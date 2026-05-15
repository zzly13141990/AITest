import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';
import { ShortcutManager } from '../shortcuts/ShortcutManager';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (sql: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ value, onChange, onExecute, onGenerate, loading }) => {
  const editorRef = useRef<any>(null);
  const { isDarkMode } = useTheme();
  const shortcutManager = ShortcutManager.getInstance();

  const handleExecute = useCallback(() => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        // 执行选中的SQL
        const model = editorRef.current.getModel();
        if (model) {
          const selectedSql = model.getValueInRange(selection);
          if (selectedSql) {
            onExecute(selectedSql);
            return;
          }
        }
      }
      // 执行整个SQL
      onExecute(value);
    } else {
      // 编辑器未就绪，执行整个SQL
      onExecute(value);
    }
  }, [value, onExecute]);

  // 注册快捷键处理器
  useEffect(() => {
    // 注册执行查询快捷键
    const handleExecuteShortcut = () => {
      handleExecute();
    };

    // 注册LLM生成快捷键
    const handleGenerateShortcut = () => {
      if (!loading) {
        onGenerate();
      }
    };

    // 注册格式化快捷键
    const handleFormatShortcut = () => {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'editor.action.formatDocument');
      }
    };

    // 注册注释快捷键
    const handleCommentShortcut = () => {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'editor.action.addCommentLine');
      }
    };

    // 注册取消注释快捷键
    const handleUncommentShortcut = () => {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'editor.action.removeCommentLine');
      }
    };

    // 注册查找快捷键
    const handleFindShortcut = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.trigger('keyboard', 'actions.find');
      }
    };

    // 注册替换快捷键
    const handleReplaceShortcut = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.trigger('keyboard', 'editor.action.startFindReplaceAction');
      }
    };

    shortcutManager.registerHandler('execute', handleExecuteShortcut);
    shortcutManager.registerHandler('generate', handleGenerateShortcut);
    shortcutManager.registerHandler('format', handleFormatShortcut);
    shortcutManager.registerHandler('comment', handleCommentShortcut);
    shortcutManager.registerHandler('uncomment', handleUncommentShortcut);
    shortcutManager.registerHandler('find', handleFindShortcut);
    shortcutManager.registerHandler('replace', handleReplaceShortcut);

    return () => {
      shortcutManager.unregisterHandler('execute', handleExecuteShortcut);
      shortcutManager.unregisterHandler('generate', handleGenerateShortcut);
      shortcutManager.unregisterHandler('format', handleFormatShortcut);
      shortcutManager.unregisterHandler('comment', handleCommentShortcut);
      shortcutManager.unregisterHandler('uncomment', handleUncommentShortcut);
      shortcutManager.unregisterHandler('find', handleFindShortcut);
      shortcutManager.unregisterHandler('replace', handleReplaceShortcut);
    };
  }, [handleExecute, onGenerate, loading]);

  // 更新编辑器聚焦状态
  useEffect(() => {
    // Monaco编辑器的focus/blur事件需要通过不同方式处理
    const model = editorRef.current?.getModel();
    if (model) {
      // 通过监听内容变化间接判断编辑器状态
      // 实际项目中可能需要更完善的实现
    }

    return () => {
      shortcutManager.setContext({ editorFocused: false });
    };
  }, []);

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 编辑器标题栏 */}
      <div className="card-header">
        <span className="card-header-title">SQL 查询</span>
      </div>
      
      {/* 编辑器内容区域 */}
      <div className="editor-container">
        {/* 左侧按钮栏 */}
        <div className="editor-toolbar">
          <button 
            className="toolbar-btn toolbar-btn-primary"
            onClick={handleExecute} 
            disabled={loading}
            title="执行查询 (Ctrl+Enter)"
          >
            {loading ? '...' : '▶'}
          </button>
          <button 
            className="toolbar-btn"
            onClick={onGenerate} 
            disabled={loading}
            title="LLM生成 (Ctrl+G)"
          >
            {loading ? '...' : '✨'}
          </button>
        </div>
        
        {/* 编辑器主体 */}
        <div className="editor-main">
          <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={(newValue) => newValue && onChange(newValue)}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            tabSize: 2,
            scrollBeyondLastLine: false,
            theme: isDarkMode ? 'vs-dark' : 'vs',
            automaticLayout: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
          }}
          />
        </div>
      </div>
    </div>
  );
};

export default SqlEditor;
