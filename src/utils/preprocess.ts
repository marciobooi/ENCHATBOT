/* utils/preprocess.ts
 * Lightweight input preprocessing for chatbot UI.
 * No external deps. Unicode-aware tokenization, sanitization, light spell-correction,
 * entity extraction (years, ranges, months, ISO2/countries, frequency), and simple flags.
 */

export type Frequency = 'monthly' | 'quarterly' | 'annual';

export interface PreprocessOptions {
  /** Trim message to this many characters (default 1_000) */
  maxChars?: number;
  /** Extra dictionary words that should be treated as correct (case-insensitive) */
  whitelist?: string[];
  /** Domain vocabulary (e.g., energy terms) to prioritize in suggestions */
  domainVocab?: string[];
  /** Enable light spell-correction (default true) */
  enableSpell?: boolean;
  /** Max edit distance used for spell suggestions (default 1) */
  maxEditDistance?: 1 | 2;
  /** Collapse elongated letters (e.g., "heyyy"->"heyy"; default true) */
  collapseElongations?: boolean;
  /** Replace URLs/emails with placeholders (true) or remove (false). Default true. */
  keepPlaceholders?: boolean;
  /** Mask profanity with asterisks (default true) */
  maskProfanity?: boolean;

  /** NEW: do not spell-correct question words (default true) */
  protectInterrogatives?: boolean;
  /** NEW: do not spell-correct the first token if it starts a question (default true) */
  protectFirstTokenIfQuestion?: boolean;
  /** NEW: protect common social tokens (hi/hello/thanks/bye) from correction (default true) */
  protectSocialTokens?: boolean;
}

const DEFAULT_DOMAIN_VOCAB: string[] = [
  'energy','electricity','power','gas','natural','lng','lpg','hydrogen','biomass','biofuel','renewables','renewable',
  'wind','solar','hydro','oil','petroleum','coal','lignite','nuclear','heat','district','heating',
  'consumption','production','generation','demand','supply','emission','emissions','intensity','efficiency','capacity','storage',
  'price','prices','tariff','tariffs','investment','import','imports','export','exports',
  'top','bottom','highest','lowest','ranking','rank',
  'kwh','mwh','gwh','twh','toe','ktoe',
  'monthly','quarterly','annual','annually',
  'france','spain','germany','italy','portugal','belgium','netherlands','luxembourg','ireland','denmark','sweden','finland',
  'poland','czechia','slovakia','slovenia','hungary','austria','romania','bulgaria','greece','croatia','estonia','latvia','lithuania','malta','cyprus',
  'europe','eurostat','eu','eu27','euro','eurozone','euro area'
];

export interface PreprocessResult {
  original: string;
  /** NFKD lowered, quotes normalized, zero-width removed, single-spaced */
  normalized: string;
  /** Tokenized list (letters/digits only, unicode aware) */
  tokens: string[];
  /** Final string after strip/mask/corrections/placeholders */
  cleaned: string;

  /** Corrections and removals applied */
  corrections: { from: string; to: string; reason: 'spelling' | 'elongation' }[];
  removed: { type: 'url' | 'email' | 'html' | 'control' | 'profanity'; value: string }[];

  /** Quick feature flags */
  flags: {
    hasUrl: boolean;
    hasEmail: boolean;
    hasEmoji: boolean;
    hasProfanity: boolean;
    looksCode: boolean;
    tooLong: boolean;
    nonEnglishLikely: boolean;
  };

  /** Extracted entities useful for query building */
  entities: {
    years: number[];
    yearRanges: [number, number][];
    months: string[];
    frequency: Frequency[];
    iso2: string[];
    countries: string[];
  };
}

/* ----------------- Normalization helpers ----------------- */

function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[“”"']/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const HTML_TAG = /<\/?[^>]+>/g;
const URL_RE = /\bhttps?:\/\/[^\s)]+/gi;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\x00-\x1F\x7F]/g;
const EMOJI_RE = /[\p{Extended_Pictographic}]/u;

