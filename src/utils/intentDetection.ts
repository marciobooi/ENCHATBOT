// utils/intentDetection.ts
// High-coverage, domain-tuned intent detector for a Eurostat Energy chatbot.
// Fast, no deps. Weighted scoring + domain-first precedence + explicit modifiers.
// Exposes: detectIntent(text) -> Intent, and resolveIntents(text) -> Resolution for diagnostics.

export const INTENTS = [
  'greeting',
  'farewell',
  'thanks',
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
  'smalltalk',          // NEW
  'statement',
  'invalid',
] as const;

export type Intent = typeof INTENTS[number];

type Pattern = RegExp | ((t: string) => number);
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

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-matcher builder (pre-compiled, unicode aware)
const wordMatcher = (list: string[], flags = 'u') =>
  new RegExp(`\\b(?:${list.map(escapeRe).join('|')})\\b`, flags);

/* ===================== Domain lexicon ===================== */

const ENERGY_TERMS = [
  'energy balance','gross inland consumption','final energy consumption','primary energy',
  'electricity','power','gas','natural gas','renewables','renewable','wind','solar','hydro',
  'oil','petroleum','coal','lignite','biomass','biofuel','heat','district heating','hydrogen',
  'nuclear','emissions','emission','co2','ghg','greenhouse gas','price','prices','tariff','tariffs',
  'consumption','production','generation','imports','import','exports','export','net imports','storage','stocks',
  'capacity','load','demand','peak','efficiency','intensity','kwh','mwh','gwh','twh','toe','ktoe',
  'nrg','eurostat','dataset','table',
];

// Measurement nouns (to strengthen noun-phrase data queries)
const MEASURE_TERMS = [
  'consumption','production','generation','price','prices','tariff','tariffs',
  'emission','emissions','capacity','demand','intensity','efficiency','load','stock','stocks','storage'
];

const VIZ_TERMS = [
  'show','plot','chart','visualise','visualize','draw','map','graph','heatmap',
  'bar chart','line chart','pie','scatter','choropleth','dashboard','table','pivot',
];

const DOWNLOAD_TERMS = [
  'download','export','save as','csv','xlsx','xls','json','png','jpg','jpeg','svg','pdf','api','share','embed','link',
];

const FILTER_TERMS = [
  'country','eu','eu27','member state','sector','nace','household','households','industry','transport','services',
  'residential','fuel','product','unit','per capita','nuts','nuts2','nuts3','region','by country','by sector',
];

const TIME_KEYWORDS = [
  'monthly','quarterly','annual','annualy','annually','trend','over time','ytd','last year','this year','latest',
  'most recent','current','q1','q2','q3','q4','seasonal','winter','summer','spring','autumn','fall',
];

/** IMPORTANT: removed raw "how is/are/was/were" from metadata terms (too broad) */
const METADATA_TERMS = [
  'definition','metadata','methodology','methodologies',
  'calculated','computed','source','data source','dataset','table code','frequency','release','last update','revision',
];

const COMPARE_TERMS = [
  'compare','vs','versus','difference between','rank','ranking','top','bottom','lowest','highest',
];

const HELP_TERMS = [
  'help','how to use','what can you do','commands','instructions','guide','examples',
];

const GREETING_BASE = ['hi','hello','hey','howdy','hiya','yo','greetings','gm','gn','gday',"g'day"];
const THANKS_BASE = ['thanks','thank','thx','ty','appreciate','cheers'];
const FAREWELL_BASE = ['bye','goodbye','cya','ttyl','later'];

const COUNTRY_NAMES = [
  'eu','eu27','euro area','european union','belgium','france','germany','netherlands','luxembourg','spain','portugal',
  'italy','ireland','denmark','sweden','finland','poland','czechia','czech republic','slovakia','slovenia','hungary',
  'austria','romania','bulgaria','greece','croatia','estonia','latvia','lithuania','malta','cyprus',
];

// IMPORTANT: lower-case to match normalized text
const ISO2 = ['at','be','bg','hr','cy','cz','dk','ee','fi','fr','de','el','gr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'];

/* Precompiled matchers */
const RX: Record<string, RegExp> = {
  energy: wordMatcher(ENERGY_TERMS),
  measure: wordMatcher(MEASURE_TERMS),
  viz: wordMatcher(VIZ_TERMS),
  download: wordMatcher(DOWNLOAD_TERMS),
  filter: wordMatcher(FILTER_TERMS),
  timeKw: wordMatcher(TIME_KEYWORDS),
  metadata: wordMatcher(METADATA_TERMS),
  compare: wordMatcher(COMPARE_TERMS),
  help: wordMatcher(HELP_TERMS),
  greeting: wordMatcher(GREETING_BASE),
  thanks: wordMatcher(THANKS_BASE),
  farewell: wordMatcher(FAREWELL_BASE),
  country: wordMatcher(COUNTRY_NAMES),
  iso2: wordMatcher(ISO2),
};

