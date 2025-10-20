// utils/intentDetection.ts
// High-coverage, domain-tuned intent detector for a Eurostat Energy chatbot.
// Fast, no deps. Weighted scoring + domain-first precedence + explicit modifiers.
// Exposes: detectIntent(text) -> Intent, and resolveIntents(text) -> Resolution for diagnostics.

import { PATTERNS, setFuzzyTokenHit } from '../data/patterns';
import { RX } from '../data/precompiledMatchers';
import { AMBIGUOUS_BASE, GROUP_ADDRESS_WORDS, FAREWELL_INDICATORS } from '../data/lexicon';

export const INTENTS = [
  'greeting',
  'farewell',
  'thanks',
  'affirmative',
  'negative',
  'help',
  'troubleshooting',
  'download_request',
  'viz_request',
  'data_query',
  'filter_change',
  'time_change',
  'metadata_request',
  'compare_request',
  'command',
  'question',
  'smalltalk',
  'ambiguous',          // NEW: context-dependent phrases
  'statement',
  'invalid',
] as const;

export type Intent = typeof INTENTS[number];
export type Scores = Record<Intent, number>;

export interface Resolution {
  primary: Intent;          // route on this
  coIntents: Intent[];      // non-modifier intents that contributed meaningfully
  modifiers: Intent[];      // time_change/filter_change (never prevail)
  scores: Scores;           // for telemetry/debug
}

/* ===================== Normalization & helpers ===================== */

function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[“”"']/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Small tokens only for fuzzy; keep it cheap.
function shortTokenize(t: string): string[] {
  return t.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 64);
}

// Damerau-Levenshtein (for short greetings only)
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,  // del
        dp[i][j - 1] + 1,  // ins
        dp[i - 1][j - 1] + cost // sub
      );
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

// Fuzzy token hit for tiny greeting vocab, ignoring 1-char tokens
function fuzzyTokenHit(text: string, vocab: string[], maxDist = 1, minLen = 2): boolean {
  const toks = shortTokenize(text).filter(tok => tok.length >= minLen && tok.length <= 10);
  for (const tok of toks) {
    for (const v of vocab) {
      if (levenshtein(tok, v) <= maxDist) return true;
    }
  }
  return false;
}

setFuzzyTokenHit(fuzzyTokenHit);

/**
 * Resolves ambiguous phrase to 'greeting' or 'farewell' based on context
 * @param phrase - The ambiguous phrase (e.g., "good evening", "night")
 * @param text - Full text being analyzed
 * @param isFirstMessage - Whether this is the first message in conversation
 * @returns 'greeting' or 'farewell'
 */
function resolveAmbiguous(phrase: string, text: string, isFirstMessage: boolean): 'greeting' | 'farewell' {
  const trimmed = text.trim();
  const lowerText = trimmed.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  
  // Build regex for the phrase with flexible whitespace
  const phraseWords = lowerPhrase.split(/\s+/);
  const phrasePattern = phraseWords.join('\\s+');
  
  // Check for group address words (indicates greeting)
  const groupPattern = new RegExp(`\\b${phrasePattern}\\s+(?:${GROUP_ADDRESS_WORDS.join('|')})\\b`, 'iu');
  if (groupPattern.test(lowerText)) {
    return 'greeting';
  }
  
  // Check for farewell indicators (indicates farewell)
  const farewellPattern = new RegExp(`\\b${phrasePattern}[,]?\\s+(?:and\\s+)?(?:${FAREWELL_INDICATORS.join('|')})`, 'iu');
  if (farewellPattern.test(lowerText)) {
    return 'farewell';
  }
  
  // Check position
  const startsWithPhrase = new RegExp(`^${phrasePattern}$`, 'iu').test(lowerText);
  const startsWithPhraseAndMore = new RegExp(`^${phrasePattern}\\b`, 'iu').test(lowerText);
  const endsWithPhrase = new RegExp(`\\b${phrasePattern}$`, 'iu').test(lowerText);
  
  if (startsWithPhrase) {
    // Standalone phrase: first message → greeting, otherwise → farewell
    return isFirstMessage ? 'greeting' : 'farewell';
  }
  
  if (startsWithPhraseAndMore && !startsWithPhrase) {
    // At start with more text: first message → greeting, otherwise check defaults
    // "good evening" at start is usually greeting
    return isFirstMessage ? 'greeting' : 'greeting';
  }
  
  if (endsWithPhrase) {
    // At end → usually farewell
    return 'farewell';
  }
  
  // Middle position or no specific pattern: default to farewell (more common for time-based phrases)
  return 'farewell';
}


