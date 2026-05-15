import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  errorMessage,
  className = '',
  ...props
}) => {
  return (
    <div className="input-wrapper">
      <input
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && errorMessage && (
        <p className="input-error-text">{errorMessage}</p>
      )}
    </div>
  );
};
