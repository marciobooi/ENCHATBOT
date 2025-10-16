/**
 * Message Processing Service
 * Centralizes all input processing: preprocessing, intent detection, entity extraction,
 * global state recording, and response generation
 */

import { preprocessInput } from './preprocess';
import { resolveIntents } from './intentDetection';
import { extractEntities } from './entityExtractor';
import { resolveResponse } from './responseResolver';
import chatInsightsStore from '../state/globalChatState';
import type { Entities } from './entityExtractor';
import type { Resolution } from './intentDetection';
import type { PreprocessResult } from './preprocess';
import type { ResolverResponse } from './responseResolver';

export interface ProcessingResult {
  preprocessed: PreprocessResult;
  resolution: Resolution;
  entities: Entities;
}

/**
 * Process a user message through all analysis stages
 */
export function processMessage(input: string): ProcessingResult {
  // Step 1: Preprocess the input
  const preprocessed = preprocessInput(input);

  // Step 2: Detect intent
  const resolution = resolveIntents(preprocessed.cleaned);

  // Step 3: Extract entities
  const entities = extractEntities(preprocessed.cleaned);

  return {
    preprocessed,
    resolution,
    entities,
  };
}

/**
 * Process a message and generate a response (complete pipeline)
 */
export async function processAndRespond(input: string): Promise<ResolverResponse> {
  // Process the message
  const processingResult = processMessage(input);

  // Store the processed data in global state for debugging/logging
  const insightEntry = chatInsightsStore.record({
    raw: input,
    cleaned: processingResult.preprocessed.cleaned,
    resolution: processingResult.resolution,
    entities: processingResult.entities,
    diagnostics: {
      corrections: processingResult.preprocessed.corrections,
      flags: processingResult.preprocessed.flags,
    },
  });

  console.log('Message processing result:', processingResult, insightEntry);

  // Simulate AI thinking time (1.5-3 seconds)
  const thinkingDelay = 3000 + Math.random() * 3000;
  await new Promise(resolve => setTimeout(resolve, thinkingDelay));

  // Generate the response
  return await resolveResponse(processingResult.resolution, processingResult.entities);
}