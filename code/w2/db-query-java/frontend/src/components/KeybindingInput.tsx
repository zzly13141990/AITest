import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Keybinding, ModifierKey } from '../types/shortcuts';

interface KeybindingInputProps {
  value: Keybinding;
  onChange: (keybinding: Keybinding) => void;
  disabled?: boolean;
  placeholder?: string;
}

const KeybindingInput: React.FC<KeybindingInputProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  placeholder = '按下快捷键组合...'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<ModifierKey[]>([]);
  const [currentKey, setCurrentKey] = useState<string>('');
  const inputRef = useRef<HTMLDivElement>(null);

  // 重置状态
  const reset = useCallback(() => {
    setIsRecording(false);
    setCurrentKeys([]);
    setCurrentKey('');
  }, []);

  // 处理键盘按下事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果不是录制状态，忽略
    if (!isRecording) return;

    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();

    const key = normalizeKey(event.key);
    
    // 如果是修饰键，添加到当前修饰键列表
    if (isModifierKey(key)) {
      const modifierKey = key as ModifierKey;
      setCurrentKeys(prev => {
        if (!prev.includes(modifierKey)) {
          return [...prev, modifierKey];
        }
        return prev;
      });
      return;
    }

    // 如果是功能键或普通键，完成录制
    if (key) {
      setCurrentKey(key);
      
      // 创建新的快捷键组合
      const newKeybinding: Keybinding = {
        modifiers: [...currentKeys],
        key
      };
      
      onChange(newKeybinding);
      reset();
    }
  }, [isRecording, currentKeys, onChange, reset]);

  // 处理键盘松开事件
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isRecording) return;
    
    const key = normalizeKey(event.key);
    
    if (isModifierKey(key)) {
      const modifierKey = key as ModifierKey;
      setCurrentKeys(prev => prev.filter(m => m !== modifierKey));
    }
  }, [isRecording]);

  // 添加全局事件监听
  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  // 处理点击开始录制
  const handleClick = () => {
    if (disabled) return;
    
    setIsRecording(true);
    setCurrentKeys([]);
    setCurrentKey('');
  };

  // 渲染当前显示的快捷键
  const renderDisplayText = () => {
    if (isRecording) {
      const parts = [...currentKeys, currentKey].filter(Boolean);
      return parts.length > 0 ? parts.join(' + ') : placeholder;
    }
    
    // 显示当前值
    if (!value.key) {
      return placeholder;
    }
    
    const parts = [...value.modifiers, value.key];
    return parts.join(' + ');
  };

  // 获取显示样式
  const getDisplayStyle = () => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 12px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      minWidth: '150px',
      textAlign: 'center',
      backgroundColor: isRecording 
        ? 'var(--bg-active)' 
        : 'var(--bg-input)',
      color: isRecording 
        ? 'var(--brand-primary)' 
        : 'var(--text-primary)',
      borderColor: isRecording 
        ? 'var(--brand-primary)' 
        : 'var(--border-color)',
      transition: 'all 0.2s ease'
    };
    
    return baseStyle;
  };

  return (
    <div ref={inputRef}>
      <div 
        style={getDisplayStyle()}
        onClick={disabled ? undefined : handleClick}
      >
        {renderDisplayText()}
      </div>
      
      {isRecording && (
        <div style={{ 
          marginTop: '4px', 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          正在录制... 按任意键完成或按 Esc 取消
        </div>
      )}
    </div>
  );
};

/**
 * 标准化按键名称
 */
function normalizeKey(key: string): string | null {
  const keyMap: { [key: string]: string } = {
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Escape': 'Esc',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Insert': 'Insert',
    ' ': 'Space',
    'Control': 'Ctrl',
    'Shift': 'Shift',
    'Alt': 'Alt',
    'Meta': 'Meta',
  };

  if (keyMap[key]) {
    return keyMap[key];
  }

  // 功能键
  if (/^F[1-9]$|^F1[0-2]$/.test(key)) {
    return key;
  }

  // 字母键转为大写
  if (key.length === 1 && key.match(/[a-zA-Z]/)) {
    return key.toUpperCase();
  }

  // 数字键
  if (key.match(/[0-9]/)) {
    return key;
  }

  return null;
}

/**
 * 判断是否为修饰键
 */
function isModifierKey(key: string | null): boolean {
  return ['Ctrl', 'Shift', 'Alt', 'Meta'].includes(key || '');
}

export default KeybindingInput;