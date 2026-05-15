import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorMessage?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  error = false,
  errorMessage,
  className = '',
  ...props
}) => {
  return (
    <div className="textarea-wrapper">
      <textarea
        className={`textarea ${error ? 'textarea-error' : ''} ${className}`}
        {...props}
      />
      {error && errorMessage && (
        <p className="textarea-error-text">{errorMessage}</p>
      )}
    </div>
  );
};
