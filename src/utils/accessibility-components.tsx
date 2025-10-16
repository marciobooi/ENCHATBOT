/**
 * Accessibility Components
 * React components for accessibility features
 */

import React from 'react';

export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip link component for keyboard navigation
 * Allows users to skip to main content
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={`skip-link ${className || ''}`}
      onFocus={(e) => {
        e.target.style.top = '0';
      }}
      onBlur={(e) => {
        e.target.style.top = '-40px';
      }}
    >
      {children}
    </a>
  );
};

/**
 * Screen reader only content component
 * Content that is visually hidden but available to screen readers
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return (
    <span
      className={`sr-only ${className || ''}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
    >
      {children}
    </span>
  );
};