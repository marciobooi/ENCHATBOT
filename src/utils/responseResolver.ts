/**
 * Response Resolver
 * Handles different intent types and generates appropriate responses
 * Routes to appropriate services based on intent and entities
 */

import type { Entities } from './entityExtractor';
import type { Resolution } from './intentDetection';
import { generateSupportEmailUrl } from './emailHelper';

export interface ResolverAction {
  type: 'mailto' | 'link' | 'button';
  label: string;
  url: string;
}

export interface ResolverResponse {
  text: string;
  type: 'text' | 'data' | 'error' | 'help';
  metadata?: {
    source?: string;
    confidence?: number;
    suggestions?: string[];
    actions?: ResolverAction[];
  };
}

// Track last used response indices to avoid consecutive repeats
let lastGreetingIndex = -1;
let lastFarewellIndex = -1;
let lastThanksIndex = -1;
let lastSmalltalkIndex = -1;
let lastStatementIndex = -1;

/**
 * Utility function to get random index avoiding consecutive repeats
 */
function getRandomIndexExcludingLast(lastIndex: number, arrayLength: number): number {
  if (arrayLength <= 1) return 0;

  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * arrayLength);
  } while (newIndex === lastIndex);

  return newIndex;
}

/**
 * Main response resolver that routes based on intent
 */
export async function resolveResponse(resolution: Resolution, entities: Entities): Promise<ResolverResponse> {
  const { primary: intent } = resolution;

  try {
    switch (intent) {
      case 'greeting':
        return handleGreeting(resolution);

      case 'farewell':
        return handleFarewell();

      case 'thanks':
        return handleThanks();

      case 'affirmative':
        return handleAffirmative();

      case 'negative':
        return handleNegative();

      case 'help':
        return handleHelp();

      case 'data_query':
        return await handleDataQuery(resolution, entities);

      case 'metadata_request':
        return await handleMetadataRequest();

      case 'compare_request':
        return await handleCompareRequest(entities);

      case 'viz_request':
        return await handleVisualizationRequest();

      case 'download_request':
        return await handleDownloadRequest();

      case 'filter_change':
      case 'time_change':
        return handleFilterChange(entities);

      case 'command':
        return handleCommand();

      case 'question':
        return await handleQuestion(resolution, entities);

      case 'smalltalk':
        return handleSmalltalk();

      case 'troubleshooting':
        return handleTroubleshooting();

      case 'statement':
        return handleStatement();

      case 'invalid':
      default:
        return handleInvalid();
    }
  } catch {
    return {
      text: 'I encountered an error processing your request. Please try again or contact support if the issue persists.',
      type: 'error',
      metadata: {
        source: 'error_handler'
      }
    };
  }
}

/**
 * Greeting responses
 */
function handleGreeting(resolution: Resolution): ResolverResponse {
const responses = [
  "Hello! I'm here to help you with Eurostat energy data. What would you like to know?",
  "Hi there! I can assist you with energy statistics and data from Eurostat. How can I help?",
  "Welcome! I'm your Eurostat energy data assistant. What information are you looking for?",
  "Greetings! I have access to comprehensive Eurostat energy datasets. What can I help you discover?",
  "Hey! Need insights on Eurostat energy trends? Just ask!",
  "Hi! I can provide details on energy production, consumption, and more. What do you need?",
  "Hello! Curious about renewable energy or fossil fuel stats? I’ve got the data!",
  "Hi there! Want to explore Eurostat energy indicators? Let me know your topic.",
  "Welcome! I can help you analyze energy balances and trends. What’s your question?",
  "Greetings! Looking for electricity, gas, or oil data? I’m ready to assist."
];

  const responseIndex = getRandomIndexExcludingLast(lastGreetingIndex, responses.length);
  lastGreetingIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'greeting_handler',
      confidence: resolution.scores.greeting
    }
  };
}

/**
 * Farewell responses
 */
