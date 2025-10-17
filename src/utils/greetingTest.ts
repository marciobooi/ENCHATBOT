/**
 * Automated Greeting Test
 * Tests greeting intent detection and response generation
 */

import { processMessage } from './messageProcessor';

const greetingTestSentences = [
  "hello",
  "hi there",
  "good morning",
  "hey",
  "hi",
  "greetings",
  "good afternoon",
  "hello there",
  "hey there",
  "good day",
  "salutations",
  "howdy",
  "yo",
  "sup",
  "hiya",
  "hallo",
  // New expanded greetings
  "hi all",
  "hey everyone",
  "how's it going",
  "what's up",
  "how are you",
  "long time no see",
  "good evening",
  "hey team",
  "wassup",
  "how are things"
];

export async function runGreetingTests(): Promise<void> {
  console.log('🚀 Greeting Tests\n');
  console.log('=' .repeat(30));

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < greetingTestSentences.length; i++) {
    const input = greetingTestSentences[i];

    try {
      // Process the message
      const processingResult = processMessage(input);

      // Check if greeting intent was detected
      const isGreeting = processingResult.resolution.primary === 'greeting';
      const status = isGreeting ? '✅ PASS' : '❌ FAIL';

      if (isGreeting) {
        passed++;
      } else {
        failed++;
      }

      console.log(`${status} "${input}"`);

    } catch (error) {
      console.error(`❌ ERROR testing "${input}":`, error);
      failed++;
    }
  }

  console.log('=' .repeat(30));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('🎯 All greetings should be detected as "greeting" intent');
}

// Auto-run tests in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    runGreetingTests().catch(console.error);
  }, 1000);
}