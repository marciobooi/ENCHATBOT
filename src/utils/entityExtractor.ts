// utils/entityExtractor.ts
// Eurostat Energy — lightweight entity extractor (time, geography, measures, fuels, filters, compare/ranking).
// No external deps; Unicode aware. Designed to pair with intentDetection.ts and preprocess.ts.

export interface ExtractorOptions {
  /** Current year for relative expressions (default: new Date().getFullYear()) */
  currentYear?: number;
  /** Extend vocabularies (lowercased) */
  extraCountries?: string[];
  extraProducts?: string[];
  extraMeasures?: string[];
  extraSectors?: string[];
  extraUnits?: string[];
}

export type Frequency = 'monthly' | 'quarterly' | 'annual';

export interface TimeEntities {
  years: number[];
  ranges: [number, number][];
  quarters: { q: 1 | 2 | 3 | 4; year: number }[];
  months: string[];
  frequency: Frequency[];
  relative?: {
    lastNYears?: number;
    sinceYear?: number; // e.g., "since 2019" (end assumed currentYear)
  };
}

export interface GeographyEntities {
  iso2: string[];         // e.g., ['fr', 'de']
  countries: string[];    // e.g., ['france', 'germany']
  groups: string[];       // e.g., ['eu', 'eu27', 'euro area']
  nuts?: string[];        // loose capture of NUTS codes or mentions (lowercased)
}

export interface CompareEntities {
  pair?: { left: string; right: string };
  ranking?: { order: 'top' | 'bottom' | 'lowest' | 'highest'; n?: number; scope?: string };
}

export interface FilterEntities {
  sectors: string[];      // households, industry, transport, services, residential
  units: string[];        // kwh, mwh, gwh, twh, toe, ktoe
  perCapita: boolean;
}

export interface MeasureEntities {
  measures: string[];     // consumption, prices, emissions, capacity, demand, intensity, efficiency, etc.
  products: string[];     // electricity, gas, oil, coal, renewables, wind, solar, hydro, biomass, hydrogen, nuclear, heat
}

export interface DatasetHints {
  tables?: string[];      // e.g., codes matching nrg_* patterns mentioned by users
  apiLinks?: string[];    // urls
}

export interface Entities {
  time: TimeEntities;
  geography: GeographyEntities;
  compare: CompareEntities;
  filters: FilterEntities;
  measure: MeasureEntities;
  dataset: DatasetHints;
  numbers?: number[];     // any standalone numbers found (excluding years already collected)
}

