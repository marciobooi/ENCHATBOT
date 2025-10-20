// data/lexicon.ts
// Domain vocabulary and keyword lists for intent detection

/* ===================== Domain Terms ===================== */

export const ENERGY_TERMS = [
  'energy balance','gross inland consumption','final energy consumption','primary energy',
  'electricity','power','gas','natural gas','renewables','renewable','wind','solar','hydro',
  'oil','petroleum','coal','lignite','biomass','biofuel','heat','district heating','hydrogen',
  'nuclear','emissions','emission','co2','ghg','greenhouse gas','price','prices','tariff','tariffs',
  'consumption','production','generation','imports','import','exports','export','net imports','storage','stocks',
  'capacity','load','demand','peak','efficiency','intensity','kwh','mwh','gwh','twh','toe','ktoe',
  'nrg','eurostat','dataset','table',
];

export const MEASURE_TERMS = [
  'consumption','production','generation','price','prices','tariff','tariffs',
  'emission','emissions','capacity','demand','intensity','efficiency','load','stock','stocks','storage'
];

export const VIZ_TERMS = [
  'show','plot','chart','visualise','visualize','draw','map','graph','heatmap',
  'bar chart','line chart','pie','scatter','choropleth','dashboard','table','pivot',
];

export const DOWNLOAD_TERMS = [
  'download','export','save as','csv','xlsx','xls','json','png','jpg','jpeg','svg','pdf','api','share','embed','link',
];

export const FILTER_TERMS = [
  'country','eu','eu27','member state','sector','nace','household','households','industry','transport','services',
  'residential','fuel','product','unit','per capita','nuts','nuts2','nuts3','region','by country','by sector',
];

export const TIME_KEYWORDS = [
  'monthly','quarterly','annual','annualy','annually','trend','over time','ytd','last year','this year','latest',
  'most recent','current','q1','q2','q3','q4','seasonal','winter','summer','spring','autumn','fall',
];

export const METADATA_TERMS = [
  'definition','metadata','methodology','methodologies',
  'calculated','computed','source','data source','dataset','table code','frequency','release','last update','revision',
];

export const COMPARE_TERMS = [
  'compare','vs','versus','difference between','rank','ranking','top','bottom','lowest','highest',
];

export const HELP_TERMS = [
  'help',
  'help me',
  'can you help',
  'how to use',
  'how do i',
  'how do you',
  'what can you do',
  'commands',
  'instructions',
  'guide',
  'guidelines',
  'manual',
  'examples',
  'show me',
  'usage',
  'need help',
  'need assistance',
  'support',
  'how does this work',
  'how it works'
];

/* ===================== Social Interaction Vocabulary ===================== */

export const GREETING_BASE = [
  // --- Core single-word greetings ---
  'hi', 'hello', 'hey', 'howdy', 'hiya', 'yo', 'greetings', 'welcome', 'salutations', 'sup',
  'heya', 'heyo',

  // --- Abbreviations / internet shorthand ---
  'gm', 'ga', 'ge', 'gday', "g'day", 'g day', 'gidday',

  // --- Time-based greetings (commonly used as greetings) ---
  'good morning', 'good afternoon', 'good day',
  'morning', 'afternoon', 'evening',

  // --- Friendly variants ---
  'hi there', 'hello there', 'hey there',

  // --- Group-address variants (very common in chats/teams) ---
  'hi all', 'hi everyone', 'hi folks', 'hi team', 'hi guys',
  'hello all', 'hello everyone', 'hello folks', 'hello team', 'hello guys',
  'hey all', 'hey everyone', 'hey folks', 'hey team', 'hey guys',
  'hey yall', "hey y'all",

  // --- Conversational openers typically used as greetings ---
  "how's it going", 'hows it going', 'how is it going', 'how s it going',
  'how are you', 'how are ya', 'how are yall', "how are y'all", 'how are u',
  'how are you doing', 'how you doing',
  'how are things', 'how goes it', "how's everything", 'hows everything', 'how s everything',
  'how ya doing', 'how ya doin', 'how you doin', 'how u doing',
  "what's up", 'whats up', 'what s up', 'wassup', 'wazzup', 'whassup', 'waddup', 'what up',
  "what's good", 'whats good', 'what s good', "what's new", 'whats new', 'what s new',
  "what's happening", 'whats happening', 'what s happening', "what's happenin", 'whats happenin',
  "what's poppin", 'whats poppin', 'what s poppin',
  'long time no see', "it's been a while", 'its been a while', 'it s been a while',
  'nice to see you',
];

