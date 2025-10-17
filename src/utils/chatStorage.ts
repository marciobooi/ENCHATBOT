import localforage from 'localforage';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: {
    actions?: Array<{
      type: 'mailto' | 'link' | 'button';
      label: string;
      url: string;
    }>;
  };
}

interface ChatHistory {
  messages: Message[];
  messageHistory: string[];
  lastUpdated: string;
}

// Configure localforage
localforage.config({
  name: 'EurostatChatbot',
  version: 1.0,
  storeName: 'chatHistory',
  description: 'Persistent chat history for Eurostat Energy Chatbot'
});

const CHAT_HISTORY_KEY = 'chatHistory';

export class ChatStorage {
  /**
   * Save chat history to browser storage
   */
  static async saveChatHistory(
    messages: Message[],
    messageHistory: string[]
  ): Promise<void> {
    try {
      const chatHistory: ChatHistory = {
        messages,
        messageHistory,
        lastUpdated: new Date().toISOString(),
      };

      await localforage.setItem(CHAT_HISTORY_KEY, chatHistory);
      console.log('Chat history saved successfully');
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  /**
   * Load chat history from browser storage
   */
  static async loadChatHistory(): Promise<ChatHistory | null> {
    try {
      const chatHistory = await localforage.getItem<ChatHistory>(CHAT_HISTORY_KEY);

      if (chatHistory) {
        // Convert timestamp strings back to Date objects
        const processedMessages = chatHistory.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        return {
          ...chatHistory,
          messages: processedMessages
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return null;
    }
  }

  /**
   * Clear chat history from browser storage
   */
  static async clearChatHistory(): Promise<void> {
    try {
      await localforage.removeItem(CHAT_HISTORY_KEY);
      console.log('Chat history cleared successfully');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }

  /**
   * Check if chat history exists
   */
  static async hasChatHistory(): Promise<boolean> {
    try {
      const chatHistory = await localforage.getItem(CHAT_HISTORY_KEY);
      return chatHistory !== null;
    } catch (error) {
      console.error('Failed to check chat history existence:', error);
      return false;
    }
  }
}

export default ChatStorage;