function stripHtml(input: string, removed: PreprocessResult['removed']): string {
  const matches = input.match(HTML_TAG) || [];
  matches.forEach(m => removed.push({ type: 'html', value: m }));
  return input.replace(HTML_TAG, '');
}

function removeControls(input: string, removed: PreprocessResult['removed']): string {
  const matches = input.match(CONTROL_RE) || [];
  matches.forEach(m => removed.push({ type: 'control', value: JSON.stringify(m) }));
  return input.replace(CONTROL_RE, '');
}

function replaceUrlsAndEmails(
  input: string,
  removed: PreprocessResult['removed'],
  keepPlaceholders: boolean
): string {
  input = input.replace(URL_RE, (m) => {
    removed.push({ type: 'url', value: m });
    return keepPlaceholders ? '[url]' : '';
  });
  input = input.replace(EMAIL_RE, (m) => {
    removed.push({ type: 'email', value: m });
    return keepPlaceholders ? '[email]' : '';
  });
  return input;
}

/* ----------------- Tokenization & elongations ----------------- */

function tokenize(t: string): string[] {
  // grab sequences of letters or digits; unicode aware
  return (t.match(/[\p{L}\p{N}]+/gu) || []).slice(0, 1024);
}

function collapseElongationsToken(token: string): { out: string; changed: boolean } {
  // "heyyy" -> "heyy" (max 2 in a row), letters only
  const out = token.replace(/([a-z])\1{2,}/g, '$1$1');
  return { out, changed: out !== token };
}

/* ----------------- Profanity (very small illustrative list) ----------------- */

const PROFANITY = ['damn','crap','shit','fuck']; // extend server-side if needed

