/**
 * Automated Farewell Test
 * Tests farewell intent detection and response generation
 */

import { processMessage } from '../utils/messageProcessor';

const farewellTestSentences = [
  // === CORE FAREWELLS ===
  "bye",
  "goodbye",
  "farewell",
  "ciao",
  "cheerio",
  
  // === BYE VARIANTS ===
  "bye bye",
  "bye-bye",
  "byebye",
  
  // === TIME-BASED FAREWELLS ===
  "good night",
  "goodnight",
  "good evening",
  "night",
  "nite",
  
  // === SEE YOU VARIANTS ===
  "see you",
  "see ya",
  "see you later",
  "see ya later",
  "see you soon",
  "see ya soon",
  "see you tomorrow",
  "see you around",
  
  // === CATCH YOU / TALK TO YOU ===
  "catch you later",
  "catch ya later",
  "talk to you later",
  "talk to ya later",
  
  // === TAKE CARE / WELL-WISHES ===
  "take care",
  "take it easy",
  "stay safe",
  "be well",
  "be safe",
  
  // === HAVE A GOOD... ===
  "have a good day",
  "have a great day",
  "have a nice day",
  "have a good one",
  "have a great one",
  "have a nice one",
  "have a wonderful day",
  "have a good night",
  
  // === UNTIL VARIANTS ===
  "until next time",
  "till next time",
  "until we meet again",
  "until later",
  "till tomorrow",
  
  // === LEAVING PHRASES ===
  "i'm out",
  "i'm off",
  "i'm leaving",
  "i'm going",
  "im out",
  "im off",
  "i m out",
  "i m off",
  "gotta go",
  "got to go",
  "gotta run",
  "got to run",
  "gotta bounce",
  "got to bounce",
  
  // === ABBREVIATIONS / INTERNET SHORTHAND ===
  "cya",
  "c ya",
  "ttyl",
  "gtg",
  "g2g",
  "brb",
  "bbl",
  "gn",
  "l8r",
  "laters",
  "laterz",
  
  // === GOOD LUCK / BEST WISHES ===
  "good luck",
  "best wishes",
  "all the best",
  
  // === CASUAL / SLANG ===
  "peace",
  "later",
  "later gator",
  "catch you on the flip side",
  "adieu",
  "bai",
];

export async function runFarewellTests(): Promise<void> {
  console.log('🚀 Farewell Tests\n');
  console.log('=' .repeat(30));

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < farewellTestSentences.length; i++) {
    const input = farewellTestSentences[i];

    try {
      // Process the message
      const processingResult = processMessage(input);

      // Check if farewell intent was detected
      const isFarewell = processingResult.resolution.primary === 'farewell';

      if (isFarewell) {
        passed++;
        // Don't output anything for passed tests
      } else {
        failed++;
        // Show detailed info for failures only
        console.log(`❌ FAIL "${input}"`);
        console.log(`  └─ Detected as: ${processingResult.resolution.primary}`);
        console.log(`  └─ Preprocessed: "${processingResult.preprocessed.cleaned}"`);
        console.log(`  └─ Tokens: [${processingResult.preprocessed.tokens.join(', ')}]`);
        console.log(`  └─ Scores: farewell=${processingResult.resolution.scores.farewell.toFixed(1)}, greeting=${processingResult.resolution.scores.greeting.toFixed(1)}, question=${processingResult.resolution.scores.question.toFixed(1)}, statement=${processingResult.resolution.scores.statement.toFixed(1)}`);
      }

    } catch (error) {
      console.error(`❌ ERROR testing "${input}":`, error);
      failed++;
    }
  }

  console.log('=' .repeat(30));
  console.log(`📊 Results: ${passed} passed, ${failed} failed (${farewellTestSentences.length} total)`);
  console.log('🎯 All farewells should be detected as "farewell" intent');
}

// Auto-run tests in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    runFarewellTests().catch(console.error);
  }, 2000); // Run after greeting tests
}