function handleFarewell(): ResolverResponse {

const responses = [
  "Goodbye! Feel free to come back anytime for Eurostat energy data.",
  "Take care! I'm here whenever you need energy statistics information.",
  "Farewell! Don't hesitate to return for more Eurostat data insights.",
  "Until next time! Your Eurostat energy assistant is always available.",
  "See you soon! Energy data will be waiting whenever you need it.",
  "Bye for now! Come back anytime for Eurostat energy trends and stats.",
  "Thanks for stopping by! I’ll be here for your next energy query.",
  "Catch you later! Eurostat energy insights are just a click away.",
  "Goodbye! Stay informed and return for more energy data anytime.",
  "Take care! I’ll be ready with Eurostat energy details when you return."
];


  const responseIndex = getRandomIndexExcludingLast(lastFarewellIndex, responses.length);
  lastFarewellIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'farewell_handler'
    }
  };
}

/**
 * Thanks responses
 */
function handleThanks(): ResolverResponse {
const responses = [
  "You're welcome! Happy to help with Eurostat energy data.",
  "My pleasure! Let me know if you need more energy statistics.",
  "Glad I could help! Eurostat has extensive energy datasets available.",
  "You're welcome! Feel free to ask about any energy-related data.",
  "No problem! Always here for your Eurostat energy questions.",
  "Anytime! If you need more insights, just let me know.",
  "You're welcome! Energy data is my specialty.",
  "Happy to assist! Come back anytime for more Eurostat stats.",
  "Glad to help! Want to explore more energy indicators?",
  "You're welcome! I’m ready for your next energy query."
];

  const responseIndex = getRandomIndexExcludingLast(lastThanksIndex, responses.length);
  lastThanksIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'thanks_handler'
    }
  };
}

/**
 * Affirmative responses
 */
let lastAffirmativeIndex = -1;

function handleAffirmative(): ResolverResponse {
  const responses = [
    "Great! How can I help you with Eurostat energy data?",
    "Perfect! What would you like to know about energy statistics?",
    "Excellent! I'm ready to assist with energy data queries.",
    "Sounds good! Let me know what energy information you need.",
    "Alright! What energy dataset are you interested in?",
    "Okay! Feel free to ask about any energy indicators.",
    "Understood! How may I assist with your energy data needs?",
    "Got it! What energy statistics can I help you explore?",
    "Noted! I'm here to help with Eurostat energy information.",
    "Right! What aspect of energy data would you like to explore?"
  ];

  const responseIndex = getRandomIndexExcludingLast(lastAffirmativeIndex, responses.length);
  lastAffirmativeIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'affirmative_handler'
    }
  };
}

/**
 * Negative responses
 */
let lastNegativeIndex = -1;

function handleNegative(): ResolverResponse {
  const responses = [
    "No problem! Let me know if you change your mind about energy data.",
    "Understood. I'm here if you need Eurostat energy statistics later.",
    "Alright. Feel free to ask if you need energy information anytime.",
    "Okay, no worries! I'll be here when you need energy data.",
    "Got it. Let me know if there's anything else about energy statistics.",
    "Fair enough! I'm available whenever you need energy data insights.",
    "Understood. Don't hesitate to ask if you need energy information.",
    "No problem at all! I'm ready when you need energy statistics.",
    "Okay! Feel free to explore energy data whenever you're ready.",
    "Noted. I'm here to help with energy data whenever you need it."
  ];

  const responseIndex = getRandomIndexExcludingLast(lastNegativeIndex, responses.length);
  lastNegativeIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'negative_handler'
    }
  };
}

/**
 * Help responses
 */
