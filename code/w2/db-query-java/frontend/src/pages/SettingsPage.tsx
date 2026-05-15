import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShortcutManager } from '../shortcuts/ShortcutManager';
import { ShortcutConfig } from '../types/shortcuts';
import KeybindingInput from '../components/KeybindingInput';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const shortcutManager = ShortcutManager.getInstance();
  
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // 加载快捷键配置
  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = () => {
    const allShortcuts = shortcutManager.getAllShortcuts();
    setShortcuts(allShortcuts);
  };

  // 处理快捷键更新
  const handleKeybindingChange = (action: string, keybinding: typeof shortcuts[0]['keybinding']) => {
    // 检测冲突
    const conflict = shortcutManager.detectConflict(keybinding, action as any);
    
    if (conflict.hasConflict) {
      setMessage({ 
        type: 'error', 
        text: `冲突检测：该快捷键已被 "${conflict.conflictingActions.join(', ')}" 使用` 
      });
      return;
    }

    // 更新快捷键
    const success = shortcutManager.updateShortcut(action as any, keybinding);
    
    if (success) {
      setMessage({ type: 'success', text: '快捷键更新成功' });
      loadShortcuts();
    } else {
      setMessage({ type: 'error', text: '快捷键更新失败' });
    }
    
    setEditingAction(null);
  };

  // 开始编辑
  const startEditing = (action: string) => {
    setEditingAction(action);
    setMessage(null);
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingAction(null);
    setMessage(null);
  };

  // 恢复默认配置
  const handleRestoreDefaults = () => {
    if (window.confirm('确定要恢复所有快捷键为默认配置吗？')) {
      shortcutManager.restoreDefaults();
      loadShortcuts();
      setMessage({ type: 'success', text: '已恢复默认配置' });
    }
  };

  // 导出配置
  const handleExport = () => {
    const configJson = shortcutManager.exportConfig();
    setShowExportModal(true);
    // 自动下载
    downloadConfig(configJson);
  };

  // 下载配置文件
  const downloadConfig = (configJson: string) => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortcuts-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const handleImport = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: '请输入配置内容' });
      return;
    }

    const success = shortcutManager.importConfig(importText);
    
    if (success) {
      loadShortcuts();
      setShowImportModal(false);
      setImportText('');
      setMessage({ type: 'success', text: '配置导入成功' });
    } else {
      setMessage({ type: 'error', text: '配置导入失败，请检查格式是否正确' });
    }
  };

  // 按分类分组快捷键
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as { [key: string]: ShortcutConfig[] });

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* 头部 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>快捷键设置</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div 
          style={{
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: message.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${message.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <button
          onClick={handleRestoreDefaults}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          恢复默认配置
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          导出配置
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          导入配置
        </button>
      </div>

      {/* 快捷键列表 */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {Object.entries(groupedShortcuts).map(([category, items]) => (
          <div key={category}>
            {/* 分类标题 */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              {category}
            </div>
            
            {/* 快捷键项 */}
            {items.map(shortcut => (
              <div 
                key={shortcut.action}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: editingAction === shortcut.action ? 'var(--bg-hover)' : 'transparent'
                }}
              >
                {/* 描述 */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                    {shortcut.description}
                  </div>
                </div>

                {/* 快捷键输入/显示 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {editingAction === shortcut.action ? (
                    <>
                      <KeybindingInput
                        value={shortcut.keybinding}
                        onChange={(keybinding) => handleKeybindingChange(shortcut.action, keybinding)}
                      />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => cancelEditing()}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                      }}>
                        {shortcutManager.formatKeybinding(shortcut.keybinding)}
                      </div>
                      <button
                        onClick={() => startEditing(shortcut.action)}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        修改
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 导出模态框 */}
      {showExportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 15px' }}>导出配置</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
              配置文件已自动下载。以下是配置内容：
            </p>
            <textarea
              readOnly
              value={shortcutManager.exportConfig()}
              style={{
                width: '100%',
                height: '200px',
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
            <button
              onClick={() => setShowExportModal(false)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 导入模态框 */}
      {showImportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 15px' }}>导入配置</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
              请粘贴快捷键配置JSON内容：
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"action": "...", "keybinding": {...}, ...}'
              style={{
                width: '100%',
                height: '200px',
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleImport}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--brand-primary)',
                  borderRadius: '4px',
                  background: 'var(--brand-primary)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;