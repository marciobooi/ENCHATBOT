/**
 * Response Resolver
 * Handles different intent types and generates appropriate responses
 * Routes to appropriate services based on intent and entities
 */

import type { Entities } from './entityExtractor';
import type { Resolution } from './intentDetection';

export interface ResolverResponse {
  text: string;
  type: 'text' | 'data' | 'error' | 'help';
  metadata?: {
    source?: string;
    confidence?: number;
    suggestions?: string[];
  };
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
    "1 Hello! I'm here to help you with Eurostat energy data. What would you like to know?",
    "2 Hi there! I can assist you with energy statistics and data from Eurostat. How can I help?",
    "3 Welcome! I'm your Eurostat energy data assistant. What information are you looking for?",
    "4 Greetings! I have access to comprehensive Eurostat energy datasets. What can I help you discover?"
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
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
    "Until next time! Your Eurostat energy assistant is always available."
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
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
    "You're welcome! Feel free to ask about any energy-related data."
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
    type: 'text',
    metadata: {
      source: 'thanks_handler'
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
    "I'm doing well, thank you for asking! I'm here and ready to help with Eurostat energy data whenever you need.",
    "I'm functioning optimally! How can I assist you with energy statistics today?",
    "All systems are go! What energy data questions do you have for me?",
    "I'm ready and waiting! Let's explore some Eurostat energy datasets together."
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
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
  return {
    text: `**Troubleshooting & Support**

If you're experiencing issues, here are some common solutions:

🔧 **Common Issues & Solutions:**

**Data Not Loading:**
• Check your internet connection
• Try refreshing the page
• Clear browser cache and cookies

**Search Not Working:**
• Ensure your query includes specific energy terms
• Try rephrasing your question
• Use the help panel for query examples

**Filters Not Applying:**
• Check that your filter values are valid
• Try resetting filters and reapplying
• Some combinations may not have data available

**Performance Issues:**
• Large datasets may take time to load
• Try narrowing your search criteria
• Use filters to reduce data volume

**API Errors:**
• Temporary service issues - try again later
• Check API status page for known outages
• Contact support for persistent issues

**Getting Help:**
• Use the help panel (?) for guidance
• Check the Eurostat website for documentation
• Contact the Eurostat helpdesk for data-specific questions

If these solutions don't resolve your issue, please provide more details about what you're experiencing.`,
    type: 'help',
    metadata: {
      source: 'troubleshooting_handler'
    }
  };
}

/**
 * Statement handler
 */
function handleStatement(): ResolverResponse {
  return {
    text: `I understand your statement. If you'd like to:

• **Query data**: Ask specific questions about energy statistics
• **Get information**: Learn about available datasets or methodologies
• **Apply filters**: Set time periods, countries, or energy types
• **Compare data**: Analyze differences between regions or time periods

Please let me know what specific energy data information you're interested in, and I'll help you find it.`,
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