/* ===================== Patterns & weights ===================== */

const PATTERNS: Record<
  Exclude<Intent, 'statement' | 'invalid'>,
  { pattern: Pattern; weight: number }[]
> = {
  troubleshooting: [
    { pattern: /\b(does(?:n'?t| not)\s+work|can(?:'|no)t|cannot|fail(?:ed|s)?|error|exception|crash(?:ed|es)?|timeout|broken|bug|slow|stuck|load(?:ing)? issue|permission denied|unauthorized)\b/u, weight: 3.2 },
  ],
  download_request: [
    { pattern: RX.download, weight: 2.6 },
    { pattern: /\b(save|export|download)\b.*\b(csv|xlsx?|json|png|jpe?g|svg|pdf)\b/u, weight: 3.0 },
    { pattern: /\b(api|endpoint|link|url)\b/u, weight: 1.6 },
    { pattern: /\bhttps?:\/\/\S+\.(csv|xlsx?|json|png|jpe?g|svg|pdf)\b/u, weight: 3.0 },
  ],
  viz_request: [
    { pattern: RX.viz, weight: 2.7 },
    { pattern: /\b(can|could|would|please|kindly)\b.*\b(show|plot|chart|visuali[sz]e|draw|map|graph|heatmap|bar chart|line chart|pie|scatter|choropleth|dashboard|table|pivot)\b/u, weight: 2.2 },
    { pattern: (t: string) => (RX.energy.test(t) && RX.viz.test(t) ? 3.1 : 0), weight: 1 },
  ],
  data_query: [
    // Question + energy keyword
    { pattern: /\b(what|how much|how many|show me|give me|value of|latest|evolution|time series|trend|increase|decrease)\b.*\b(electricity|gas|natural gas|renewables?|wind|solar|hydro|oil|petroleum|coal|lignite|biomass|biofuel|heat|hydrogen|nuclear|emissions?|co2|ghg|price|prices|tariffs?|consumption|production|generation|imports?|exports?|capacity|demand|kwh|mwh|gwh|twh|toe|ktoe)\b/u, weight: 2.6 },
    // Ending with ? and containing energy term
    { pattern: (t: string) => (t.endsWith('?') && RX.energy.test(t) ? 2.2 : 0), weight: 1 },
    // Weak nudge when any energy term exists
    { pattern: RX.energy, weight: 0.9 },
    // Energy + measurement noun → strong noun-phrase data query
    { pattern: (t: string) => (RX.energy.test(t) && RX.measure.test(t) ? 2.4 : 0), weight: 1 },
    // Energy + filter mention (country/sector/etc.) → query intent
    { pattern: (t: string) => (RX.energy.test(t) && (RX.country.test(t) || RX.filter.test(t)) ? 1.8 : 0), weight: 1 },
    // Direct pairing like "electricity ... consumption"
    { pattern: /\b(electricity|gas|natural gas|renewables?|wind|solar|hydro|oil|petroleum|coal|lignite|biomass|biofuel|heat|hydrogen|nuclear|emissions?|co2|ghg|price|prices|tariffs?|consumption|production|generation|capacity|demand)\b.*\b(consumption|production|prices?|emissions?|capacity|generation|demand|intensity|efficiency)\b/u, weight: 2.0 },
  ],
  filter_change: [
    { pattern: RX.filter, weight: 1.9 },
    { pattern: RX.country, weight: 1.9 },
    { pattern: RX.iso2, weight: 1.6 }, // now matches (lowercased)
    { pattern: /\b(by|for|in)\b\s+(country|sector|fuel|product|unit|nace|households?|industry|transport|services|residential|region|nuts\d?)\b/u, weight: 2.1 },
    { pattern: /\bper[- ]?capita\b/u, weight: 1.6 },
    { pattern: /\beu[- ]?27\b/u, weight: 1.4 }, // eu-27 or eu 27
  ],
  time_change: [
    { pattern: /\b(19|20)\d{2}\b/u, weight: 1.8 }, // any year 1900–2099
    { pattern: /\b(from|since|between)\s+(19|20)\d{2}\s+(to|and|[-–—])\s*(19|20)\d{2}\b/u, weight: 2.3 },
    { pattern: /\b(?:q[1-4]\s*(?:19|20)\d{2}|(?:19|20)\d{2}\s*q[1-4])\b/u, weight: 2.0 },
    { pattern: RX.timeKw, weight: 1.8 },
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/u, weight: 1.4 },
  ],
  metadata_request: [
    { pattern: RX.metadata, weight: 2.9 }, // domain metadata words (no raw "how is/are")
    // explicit "how ... <method>":
    { pattern: /\b(how (?:is|are|was|were))\b.*\b(calculated|computed|defined|measured|collected|estimated|compiled|aggregated|imputed)\b/u, weight: 2.8 },
    { pattern: /\b(where does|what is the source|data source)\b/u, weight: 2.0 },
    { pattern: /\bdefinition of\b/u, weight: 2.2 },
  ],
  compare_request: [
    { pattern: RX.compare, weight: 2.8 }, // bumped from 2.4
    { pattern: /^\s*compare\b/u, weight: 0.8 }, // start-anchored nudge
    { pattern: /\b(compare|vs|versus)\b.*\b([a-z][a-z]+)\b.*\b([a-z][a-z]+)\b/u, weight: 2.0 },
    { pattern: /\b(top\s*\d+|bottom\s*\d+|lowest\s*\d+|highest\s*\d+)\b/u, weight: 2.0 },
  ],
  help: [
    { pattern: RX.help, weight: 2.2 },
    { pattern: /\b(how do i .* (find|get|see)|examples)\b/u, weight: 1.6 },
  ],
  greeting: [
    { pattern: RX.greeting, weight: 2.0 },
    { pattern: /\bgood (morning|afternoon|evening|day|night)\b/u, weight: 1.8 },
    { pattern: /^(morning|afternoon|evening|night)[!.,\s]*$/u, weight: 1.8 },
    { pattern: /[\u{1F44B}\u{1F60A}\u{1F642}\u{1F600}\u{1F603}\u{1F601}]/u, weight: 1.8 }, // 👋 🙂 🙂 😀 😃 😁
    { pattern: /\b(hi there|hey there)\b/u, weight: 1.6 },
    { pattern: /^dear\b/u, weight: 1.5 },
    { pattern: (t: string) => (fuzzyTokenHit(t, ['hi','hey','hello'], 1, 2) ? 1.4 : 0), weight: 1 },
  ],
  farewell: [
    { pattern: RX.farewell, weight: 2.0 },
    { pattern: /\b(see (ya|you)|take care|good night)\b/u, weight: 1.6 },
  ],
  thanks: [
    { pattern: RX.thanks, weight: 2.0 },
    { pattern: /\b(appreciate (it|that))\b/u, weight: 2.0 },
  ],
  command: [
    // NOTE: removed 'compare' from this verb list (we have compare_request)
    { pattern: /^\s*(show|plot|chart|visuali[sz]e|draw|map|graph|table|list|filter|set|change|update|select|open|close|reset|download|export|share|explain|define|calculate|generate|summarize|rank)\b/u, weight: 2.5 },
    { pattern: /\b(please|kindly)\b/u, weight: 1.2 },
    { pattern: /\b(let'?s)\b/u, weight: 1.3 },
    { pattern: /\b(i (need|want) you to|make sure to|be sure to)\b/u, weight: 1.8 },
  ],

question: [
  { pattern: (t: string) => (t.endsWith('?') ? 2.3 : 0), weight: 1 },
  { pattern: /^\s*(who|what|when|where|why|how|which|can|could|do|does|is|are|will|would|should|may|might|have|has|did)\b/u, weight: 2.4 }, // was 2.0
  { pattern: /\b(any idea|could you tell me|do you know|i wonder|is it possible)\b/u, weight: 1.6 },
],

  smalltalk: [
    // common chit-chat; anchored loosely (normalize() lowercases input)
    { pattern: /\b(how are you(?: doing)?|how's it going|hows it going|how are things|what's up|whats up|how do you do|long time no see|how are u|how r u)\b/u, weight: 3.0 }, // stronger than generic question
    { pattern: /\b(nice to (meet|see) you|pleased to meet you)\b/u, weight: 2.2 },
  ],
} as const;

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
  'question',
  // Social / supportive
  'help',
  'thanks',
  'farewell',            // prefer farewell over greeting
  'greeting',
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

export function score(text: string): Scores {

let t = normalize(text);
  const scores = Object.fromEntries(INTENTS.map(i => [i, 0])) as Scores;


  
if (!t || typeof t !== 'string' || !t.trim()) {
    scores.invalid = 1;
    return scores;
  }



  // ✅ Smart normalization: treat interrogative-starts as questions even without '?'
  if (/^\s*(who|what|when|where|why|how|which)\b/u.test(t) && !t.endsWith('?')) {
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

  // If nothing fired, treat as a generic statement
  if (Object.values(scores).every(v => v === 0)) scores.statement = 0.6;

  return scores;
}

/* ===================== Resolver (multi-intent → primary) ===================== */

export function resolveIntents(text: string): Resolution {
  const s = score(text);

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
export function detectIntent(text: string): Intent {
  return resolveIntents(text).primary;
}