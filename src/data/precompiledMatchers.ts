// data/precompiledMatchers.ts
// Precompiled regex matchers for fast pattern matching

import {
  ENERGY_TERMS,
  MEASURE_TERMS,
  VIZ_TERMS,
  DOWNLOAD_TERMS,
  FILTER_TERMS,
  TIME_KEYWORDS,
  METADATA_TERMS,
  COMPARE_TERMS,
  HELP_TERMS,
  GREETING_BASE,
  THANKS_BASE,
  FAREWELL_BASE,
  AMBIGUOUS_BASE,
  COUNTRY_NAMES,
  ISO2,
} from './lexicon';

// Helper functions
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordMatcher(list: string[], flags = 'u') {
  return new RegExp(`\\b(?:${list.map(escapeRe).join('|')})\\b`, flags);
}

function makeGreetingRegex(base: string[], flags = 'iu') {
  const single = base.filter(p => !p.includes(' ')).map(escapeRe);
  const multi = base
    .filter(p => p.includes(' '))
    .map(p => escapeRe(p).replace(/\s+/g, '\\s+'));
  
  return new RegExp(`\\b(?:${[...single, ...multi].join('|')})\\b`, flags);
}

// Precompiled matchers
export const RX: Record<string, RegExp> = {
  energy: wordMatcher(ENERGY_TERMS),
  measure: wordMatcher(MEASURE_TERMS),
  viz: wordMatcher(VIZ_TERMS),
  download: wordMatcher(DOWNLOAD_TERMS),
  filter: wordMatcher(FILTER_TERMS),
  timeKw: wordMatcher(TIME_KEYWORDS),
  metadata: wordMatcher(METADATA_TERMS),
  compare: wordMatcher(COMPARE_TERMS),
  help: wordMatcher(HELP_TERMS),
  greeting: makeGreetingRegex(GREETING_BASE),
  thanks: wordMatcher(THANKS_BASE),
  farewell: makeGreetingRegex(FAREWELL_BASE),
  ambiguous: makeGreetingRegex(AMBIGUOUS_BASE),
  country: wordMatcher(COUNTRY_NAMES),
  iso2: wordMatcher(ISO2),
};