export const THANKS_BASE = [
  // Core
  'thanks', 'thank', 'thank you', 'thank u',

  // Abbreviations / Short forms
  'thx', 'ty', 'tnx', 'tks',

  // Casual / Friendly
  'thanks a lot', 'thanks so much', 'thanks very much',
  'thank you so much', 'thank you very much',
  'many thanks', 'much obliged',

  // Appreciation phrases
  'appreciate', 'appreciate it', 'really appreciate', 'greatly appreciate',

  // Informal / Slang
  'cheers', 'props', 'big thanks', 'big thank you'
];

export const FAREWELL_BASE = [
  // --- Core single-word farewells ---
  'bye', 'goodbye', 'farewell', 'adieu', 'cheerio', 'later', 'peace', 'ciao',
  
  // --- Abbreviations / internet shorthand ---
  'cya', 'c ya', 'ttyl', 'gtg', 'g2g', 'gotta go', 'got to go', 'gotta run', 'got to run',
  'brb', 'bbl', 'bb', 'bai', 'buh-bye', 'buhbye',
  
  // --- Time-based farewells ---
  'good night', 'goodnight', 'gn',
  
  // --- Friendly variants ---
  'bye bye', 'bye-bye', 'byebye',
  'see you', 'see ya', 'see you later', 'see ya later', 'see you soon', 'see ya soon',
  'see you tomorrow', 'see ya tomorrow', 'see you around', 'see ya around',
  'catch you later', 'catch ya later', 'talk to you later', 'talk to ya later',
  
  // --- Polite/formal farewells ---
  'take care', 'have a good day', 'have a great day', 'have a nice day',
  'have a good one', 'have a great one', 'have a nice one', 'have a wonderful day',
  'have a good night',
  'until next time', 'until we meet again', 'till next time', 'until later', 'till tomorrow',
  
  // --- Casual/slang farewells ---
  'laters', 'l8r', 'laterz', 'later gator', 'catch you on the flip side',
  'i m out', "i'm out", 'im out', 'i m off', "i'm off", 'im off', 'i m leaving', "i'm leaving", 'im leaving',
  'i m going', "i'm going", 'im going',
  'gotta bounce', 'got to bounce',
  
  // --- With well-wishes ---
  'good luck', 'best wishes', 'all the best', 'take it easy',
  'stay safe', 'be well', 'be safe',
];

export const AMBIGUOUS_BASE = [
  'good evening',
  'night',
  'nite',
];

export const GROUP_ADDRESS_WORDS = ['everyone', 'folks', 'all', 'team', 'guys', 'yall', "y'all"];

export const FAREWELL_INDICATORS = ['goodbye', 'bye', 'see you', 'see ya', 'take care', 'later', 'leaving', 'going'];

/* ===================== Geographic Data ===================== */

export const COUNTRY_NAMES = [
  'eu','eu27','euro area','european union','belgium','france','germany','netherlands','luxembourg','spain','portugal',
  'italy','ireland','denmark','sweden','finland','poland','czechia','czech republic','slovakia','slovenia','hungary',
  'austria','romania','bulgaria','greece','croatia','estonia','latvia','lithuania','malta','cyprus',
];

export const ISO2 = ['at','be','bg','hr','cy','cz','dk','ee','fi','fr','de','el','gr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'];
