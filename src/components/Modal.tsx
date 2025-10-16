import React, { useEffect, useRef, useCallback } from 'react';
import { useFocusRestoration, trapFocus, useAriaLive } from '../utils/accessibility';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  // Additional keyboard handlers for chatbot functionality
  onSend?: () => void;
  onClear?: () => void;
  onNavigateHistory?: (direction: 'up' | 'down') => void;
  onFocusInput?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  onSend,
  onClear,
  onNavigateHistory,
  onFocusInput
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { restoreFocus } = useFocusRestoration(isOpen);
  const announceModalOpen = useAriaLive('assertive');

  // Focus trap functionality
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Handle focus trapping with Tab
    if (trapFocus(modal, e)) {
      return;
    }

    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

    // Handle chatbot keyboard shortcuts first
    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey && isInputFocused && onSend) {
          e.preventDefault();
          onSend();
          return;
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        return;

      case 'ArrowUp':
        if (isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey) {
          const input = target as HTMLTextAreaElement | HTMLInputElement;
          if (input && (input.value === '' || input.selectionStart === 0) && onNavigateHistory) {
            e.preventDefault();
            onNavigateHistory('up');
            return;
          }
        }
        break;

      case 'ArrowDown':
        if (isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey) {
          const input = target as HTMLTextAreaElement | HTMLInputElement;
          if (input && (input.value === '' || input.selectionStart === input.value.length) && onNavigateHistory) {
            e.preventDefault();
            onNavigateHistory('down');
            return;
          }
        }
        break;

      case '/':
        if (!isInputFocused && !e.shiftKey && !e.ctrlKey && !e.altKey && onFocusInput) {
          e.preventDefault();
          onFocusInput();
          return;
        }
        break;

      case 'k':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && onFocusInput) {
          e.preventDefault();
          onFocusInput();
          return;
        }
        break;

      case 'l':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && onClear) {
          e.preventDefault();
          onClear();
          return;
        }
        break;
    }

    // Handle focus trapping with Tab
    if (e.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;

      // Get all focusable elements within the modal
      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => {
        if (!element || element.tabIndex === -1) return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;
        if ((element as HTMLButtonElement).disabled) return false;
        if (element instanceof HTMLInputElement && element.type === 'hidden') return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose, onSend, onClear, onNavigateHistory, onFocusInput]);

  // Handle modal opening/closing
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Announce modal opening
      announceModalOpen(`Modal opened: ${title || 'Dialog'}`);

      // Focus the modal after a short delay to ensure DOM is ready
      const focusTimer = setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          // Try to find focusable elements in order of preference
          const focusableSelectors = [
            'button.close-button:not([disabled])',
            'input[type="text"]:not([disabled])',
            'input[type="email"]:not([disabled])',
            'textarea:not([disabled])',
            'button:not([disabled])',
            '[href]',
            'input:not([type="hidden"])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
          ];

          const firstFocusable = focusableSelectors
            .map((selector) => modal.querySelector<HTMLElement>(selector))
            .filter((element): element is HTMLElement => {
              if (!element) return false;
              if (element.getAttribute('aria-hidden') === 'true') return false;
              const style = window.getComputedStyle(element);
              return style.display !== 'none' && style.visibility !== 'hidden';
            })[0] || null;

          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);

      return () => clearTimeout(focusTimer);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore previous focus
      restoreFocus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announceModalOpen, restoreFocus]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {children}
      </div>
    </div>
  );
};