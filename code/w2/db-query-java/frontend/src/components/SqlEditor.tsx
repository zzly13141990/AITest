import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (sql: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ value, onChange, onExecute, onGenerate, loading }) => {
  const editorRef = useRef<any>(null);

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

  // 添加键盘快捷键 ALT+C 执行查询
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'c') {
        event.preventDefault();
        handleExecute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [value, onExecute, handleExecute]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
      {/* 编辑器标题栏 */}
      <div style={{ 
        padding: '8px 16px', 
        background: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 'bold' }}>SQL查询</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f0f0f0',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
            onClick={onGenerate} 
            disabled={loading}
          >
            {loading ? '生成中...' : 'LLM生成'}
          </button>
          <button 
            style={{
              padding: '6px 12px',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              background: '#4CAF50',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
            onClick={handleExecute} 
            disabled={loading}
          >
            {loading ? '执行中...' : '执行查询'}
          </button>
        </div>
      </div>
      
      {/* 编辑器内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
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
            theme: 'vs',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default SqlEditor;