function escapeRe(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskProfanity(text: string, removed: PreprocessResult['removed'], doMask: boolean): string {
  if (!doMask) return text;
  const re = new RegExp(`\\b(?:${PROFANITY.map(escapeRe).join('|')})\\b`, 'gi');
  return text.replace(re, (m) => {
    removed.push({ type: 'profanity', value: m });
    return m[0] + '*'.repeat(Math.max(0, m.length - 1));
  });
}

/* ----------------- Spell checking (tiny, local) ----------------- */

const INTERROGATIVES = new Set(['who','what','when','where','why','how','which']);

const SOCIAL_TOKENS = new Set([
  // Simple greetings and farewells
  'hi','hello','hey','bye','goodbye','thanks','thank','cheers','yo','hiya','gm','gn',
  // Conversational greetings - protect from spell correction
  'sup','wassup','wazzup','waddup','whassup',
  'howdy','heya','heyo','hallo',
  // Time-based greetings - protect "day" from being corrected to "may"
  'morning','afternoon','evening','day','night',
  // Conversational words - protect "new" from being corrected to "now"
  'new'
]);

const EN_STOPWORDS = new Set<string>([
  'a','an','the','and','or','but','if','then','else','when','where','how','why','who','which','what',
  'i','you','he','she','it','we','they','me','him','her','them','my','your','his','her','its','our','their',
  'to','for','from','in','on','at','by','of','with','as','is','are','was','were','be','been','being',
  'do','does','did','can','could','should','would','may','might','will','shall',
  'this','that','these','those','there','here','now','then','not','no','yes','ok','okay','please'
]);

// very small base english words to keep false positives down
const EN_BASE_SMALL = new Set<string>([
  'hello','hi','hey','bye','thanks','thank','help','download','export','show','plot','chart','map','table',
  'compare','definition','source','frequency','latest','trend','value','values','increase','decrease','error','crash',
  'reset','filter','select','update','open','close','share','explain','define','calculate','generate','summarize','rank',
  // add interrogatives explicitly here too for redundancy
  'who','what','when','where','why','how','which'
]);

// Damerau-Levenshtein for spell suggestions
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function buildDictionary(options?: PreprocessOptions): Set<string> {
  const dict = new Set<string>();
  EN_STOPWORDS.forEach(w => dict.add(w));
  EN_BASE_SMALL.forEach(w => dict.add(w));
  (options?.whitelist || []).forEach(w => dict.add(w.toLowerCase()));
  (options?.domainVocab || []).forEach(w => dict.add(w.toLowerCase()));
  return dict;
}

function suggestWord(
  token: string,
  dict: Set<string>,
  maxEditDistance: number
): string | null {
  if (token.length <= 2) return null;           // ignore super short
  if (/^\d+$/.test(token)) return null;          // numbers
  if (dict.has(token)) return null;              // already known
  let best: { w: string; d: number } | null = null;
  for (const w of dict) {
    const d = levenshtein(token, w);
    if (d <= maxEditDistance) {
      if (!best || d < best.d || (d === best.d && w.length < best.w.length)) {
        best = { w, d };
        if (d === 0) break;
      }
    }
  }
  return best?.w ?? null;
}

/* ----------------- Entities: years, months, freq, ISO2/countries ----------------- */

const MONTHS_FULL = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTHS_ABBR = ['jan','feb','mar','apr','jun','jul','aug','sep','sept','oct','nov','dec'];
const FREQ_MAP: Record<string, Frequency> = {
  monthly: 'monthly', quarterly: 'quarterly', annual: 'annual', annually: 'annual', annualy: 'annual'
};

// small EU list for ISO2 seen in your detector (lowercase)
const ISO2 = new Set(['at','be','bg','hr','cy','cz','dk','ee','fi','fr','de','el','gr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se']);
// tiny country list (reuse subset)
const COUNTRIES = new Set([
  'eu','eu27','euro','euro area','european','belgium','france','germany','netherlands','luxembourg','spain','portugal',
  'italy','ireland','denmark','sweden','finland','poland','czechia','slovakia','slovenia','hungary','austria','romania',
  'bulgaria','greece','croatia','estonia','latvia','lithuania','malta','cyprus'
]);

function extractEntities(text: string) {
  const years = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g)).map(m => Number(m[0]));
  const yearRanges: [number, number][] = [];
  for (const m of text.matchAll(/\b(19|20)\d{2}\s*(?:-|–|—|to|and)\s*(19|20)\d{2}\b/g)) {
    const a = Number(m[0].slice(0, 4));
    const b = Number(m[0].slice(-4));
    yearRanges.push(([a, b].sort((x, y) => x - y) as [number, number]));
  }
  const months = [
    ...MONTHS_FULL.filter(m => text.includes(m)),
    ...MONTHS_ABBR.filter(m => text.includes(m))
  ];
  const frequency: Frequency[] = Object.keys(FREQ_MAP)
    .filter(k => text.includes(k))
    .map(k => FREQ_MAP[k]);

  const iso2: string[] = [];
  for (const m of text.matchAll(/\b[a-z]{2}\b/g)) {
    if (ISO2.has(m[0])) iso2.push(m[0]);
  }
  const countries: string[] = [];
  COUNTRIES.forEach(c => { if (text.includes(c)) countries.push(c); });

  return { years, yearRanges, months, frequency, iso2, countries };
}

/* ----------------- Language/code heuristics ----------------- */

function looksLikeCode(t: string): boolean {
  return /[{;}<>]|function\s|\bconst\b|\blet\b|\bvar\b|\bimport\s|\bclass\s/.test(t);
}

function nonEnglishLikely(t: string): boolean {
  const letters = t.replace(/[^a-z0-9]/g, '');
  const ratio = letters.length / Math.max(1, t.length);
  return ratio < 0.4;
}

/* ----------------- Main API ----------------- */