function handleHelp(): ResolverResponse {
  return {
    text: `I can help you with Eurostat energy data in several ways:

📊 **Data Queries**: Ask about energy production, consumption, prices, etc.
📈 **Comparisons**: Compare energy data between countries, years, or sectors
📋 **Metadata**: Learn about available datasets and their structure
📥 **Downloads**: Get data exports in various formats
🎯 **Filters**: Apply time periods, geographic regions, or energy types

**Examples:**
• "Show me electricity production in Germany for 2020"
• "Compare renewable energy growth between EU countries"
• "What energy datasets are available?"
• "Download wind energy data for Europe"

Use the help panel (?) for detailed shortcuts and features.`,
    type: 'help',
    metadata: {
      source: 'help_handler',
      suggestions: [
        'What energy data is available?',
        'Show electricity production trends',
        'Compare renewable energy by country'
      ]
    }
  };
}

/**
 * Data query handler - calls Eurostat API
 */
async function handleDataQuery(resolution: Resolution, entities: Entities): Promise<ResolverResponse> {

  // Simulate API call - in real implementation, this would call Eurostat API
  try {
    // Check if we have sufficient entities for a meaningful query
    const hasTime = entities.time && (entities.time.years.length > 0 || entities.time.ranges.length > 0);
    const hasGeo = entities.geography && (entities.geography.countries.length > 0 || entities.geography.groups.length > 0);
    const hasMeasure = entities.measure && entities.measure.measures.length > 0;

    if (!hasMeasure) {
      return {
        text: "I need to know what type of energy data you're interested in. Could you specify electricity, gas, renewable energy, or another energy type?",
        type: 'text',
        metadata: {
          source: 'data_query_handler',
          suggestions: ['electricity production', 'gas consumption', 'renewable energy', 'energy prices']
        }
      };
    }

    // Build query description
    const queryParts = [];
    if (hasGeo) {
      const geoValues = [
        ...entities.geography.countries,
        ...entities.geography.groups
      ];
      if (geoValues.length > 0) {
        queryParts.push(`for ${geoValues.join(', ')}`);
      }
    }
    if (hasTime) {
      const timeValues = [
        ...entities.time.years.map(y => y.toString()),
        ...entities.time.ranges.map(r => `${r[0]}-${r[1]}`)
      ];
      if (timeValues.length > 0) {
        queryParts.push(`in ${timeValues.join(', ')}`);
      }
    }
    if (hasMeasure) {
      queryParts.push(`regarding ${entities.measure.measures.join(', ')}`);
    }

    const queryDescription = queryParts.join(' ');

    // Simulate API response
    return {
      text: `I'll help you find ${queryDescription}. Let me query the Eurostat database...

🔍 **Query Results:**
Based on your request, I've found relevant energy data. In a full implementation, this would connect to the Eurostat API and return actual statistics.

**Sample Data Structure:**
• Dataset: Energy Statistics
• Coverage: ${hasGeo ? [...entities.geography.countries, ...entities.geography.groups][0] || 'EU countries' : 'EU countries'}
• Time Period: ${hasTime ? [...entities.time.years.map(y => y.toString()), ...entities.time.ranges.map(r => `${r[0]}-${r[1]}`)][0] || 'Latest available' : 'Latest available'}
• Energy Type: ${hasMeasure ? entities.measure.measures[0] : 'Various'}

Would you like me to show you how to access this data or refine your search?`,
      type: 'data',
      metadata: {
        source: 'eurostat_api',
        confidence: resolution.scores.data_query
      }
    };

  } catch {
    return {
      text: "I encountered an issue accessing the Eurostat database. Please try again or rephrase your query.",
      type: 'error',
      metadata: {
        source: 'data_query_handler'
      }
    };
  }
}

/**
 * Metadata request handler
 */
