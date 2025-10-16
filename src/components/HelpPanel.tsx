import React from 'react';
import {
  Keyboard,
  Send,
  CornerDownLeft,
  ArrowUp,
  Trash2,
  X,
  Search,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Calendar,
  MapPin,
  Filter,
  ArrowRightLeft
} from 'lucide-react';
import {
  ScreenReaderOnly,
  useAriaIds
} from '../utils/accessibility';
import './HelpPanel.css';

interface HelpPanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const headingId = useAriaIds('help-heading');
  const gettingStartedId = useAriaIds('getting-started');
  const shortcutsId = useAriaIds('shortcuts');
  const featuresId = useAriaIds('features');

  if (!isOpen) return null;

  return (
    <div
      className="help-panel"
      role="region"
      aria-labelledby={headingId}
      aria-live="polite"
    >
      <header className="help-header">
        <Keyboard
          className="help-icon"
          size={20}
          aria-hidden="true"
        />
        <h1 id={headingId} className="help-title">
          Chatbot Guide & Shortcuts
        </h1>
        {onClose && (
          <button
            className="help-close-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close help panel"
            type="button"
          >
            ×
          </button>
        )}
        <ScreenReaderOnly>
          Comprehensive guide for using the Eurostat Energy Chatbot
        </ScreenReaderOnly>
      </header>

      <section className="help-section" aria-labelledby={gettingStartedId}>
        <h2 id={gettingStartedId} className="sr-only">
          Getting Started
        </h2>
        <div className="help-section-header">
          <MessageSquare size={16} aria-hidden="true" />
          <h3>Getting Started</h3>
        </div>
        <p>Welcome to the Eurostat Energy Chatbot! Ask questions about energy data, statistics, and trends from Eurostat's comprehensive database.</p>
        <div className="help-examples">
          <strong>Try asking:</strong>
          <ul>
            <li>"Show me renewable energy production in Germany"</li>
            <li>"What are the energy prices in Europe?"</li>
            <li>"Compare electricity consumption between countries"</li>
          </ul>
        </div>
      </section>

      <section className="help-section" aria-labelledby={shortcutsId}>
        <h2 id={shortcutsId} className="sr-only">
          Keyboard Shortcuts
        </h2>
        <div className="help-section-header">
          <Keyboard size={16} aria-hidden="true" />
          <h3>Keyboard Shortcuts</h3>
        </div>
        <div className="shortcuts-grid" role="list">
          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>/</kbd>
              <span aria-hidden="true">or</span>
              <kbd>Ctrl</kbd><kbd>K</kbd>
            </div>
            <div className="shortcut-desc">
              <Search size={14} aria-hidden="true" />
              <span>Focus input field</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>Enter</kbd>
            </div>
            <div className="shortcut-desc">
              <Send size={14} aria-hidden="true" />
              <span>Send message</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>Shift</kbd><kbd>Enter</kbd>
            </div>
            <div className="shortcut-desc">
              <CornerDownLeft size={14} aria-hidden="true" />
              <span>New line in input</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>↑</kbd><kbd>↓</kbd>
            </div>
            <div className="shortcut-desc">
              <ArrowUp size={14} aria-hidden="true" />
              <span>Navigate message history</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>Ctrl</kbd><kbd>L</kbd>
            </div>
            <div className="shortcut-desc">
              <Trash2 size={14} aria-hidden="true" />
              <span>Clear input field</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>Esc</kbd>
            </div>
            <div className="shortcut-desc">
              <X size={14} aria-hidden="true" />
              <span>Close modal / Clear input</span>
            </div>
          </div>

          <div className="shortcut-item" role="listitem">
            <div className="shortcut-keys">
              <kbd>Tab</kbd>
              <span aria-hidden="true">/</span>
              <kbd>Shift</kbd><kbd>Tab</kbd>
            </div>
            <div className="shortcut-desc">
              <ArrowRightLeft size={14} aria-hidden="true" />
              <span>Navigate focusable elements</span>
            </div>
          </div>
        </div>
      </section>

      <section className="help-section" aria-labelledby={featuresId}>
        <h2 id={featuresId} className="sr-only">
          Smart Features
        </h2>
        <div className="help-section-header">
          <Lightbulb size={16} aria-hidden="true" />
          <h3>Smart Features</h3>
        </div>
        <div className="features-grid" role="list">
          <div className="feature-item" role="listitem">
            <BarChart3 size={14} aria-hidden="true" />
            <span><strong>Intent Detection:</strong> Automatically understands your questions about energy data</span>
          </div>
          <div className="feature-item" role="listitem">
            <Calendar size={14} aria-hidden="true" />
            <span><strong>Time Filters:</strong> Ask about specific years, months, or date ranges</span>
          </div>
          <div className="feature-item" role="listitem">
            <MapPin size={14} aria-hidden="true" />
            <span><strong>Geography:</strong> Query data for countries, regions, or EU-wide statistics</span>
          </div>
          <div className="feature-item" role="listitem">
            <Filter size={14} aria-hidden="true" />
            <span><strong>Entity Extraction:</strong> Recognizes energy types, measures, and filters automatically</span>
          </div>
        </div>
      </section>

      <footer className="help-footer" role="complementary">
        <p>
          💡 <strong>Pro tip:</strong> Be specific about what data you want - include countries, time periods, and energy types for better results!
        </p>
        <ScreenReaderOnly>
          Tip: For best results, include specific countries, time periods, and energy types in your questions.
        </ScreenReaderOnly>
      </footer>
    </div>
  );
};

export default HelpPanel;