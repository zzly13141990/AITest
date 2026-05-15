import React, { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, disabled = false }) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = useCallback(async () => {
    if (disabled || !text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      // 降级方案：创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (e) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
      document.body.removeChild(textArea);
    }
  }, [text, disabled]);

  const getIcon = () => {
    switch (status) {
      case 'copied':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        );
    }
  };

  const getTooltip = () => {
    switch (status) {
      case 'copied':
        return '已复制';
      case 'error':
        return '复制失败';
      default:
        return disabled ? '无创建语句' : '复制创建语句';
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || !text}
      style={{
        width: '32px',
        height: '32px',
        padding: '6px',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        background: disabled || !text ? 'var(--bg-disabled)' : 'var(--bg-tertiary)',
        color: disabled || !text ? 'var(--text-disabled)' : status === 'copied' ? '#4CAF50' : status === 'error' ? '#F44336' : 'var(--text-primary)',
        cursor: disabled || !text ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      title={getTooltip()}
    >
      {getIcon()}
      
      {/* Tooltip */}
      <span
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 8px',
          background: 'var(--bg-tooltip)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          opacity: 0,
          visibility: 'hidden',
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          zIndex: 10
        }}
        className="copy-button-tooltip"
      >
        {getTooltip()}
      </span>
    </button>
  );
};

export default CopyButton;