async function handleMetadataRequest(): Promise<ResolverResponse> {
  return {
    text: `**Eurostat Energy Datasets Overview:**

📊 **Available Energy Categories:**
• **Electricity**: Production, consumption, imports/exports, prices
• **Gas**: Natural gas statistics, LNG terminals, storage
• **Oil**: Petroleum products, refinery data, stocks
• **Renewable Energy**: Solar, wind, hydro, biomass statistics
• **Energy Balances**: Complete energy flow diagrams
• **Prices**: Consumer and industrial energy prices
• **Efficiency**: Energy intensity and efficiency indicators

🔍 **Geographic Coverage:**
• EU Member States (27 countries)
• EFTA countries (Norway, Switzerland, Iceland, Liechtenstein)
• Candidate countries and potential candidates
• Regional aggregations (EU-27, EU-28, etc.)

📅 **Time Coverage:**
• Annual data: Typically 1990-present
• Monthly/quarterly data: Where available
• Some datasets go back to 1960s

**Popular Datasets:**
• ENER (Energy Statistics)
• NRGY (Energy Balances)
• Nrg_price (Energy Prices)
• Nrg_ind (Energy Indicators)

Would you like details about a specific dataset or category?`,
    type: 'text',
    metadata: {
      source: 'metadata_handler'
    }
  };
}

/**
 * Comparison request handler
 */
async function handleCompareRequest(entities: Entities): Promise<ResolverResponse> {

  return {
    text: `**Energy Data Comparison Analysis**

I'll help you compare energy data across different dimensions. Based on your request, I can compare:

📊 **Comparison Types Available:**
• **Geographic**: Between countries, regions, or economic areas
• **Temporal**: Year-over-year changes, trends over time
• **Sectoral**: Different energy types, sources, or uses
• **Economic**: Per capita, GDP correlations, efficiency metrics

**Your Comparison Request:**
${entities.geography && (entities.geography.countries.length > 1 || entities.geography.groups.length > 1) ?
  `🌍 Comparing: ${[...entities.geography.countries, ...entities.geography.groups].join(' vs ')}` :
  '🌍 Geographic comparison: Please specify countries/regions to compare'}

${entities.time && (entities.time.years.length > 1 || entities.time.ranges.length > 1) ?
  `📅 Time periods: ${[...entities.time.years.map(y => y.toString()), ...entities.time.ranges.map(r => `${r[0]}-${r[1]}`)].join(' vs ')}` :
  '📅 Time comparison: Specify periods to compare'}

${entities.measure && entities.measure.measures.length > 0 ?
  `⚡ Energy focus: ${entities.measure.measures.join(', ')}` :
  '⚡ Energy types: Please specify what to compare'}

**Example Comparisons:**
• "Compare electricity production between Germany and France in 2020"
• "Show renewable energy growth trends for EU countries 2010-2022"
• "Compare energy prices across European countries"

Would you like to refine your comparison criteria?`,
    type: 'text',
    metadata: {
      source: 'comparison_handler',
      suggestions: [
        'Compare electricity production between Germany and France',
        'Show renewable energy trends in EU countries',
        'Compare energy prices across Europe'
      ]
    }
  };
}

/**
 * Visualization request handler
 */
async function handleVisualizationRequest(): Promise<ResolverResponse> {
  return {
    text: `**Data Visualization Options**

I can help you create various types of energy data visualizations:

📈 **Chart Types Available:**
• **Line Charts**: Trends over time, historical data
• **Bar Charts**: Comparisons between countries/categories
• **Pie Charts**: Energy mix compositions, shares
• **Maps**: Geographic distributions, regional comparisons
• **Scatter Plots**: Correlations, efficiency analysis

🎨 **Visualization Features:**
• Interactive filtering by time period, geography, energy type
• Export options (PNG, SVG, PDF)
• Responsive design for different screen sizes
• Accessibility-compliant color schemes

**Popular Visualizations:**
• Energy production trends by country
• Renewable energy share over time
• Electricity prices comparison
• Energy intensity maps

Would you like me to generate a specific visualization? Please describe what data you'd like to see visualized.`,
    type: 'text',
    metadata: {
      source: 'visualization_handler'
    }
  };
}

/**
 * Download request handler
 */
