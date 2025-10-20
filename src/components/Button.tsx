import React from 'react';

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  loading?: boolean;
  loadingText?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  children,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  loading = false,
  loadingText = 'Loading...',
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`btn ${className} ${loading ? 'btn-loading' : ''}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled}
    >
      {loading ? loadingText : children}
    </button>
  );
};

export default Button;