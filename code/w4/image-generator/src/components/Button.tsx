import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} ${className} ${isLoading ? 'btn-loading' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner />
          <span className="btn-loading-text">生成中...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

const Spinner: React.FC = () => (
  <svg
    className="spinner"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="60 20"
      fill="transparent"
    />
  </svg>
);
