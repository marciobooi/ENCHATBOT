// data/patterns.ts
// Pattern definitions and weights for intent detection

import { RX } from './precompiledMatchers';

// Pattern type: either a RegExp or a function that returns a number
export type Pattern = RegExp | ((t: string) => number);

// Intent type - must match INTENTS in intentDetection.ts
export type Intent = 
  | 'greeting' | 'farewell' | 'thanks' | 'affirmative' | 'negative'
  | 'help' | 'troubleshooting' | 'download_request' | 'viz_request'
  | 'data_query' | 'filter_change' | 'time_change' | 'metadata_request'
  | 'compare_request' | 'command' | 'question' | 'smalltalk' 
  | 'ambiguous' | 'statement' | 'invalid';

// fuzzyTokenHit will be injected at runtime
export let fuzzyTokenHit: (text: string, vocab: string[], maxDist?: number, minLen?: number) => boolean = () => false;

export function setFuzzyTokenHit(fn: typeof fuzzyTokenHit) {
  fuzzyTokenHit = fn;
}

export const PATTERNS: Record<
  Exclude<Intent, 'statement' | 'invalid'>,
  { pattern: Pattern; weight: number }[]
> = {
  troubleshooting: [
    { pattern: /\b(does(?:["']?n["']?t| not)\s+(?:work|load|function|start|open|connect|display|show|appear|run))\b/u, weight: 3.5 },
    { pattern: /\bdoes\s+t\s+(?:work|load|function|start|open|connect|display|show|appear|run)\b/u, weight: 3.5 },
    { pattern: /\b(can(?:["']?t|not)|cannot|fail(?:ed|s)?|error|exception|crash(?:ed|es)?|timeout|broken|bug|slow|stuck|load(?:ing)? issue|permission denied|unauthorized|problem|issue|not working|won't work|doesn't work)\b/u, weight: 3.2 },
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
    { pattern: /\b(what|how much|how many|show me|give me|value of|latest|evolution|time series|trend|increase|decrease)\b.*\b(electricity|gas|natural gas|renewables?|wind|solar|hydro|oil|petroleum|coal|lignite|biomass|biofuel|heat|hydrogen|nuclear|emissions?|co2|ghg|price|prices|tariffs?|consumption|production|generation|imports?|exports?|capacity|demand|kwh|mwh|gwh|twh|toe|ktoe)\b/u, weight: 2.6 },
    { pattern: (t: string) => (t.endsWith('?') && RX.energy.test(t) ? 2.2 : 0), weight: 1 },
    { pattern: RX.energy, weight: 0.9 },
    { pattern: (t: string) => (RX.energy.test(t) && RX.measure.test(t) ? 2.4 : 0), weight: 1 },
    { pattern: (t: string) => (RX.energy.test(t) && (RX.country.test(t) || RX.filter.test(t)) ? 1.8 : 0), weight: 1 },
    { pattern: /\b(electricity|gas|natural gas|renewables?|wind|solar|hydro|oil|petroleum|coal|lignite|biomass|biofuel|heat|hydrogen|nuclear|emissions?|co2|ghg|price|prices|tariffs?|consumption|production|generation|capacity|demand)\b.*\b(consumption|production|prices?|emissions?|capacity|generation|demand|intensity|efficiency)\b/u, weight: 2.0 },
  ],
  
  filter_change: [
    { pattern: RX.filter, weight: 1.9 },
    { pattern: RX.country, weight: 1.9 },
    { pattern: RX.iso2, weight: 1.6 },
    { pattern: /\b(by|for|in)\b\s+(country|sector|fuel|product|unit|nace|households?|industry|transport|services|residential|region|nuts\d?)\b/u, weight: 2.1 },
    { pattern: /\bper[- ]?capita\b/u, weight: 1.6 },
    { pattern: /\beu[- ]?27\b/u, weight: 1.4 },
  ],
  
  time_change: [
    { pattern: /\b(19|20)\d{2}\b/u, weight: 1.8 },
    { pattern: /\b(from|since|between)\s+(19|20)\d{2}\s+(to|and|[-–—])\s*(19|20)\d{2}\b/u, weight: 2.3 },
    { pattern: /\b(?:q[1-4]\s*(?:19|20)\d{2}|(?:19|20)\d{2}\s*q[1-4])\b/u, weight: 2.0 },
    { pattern: RX.timeKw, weight: 1.8 },
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/u, weight: 1.4 },
  ],
  
  metadata_request: [
    { pattern: RX.metadata, weight: 2.9 },
    { pattern: /\b(how (?:is|are|was|were))\b.*\b(calculated|computed|defined|measured|collected|estimated|compiled|aggregated|imputed)\b/u, weight: 2.8 },
    { pattern: /\b(where does|what is the source|data source)\b/u, weight: 2.0 },
    { pattern: /\bdefinition of\b/u, weight: 2.2 },
  ],
  
  compare_request: [
    { pattern: RX.compare, weight: 2.8 },
    { pattern: /^\s*compare\b/u, weight: 0.8 },
    { pattern: /\b(compare|vs|versus)\b.*\b([a-z][a-z]+)\b.*\b([a-z][a-z]+)\b/u, weight: 2.0 },
    { pattern: /\b(top\s*\d+|bottom\s*\d+|lowest\s*\d+|highest\s*\d+)\b/u, weight: 2.0 },
  ],
  
  help: [
    { pattern: RX.help, weight: 2.2 },
    { pattern: /\b(how do i .* (find|get|see)|examples)\b/u, weight: 1.6 },
  ],

  greeting: [
    // Main greeting list (from GREETING_BASE)
    { pattern: RX.greeting, weight: 5.5 },
    
    // Time-based greetings
    { pattern: /\bgood\s+(?:morning|afternoon|evening|day)\b/iu, weight: 2.5 },
    
    // Standalone time words
    { pattern: /^(?:morning|afternoon|evening|night|day)[!.,\s]*$/iu, weight: 2.3 },
    
    // Abbreviations & short forms
    { pattern: /\b(?:gm|ga|ge|gday|g(?:'|')?day|gidday)\b/iu, weight: 2.2 },
    
    // Friendly "there" variants
    { pattern: /\b(?:hi|hello|hey)\s+there\b/iu, weight: 2.0 },
    
    // Group-address greetings
    { pattern: /\b(?:hi|hello|hey)[\s,.:;–—-]+(?:all|everyone|team|folks|y(?:'|')?all)\b/iu, weight: 2.0 },
    
    // Conversational openers - INCREASED WEIGHT to beat question
    { pattern: /\b(?:how(?:'|')?s\s+(?:it\s+going|things|everything)|how\s+(?:are\s+(?:you|ya|y(?:'|')?all)|you\s+doing|ya\s+doin)|what(?:'|')?s\s+(?:up|new|good|happening|happenin|poppin)|wass?up|wazzup|waddup|what\s+up)\b/iu, weight: 3.5 },
    
    // Reconnection greetings - MUST BEAT negative detection (6.0)
    { pattern: /\b(?:long\s+time\s+no\s+see|it(?:'|')?s\s+been\s+a\s+while)\b/iu, weight: 6.5 },
    
    // Email-style salutations
    { pattern: /^(?:dear\b|to\s+whom\s+it\s+may\s+concern\b)/iu, weight: 2.0 },
    
    // Emojis
    { pattern: /[👋😊🙂😀😃😁😄🤗]/u, weight: 1.8 },
    
    // Fuzzy hits
    { pattern: (t) => (fuzzyTokenHit(t, ['hi','hello','hey','howdy','hiya','yo','heya','heyo','sup'], 1, 2) ? 1.8 : 0), weight: 1 },
  ],

  farewell: [
    // Main farewell list
    { pattern: RX.farewell, weight: 5.0 },
    
    // Time-based farewells
    { pattern: /\bgood\s+(?:night|evening)\b/iu, weight: 2.2 },
    
    // "See you" variants
    { pattern: /\bsee\s+(?:you|ya)(?:\s+(?:later|soon|tomorrow|around))?\b/iu, weight: 2.5 },
    
    // "Take care" and well-wishes
    { pattern: /\b(?:take\s+care|take\s+it\s+easy|stay\s+safe|be\s+well|be\s+safe)\b/iu, weight: 2.2 },
    
    // "Have a" constructions
    { pattern: /\bhave\s+a\s+(?:good|great|nice|wonderful|lovely)\s+(?:day|night|one|time|weekend)\b/iu, weight: 2.5 },
    
    // Leaving phrases - INCREASED WEIGHT to beat statement
    { pattern: /\b(?:i(?:'|')?m\s+(?:out|off|leaving|going)|gotta\s+(?:go|run|bounce)|got\s+to\s+(?:go|run|bounce))\b/iu, weight: 4.5 },
    
    // Abbreviations & short forms
    { pattern: /\b(?:gtg|g2g|ttyl|brb|bbl|cya|c\s+ya)\b/iu, weight: 2.0 },
    
    // Until next time variants
    { pattern: /\b(?:until|till)\s+(?:next\s+time|we\s+meet\s+again|later|tomorrow)\b/iu, weight: 2.3 },
    
    // Good luck and best wishes
    { pattern: /\b(?:good\s+luck|best\s+wishes|all\s+the\s+best)\b/iu, weight: 2.0 },
  ],
  
  thanks: [
    { pattern: RX.thanks, weight: 2.0 },
    { pattern: /\b(appreciate (it|that))\b/u, weight: 2.0 },
  ],
  
  affirmative: [
    // Core single-word affirmatives - MUST BEAT statement
    { pattern: /\b(yes|yeah|yep|yup|yea|aye|yah|okay|ok|alright|all\s+right|certainly|definitely|absolutely|indeed|correct|right|true|exactly)\b/iu, weight: 4.5 },
    
    // Multi-word expressions - "why not" MUST BEAT negative (6.0)
    { pattern: /\b(why\s+not|sounds\s+good|of\s+course|for\s+sure|you\s+bet|go\s+ahead)\b/iu, weight: 6.5 },
    
    // Agreement patterns
    { pattern: /\b(i\s+(?:think\s+)?(?:agree|concur)|agreed)\b/iu, weight: 4.0 },
    
    // Casual affirmatives
    { pattern: /\b(k|kk|ya|uh\s+huh|mhm|mm\s+hmm)\b/iu, weight: 4.3 },
    
    // Agreement continuations
    { pattern: /\b(that\s+works|makes\s+sense|fine|let(?:'|')?s\s+(?:do\s+)?it|let(?:'|')?s\s+go|let(?:'|')?s\s+start|count\s+me\s+in|i(?:'|')?m\s+in|sign\s+me\s+up)\b/iu, weight: 4.1 },
    
    // Confirmation patterns
    { pattern: /\b(roger|copy\s+that|got\s+it|understood)\b/iu, weight: 4.0 },
    
    // Looks/sounds/seems good patterns
    { pattern: /\b(sounds|looks|seems)\s+(?:good|great|fine|perfect|right)\b/iu, weight: 4.0 },
    
    // Administrative confirmations
    { pattern: /\b(approved|confirmed|accepted)\b/iu, weight: 4.0 },
    
    // Standalone affirmatives
    { pattern: /^(?:yes|yeah|ok|okay|sure|yep|definitely|absolutely|k|ya)[!.,\s]*$/iu, weight: 4.8 },
    
    // Emojis
    { pattern: /\b(thumbs\s+up|👍|✓|✔)\b/u, weight: 4.0 },
  ],
  
  negative: [
    // Core single-word negatives
    { pattern: /\b(no|nope|nah|nay|never|refuse|reject|deny|decline|false|incorrect|wrong|negative)\b/iu, weight: 6.0 },
    
    // Can't/won't patterns - specific phrases higher weight than troubleshooting (3.2) and generic negative (6.0)
    { pattern: /\b(?:i\s+)?(?:can(?:'|')?t|won(?:'|')?t)\b/iu, weight: 6.5 },
    
    // Disagreement patterns - specific phrase higher weight
    { pattern: /\bdon(?:'|')?t\s+think\s+so\b/iu, weight: 6.5 },
    { pattern: /\b(disagree|not\s+really|absolutely\s+not|definitely\s+not|no\s+way)\b/iu, weight: 6.0 },
    
    // Polite refusals - "maybe later" should trigger negative
    { pattern: /\b(maybe\s+later|no\s+thanks|not\s+interested|not\s+now|pass|sorry|skip)\b/iu, weight: 6.2 },
    
    // Dismissals
    { pattern: /\b(never\s+mind|nevermind|forget\s+it|i(?:'|')?m\s+not|i(?:'|')?d\s+rather\s+not|nuh\s+uh|nada|no\s+(?:sir|maam))\b/iu, weight: 5.8 },
    
    // Unknown/uncertain negatives
    { pattern: /\b(don(?:'|')?t\s+know|can(?:'|')?t\s+say|not\s+sure|unsure)\b/iu, weight: 4.0 },
    
    // Standalone negatives
    { pattern: /^(?:no|nope|nah|not|don(?:'|')?t\s+think\s+so)[!.,\s]*$/iu, weight: 6.5 },
    
    // "not" as standalone word (lower weight to avoid false positives)
    { pattern: /\bnot\b/iu, weight: 3.0 },
    
    // Emojis
    { pattern: /\b(thumbs\s+down|👎|✗|✕)\b/u, weight: 5.5 },
  ],
  
  command: [
    { pattern: /^\s*(show|plot|chart|visuali[sz]e|draw|map|graph|table|list|filter|set|change|update|select|open|close|reset|download|export|share|explain|define|calculate|generate|summarize|rank)\b/u, weight: 2.5 },
    { pattern: /\b(please|kindly)\b/u, weight: 1.2 },
    { pattern: /\b(let'?s)\b/u, weight: 1.3 },
    { pattern: /\b(i (need|want) you to|make sure to|be sure to)\b/u, weight: 1.8 },
  ],

  question: [
    { pattern: (t: string) => (t.endsWith('?') ? 2.3 : 0), weight: 1 },
    { pattern: /^\s*(who|what|when|where|why|how|which|can|could|do|does|is|are|will|would|should|may|might|have|has|did)\b/u, weight: 2.4 },
    { pattern: /\b(any idea|could you tell me|do you know|i wonder|is it possible)\b/u, weight: 1.6 },
  ],

  smalltalk: [
    { pattern: /\b(nice to (meet|see) you|pleased to meet you)\b/u, weight: 2.2 },
    { pattern: /\b(how do you do)\b/u, weight: 2.0 },
  ],

  ambiguous: [
    { pattern: RX.ambiguous, weight: 2.5 }
  ],
} as const;
