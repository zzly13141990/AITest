import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { QueryResult } from '../types';
import { queryApi } from '../api';
import SqlEditor from '../components/SqlEditor';
import QueryResultComponent from '../components/QueryResult';
import { useConnection } from '../components/Layout';
import { ShortcutManager } from '../shortcuts/ShortcutManager';
import ContextMenu, { MenuItem } from '../components/ContextMenu';

interface EditorTab {
  id: string;
  title: string;
  sql: string;
  hideEditor?: boolean;
}

interface ResultTab {
  id: string;
  title: string;
  sql: string;
  result: QueryResult[];
  total: number;
  page: number;
  pageSize: number;
  success: boolean;
  error?: string;
  updateCount?: number;
  executeTime?: number;
  fetchTime?: number;
  totalTime?: number;
}

const splitSqlStatements = (sql: string): string[] => {
  const statements = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeChar = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '\0';

    if (escapeChar) {
      currentStatement += char;
      escapeChar = false;
      continue;
    }

    if (char === '\\') {
      currentStatement += char;
      escapeChar = true;
      continue;
    }

    if (char === '\'' && prevChar !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = currentStatement.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      currentStatement = '';
      continue;
    }

    currentStatement += char;
  }

  const lastStatement = currentStatement.trim();
  if (lastStatement) {
    statements.push(lastStatement);
  }

  return statements;
};

