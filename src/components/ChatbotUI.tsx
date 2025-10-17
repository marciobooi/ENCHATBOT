import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { processAndRespond } from '../utils/messageProcessor';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useAriaLive } from '../utils/accessibility';
import { Trash2 } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import chatInsightsStore from '../state/globalChatState';
import ChatStorage from '../utils/chatStorage';
import './ChatbotUI.css';
import Message from './Message';
import Button from './Button';
import HelpPanel from './HelpPanel';
import Tooltip from './Tooltip';
import { runGreetingTests } from '../utils/greetingTest';

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

interface ChatbotUIProps {
  onClose?: () => void;
}

export interface ChatbotUIHandlers {
  handleSend: () => void;
  clearInput: () => void;
  clearChat: () => void;
  navigateHistory: (direction: 'up' | 'down') => void;
  focusInput: () => void;
}

const ChatbotUI = forwardRef<ChatbotUIHandlers, ChatbotUIProps>(({ onClose }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: 'Hello! I\'m here to help with Eurostat energy data. What can I do for you?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Accessibility announcements
  const announceMessage = useAriaLive('polite');
  const announceStatus = useAriaLive('assertive');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedHistory = await ChatStorage.loadChatHistory();
        if (savedHistory && savedHistory.messages.length > 0) {
          setMessages(savedHistory.messages);
          setMessageHistory(savedHistory.messageHistory);
          announceStatus('Previous chat history loaded');
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();

    // Run greeting tests after loading
    setTimeout(() => {
      runGreetingTests().catch(console.error);
    }, 500);
  }, [announceStatus]);

  // Message history navigation
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (messageHistory.length === 0) return;

    let newIndex = historyIndex;

    if (direction === 'up') {
      newIndex = historyIndex < messageHistory.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
    }

    setHistoryIndex(newIndex);

    if (newIndex >= 0 && newIndex < messageHistory.length) {
      setInput(messageHistory[messageHistory.length - 1 - newIndex]);
    } else {
      setInput('');
    }
  }, [messageHistory, historyIndex]);

  // Clear input
  const clearInput = useCallback(() => {
    setInput('');
    setHistoryIndex(-1);
  }, []);

  // Clear chat
  const clearChat = useCallback(async () => {
    setMessages([
      {
        text: 'Hello! I\'m here to help with Eurostat energy data. What can I do for you?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setMessageHistory([]);
    setHistoryIndex(-1);
    setInput('');
    // Clear chat insights store
    chatInsightsStore.clear();
    // Clear stored chat history
    await ChatStorage.clearChatHistory();
    announceStatus('Chat cleared. Starting fresh conversation.');
  }, [announceStatus]);

  // Focus input
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const currentInput = input;
    const newMessageHistory = [...messageHistory, currentInput];

    // Add to message history
    setMessageHistory(newMessageHistory);
    setHistoryIndex(-1);

    const userMessage: Message = {
      text: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    announceMessage('Message sent');

    setInput('');
    setLoading(true);

    let finalMessages = messagesWithUser;
    const finalMessageHistory = newMessageHistory;

    try {
      // Process the message and generate response (complete pipeline)
      const responseResult = await processAndRespond(currentInput, finalMessages, finalMessageHistory);

      const botMessage: Message = {
        text: responseResult.text,
        sender: 'bot',
        timestamp: new Date(),
        metadata: responseResult.metadata
      };

      finalMessages = [...messagesWithUser, botMessage];
      setMessages(finalMessages);
      announceMessage('Bot response received');
    } catch {
      const errorMessage: Message = {
        text: 'Sorry, I encountered an error processing your message.',
        sender: 'bot',
        timestamp: new Date(),
      };
      finalMessages = [...messagesWithUser, errorMessage];
      setMessages(finalMessages);
      announceStatus('Error occurred while processing message');
    } finally {
      setLoading(false);
      announceStatus('Ready for next message');
    }
  }, [input, loading, messages, messageHistory, announceMessage, announceStatus]);

  // Keyboard navigation hook - disabled when in modal (modal handles focus trapping)
  const { inputRef, containerRef, handleKeyDown } = useKeyboardNavigation({
    onSend: handleSend,
    onClear: clearInput,
    onNavigateHistory: navigateHistory,
    onFocusInput: focusInput,
    onEscape: onClose || clearInput,
    disabled: loading || !!onClose, // Disable when in modal
  });

  // Auto-focus input on mount - aggressive focus to override any default behavior
  useEffect(() => {
    // Use requestAnimationFrame to ensure it runs after render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  }, [inputRef]);

  // Expose handlers for modal keyboard shortcuts
  useImperativeHandle(ref, () => ({
    handleSend,
    clearInput,
    clearChat,
    navigateHistory,
    focusInput,
  }), [handleSend, clearInput, clearChat, navigateHistory, focusInput]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={0}>
      <div
        className="chatbot-container"
        ref={containerRef}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="Eurostat Energy Chatbot"
        aria-describedby="chatbot-description"
        tabIndex={-1}
      >
      <div className="chatbot-header" role="banner">
        <h1>Eurostat Energy Chatbot</h1>
        <div id="chatbot-description" className="sr-only">
          AI-powered chatbot for Eurostat energy data queries. Use keyboard shortcuts or type questions about energy statistics.
        </div>
        <div className="header-buttons">
          <Tooltip content="Help & Keyboard Shortcuts" side="bottom">
            <button
              className="menu-button"
              onClick={() => setShowHelp(!showHelp)}
              aria-label={showHelp ? "Hide help menu" : "Show help menu"}
              aria-expanded={showHelp}
              aria-controls="help-panel"
              type="button"
            >
              ?
            </button>
          </Tooltip>
          <Tooltip content="Clear Chat History" side="bottom">
            <button
              className="clear-button"
              onClick={clearChat}
              aria-label="Clear chat history"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
          {onClose && (
            <Tooltip content="Close Chatbot" side="bottom">
              <button
                className="close-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close chatbot"
                type="button"
              >
                ×
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {showHelp ? (
        <div
          id="help-panel"
          className="help-panel-container"
        >
          <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
      ) : (
        <div
          className="messages-container"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
          {loading && (
            <div className="message bot" aria-live="assertive">
              <div className="message-bubble loading" aria-label="AI is thinking and processing your message">
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="input-container" role="form" aria-label="Message input">
        <label htmlFor="chat-input" className="sr-only">
          Type your message about Eurostat energy data
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press / to focus, ↑↓ for history)"
          rows={1}
          disabled={loading}
          aria-describedby="input-help"
          aria-invalid={false}
          autoFocus
        />
        <div id="input-help" className="sr-only">
          Press Enter to send, Shift+Enter for new line. Use ↑↓ to navigate message history.
        </div>
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          aria-label={loading ? "Sending message..." : "Send message"}
        >
          Send
        </Button>
      </div>
    </div>
    </TooltipPrimitive.Provider>
  );
});

ChatbotUI.displayName = 'ChatbotUI';

export default ChatbotUI;