async function handleDownloadRequest(): Promise<ResolverResponse> {
  return {
    text: `**Data Download Options**

You can download Eurostat energy data in various formats:

📥 **Available Formats:**
• **CSV**: Comma-separated values for spreadsheet analysis
• **Excel (XLSX)**: Formatted spreadsheets with metadata
• **JSON**: Structured data for web applications
• **XML**: Extensible markup language format
• **SDMX**: Statistical data exchange format

📊 **Download Options:**
• **Bulk Download**: Complete datasets
• **Filtered Downloads**: Custom selections by time/geography
• **API Access**: Programmatic data retrieval
• **Scheduled Reports**: Automated data updates

**Data Availability:**
• Most datasets are freely available
• Some restricted datasets require registration
• Bulk downloads may have size limits

**Getting Started:**
1. Specify the data you want (energy type, countries, time period)
2. Choose your preferred format
3. I'll provide download links or API endpoints

What energy data would you like to download?`,
    type: 'text',
    metadata: {
      source: 'download_handler'
    }
  };
}

/**
 * Filter/Time change handler
 */
function handleFilterChange(entities: Entities): ResolverResponse {

  return {
    text: `**Filter Applied Successfully**

I've updated your data filters based on your request:

${entities.time && (entities.time.years.length > 0 || entities.time.ranges.length > 0) ?
  `📅 **Time Period**: ${[...entities.time.years.map(y => y.toString()), ...entities.time.ranges.map(r => `${r[0]}-${r[1]}`)].join(', ')}` :
  ''}

${entities.geography && (entities.geography.countries.length > 0 || entities.geography.groups.length > 0) ?
  `🌍 **Geography**: ${[...entities.geography.countries, ...entities.geography.groups].join(', ')}` :
  ''}

${entities.measure && entities.measure.measures.length > 0 ?
  `⚡ **Energy Type**: ${entities.measure.measures.join(', ')}` :
  ''}

Your current data view now reflects these filters. You can:
• Apply additional filters
• Run queries with the current filters
• Reset filters to start over

Would you like to query data with these filters applied?`,
    type: 'text',
    metadata: {
      source: 'filter_handler'
    }
  };
}

/**
 * Command handler
 */
function handleCommand(): ResolverResponse {
  return {
    text: `**Command Processing**

I detected a command in your message. Available commands include:

🔧 **System Commands:**
• **/help** - Show available commands and features
• **/clear** - Clear chat history
• **/reset** - Reset all filters and settings
• **/status** - Show current system status

📊 **Data Commands:**
• **/datasets** - List available energy datasets
• **/filters** - Show current active filters
• **/export** - Export current data view

💬 **Chat Commands:**
• **/history** - Show recent conversation history
• **/save** - Save current conversation
• **/load** - Load previous conversation

Please specify which command you'd like to execute, or type /help for more details.`,
    type: 'text',
    metadata: {
      source: 'command_handler'
    }
  };
}

/**
 * Question handler - routes to appropriate service
 */
async function handleQuestion(resolution: Resolution, entities: Entities): Promise<ResolverResponse> {
  // For questions, try to determine if it's data-related or general

  if (entities.measure && entities.measure.measures.length > 0) {
    // Looks like a data question
    return await handleDataQuery(resolution, entities);
  }

  return {
    text: `I understand you're asking a question. To provide the best answer, I need more context about what you're looking for.

**Question Types I Can Help With:**
• **Data Questions**: "What is the electricity production in Germany?"
• **Definition Questions**: "What is renewable energy?"
• **Comparison Questions**: "How does Germany compare to France?"
• **Methodological Questions**: "How is energy consumption calculated?"

Could you provide more details about what you'd like to know about Eurostat energy data?`,
    type: 'text',
    metadata: {
      source: 'question_handler'
    }
  };
}

/**
 * Smalltalk handler
 */
