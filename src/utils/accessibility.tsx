/**
 * Accessibility Utilities
 * Comprehensive accessibility helpers following WCAG 2.1 AA guidelines
 */

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Hook to manage focus restoration
 * @param isActive - Whether the component is currently active
 * @returns Object with focus restoration functions
 */
export const useFocusRestoration = (isActive: boolean) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isActive]);

  return {
    restoreFocus: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  };
};

/**
 * Safely focus an element with error handling
 * @param element - Element to focus
 * @param options - Focus options
 */
export const safeFocus = (
  element: HTMLElement | null | undefined,
  options?: FocusOptions
): boolean => {
  if (!element) return false;

  try {
    element.focus(options);
    return document.activeElement === element;
  } catch (error) {
    console.warn('Failed to focus element:', error);
    return false;
  }
};

/**
 * Get all focusable elements within a container
 * @param container - Container element to search within
 * @param includeHidden - Whether to include hidden elements
 * @returns Array of focusable elements
 */
export const getFocusableElements = (
  container: HTMLElement,
  includeHidden = false
): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  );

  return elements.filter(element => {
    if (!includeHidden) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
    }

    // Check if element is visible in viewport
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
};

/**
 * Trap focus within a container
 * @param container - Container element
 * @param event - Keyboard event
 * @returns Whether focus was trapped
 */
export const trapFocus = (container: HTMLElement, event: KeyboardEvent): boolean => {
  if (event.key !== 'Tab') return false;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return false;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey) {
    // Shift + Tab
    if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
      event.preventDefault();
      safeFocus(lastElement);
      return true;
    }
  } else {
    // Tab
    if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
      event.preventDefault();
      safeFocus(firstElement);
      return true;
    }
  }

  return false;
};

// ============================================================================
// ARIA ATTRIBUTES MANAGEMENT
// ============================================================================

/**
 * Generate unique IDs for ARIA relationships
 */
export const useAriaIds = (prefix = 'aria') => {
  const idRef = useRef<string>(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return idRef.current;
};

/**
 * ARIA live region announcer
 */
export class AriaAnnouncer {
  private liveRegion: HTMLElement | null = null;
  private static instance: AriaAnnouncer | null = null;

  private constructor() {
    this.createLiveRegion();
  }

  static getInstance(): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer();
    }
    return AriaAnnouncer.instance;
  }

  private createLiveRegion(): void {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

/**
 * Hook for managing ARIA live regions
 * @param priority - Live region priority
 * @returns Announce function
 */
export const useAriaLive = (priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = AriaAnnouncer.getInstance();

  return useCallback((message: string) => {
    announcer.announce(message, priority);
  }, [priority]);
};

/**
 * Generate ARIA label for buttons with icons
 * @param action - Action description
 * @param iconName - Icon name/description
 * @returns Accessible label
 */
export const getAriaLabelForIconButton = (action: string, iconName: string): string => {
  return `${action} (${iconName} icon)`;
};

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Standard keyboard event handler types
 */
export interface KeyboardHandler {
  (event: KeyboardEvent): void;
}

/**
 * Create keyboard navigation handler with common patterns
 * @param handlers - Key handlers map
 * @returns Keyboard event handler
 */
export const createKeyboardHandler = (
  handlers: Record<string, (event: KeyboardEvent) => void>
): KeyboardHandler => {
  return (event: KeyboardEvent) => {
    const handler = handlers[event.key];
    if (handler) {
      handler(event);
    }
  };
};

/**
 * Check if keyboard event matches common modifier patterns
 * @param event - Keyboard event
 * @param pattern - Modifier pattern
 * @returns Whether pattern matches
 */
export const matchesKeyPattern = (
  event: KeyboardEvent,
  pattern: {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  }
): boolean => {
  const { key, ctrl = false, alt = false, shift = false, meta = false } = pattern;

  return (
    event.key === key &&
    event.ctrlKey === ctrl &&
    event.altKey === alt &&
    event.shiftKey === shift &&
    event.metaKey === meta
  );
};

// ============================================================================
// SKIP LINKS
// ============================================================================

/**
 * Skip link component props
 */
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip link component for keyboard navigation
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={`skip-link ${className || ''}`}
      onFocus={(e) => {
        e.target.style.position = 'static';
        e.target.style.clip = 'auto';
        e.target.style.height = 'auto';
        e.target.style.width = 'auto';
        e.target.style.overflow = 'visible';
      }}
      onBlur={(e) => {
        e.target.style.position = 'absolute';
        e.target.style.clip = 'rect(0 0 0 0)';
        e.target.style.height = '1px';
        e.target.style.width = '1px';
        e.target.style.overflow = 'hidden';
      }}
    >
      {children}
    </a>
  );
};

// ============================================================================
// SEMANTIC HTML HELPERS
// ============================================================================

/**
 * Generate semantic heading level based on context
 * @param baseLevel - Base heading level
 * @param contextLevel - Context adjustment
 * @returns Semantic heading level
 */
export const getSemanticHeadingLevel = (baseLevel: number, contextLevel = 1): number => {
  return Math.min(Math.max(baseLevel + contextLevel - 1, 1), 6);
};

/**
 * Generate accessible form field props
 * @param options - Field options
 * @returns Accessible props
 */