/* ===================== Precedence & policy ===================== */

const PRECEDENCE: Intent[] = [
  // Domain—actionable
  'troubleshooting',
  'download_request',
  'viz_request',
  'compare_request',     // moved up
  'metadata_request',    // moved up
  'data_query',
  // Generic
  'command',
  'greeting',
  'question',
  // Social / supportive
  'help',
  'thanks',
  'farewell',            // prefer farewell over greeting
  'smalltalk',           // after greeting (but see override below)
  // Fallback
  'statement',
  'invalid',
];

export const MODIFIERS = new Set<Intent>(['time_change', 'filter_change']);
const NON_PREVAILING_SOCIAL = new Set<Intent>(['greeting', 'thanks', 'farewell', 'smalltalk']);

// Tuning knobs
const NEAR_TIE_DELTA = 0.5;     // within 0.5 of the top is a near tie
const COINTENT_FRACTION = 0.6;  // co-intents >= 60% of the top score

/* ===================== Scoring ===================== */

export function score(text: string, isFirstMessage = false): Scores {
  let t = normalize(text);
  const scores = Object.fromEntries(INTENTS.map(i => [i, 0])) as Scores;

  if (!t || typeof t !== 'string' || !t.trim()) {
    scores.invalid = 1;
    return scores;
  }



  // ✅ Smart normalization: treat interrogative-starts as questions even without '?'
  // But skip if it looks like a greeting to avoid false positives
  const isGreeting = RX.greeting.test(t);
  if (!isGreeting && /^\s*(who|what|when|where|why|how|which)\b/u.test(t) && !t.endsWith('?')) {
    t += '?';
  }


  // Apply patterns
  (Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).forEach((intent) => {
    for (const { pattern, weight } of PATTERNS[intent]) {
      if (pattern instanceof RegExp) {
        if (pattern.test(t)) scores[intent] += weight;
      } else {
        const v = pattern(t);
        if (v > 0) scores[intent] += v;
      }
    }
  });

  // Heuristics
  if (t.endsWith('?') && scores.command > 0) scores.question += 0.4; // soft imperative phrased as a question
  if (/\b(stop|cancel)\b/u.test(t)) scores.command += 0.5;

  // Ensure time/filter are captured even without other domain terms
  if (scores.time_change === 0 && /\b(19|20)\d{2}\b/u.test(t)) scores.time_change += 1.2;
  if (scores.filter_change === 0 && (RX.country.test(t) || RX.iso2.test(t))) scores.filter_change += 1.0;

  // If smalltalk and question both fired, nudge question down a bit (keeps resolver simple)
  if (scores.smalltalk > 0 && scores.question > 0) {
    scores.question -= 0.8; // small talk should beat a generic question
  }

  // If greeting and question both fired, nudge question down (conversational greetings should prevail)
  if (scores.greeting > 0 && scores.question > 0) {
    scores.question -= 2.5; // greeting should beat generic question
  }

  // If farewell and greeting both fired, farewell should always win
  if (scores.farewell > 0 && scores.greeting > 0) {
    scores.greeting -= 3.0; // farewell should beat greeting
  }

  // If farewell and question both fired, farewell should win
  if (scores.farewell > 0 && scores.question > 0) {
    scores.question -= 2.5; // farewell should beat question
  }

  // ========== AMBIGUOUS INTENT RESOLUTION ==========
  // Resolve ambiguous phrases to either greeting or farewell based on context
  if (scores.ambiguous > 0) {
    // Check which ambiguous phrase was detected
    for (const phrase of AMBIGUOUS_BASE) {
      const phraseWords = phrase.split(/\s+/);
      const phrasePattern = new RegExp(`\\b${phraseWords.join('\\s+')}\\b`, 'iu');
      
      if (phrasePattern.test(t)) {
        const resolved = resolveAmbiguous(phrase, t, isFirstMessage);
        
        if (resolved === 'greeting') {
          scores.greeting += scores.ambiguous;
        } else {
          scores.farewell += scores.ambiguous;
        }
        scores.ambiguous = 0;
        break;
      }
    }
  }

  // If nothing fired, treat as a generic statement
  if (Object.values(scores).every(v => v === 0)) scores.statement = 0.6;

  return scores;
}