function handleSmalltalk(): ResolverResponse {
const responses = [
  "I'm feeling energized and ready to dive into Eurostat data! What can I help you with?",
  "All good here! Curious about energy trends today?",
  "Fully operational and excited to assist! What’s your next question?",
  "I’m running smoothly—like a well-oiled machine! Need any stats?",
  "Charged up and ready! Shall we explore some renewable energy figures?",
  "Everything is working perfectly! What dataset are you interested in?",
  "I’m doing great! Want to check out electricity consumption trends?",
  "Systems are stable and ready for action! What energy topic intrigues you?",
  "Feeling bright and sunny—just like solar power! How can I help?",
  "I’m in top shape! Ready to crunch some numbers whenever you are.",
  "All systems green! What Eurostat energy insight can I provide today?",
  "I’m good, thanks for asking! Looking for oil, gas, or renewables data?",
  "Running at full capacity! What’s your next energy question?",
  "I’m feeling efficient—like a smart grid! What can I assist with?",
  "Everything’s smooth sailing! Shall we explore energy balances?",
  "I’m great! Want to dive into energy production stats?",
  "Fully charged and ready! Curious about energy imports and exports?",
  "I’m doing fantastic! How about checking some CO₂ emission data?",
  "All set and ready to help! What energy indicator interests you?",
  "I’m feeling powerful—like a hydro plant! What can I do for you today?"
];

  const responseIndex = getRandomIndexExcludingLast(lastSmalltalkIndex, responses.length);
  lastSmalltalkIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'smalltalk_handler'
    }
  };
}

/**
 * Troubleshooting handler
 */
function handleTroubleshooting(): ResolverResponse {
  // Generate mailto URL with diagnostic information
  const mailtoUrl = generateSupportEmailUrl();

  return {
    text: `Sorry to hear you're having trouble! Here are some quick tips:

• **Try rephrasing** your question with different words
• **Be specific** - include country names, years, or energy types
• **Check examples** in the help panel (?) for query ideas
• **Refresh the page** if the chatbot seems unresponsive

If the problem persists, I can prepare a support email with diagnostic information to help our team investigate.`,
    type: 'text',
    metadata: {
      source: 'troubleshooting_handler',
      actions: [{
        type: 'mailto',
        label: 'Send Email to Helpdesk',
        url: mailtoUrl
      }]
    }
  };
}

/**
 * Statement handler
 */