const SqlEditorPage: React.FC = () => {
  const context = useConnection();
  const shortcutManager = ShortcutManager.getInstance();

  const { selectedConnection, setOnTableClick, setOnObjectClick } = context;

  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([
    {
      id: '1',
      title: '查询 1',
      sql: ''
    }
  ]);
  const [activeEditorTabId, setActiveEditorTabId] = useState<string>('1');
  
  const [resultTabs, setResultTabs] = useState<ResultTab[]>([]);
  const [activeResultTabId, setActiveResultTabId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(60);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [contextMenuItems, setContextMenuItems] = useState<MenuItem[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorTabsRef = useRef<EditorTab[]>(editorTabs);
  const activeEditorTabIdRef = useRef<string>(activeEditorTabId);
  const resultTabsRef = useRef<ResultTab[]>(resultTabs);

  editorTabsRef.current = editorTabs;
  activeEditorTabIdRef.current = activeEditorTabId;
  resultTabsRef.current = resultTabs;

  const activeEditorTab = useMemo(() => {
    return editorTabs.find(tab => tab.id === activeEditorTabId) || editorTabs[0];
  }, [editorTabs, activeEditorTabId]);

  const activeResultTab = useMemo(() => {
    if (!activeResultTabId) return null;
    return resultTabs.find(tab => tab.id === activeResultTabId) || null;
  }, [resultTabs, activeResultTabId]);

  const setActiveEditorTab = (updates: Partial<EditorTab>) => {
    setEditorTabs(prev => prev.map(tab =>
      tab.id === activeEditorTabId ? { ...tab, ...updates } : tab
    ));
  };

  const handleSqlChange = (value: string) => {
    setActiveEditorTab({ sql: value });
  };

  const handleExecuteQuery = async (sqlToExecute: string, currentPage: number = 1, pageSize: number = 20, conn?: any) => {
    const currentConnection = conn || selectedConnection;
    if (!currentConnection) {
      setError('请选择一个数据库连接');
      return;
    }

    if (!sqlToExecute.trim()) {
      setError('请输入SQL语句');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const statements = splitSqlStatements(sqlToExecute);
      
      if (statements.length === 0) {
        setError('没有有效的SQL语句');
        setLoading(false);
        return;
      }

      if (statements.length === 1) {
        const response = await queryApi.execute(currentConnection.id!, statements[0], currentPage, pageSize);
        
        const newResultTab: ResultTab = {
          id: `result-${Date.now()}`,
          title: statements[0].substring(0, 30) + (statements[0].length > 30 ? '...' : ''),
          sql: statements[0],
          result: response.data || [],
          total: response.total || 0,
          page: currentPage,
          pageSize: pageSize,
          success: true,
          updateCount: response.updateCount || response.affectedRows || response.changedRows || response.total,
          executeTime: response.executeTime || response.executionTime,
          fetchTime: response.fetchTime,
          totalTime: response.totalTime || response.duration
        };

        setResultTabs([newResultTab]);
        setActiveResultTabId(newResultTab.id);
      } else {
        const newResultTabs: ResultTab[] = [];
        let hasError = false;

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          try {
            const response = await queryApi.execute(currentConnection.id!, statement, currentPage, pageSize);
            
            newResultTabs.push({
              id: `result-${Date.now()}-${i}`,
              title: `${i + 1}. ${statement.substring(0, 25)}${statement.length > 25 ? '...' : ''}`,
              sql: statement,
              result: response.data || [],
              total: response.total || 0,
              page: currentPage,
              pageSize: pageSize,
              success: true,
              updateCount: response.updateCount || response.affectedRows || response.changedRows || response.total,
              executeTime: response.executeTime || response.executionTime,
              fetchTime: response.fetchTime,
              totalTime: response.totalTime || response.duration
            });
          } catch (err: any) {
            let errorMessage = '';
            if (err.response && err.response.data) {
              if (err.response.data.message) {
                errorMessage = err.response.data.message;
              } else if (err.response.data.error) {
                errorMessage = err.response.data.error;
              } else {
                errorMessage = JSON.stringify(err.response.data);
              }
            } else if (err.message) {
              errorMessage = err.message;
            } else {
              errorMessage = String(err);
            }
            
            newResultTabs.push({
              id: `result-${Date.now()}-${i}`,
              title: `${i + 1}. ${statement.substring(0, 25)}${statement.length > 25 ? '...' : ''} (失败)`,
              sql: statement,
              result: [],
              total: 0,
              page: currentPage,
              pageSize: pageSize,
              success: false,
              error: errorMessage
            });
            hasError = true;
          }
        }

        setResultTabs(newResultTabs);
        setActiveResultTabId(newResultTabs[0].id);

        if (hasError) {
          const failedCount = newResultTabs.filter(t => !t.success).length;
          setError(`部分语句执行失败（${failedCount}/${newResultTabs.length}）`);
        }
      }

      setError('');
    } catch (err: any) {
      let errorMessage = '执行查询失败：';
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += String(err);
      }
      setError(errorMessage);
      console.error('查询执行错误:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!setOnTableClick || !setOnObjectClick) return;

    setOnTableClick((tableName) => {
      if (!tableName) return;

      const latestConnection = contextRef.current.selectedConnection;
      if (!latestConnection) {
        setError('请先选择一个数据库连接');
        return;
      }

      const existingTab = editorTabsRef.current.find(tab => tab.title === tableName);

      if (existingTab) {
        setActiveEditorTabId(existingTab.id);
        handleExecuteQuery(existingTab.sql, 1, 20, latestConnection);
      } else {
        if (editorTabsRef.current.length >= 20) {
          alert('标签页数量已达上限（20个）');
          return;
        }
        const sql = `SELECT TOP 1000 * FROM ${tableName}`;
        const currentTabs = editorTabsRef.current;
        const maxId = Math.max(0, ...currentTabs.map(tab => parseInt(tab.id) || 0));
        const newTabId = (maxId + 1).toString();
        const newTab: EditorTab = {
          id: newTabId,
          title: tableName,
          sql: sql,
          hideEditor: true
        };
        setEditorTabs(prev => [...prev, newTab]);
        setActiveEditorTabId(newTabId);
        handleExecuteQuery(sql, 1, 20, latestConnection);
      }
    });

    setOnObjectClick?.((object) => {
      if (!object || !object.tableName) return;

      if (editorTabsRef.current.length >= 20) {
        alert('标签页数量已达上限（20个）');
        return;
      }

      let createSql = '';
      switch (object.tableType) {
        case 'PROC':
          createSql = `-- 存储过程创建语句\nCREATE PROCEDURE ${object.tableName}\nAS\nBEGIN\n    -- 存储过程逻辑\nEND`;
          break;
        case 'FUNCTION':
          createSql = `-- 函数创建语句\nCREATE FUNCTION ${object.tableName}\n()\nRETURNS INT\nAS\nBEGIN\n    -- 函数逻辑\n    RETURN 0\nEND`;
          break;
        case 'VIEW':
          createSql = `-- 视图创建语句\nCREATE VIEW ${object.tableName}\nAS\nSELECT * FROM your_table`;
          break;
        default:
          return;
      }

      const currentTabs = editorTabsRef.current;
      const maxId = Math.max(0, ...currentTabs.map(tab => parseInt(tab.id) || 0));
      const newTabId = (maxId + 1).toString();
      const newTab: EditorTab = {
        id: newTabId,
        title: `${object.tableType}: ${object.tableName}`,
        sql: createSql
      };
      setEditorTabs(prev => [...prev, newTab]);
      setActiveEditorTabId(newTabId);
    });
  }, [setOnTableClick, setOnObjectClick, selectedConnection]);

  const handlePageChange = (newPage: number) => {
    if (!activeResultTab) return;
    setResultTabs(prev => prev.map(tab =>
      tab.id === activeResultTabId ? { ...tab, page: newPage } : tab
    ));
    handleExecuteQuery(activeResultTab.sql, newPage, activeResultTab.pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (!activeResultTab) return;
    setResultTabs(prev => prev.map(tab =>
      tab.id === activeResultTabId ? { ...tab, pageSize: newPageSize, page: 1 } : tab
    ));
    handleExecuteQuery(activeResultTab.sql, 1, newPageSize);
  };

  const extractTableName = (sql: string): string | null => {
    const selectMatch = sql.match(/SELECT\s+.*?FROM\s+([\w\.]+)/i);
    if (selectMatch) {
      return selectMatch[1];
    }
    return null;
  };

  const handleDelete = async (row: QueryResult, _index: number) => {
    if (window.confirm('确定要删除这行数据吗？')) {
      if (!activeResultTab || !selectedConnection) return;
      
      const tableName = extractTableName(activeResultTab.sql);
      if (!tableName) return;

      const columns = Object.keys(row);
      if (columns.length === 0) {
        setError('没有可用的列来标识要删除的记录');
        return;
      }

      const quoteColumn = (column: string) => `[${column}]`;

      const whereClause = columns.map(column => {
        const value = row[column];
        const formattedValue = typeof value === 'string' ? `'${value}'` : value;
        return `${quoteColumn(column)} = ${formattedValue}`;
      }).join(' AND ');

      const deleteSql = `DELETE FROM ${tableName} WHERE ${whereClause}`;

      setLoading(true);
      try {
        await queryApi.execute(selectedConnection.id!, deleteSql);
        await handleExecuteQuery(activeResultTab.sql, activeResultTab.page, activeResultTab.pageSize);
      } catch (err: any) {
        let errorMessage = '删除失败：';
        if (err.response && err.response.data) {
          if (err.response.data.message) {
            errorMessage += err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage += err.response.data.error;
          } else {
            errorMessage += JSON.stringify(err.response.data);
          }
        } else if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += String(err);
        }
        setError(errorMessage);
        console.error('删除错误:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportExcel = async (sqlToExport: string, selectedRows?: any[]) => {
    if (!selectedConnection) {
      setError('请选择一个数据库连接');
      return;
    }

    if (!sqlToExport.trim()) {
      setError('没有可导出的SQL语句');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (selectedRows && selectedRows.length > 0) {
        exportSelectedRowsToExcel(selectedRows);
      } else {
        const response = await queryApi.exportExcel(selectedConnection.id!, sqlToExport);
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query_result_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setError('');
    } catch (err: any) {
      let errorMessage = '导出Excel失败：';
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += String(err);
      }
      setError(errorMessage);
      console.error('导出Excel错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportSelectedRowsToExcel = (data: any[]) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    
    const escapeCsvField = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    let csvContent = headers.map(escapeCsvField).join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return escapeCsvField(JSON.stringify(value));
        return escapeCsvField(String(value));
      });
      csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_rows_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleGenerateSql = async () => {
    if (!selectedConnection) {
      setError('请选择一个数据库连接');
      return;
    }

    const naturalLanguageQuery = prompt('请输入自然语言查询需求：');
    if (!naturalLanguageQuery) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const generatedSql = await queryApi.generate(selectedConnection.id!, naturalLanguageQuery);
      setActiveEditorTab({ sql: generatedSql });
    } catch (err: any) {
      let errorMessage = '生成SQL失败：';
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += String(err);
      }
      setError(errorMessage);
      console.error('SQL生成错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const height = e.clientY - containerRect.top;
    const percentage = (height / containerRect.height) * 100;

    if (percentage >= 20 && percentage <= 80) {
      setEditorHeight(percentage);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const addNewEditorTab = () => {
    if (editorTabs.length >= 20) {
      alert('标签页数量已达上限（20个）');
      return;
    }
    const maxId = Math.max(0, ...editorTabs.map(tab => parseInt(tab.id) || 0));
    const newTabId = (maxId + 1).toString();
    setEditorTabs(prev => [...prev, {
      id: newTabId,
      title: `查询 ${newTabId}`,
      sql: ''
    }]);
    setActiveEditorTabId(newTabId);
    setResultTabs([]);
    setActiveResultTabId(null);
  };

  const closeEditorTab = (tabId: string) => {
    if (editorTabs.length === 1) return;
    const newTabs = editorTabs.filter(tab => tab.id !== tabId);
    setEditorTabs(newTabs);
    if (activeEditorTabId === tabId) {
      setActiveEditorTabId(newTabs[0].id);
      setResultTabs([]);
      setActiveResultTabId(null);
    }
  };

  const closeOtherEditorTabs = (currentTabId: string) => {
    const newTabs = editorTabs.filter(tab => tab.id === currentTabId);
    if (newTabs.length > 0) {
      setEditorTabs(newTabs);
      setActiveEditorTabId(currentTabId);
      setResultTabs([]);
      setActiveResultTabId(null);
      setTimeout(() => {
        if (editorTabsContainerRef.current) {
          editorTabsContainerRef.current.scrollLeft = 0;
        }
      }, 0);
    }
  };

  const closeLeftEditorTabs = (currentIndex: number) => {
    const newTabs = editorTabs.slice(currentIndex);
    if (newTabs.length > 0 && newTabs.length < editorTabs.length) {
      setEditorTabs(newTabs);
      setActiveEditorTabId(newTabs[0].id);
      setResultTabs([]);
      setActiveResultTabId(null);
    }
  };

  const closeRightEditorTabs = (currentIndex: number) => {
    const newTabs = editorTabs.slice(0, currentIndex + 1);
    if (newTabs.length > 0) {
      setEditorTabs(newTabs);
      setActiveEditorTabId(newTabs[newTabs.length - 1].id);
      setResultTabs([]);
      setActiveResultTabId(null);
    }
  };

  const closeResultTab = (tabId: string) => {
    if (resultTabs.length === 1) {
      setResultTabs([]);
      setActiveResultTabId(null);
      return;
    }
    const newTabs = resultTabs.filter(tab => tab.id !== tabId);
    setResultTabs(newTabs);
    if (activeResultTabId === tabId) {
      setActiveResultTabId(newTabs[0].id);
    }
  };

  const handleEditorTabRightClick = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    
    if (editorTabs.length <= 1) return;

    const currentIndex = editorTabs.findIndex(tab => tab.id === tabId);
    
    const menuItems: MenuItem[] = [
      {
        id: 'close-other',
        label: '删除除本页外的其他标签',
        disabled: editorTabs.length <= 1,
        onClick: () => closeOtherEditorTabs(tabId)
      },
      {
        id: 'close-left',
        label: '删除左边的标签',
        disabled: currentIndex <= 0,
        onClick: () => closeLeftEditorTabs(currentIndex)
      },
      {
        id: 'close-right',
        label: '删除右边的标签',
        disabled: currentIndex === editorTabs.length - 1,
        onClick: () => closeRightEditorTabs(currentIndex)
      }
    ];

    setContextMenuItems(menuItems);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  const handleContextMenuClose = () => {
    setContextMenuVisible(false);
  };

  const handleEditorTabClick = (tabId: string) => {
    setActiveEditorTabId(tabId);
    setResultTabs([]);
    setActiveResultTabId(null);
  };

  useEffect(() => {
    const handleNewTab = () => {
      addNewEditorTab();
    };

    const handleCloseTab = () => {
      closeEditorTab(activeEditorTabId);
    };

    const handleNextTab = () => {
      const currentIndex = editorTabs.findIndex(tab => tab.id === activeEditorTabId);
      if (currentIndex < editorTabs.length - 1) {
        setActiveEditorTabId(editorTabs[currentIndex + 1].id);
      } else {
        setActiveEditorTabId(editorTabs[0].id);
      }
    };

    const handlePrevTab = () => {
      const currentIndex = editorTabs.findIndex(tab => tab.id === activeEditorTabId);
      if (currentIndex > 0) {
        setActiveEditorTabId(editorTabs[currentIndex - 1].id);
      } else {
        setActiveEditorTabId(editorTabs[editorTabs.length - 1].id);
      }
    };

    const handleExportExcelShortcut = () => {
      if (activeResultTab) {
        handleExportExcel(activeResultTab.sql);
      }
    };

    shortcutManager.registerHandler('newTab', handleNewTab);
    shortcutManager.registerHandler('closeTab', handleCloseTab);
    shortcutManager.registerHandler('nextTab', handleNextTab);
    shortcutManager.registerHandler('prevTab', handlePrevTab);
    shortcutManager.registerHandler('exportExcel', handleExportExcelShortcut);

    return () => {
      shortcutManager.unregisterHandler('newTab', handleNewTab);
      shortcutManager.unregisterHandler('closeTab', handleCloseTab);
      shortcutManager.unregisterHandler('nextTab', handleNextTab);
      shortcutManager.unregisterHandler('prevTab', handlePrevTab);
      shortcutManager.unregisterHandler('exportExcel', handleExportExcelShortcut);
    };
  }, [editorTabs, activeEditorTabId, activeResultTab]);

  const editorTabsContainerRef = useRef<HTMLDivElement>(null);
  const resultTabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (containerRef: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 200;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div ref={containerRef} className="editor-wrapper">
      <div className="tab-container">
        <button 
          className="tab-scroll-btn" 
          onClick={() => scrollTabs(editorTabsContainerRef, 'left')}
          title="向左滚动"
        >
          ◀
        </button>
        
        <div ref={editorTabsContainerRef} className="tabs-scroll-container">
          {editorTabs.map(tab => (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              className={`tab ${tab.id === activeEditorTabId ? 'active' : ''}`}
              onClick={() => handleEditorTabClick(tab.id)}
              onContextMenu={(e) => handleEditorTabRightClick(e, tab.id)}
            >
              <span>{tab.title}</span>
              <span className="tab-close" onClick={(e) => {
                e.stopPropagation();
                closeEditorTab(tab.id);
              }}>
                ×
              </span>
            </div>
          ))}
        </div>
        
        <button 
          className="tab-scroll-btn" 
          onClick={() => scrollTabs(editorTabsContainerRef, 'right')}
          title="向右滚动"
        >
          ▶
        </button>
        
        <button className="tab tab-new" onClick={addNewEditorTab} title="新建查询 (Ctrl+T)">
          +
        </button>
      </div>

      {!activeEditorTab.hideEditor && (
        <>
          <div style={{
            height: `${editorHeight}%`,
            minHeight: '200px',
            transition: 'height 0.2s ease'
          }}>
            <SqlEditor
              value={activeEditorTab.sql}
              onChange={handleSqlChange}
              onExecute={(sqlToExecute) => handleExecuteQuery(sqlToExecute)}
              onGenerate={handleGenerateSql}
              loading={loading}
            />
          </div>

          <div
            style={{
              height: '12px',
              background: isDragging ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
              cursor: isDragging ? 'grabbing' : 'grab',
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            onMouseDown={handleMouseDown}
          >
            <div style={{
              width: '40px',
              height: '6px',
              background: isDragging ? 'var(--bg-primary)' : 'var(--text-muted)',
              borderRadius: '3px',
              transition: 'all 0.15s ease'
            }} />
          </div>
        </>
      )}

      <div className="query-result" style={{
        height: activeEditorTab.hideEditor ? '100%' : `${100 - editorHeight}%`,
        minHeight: '150px',
        transition: 'height 0.2s ease'
      }}>
        {resultTabs.length > 0 && (
          <div className="result-tabs-container">
            <button 
              className="tab-scroll-btn-small" 
              onClick={() => scrollTabs(resultTabsContainerRef, 'left')}
              title="向左滚动"
            >
              ◀
            </button>
            <div ref={resultTabsContainerRef} className="result-tabs-scroll">
              {resultTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`result-tab ${tab.id === activeResultTabId ? 'active' : ''}`}
                  onClick={() => setActiveResultTabId(tab.id)}
                >
                  <span>{tab.title}</span>
                  <span 
                    className="result-tab-close" 
                    onClick={(e) => {
                      e.stopPropagation();
                      closeResultTab(tab.id);
                    }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
            <button 
              className="tab-scroll-btn-small" 
              onClick={() => scrollTabs(resultTabsContainerRef, 'right')}
              title="向右滚动"
            >
              ▶
            </button>
          </div>
        )}

        {activeResultTab ? (
          <QueryResultComponent
            key={activeResultTab.id}
            result={activeResultTab.result}
            total={activeResultTab.total}
            page={activeResultTab.page}
            pageSize={activeResultTab.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onDelete={handleDelete}
            loading={loading}
            error={activeResultTab.error || error}
            onExportExcel={handleExportExcel}
            sql={activeResultTab.sql}
            updateCount={activeResultTab.updateCount}
            executeTime={activeResultTab.executeTime}
            fetchTime={activeResultTab.fetchTime}
            totalTime={activeResultTab.totalTime}
          />
        ) : resultTabs.length > 0 ? (
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-header-title">查询结果</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>请选择一个结果页签</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-header-title">查询结果</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>执行查询后显示结果</p>
            </div>
          </div>
        )}
      </div>

      <ContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        items={contextMenuItems}
        onClose={handleContextMenuClose}
      />
    </div>
  );
};

export default SqlEditorPage;