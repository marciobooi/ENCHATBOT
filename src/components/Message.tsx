import React from 'react';

interface ResolverAction {
  type: 'mailto' | 'link' | 'button';
  label: string;
  url: string;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: {
    actions?: ResolverAction[];
  };
}

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const handleActionClick = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className={`message ${message.sender}`}>
      <div className="message-bubble">
        {message.text}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="message-actions">
            {message.metadata.actions.map((action, index) => (
              <button
                key={index}
                className="action-button"
                onClick={() => handleActionClick(action.url)}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComponent;