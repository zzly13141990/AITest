import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QueryResult } from '../types';
import { queryApi } from '../api';
import SqlEditor from '../components/SqlEditor';
import QueryResultComponent from '../components/QueryResult';
import EditDialog from '../components/EditDialog';
import { useConnection } from '../components/Layout';

interface Tab {
  id: string;
  title: string;
  sql: string;
  result: QueryResult[];
  total: number;
  page: number;
  pageSize: number;
  hideEditor?: boolean;
}

const SqlEditorPage: React.FC = () => {
  const context = useConnection();
  console.log('SqlEditorPage: full context object keys:', Object.keys(context));
  console.log('SqlEditorPage: setOnTableClick raw type:', typeof context.setOnTableClick);
  console.log('SqlEditorPage: setOnTableClick value:', context.setOnTableClick);
  
  const { selectedConnection, setOnTableClick, setOnObjectClick } = context;
  
  console.log('SqlEditorPage render:', { 
    setOnTableClick: !!setOnTableClick, 
    setOnObjectClick: !!setOnObjectClick,
    selectedConnection: selectedConnection?.connectionName 
  });
  
  // Add a ref to track the latest context
  const contextRef = useRef(context);
  
  // Update the ref whenever context changes
  useEffect(() => {
    contextRef.current = context;
    console.log('Context ref updated:', { selectedConnection: context.selectedConnection?.connectionName });
  }, [context]);
  
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: '查询 1',
      sql: '',
      result: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editorHeight, setEditorHeight] = useState<number>(60);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [primaryKeyColumns, setPrimaryKeyColumns] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Tab[]>(tabs);
  const activeTabIdRef = useRef<string>(activeTabId);

  tabsRef.current = tabs;
  activeTabIdRef.current = activeTabId;

  // Get the current active tab
  const activeTab = useMemo(() => {
    return tabs.find(tab => tab.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  const setActiveTab = (updates: Partial<Tab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ));
  };

  const handleSqlChange = (value: string) => {
    setActiveTab({ sql: value });
  };

  const fetchPrimaryKeyColumns = async (tableName: string, connectionId: number) => {
    try {
      const metadataList = await metadataApi.getByConnectionId(connectionId);
      const tableMetadata = metadataList.find(item => item.tableName === tableName && item.tableType === 'TABLE');
      if (tableMetadata && tableMetadata.primaryKeys) {
        const primaryKeys = JSON.parse(tableMetadata.primaryKeys);
        const primaryKeyColumns = primaryKeys.map((key: any) => key.columnName);
        setPrimaryKeyColumns(primaryKeyColumns);
      } else {
        setPrimaryKeyColumns([]);
      }
    } catch (err) {
      console.error('获取主键列失败：', err);
      setPrimaryKeyColumns([]);
    }
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

    setLoading(true);
    setError('');

    try {
      const response = await queryApi.execute(currentConnection.id!, sqlToExecute, currentPage, pageSize);
      // 使用最新的 activeTabId 来更新正确的标签页
      const latestActiveTabId = activeTabIdRef.current;
      setTabs(prev => prev.map(tab => 
        tab.id === latestActiveTabId ? { 
          ...tab, 
          result: response.data, 
          total: response.total, 
          page: currentPage, 
          pageSize: pageSize 
        } : tab
      ));
      setError('');
      
      // 提取表名并获取主键列
      const tableName = extractTableName(sqlToExecute);
      if (tableName && currentConnection.id) {
        await fetchPrimaryKeyColumns(tableName, currentConnection.id);
      }
    } catch (err) {
      setError('执行查询失败：' + (err as Error).message);
      // 使用最新的 activeTabId 来更新正确的标签页
      const latestActiveTabId = activeTabIdRef.current;
      setTabs(prev => prev.map(tab => 
        tab.id === latestActiveTabId ? { 
          ...tab, 
          result: [], 
          total: 0 
        } : tab
      ));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    console.log('=== SqlEditorPage useEffect executing ===');
    console.log('setOnTableClick type:', typeof setOnTableClick);
    console.log('setOnTableClick value:', setOnTableClick);
    console.log('setOnObjectClick type:', typeof setOnObjectClick);
    console.log('setOnObjectClick value:', setOnObjectClick);
    
    if (!setOnTableClick) {
      console.error('ERROR: setOnTableClick is not defined!');
      return;
    }
    if (!setOnObjectClick) {
      console.error('ERROR: setOnObjectClick is not defined!');
      return;
    }
    
    console.log('Registering onTableClick callback...');
    setOnTableClick((tableName) => {
      console.log('onTableClick callback executed with:', tableName);
      if (!tableName) return;
      
      // 获取最新的 selectedConnection from ref
      const latestConnection = contextRef.current.selectedConnection;
      console.log('Latest selectedConnection from ref:', latestConnection);
      
      if (!latestConnection) {
        console.error('No connection selected!');
        setError('请先选择一个数据库连接');
        return;
      }
      
      // 检查是否已存在相同表名的标签页
      const existingTab = tabsRef.current.find(tab => tab.title === tableName);
      
      if (existingTab) {
        // 如果已存在，切换到该标签页并重新查询
        console.log('已存在相同表名的标签页，切换并重新查询:', existingTab);
        setActiveTabId(existingTab.id);
        
        // 执行查询并获取主键列
        handleExecuteQuery(existingTab.sql, 1, 20, latestConnection);
      } else {
        // 如果不存在，创建新标签页
        const sql = `SELECT TOP 1000 * FROM ${tableName}`;
        const currentTabs = tabsRef.current;
        const newTabId = (currentTabs.length + 1).toString();
        const newTab: Tab = {
          id: newTabId,
          title: tableName,
          sql: sql,
          result: [],
          total: 0,
          page: 1,
          pageSize: 20,
          hideEditor: true
        };
        console.log('Creating new tab:', newTab);
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTabId);
        
        // 执行查询并获取主键列
        handleExecuteQuery(sql, 1, 20, latestConnection);
      }
    });
    
    setOnObjectClick?.((object) => {
      console.log('onObjectClick callback executed with:', object);
      if (!object || !object.tableName) return;
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
      
      const currentTabs = tabsRef.current;
      const newTabId = (currentTabs.length + 1).toString();
      const newTab: Tab = {
        id: newTabId,
        title: `${object.tableType}: ${object.tableName}`,
        sql: createSql,
        result: [],
        total: 0,
        page: 1,
        pageSize: 20
      };
      console.log('Creating new tab for object:', newTab);
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTabId);
    });
  }, [setOnTableClick, setOnObjectClick, selectedConnection]);

  const handlePageChange = (newPage: number) => {
    handleExecuteQuery(activeTab.sql, newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    handleExecuteQuery(activeTab.sql, 1, newPageSize);
  };

  const extractTableName = (sql: string): string | null => {
    const selectMatch = sql.match(/SELECT\s+.*?FROM\s+([\w\.]+)/i);
    if (selectMatch) {
      return selectMatch[1];
    }
    return null;
  };

  const handleEdit = async (_row?: QueryResult, _index?: number) => {
    handleExecuteQuery(activeTab.sql, activeTab.page);
  };

  const handleDelete = async (row: QueryResult, _index: number) => {
    if (window.confirm('确定要删除这行数据吗？')) {
      const tableName = extractTableName(activeTab.sql);
      if (!tableName || !selectedConnection) return;

      // Get all columns from the row
      const columns = Object.keys(row);
      if (columns.length === 0) {
        setError('没有可用的列来标识要删除的记录');
        return;
      }

      // Helper function to quote column names
      const quoteColumn = (column: string) => {
        return `[${column}]`;
      };

      // Create a WHERE clause using all columns to ensure we only delete the specific row
      const whereClause = columns.map(column => {
        const value = row[column];
        const formattedValue = typeof value === 'string' ? `'${value}'` : value;
        return `${quoteColumn(column)} = ${formattedValue}`;
      }).join(' AND ');

      const deleteSql = `DELETE FROM ${tableName} WHERE ${whereClause}`;

      setLoading(true);
      try {
        await queryApi.execute(selectedConnection.id!, deleteSql);
        await handleExecuteQuery(activeTab.sql, activeTab.page);
      } catch (err) {
        setError('删除失败：' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveAdd = async (data: QueryResult) => {
    const tableName = extractTableName(activeTab.sql);
    if (!tableName || !selectedConnection) return;

    // Helper function to quote column names
    const quoteColumn = (column: string) => {
      return `[${column}]`;
    };

    const columns = Object.keys(data).map(quoteColumn).join(', ');
    const values = Object.values(data).map(value => `'${value}'`).join(', ');
    const insertSql = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

    setLoading(true);
    try {
      await queryApi.execute(selectedConnection.id!, insertSql);
      await handleExecuteQuery(activeTab.sql, activeTab.page);
      setIsAddDialogOpen(false);
    } catch (err) {
      setError('插入失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
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
      setActiveTab({ sql: generatedSql });
    } catch (err) {
      setError('生成SQL失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (_e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const height = e.clientY - containerRect.top;
    const percentage = (height / containerRect.height) * 100;

    if (percentage >= 20 && percentage <= 80) {
      setEditorHeight(percentage);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const addNewTab = () => {
    const newTabId = (tabs.length + 1).toString();
    setTabs(prev => [...prev, {
      id: newTabId,
      title: `查询 ${newTabId}`,
      sql: '',
      result: [],
      total: 0,
      page: 1,
      pageSize: 20
    }]);
    setActiveTabId(newTabId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ddd', 
        background: '#f5f5f5',
        padding: '0 10px'
      }}>
        {tabs.map(tab => (
          <div 
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: tab.id === activeTabId ? '2px solid #2196f3' : '2px solid transparent',
              background: tab.id === activeTabId ? 'white' : 'transparent'
            }}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span style={{ marginRight: '8px' }}>{tab.title}</span>
            <span 
              style={{ 
                fontSize: '12px', 
                color: '#999',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              ×
            </span>
          </div>
        ))}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#666'
          }}
          onClick={addNewTab}
        >
          + 新建
        </div>
      </div>

      {!activeTab.hideEditor && (
        <>
          <div style={{ 
            height: `${editorHeight}%`, 
            minHeight: '200px', 
            transition: 'height 0.2s ease'
          }}>
            <SqlEditor
              value={activeTab.sql}
              onChange={handleSqlChange}
              onExecute={(sqlToExecute) => handleExecuteQuery(sqlToExecute)}
              onGenerate={handleGenerateSql}
              loading={loading}
            />
          </div>

          <div 
            style={{
              height: '8px',
              background: '#f0f0f0',
              cursor: isDragging ? 'grabbing' : 'grab',
              borderTop: '1px solid #ddd',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseDown={handleMouseDown}
          >
            <div style={{
              width: '20px',
              height: '4px',
              background: '#ccc',
              borderRadius: '2px'
            }} />
          </div>
        </>
      )}

      <div style={{ 
        height: activeTab.hideEditor ? '100%' : `${100 - editorHeight}%`, 
        minHeight: '150px',
        transition: 'height 0.2s ease'
      }}>
        <QueryResultComponent
          result={activeTab.result}
          total={activeTab.total}
          page={activeTab.page}
          pageSize={activeTab.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          loading={loading}
          error={error}
          tableName={extractTableName(activeTab.sql) || activeTab.title}
          connectionId={selectedConnection?.id || 1}
          primaryKeyColumns={primaryKeyColumns}
        />
      </div>

      <EditDialog
        key="add-dialog"
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveAdd}
        columns={activeTab.result.length > 0 ? Object.keys(activeTab.result[0]) : []}
        title="新增数据"
      />
    </div>
  );
};

export default SqlEditorPage;
