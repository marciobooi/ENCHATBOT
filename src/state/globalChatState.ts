import type { Entities } from '../utils/entityExtractor';
import type { Resolution } from '../utils/intentDetection';
import type { PreprocessResult } from '../utils/preprocess';

export interface ChatInsightEntry {
  id: string;
  timestamp: number;
  raw: string;
  cleaned: string;
  resolution: Resolution;
  entities: Entities;
  diagnostics?: {
    corrections: PreprocessResult['corrections'];
    flags: PreprocessResult['flags'];
  };
}

export type ChatInsightListener = (entry: ChatInsightEntry) => void;

class ChatInsightsStore {
  private entriesInternal: ChatInsightEntry[] = [];
  private listeners: Set<ChatInsightListener> = new Set();

  record(payload: {
    raw: string;
    cleaned: string;
    resolution: Resolution;
    entities: Entities;
    diagnostics?: ChatInsightEntry['diagnostics'];
  }): ChatInsightEntry {
    const entry: ChatInsightEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      raw: payload.raw,
      cleaned: payload.cleaned,
      resolution: payload.resolution,
      entities: payload.entities,
      diagnostics: payload.diagnostics ?? undefined,
    };

    this.entriesInternal.push(entry);
    this.listeners.forEach(listener => listener(entry));
    return entry;
  }

  get entries(): ChatInsightEntry[] {
    return [...this.entriesInternal];
  }

  get last(): ChatInsightEntry | undefined {
    return this.entriesInternal[this.entriesInternal.length - 1];
  }

  subscribe(listener: ChatInsightListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.entriesInternal = [];
  }
}

export const chatInsightsStore = new ChatInsightsStore();

declare global {
  interface Window {
    __EUROSTAT_CHAT_INSIGHTS__?: ChatInsightsStore;
  }
}

if (typeof window !== 'undefined') {
  window.__EUROSTAT_CHAT_INSIGHTS__ = chatInsightsStore;
}

export default chatInsightsStore;
