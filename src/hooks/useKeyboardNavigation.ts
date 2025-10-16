import { useEffect, useRef, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onSend?: () => void;
  onClear?: () => void;
  onNavigateHistory?: (direction: 'up' | 'down') => void;
  onFocusInput?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export interface KeyboardNavigationReturn {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Custom hook for comprehensive keyboard navigation in chat interfaces
 * Provides accessibility-compliant keyboard shortcuts and navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions): KeyboardNavigationReturn {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    onSend,
    onClear,
    onNavigateHistory,
    onFocusInput,
    onEscape,
    disabled = false,
  } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    const target = e.target as HTMLElement;
    const isInputFocused = target === inputRef.current;

    // Handle keyboard shortcuts
    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey && isInputFocused && onSend) {
          e.preventDefault();
          onSend();
        }
        // Shift+Enter allows new lines in textarea
        break;

      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        } else if (isInputFocused && onClear) {
          e.preventDefault();
          onClear();
        }
        break;

      case 'ArrowUp':
        if (isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey) {
          // Only navigate history if input is empty or cursor is at start
          const input = inputRef.current;
          if (input && (input.value === '' || input.selectionStart === 0)) {
            e.preventDefault();
            onNavigateHistory?.('up');
          }
        }
        break;

      case 'ArrowDown':
        if (isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey) {
          // Only navigate history if input is empty or cursor is at end
          const input = inputRef.current;
          if (input && (input.value === '' || input.selectionStart === input.value.length)) {
            e.preventDefault();
            onNavigateHistory?.('down');
          }
        }
        break;

      case '/':
        // Focus input when typing "/" anywhere in the container
        if (!isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          onFocusInput?.();
        }
        break;

      case 'k':
        // Ctrl+K or Cmd+K to focus input (like Slack/Discord)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          onFocusInput?.();
        }
        break;

      case 'l':
        // Ctrl+L or Cmd+L to clear chat (like terminal)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && onClear) {
          e.preventDefault();
          onClear();
        }
        break;

      default:
        break;
    }
  }, [disabled, onSend, onClear, onNavigateHistory, onFocusInput, onEscape]);

  // Global keyboard listener for container-wide shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're not in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      if (!isInput && containerRef.current?.contains(target)) {
        // Handle container-wide shortcuts
        switch (e.key) {
          case '/':
            if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
              e.preventDefault();
              onFocusInput?.();
            }
            break;
          case 'k':
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
              e.preventDefault();
              onFocusInput?.();
            }
            break;
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleGlobalKeyDown);
      return () => container.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [onFocusInput]);

  // Focus management
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    // Move cursor to end
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        input.selectionStart = input.value.length;
        input.selectionEnd = input.value.length;
      }
    }, 0);
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    if (!disabled) {
      focusInput();
    }
  }, [focusInput, disabled]);

  return {
    inputRef,
    containerRef,
    handleKeyDown,
  };
}

/**
 * Keyboard shortcuts help text for display in UI
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'Enter', description: 'Send message' },
  { key: 'Shift + Enter', description: 'New line' },
  { key: '↑ / ↓', description: 'Navigate message history' },
  { key: '/', description: 'Focus input' },
  { key: 'Ctrl + K', description: 'Focus input' },
  { key: 'Ctrl + L', description: 'Clear chat' },
  { key: 'Escape', description: 'Clear input' },
] as const;