export const getAccessibleFieldProps = (options: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  id?: string;
}) => {
  const { description, error, required, id } = options;
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `${fieldId}-label`;
  const descId = description ? `${fieldId}-desc` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const ariaDescribedBy = [descId, errorId].filter(Boolean).join(' ') || undefined;

  return {
    fieldId,
    labelId,
    descId,
    errorId,
    ariaDescribedBy,
    labelProps: {
      id: labelId,
      htmlFor: fieldId,
    },
    fieldProps: {
      id: fieldId,
      'aria-labelledby': labelId,
      'aria-describedby': ariaDescribedBy,
      'aria-required': required,
      'aria-invalid': !!error,
    },
    descriptionProps: descId ? {
      id: descId,
    } : undefined,
    errorProps: errorId ? {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite',
    } : undefined,
  };
};

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Check if screen reader is likely active
 * @returns Whether screen reader is detected
 */
export const isScreenReaderActive = (): boolean => {
  // Check for common screen reader indicators
  const hasSrIndicator = document.querySelector('[aria-live], [role="alert"], [role="status"]');
  const hasSrMeta = document.querySelector('meta[name="screenreader"]');

  // Check if user prefers reduced motion (often indicates assistive tech)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return !!(hasSrIndicator || hasSrMeta || prefersReducedMotion);
};

/**
 * Create screen reader only text
 * @param text - Text to show to screen readers
 * @returns Span with screen reader only styling
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <span
      className={`sr-only ${className}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
    >
      {children}
    </span>
  );
};

// ============================================================================
// ACCESSIBILITY CONSTANTS
// ============================================================================

/**
 * Common ARIA roles
 */
export const ARIA_ROLES = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  APPLICATION: 'application',
  ARTICLE: 'article',
  BANNER: 'banner',
  BUTTON: 'button',
  CELL: 'cell',
  CHECKBOX: 'checkbox',
  COLUMNHEADER: 'columnheader',
  COMBOBOX: 'combobox',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  DEFINITION: 'definition',
  DIALOG: 'dialog',
  DIRECTORY: 'directory',
  DOCUMENT: 'document',
  FEED: 'feed',
  FIGURE: 'figure',
  FORM: 'form',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  GROUP: 'group',
  HEADING: 'heading',
  IMG: 'img',
  LINK: 'link',
  LIST: 'list',
  LISTBOX: 'listbox',
  LISTITEM: 'listitem',
  LOG: 'log',
  MAIN: 'main',
  MARQUEE: 'marquee',
  MATH: 'math',
  METER: 'meter',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  MENUITEMCHECKBOX: 'menuitemcheckbox',
  MENUITEMRADIO: 'menuitemradio',
  NAVIGATION: 'navigation',
  NONE: 'none',
  NOTE: 'note',
  OPTION: 'option',
  PRESENTATION: 'presentation',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  REGION: 'region',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  ROWHEADER: 'rowheader',
  SCROLLBAR: 'scrollbar',
  SEARCH: 'search',
  SEARCHBOX: 'searchbox',
  SEPARATOR: 'separator',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  SWITCH: 'switch',
  TAB: 'tab',
  TABLE: 'table',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TERM: 'term',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem',
} as const;

/**
 * Common ARIA properties
 */
export const ARIA_PROPS = {
  ACTIVEDESCENDANT: 'aria-activedescendant',
  ATOMIC: 'aria-atomic',
  AUTOCOMPLETE: 'aria-autocomplete',
  BUSY: 'aria-busy',
  CHECKED: 'aria-checked',
  COLCOUNT: 'aria-colcount',
  COLINDEX: 'aria-colindex',
  COLSPAN: 'aria-colspan',
  CONTROLS: 'aria-controls',
  CURRENT: 'aria-current',
  DESCRIBEDBY: 'aria-describedby',
  DETAILS: 'aria-details',
  DISABLED: 'aria-disabled',
  DROPEFFECT: 'aria-dropeffect',
  ERRORMESSAGE: 'aria-errormessage',
  EXPANDED: 'aria-expanded',
  FLOWTO: 'aria-flowto',
  GRABBED: 'aria-grabbed',
  HASPOPUP: 'aria-haspopup',
  HIDDEN: 'aria-hidden',
  INVALID: 'aria-invalid',
  KEYSHORTCUTS: 'aria-keyshortcuts',
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  LEVEL: 'aria-level',
  LIVE: 'aria-live',
  MODAL: 'aria-modal',
  MULTILINE: 'aria-multiline',
  MULTISELECTABLE: 'aria-multiselectable',
  ORIENTATION: 'aria-orientation',
  OWNS: 'aria-owns',
  PLACEHOLDER: 'aria-placeholder',
  POSINSET: 'aria-posinset',
  PRESSED: 'aria-pressed',
  READONLY: 'aria-readonly',
  RELEVANT: 'aria-relevant',
  REQUIRED: 'aria-required',
  ROLEDESCRIPTION: 'aria-roledescription',
  ROWCOUNT: 'aria-rowcount',
  ROWINDEX: 'aria-rowindex',
  ROWSPAN: 'aria-rowspan',
  SELECTED: 'aria-selected',
  SETSIZE: 'aria-setsize',
  SORT: 'aria-sort',
  VALUEMAX: 'aria-valuemax',
  VALUEMIN: 'aria-valuemin',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
} as const;

/**
 * WCAG color contrast ratios
 */
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
} as const;