export function extractEntities(raw: string, opts?: ExtractorOptions): Entities {
  const currentYear = opts?.currentYear ?? new Date().getFullYear();
  const t = normalize(raw);
  const tokens = tokenize(t);

  /* ---------- Regexes & small vocab ---------- */

  // Time
  const YEAR_RE = /\b(19|20)\d{2}\b/g;                                       // 1900–2099
  const YEAR_RANGE_RE = /\b(19|20)\d{2}\s*(?:-|–|—|to|and)\s*(19|20)\d{2}\b/g;
  const FROM_TO_RE = /\bfrom\s+(19|20)\d{2}\s+(?:to|until|till|-|–|—)\s*(19|20)\d{2}\b/g;
  const SINCE_RE = /\bsince\s+(19|20)\d{2}\b/g;
  const LAST_N_YEARS_RE = /\blast\s+(\d{1,2})\s+years?\b/;
  const QUARTER_RE = /\b(?:q([1-4])\s*(19|20)\d{2}|(19|20)\d{2}\s*q([1-4]))\b/g;

  const MONTHS_FULL = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const MONTHS_ABBR = ['jan','feb','mar','apr','jun','jul','aug','sep','sept','oct','nov','dec'];
  const FREQ_MAP: Record<string, Frequency> = { monthly:'monthly', quarterly:'quarterly', annual:'annual', annually:'annual', annualy:'annual' };

  // Geography
  const EU_GROUPS = ['eu','eu27','euro area','euro-area','european union','european-union'];
  const ISO2_SET = new Set(['at','be','bg','hr','cy','cz','dk','ee','fi','fr','de','el','gr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se']);
  const COUNTRY_NAMES = new Set([
    'belgium','france','germany','netherlands','luxembourg','spain','portugal','italy','ireland','denmark','sweden','finland',
    'poland','czechia','czech republic','slovakia','slovenia','hungary','austria','romania','bulgaria','greece','croatia',
    'estonia','latvia','lithuania','malta','cyprus',
    ...(opts?.extraCountries ?? []).map(s => s.toLowerCase())
  ]);

  // NUTS (loose): capture codes when "nuts" appears; example "NUTS2" or "nuts de11"
  const NUTS_CAPTURE_RE = /\bnuts\s*([a-z]{2}[a-z0-9]{1,3}|[123])\b/gi;

  // Measures & products
  const MEASURES = new Set([
    'consumption','production','generation','price','prices','tariff','tariffs',
    'emission','emissions','capacity','demand','intensity','efficiency','load','stock','stocks','storage',
    ...(opts?.extraMeasures ?? []).map(s => s.toLowerCase())
  ]);
  const PRODUCTS = new Set([
    'electricity','power','gas','natural gas','renewables','renewable','wind','solar','hydro','oil','petroleum','coal',
    'lignite','biomass','biofuel','heat','district heating','hydrogen','nuclear',
    ...(opts?.extraProducts ?? []).map(s => s.toLowerCase())
  ]);

  // Filters
  const SECTORS = new Set([
    'household','households','industry','transport','services','residential','sector','nace',
    ...(opts?.extraSectors ?? []).map(s => s.toLowerCase())
  ]);
  const UNITS = new Set([
    'kwh','mwh','gwh','twh','toe','ktoe',
    ...(opts?.extraUnits ?? []).map(s => s.toLowerCase())
  ]);
  const PER_CAPITA_RE = /\bper\s*capita\b/;

  // Compare & ranking
  const COMPARE_PAIR_RE = /\bcompare\b\s+(.+?)\s+(?:vs|versus)\s+(.+?)(?:$|[.,;]| in | by )/;
  const RANKING_RE = /\b(top|bottom|lowest|highest)\s+(\d{1,3})?\b/;

  // Dataset hints
  const TABLE_CODE_RE = /\b(nrg_[a-z0-9_]+)\b/;
  const URL_RE = /\bhttps?:\/\/\S+/gi;

  /* ---------- Time extraction ---------- */

  const years: number[] = uniq(
    (t.match(YEAR_RE) || []).map(s => Number(s)).filter(y => y >= 1900 && y <= 2099)
  );

  const ranges: [number, number][] = [];
  for (const m of t.matchAll(YEAR_RANGE_RE)) {
    const a = Number(m[0].slice(0,4));
    const b = Number(m[0].slice(-4));
    ranges.push(normalizeRange(a, b));
  }
  for (const m of t.matchAll(FROM_TO_RE)) {
    const a = Number(m[0].match(/\b(19|20)\d{2}\b/)![0]);
    const b = Number(m[0].slice(-4));
    ranges.push(normalizeRange(a, b));
  }
  for (const m of t.matchAll(SINCE_RE)) {
    const a = Number(m[0].match(/\b(19|20)\d{2}\b/)![0]);
    ranges.push(normalizeRange(a, currentYear));
  }

  // quarters: catch both "q2 2023" and "2023 q2"
  const quarters: { q: 1|2|3|4; year: number }[] = [];
  for (const m of t.matchAll(QUARTER_RE)) {
    const q = Number(m[1] || m[4]) as 1|2|3|4;
    const rawYear = m[2] || m[3] || '';

    let year: number | undefined;
    if (rawYear.length === 2) {
      const twoDigit = Number(rawYear);
      if (!Number.isNaN(twoDigit)) {
        year = twoDigit > 30 ? 1900 + twoDigit : 2000 + twoDigit;
      }
    } else if (rawYear.length === 4) {
      year = Number(rawYear);
    }

    if (!year && m.index !== undefined) {
      const lookahead = t.slice(m.index + m[0].length);
      const twoDigitMatch = lookahead.match(/^['\s-]*(\d{2})/);
      if (twoDigitMatch) {
        const twoDigit = Number(twoDigitMatch[1]);
        year = twoDigit > 30 ? 1900 + twoDigit : 2000 + twoDigit;
      }
    }

    if (q >= 1 && q <= 4 && year && year >= 1900 && year <= 2099) {
      quarters.push({ q, year });
    }
  }

  const months = [
    ...MONTHS_FULL.filter(m => t.includes(m)),
    ...MONTHS_ABBR.filter(m => t.includes(m)),
  ];

  const frequency: Frequency[] = Object.keys(FREQ_MAP)
    .filter(k => t.includes(k))
    .map(k => FREQ_MAP[k]);

  const relMatch = t.match(LAST_N_YEARS_RE);
  const relative = relMatch ? { lastNYears: Number(relMatch[1]) } : undefined;

  const time: TimeEntities = { years, ranges: uniqRange(ranges), quarters, months, frequency, relative };

  /* ---------- Geography extraction ---------- */

  // iso2: standalone 2-letter tokens
  const iso2 = uniq(tokens.filter(tok => tok.length === 2 && ISO2_SET.has(tok)));

  // countries: match from vocabulary
  const countries = uniq(
    Array.from(COUNTRY_NAMES).filter(name => t.includes(name))
  );

  // groups
  const groups = uniq(
    EU_GROUPS.filter(g => t.includes(g))
      .map(g => g.replace('-', ' '))
  );

  // nuts mentions/codes (loose)
  const nuts: string[] = [];
  for (const m of raw.matchAll(NUTS_CAPTURE_RE)) {
    nuts.push(m[1].toLowerCase());
  }

  const geography: GeographyEntities = { iso2, countries, groups, nuts: uniq(nuts) };

  /* ---------- Measures & products ---------- */

  const measures = uniq(
    Array.from(MEASURES).filter(m => includesWord(t, m))
  );

  const products = uniq(
    Array.from(PRODUCTS).filter(p => includesWord(t, p))
  );

  const measure: MeasureEntities = { measures, products };

  /* ---------- Filters ---------- */

  const sectors = uniq(
    Array.from(SECTORS).filter(s => includesWord(t, s))
  );

  const units = uniq(tokens.filter(tok => UNITS.has(tok)));

  const perCapita = PER_CAPITA_RE.test(t);

  const filters: FilterEntities = { sectors, units, perCapita };

  /* ---------- Compare / Ranking ---------- */

  let pair: CompareEntities['pair'];
  const pairMatch = t.match(COMPARE_PAIR_RE);
  if (pairMatch) {
    pair = {
      left: sanitizeName(pairMatch[1]),
      right: sanitizeName(pairMatch[2]),
    };
  }

  let ranking: CompareEntities['ranking'];
  const rankMatch = t.match(RANKING_RE);
  if (rankMatch) {
    const order = rankMatch[1] as 'top'|'bottom'|'lowest'|'highest';
    const n = rankMatch[2] ? Number(rankMatch[2]) : undefined;
    ranking = { order, n, scope: guessScope(t) };
  }

  const compare: CompareEntities = { pair, ranking };

  /* ---------- Dataset hints ---------- */

  const tables = uniq((t.match(TABLE_CODE_RE) || []).map(s => s.toLowerCase()));
  const apiLinks = uniq((raw.match(URL_RE) || []));

  const dataset: DatasetHints = { tables: tables.length ? tables : undefined, apiLinks: apiLinks.length ? apiLinks : undefined };

  /* ---------- Numbers (non-year) ---------- */

  const numbers = uniq(
    (t.match(/\b\d+(?:\.\d+)?\b/g) || [])
      .map(Number)
      .filter(n => !(n >= 1900 && n <= 2099))
  );

  return { time, geography, compare, filters, measure, dataset, numbers };
}

/* ===================== Helpers ===================== */

function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”"']/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(t: string): string[] {
  return (t.match(/[\p{L}\p{N}]+/gu) || []).slice(0, 1024);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function normalizeRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}
function uniqRange(arr: [number, number][]): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const r of arr) {
    const key = `${r[0]}-${r[1]}`;
    if (!seen.has(key)) { seen.add(key); out.push(r); }
  }
  return out;
}

function includesWord(text: string, word: string): boolean {
  const re = new RegExp(`\\b${escapeRe(word)}\\b`, 'u');
  return re.test(text);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeName(s: string): string {
  return s.replace(/[^a-z0-9\s-]/g, '').trim();
}

function guessScope(t: string): string | undefined {
  // crude scope guesser for ranking phrases
  if (/\bcountr(y|ies)\b/.test(t)) return 'countries';
  if (/\bsector(s)?\b/.test(t)) return 'sectors';
  if (/\bregion(s)?|nuts[123]?\b/.test(t)) return 'regions';
  return undefined;
}