export function preprocessInput(raw: string, opts?: PreprocessOptions): PreprocessResult {
  const options: Required<PreprocessOptions> = {
    maxChars: opts?.maxChars ?? 1000,
    whitelist: opts?.whitelist ?? [],
    domainVocab: opts?.domainVocab ?? DEFAULT_DOMAIN_VOCAB,
    enableSpell: opts?.enableSpell ?? true,
    maxEditDistance: opts?.maxEditDistance ?? 1,
    collapseElongations: opts?.collapseElongations ?? true,
    keepPlaceholders: opts?.keepPlaceholders ?? true,
    maskProfanity: opts?.maskProfanity ?? true,
    protectInterrogatives: opts?.protectInterrogatives ?? true,
    protectFirstTokenIfQuestion: opts?.protectFirstTokenIfQuestion ?? true,
    protectSocialTokens: opts?.protectSocialTokens ?? true,
  };

  const removed: PreprocessResult['removed'] = [];
  const corrections: PreprocessResult['corrections'] = [];

  // 1) Normalize & base sanitize
  const normalized = normalize(raw);
  let working = normalized.slice(0, options.maxChars);
  const tooLong = normalized.length > options.maxChars;

  working = removeControls(working, removed);
  working = stripHtml(working, removed);
  working = replaceUrlsAndEmails(working, removed, options.keepPlaceholders);

  // 2) Mask profanity (optional)
  const beforeProfanity = working;
  working = maskProfanity(working, removed, options.maskProfanity);
  const hasProfanity = beforeProfanity !== working;

  // 3) Tokenize
  let tokens = tokenize(working);

  // 4) Collapse elongations (token-level)
  if (options.collapseElongations) {
    tokens = tokens.map(tok => {
      const { out, changed } = collapseElongationsToken(tok);
      if (changed) corrections.push({ from: tok, to: out, reason: 'elongation' });
      return out;
    });
  }

  // 5) Light spell-correction with protections
  if (options.enableSpell) {
    const dict = buildDictionary(options);

    // Identify protected tokens
    const protectedTokens = new Set<string>();
    if (options.protectInterrogatives) {
      INTERROGATIVES.forEach(w => protectedTokens.add(w));
    }
    if (options.protectSocialTokens) {
      SOCIAL_TOKENS.forEach(w => protectedTokens.add(w));
    }
    if (
      options.protectFirstTokenIfQuestion &&
      tokens.length > 0 &&
      INTERROGATIVES.has(tokens[0]) // first token is a question word
    ) {
      protectedTokens.add(tokens[0]);
    }

    tokens = tokens.map(tok => {
      if (protectedTokens.has(tok)) return tok;           // do not correct protected tokens
      if (EN_STOPWORDS.has(tok)) return tok;              // do not correct stopwords
      if (dict.has(tok)) return tok;                      // known word
      if (tok.length <= 2) return tok;                    // too short to correct
      const suggestion = suggestWord(tok, dict, options.maxEditDistance);
      if (suggestion && suggestion !== tok) {
        corrections.push({ from: tok, to: suggestion, reason: 'spelling' });
        return suggestion;
      }
      return tok;
    });
  }

  // 6) Rebuild cleaned string from corrected tokens (preserve placeholders like [url], [email])
  const placeholders = (working.match(/\[(?:url|email)\]/g) || []);
  let cleaned = tokens.join(' ');
  if (placeholders.length) cleaned = (cleaned + ' ' + placeholders.join(' ')).trim();

  // 7) Feature flags & entities
  const hasEmoji = EMOJI_RE.test(raw);
  const hasUrl = URL_RE.test(raw);
  const hasEmail = EMAIL_RE.test(raw);
  const codey = looksLikeCode(raw);
  const nonEn = nonEnglishLikely(normalized);

  const entities = extractEntities(cleaned);

  return {
    original: raw,
    normalized,
    tokens,
    cleaned,
    corrections,
    removed,
    flags: {
      hasUrl,
      hasEmail,
      hasEmoji,
      hasProfanity,
      looksCode: codey,
      tooLong,
      nonEnglishLikely: nonEn,
    },
    entities,
  };
}