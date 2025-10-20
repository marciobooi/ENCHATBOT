/**
 * Response Resolver
 * Handles different intent types and generates appropriate responses
 * Routes to appropriate services based on intent and entities
 */
import { greetingResponses, farewellResponses, thanksResponses, affirmativeResponses, negativeResponses, smalltalkResponses, statementResponses, helpResponse, invalidResponse, metadataResponse, visualizationResponse, downloadResponse, commandResponse, questionResponse, troubleshootingResponse } from '../data/responses';

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
  const responses = greetingResponses;

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

  const responses = farewellResponses;


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
  const responses = thanksResponses;

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
  const responses = affirmativeResponses;

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
  const responses = negativeResponses;

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

function handleHelp(): ResolverResponse {
  return {
    text: helpResponse,
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

async function handleMetadataRequest(): Promise<ResolverResponse> {
  return {
    text: metadataResponse,
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

async function handleVisualizationRequest(): Promise<ResolverResponse> {
  return {
    text: visualizationResponse,
    type: 'text',
    metadata: {
      source: 'visualization_handler'
    }
  };
}

async function handleDownloadRequest(): Promise<ResolverResponse> {
  return {
    text: downloadResponse,
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

function handleCommand(): ResolverResponse {
  return {
    text: commandResponse,
    type: 'text',
    metadata: {
      source: 'command_handler'
    }
  };
}

async function handleQuestion(resolution: Resolution, entities: Entities): Promise<ResolverResponse> {
  // For questions, try to determine if it's data-related or general

  if (entities.measure && entities.measure.measures.length > 0) {
    // Looks like a data question
    return await handleDataQuery(resolution, entities);
  }

  return {
    text: questionResponse,
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
  const responses = smalltalkResponses;

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

function handleTroubleshooting(): ResolverResponse {
  // Generate mailto URL with diagnostic information
  const mailtoUrl = generateSupportEmailUrl();

  return {
    text: troubleshootingResponse,
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
  const responses = statementResponses;


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

function handleInvalid(): ResolverResponse {
  return {
    text: invalidResponse,
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