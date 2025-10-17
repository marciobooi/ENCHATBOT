/**
 * Automated Greeting Test
 * Tests greeting intent detection and response generation
 */

import { processMessage } from './messageProcessor';

const greetingTestSentences = [
  // === FORMAL GREETINGS ===
  "good morning",
  "good afternoon", 
  "good evening",
  "good day",
  "greetings",
  "salutations",
  "hello",
  "hello there",
  
  // === INFORMAL GREETINGS ===
  "hi",
  "hi there",
  "hey",
  "hey there",
  "hiya",
  "howdy",
  "yo",
  "sup",
  "wassup",
  "hallo",
  
  // === GROUP GREETINGS ===
  "hi all",
  "hello everyone",
  "hey everyone",
  "hey team",
  "hi folks",
  "hey guys",
  
  // === CONVERSATIONAL OPENERS ===
  "how's it going",
  "how is it going",
  "what's up",
  "what's new",
  "what's good",
  "how are you",
  "how are you doing",
  "how you doing",
  "how are things",
  "how's everything",
  
  // === TIME-SPECIFIC ===
  "morning",
  "afternoon",
  "evening",
  
  // === CASUAL/SLANG ===
  "wazzup",
  "waddup",
  "heya",
  "heyo",
  
  // === RECONNECTION GREETINGS ===
  "long time no see",
  "it's been a while",
  "nice to see you",
  
  // === ABBREVIATED ===
  "gm",
  "ga",
  "g'day"
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