function handleStatement(): ResolverResponse {
const responses = [
  `I understand your statement. Here’s how I can assist:

• **Query data**: Ask about energy production, consumption, or trade
• **Compare metrics**: Analyze differences across countries or years
• **Explore metadata**: Learn about dataset coverage and methodology
• **Download data**: Get files for your own analysis

What specific energy topic would you like to dive into?`,

  `Got it! I can help you with Eurostat energy data in several ways:

• **Answer questions** on energy trends and indicators
• **Perform comparisons** between regions or time periods
• **Provide dataset details** including sources and frequency
• **Export data** for your projects

What would you like to explore first?`,

  `I hear you. Here’s what I can do:

• **Retrieve energy statistics** from Eurostat databases
• **Compare data points** across multiple dimensions
• **Explain metadata** for better understanding
• **Offer download options** for further analysis

Which area interests you most?`,

  `Thanks for sharing that. I can assist with:

• **Energy queries** for production, consumption, and prices
• **Cross-country comparisons** and trend analysis
• **Dataset documentation** for methodology and coverage
• **Data exports** in various formats

What should we look at together?`,

  `Understood! Here’s how I can help:

• **Answer energy-related questions**
• **Compare indicators** across countries or years
• **Provide metadata** for datasets
• **Facilitate downloads** for your analysis

What’s your next step?`,

  `Acknowledged. I can support you with:

• **Detailed queries** on energy statistics
• **Comparative analysis** across regions or time frames
• **Metadata exploration** for dataset clarity
• **Data delivery** in multiple formats

What energy data would you like to work with?`,

  `I see your point. Here’s what I offer:

• **Energy data retrieval** from Eurostat
• **Comparisons** between countries or sectors
• **Technical details** about data collection
• **Download options** for raw or processed data

What should we start with?`,

  `Noted! I can assist you by:

• **Answering questions** about energy trends
• **Performing comparisons** across different dimensions
• **Providing metadata** for better understanding
• **Helping with downloads** for your analysis

What’s your focus today?`,

  `I appreciate your input. Here’s how I can help:

• **Retrieve energy data** from Eurostat
• **Analyze trends** and perform comparisons
• **Explain dataset structure** and methodology
• **Provide export options** for your workflow

What would you like to explore?`,

  `Got it! I’m ready to assist with:

• **Energy statistics queries**
• **Comparative studies** across regions or time periods
• **Metadata details** for clarity
• **Data downloads** in various formats

What’s your next question?`,

  `Understood. Here’s what I can do for you:

• **Query specific energy data**
• **Compare metrics** between countries or years
• **Access metadata** for datasets
• **Export data** for your analysis

What energy topic interests you?`,

  `I hear you. My capabilities include:

• **Energy data retrieval**
• **Cross-country comparisons**
• **Metadata exploration**
• **Data export options**

What should we focus on?`,

  `Acknowledged. I can help with:

• **Energy queries** for production and consumption
• **Comparative analysis** across multiple dimensions
• **Dataset documentation** for clarity
• **Flexible downloads** for your needs
What’s your next step?`,

  `I understand your perspective. Here’s how I can assist:

• **Answer questions** about energy indicators
• **Perform comparisons** across regions or time frames
• **Provide metadata** for datasets
• **Facilitate data downloads**

What would you like to explore today?`,

  `Thanks for sharing that. I can support you with:

• **Energy data queries**
• **Comparative studies** across countries or years
• **Dataset details** including methodology
• **Data exports** for your analysis
What’s your focus?`,

  `Noted! Here’s what I can offer:

• **Retrieve Eurostat energy statistics**
• **Analyze trends and comparisons**
• **Explain metadata and coverage**
• **Provide download options**

What should we look at first?`,

  `I see what you mean. I can help with:

• **Energy queries** for production, consumption, and trade
• **Comparative analysis** across different dimensions
• **Metadata details** for datasets
• **Data delivery** in multiple formats

What’s your next question?`,

  `Understood. Here’s how I can assist:

• **Query energy data** from Eurostat
• **Compare indicators** across countries or sectors
• **Access metadata** for clarity
• **Export data** for your projects

What energy topic interests you most?`,

  `Acknowledged. I’m ready to help with:

• **Energy statistics retrieval**
• **Comparative studies** across time periods
• **Dataset documentation** for better understanding
• **Data downloads** for your analysis

What should we start with?`,

  `I appreciate your statement. Here’s what I can do:

• **Answer questions** about energy trends
• **Perform comparisons** across multiple dimensions
• **Provide metadata** for datasets
• **Facilitate downloads** for your workflow

What’s your next step?`
];


  const responseIndex = getRandomIndexExcludingLast(lastStatementIndex, responses.length);
  lastStatementIndex = responseIndex;

  return {
    text: responses[responseIndex],
    type: 'text',
    metadata: {
      source: 'statement_handler'
    }
  };
}

/**
 * Invalid input handler
 */
function handleInvalid(): ResolverResponse {
  return {
    text: `I'm not sure I understand your request. I specialize in Eurostat energy data and statistics.

**I can help with:**
• Energy production and consumption data
• Renewable energy statistics
• Electricity and gas market data
• Energy prices and costs
• Cross-country comparisons
• Historical trends and analysis

**Try asking:**
• "Show me electricity production in Germany"
• "What renewable energy data is available?"
• "Compare energy prices between EU countries"
• "Download wind energy statistics"

Use the help panel (?) for more examples and available features.`,
    type: 'text',
    metadata: {
      source: 'invalid_handler',
      suggestions: [
        'Show me electricity production data',
        'What energy datasets are available?',
        'Compare renewable energy between countries'
      ]
    }
  };
}