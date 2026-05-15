import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 9999,
        transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      {message}
    </div>
  );
};

export default Toast;