/* ===================== Resolver (multi-intent → primary) ===================== */

export function resolveIntents(text: string, isFirstMessage = false): Resolution {
  const s = score(text, isFirstMessage);

  const active = Object.entries(s)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]) as [Intent, number][];

  if (active.length === 0) {
    return { primary: 'invalid', coIntents: [], modifiers: [], scores: s };
  }

  const [topIntent, topScore] = active[0];

  // Candidates near the top
  const nearTop = active
    .filter(([, v]) => topScore - v <= NEAR_TIE_DELTA)
    .map(([i]) => i);

  // Pull out modifiers
  const modifierHits = active.filter(([i]) => MODIFIERS.has(i)).map(([i]) => i);

  // Prevailing pool excludes modifiers
  let prevailing = nearTop.filter(i => !MODIFIERS.has(i));

  // If any actionable present, drop social from the pool
  const hasActionable = prevailing.some(i =>
    !NON_PREVAILING_SOCIAL.has(i) && i !== 'statement' && i !== 'invalid'
  );
  if (hasActionable) {
    prevailing = prevailing.filter(i => !NON_PREVAILING_SOCIAL.has(i));
  }

  // Special rule: troubleshooting always wins
  if (prevailing.includes('troubleshooting')) {
    prevailing = ['troubleshooting', ...prevailing.filter(i => i !== 'troubleshooting')];
  }

  // Ensure compare/metadata can prevail over data_query even if not near-top
  const activeIntents = new Set(active.map(([i]) => i));
  if (activeIntents.has('compare_request') && activeIntents.has('data_query')) {
    if (!prevailing.includes('compare_request')) {
      prevailing = ['compare_request', ...prevailing];
    }
  }
  if (activeIntents.has('metadata_request') && activeIntents.has('data_query')) {
    if (!prevailing.includes('metadata_request')) {
      prevailing = ['metadata_request', ...prevailing];
    }
  }

  // If both greeting and farewell are present (and no actionable/generic), prefer farewell
  const onlySocialOrNone =
    !hasActionable &&
    !activeIntents.has('command') &&
    !activeIntents.has('question');

  if (onlySocialOrNone &&
      activeIntents.has('greeting') &&
      activeIntents.has('farewell')) {
    if (!prevailing.includes('farewell')) {
      // force-include farewell so precedence can pick it
      prevailing = ['farewell', ...prevailing];
    }
  }

  // NEW: If smalltalk is present and there is no actionable intent or command,
  // let smalltalk prevail over a generic question.
  const hasCommand = activeIntents.has('command');
  const hasAnyActionable = ['viz_request','data_query','download_request','compare_request','metadata_request','troubleshooting']
    .some(k => activeIntents.has(k as Intent));
  if (!hasAnyActionable && !hasCommand && activeIntents.has('smalltalk')) {
    if (!prevailing.includes('smalltalk')) {
      prevailing = ['smalltalk', ...prevailing.filter(i => i !== 'question')];
    }
  }

  // Choose by precedence among prevailing
  let primary: Intent;
  if (prevailing.length) {
    primary = prevailing.sort((a, b) => PRECEDENCE.indexOf(a) - PRECEDENCE.indexOf(b))[0];
  } else {
    // If prevailing is empty (e.g., only modifiers are near-top),
    // pick the best non-modifier actionable if present; otherwise 'statement' if any modifiers exist.
    const nonMods = active.filter(([i]) =>
      !MODIFIERS.has(i) &&
      i !== 'statement' &&
      i !== 'invalid' &&
      !NON_PREVAILING_SOCIAL.has(i)
    );
    if (nonMods.length) {
      primary = nonMods[0][0];        // best-scoring actionable (e.g., 'data_query')
    } else {
      primary = modifierHits.length ? 'statement' : topIntent;
    }
  }

  // Co-intents: meaningful supports (>= fraction of top), excluding modifiers & primary
  const coIntents = active
    .filter(([i, v]) => i !== primary && !MODIFIERS.has(i) && v >= topScore * COINTENT_FRACTION)
    .map(([i]) => i);

  return { primary, coIntents, modifiers: modifierHits, scores: s };
}

/** Public API: single intent label */
export function detectIntent(text: string, isFirstMessage = false): Intent {
  return resolveIntents(text, isFirstMessage).primary;
}