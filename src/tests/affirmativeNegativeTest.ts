/**
 * Automated Affirmative & Negative Test
 * Tests affirmative and negative intent detection
 */

import { processMessage } from '../utils/messageProcessor';

const affirmativeTestSentences = [
  // === CORE AFFIRMATIVES ===
  'yes', 'yeah', 'yep', 'yup', 'yea', 'aye', 'yah',

  // === AGREEMENT ===
  'ok', 'okay', 'k', 'kk', 'alright', 'all right',

  // === CONFIRMATION ===
  'sure', 'certainly', 'absolutely', 'definitely', 'indeed', 'exactly', 'correct',
  'right', 'true',

  // === AGREEMENT EXPRESSIONS ===
  'i agree', 'agreed', 'sounds good', 'makes sense', 'that works', 'fine',

  // === ENTHUSIASTIC ===
  'of course', 'for sure', 'you bet', 'why not', 'go ahead',

  // === CASUAL ===
  'ya', 'uh huh', 'mhm', 'mm hmm',
];

const negativeTestSentences = [
  // === CORE NEGATIVES ===
  'no', 'nope', 'nah', 'nay', 'no way', 'not really',

  // === DISAGREEMENT ===
  'i disagree', "don't think so", 'dont think so',

  // === REFUSAL ===
  "i can't", "can't", 'cannot', "i won't", "won't", 'refuse', 'decline',

  // === NEGATION ===
  'never', 'never mind', 'nevermind', 'negative', 'false', 'incorrect', 'wrong',

  // === POLITE REFUSAL ===
  'no thanks', 'not interested', 'not now', 'maybe later', "i'd rather not",

  // === CASUAL ===
  'nop', 'nuh uh', 'nada', 'no sir', 'no maam',
];

export async function runAffirmativeNegativeTests(): Promise<void> {
  console.log('🚀 Affirmative & Negative Tests\n');
  console.log('=' .repeat(40));

  let totalPassed = 0;
  let totalFailed = 0;

  // Test affirmatives
  console.log('Testing AFFIRMATIVE intents...');
  for (let i = 0; i < affirmativeTestSentences.length; i++) {
    const input = affirmativeTestSentences[i];

    try {
      const processingResult = processMessage(input, false);
      const isAffirmative = processingResult.resolution.primary === 'affirmative';

      if (isAffirmative) {
        totalPassed++;
      } else {
        totalFailed++;
        console.log(`❌ FAIL "${input}"`);
        console.log(`  └─ Detected as: ${processingResult.resolution.primary}`);
        console.log(`  └─ Preprocessed: "${processingResult.preprocessed.cleaned}"`);
        console.log(`  └─ Tokens: [${processingResult.preprocessed.tokens.join(', ')}]`);
        console.log(`  └─ Scores: affirmative=${processingResult.resolution.scores.affirmative.toFixed(1)}, negative=${processingResult.resolution.scores.negative.toFixed(1)}, question=${processingResult.resolution.scores.question.toFixed(1)}, statement=${processingResult.resolution.scores.statement.toFixed(1)}`);
      }

    } catch (error) {
      console.error(`❌ ERROR testing "${input}":`, error);
      totalFailed++;
    }
  }

  // Test negatives
  console.log('\nTesting NEGATIVE intents...');
  for (let i = 0; i < negativeTestSentences.length; i++) {
    const input = negativeTestSentences[i];

    try {
      const processingResult = processMessage(input, false);
      const isNegative = processingResult.resolution.primary === 'negative';

      if (isNegative) {
        totalPassed++;
      } else {
        totalFailed++;
        console.log(`❌ FAIL "${input}"`);
        console.log(`  └─ Detected as: ${processingResult.resolution.primary}`);
        console.log(`  └─ Preprocessed: "${processingResult.preprocessed.cleaned}"`);
        console.log(`  └─ Tokens: [${processingResult.preprocessed.tokens.join(', ')}]`);
        console.log(`  └─ Scores: negative=${processingResult.resolution.scores.negative.toFixed(1)}, affirmative=${processingResult.resolution.scores.affirmative.toFixed(1)}, farewell=${processingResult.resolution.scores.farewell.toFixed(1)}, question=${processingResult.resolution.scores.question.toFixed(1)}`);
      }

    } catch (error) {
      console.error(`❌ ERROR testing "${input}":`, error);
      totalFailed++;
    }
  }

  console.log('=' .repeat(40));
  console.log(`📊 Results: ${totalPassed} passed, ${totalFailed} failed (${affirmativeTestSentences.length + negativeTestSentences.length} total)`);
  console.log('🎯 All affirmatives should be detected as "affirmative" intent');
  console.log('🎯 All negatives should be detected as "negative" intent');
}

// Auto-run tests in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    runAffirmativeNegativeTests().catch(console.error);
  }, 3000); // Run after farewell tests
}