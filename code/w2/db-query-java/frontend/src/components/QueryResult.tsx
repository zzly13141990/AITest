import React, { useState, useRef, useEffect } from 'react';
import { QueryResult as QueryResultType } from '../types';
import { queryApi } from '../api';

interface QueryResultProps {
  result: QueryResultType[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (row: QueryResultType, index: number) => void;
  onDelete: (row: QueryResultType, index: number) => void;
  onAdd: () => void;
  loading: boolean;
  error: string;
  tableName?: string; // 新增表名参数，用于生成SQL
  connectionId: number; // 新增连接ID参数，用于执行SQL
  primaryKeyColumns?: string[]; // 主键列名列表
}

const QueryResult: React.FC<QueryResultProps> = ({ result, total, page, pageSize, onPageChange, onPageSizeChange, onEdit, onDelete, onAdd, loading, error, tableName, connectionId, primaryKeyColumns = [] }) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<QueryResultType | null>(null);
  const [originalData, setOriginalData] = useState<QueryResultType | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, string>>({});
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [startWidth, setStartWidth] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const tableRef = useRef<HTMLTableElement>(null);

  // 添加鼠标事件监听器
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, startX, startWidth]);

  // 当查询结果变化时，重置编辑状态
  useEffect(() => {
    setEditingRow(null);
    setEditedData(null);
    setOriginalData(null);
  }, [result]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div style={{ 
          padding: '8px 16px', 
          background: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>查询结果</span>
          <button 
            onClick={onAdd}
            style={{
              padding: '4px 10px',
              border: '1px solid #2196f3',
              borderRadius: '3px',
              background: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 新增
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              border: '4px solid #f3f3f3', 
              borderTop: '4px solid #4CAF50', 
              borderRadius: '50%', 
              width: '30px', 
              height: '30px', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p style={{ fontSize: '14px', color: '#666' }}>执行查询中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div style={{ 
          padding: '8px 16px', 
          background: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>查询结果</span>
          <button 
            onClick={onAdd}
            style={{
              padding: '4px 10px',
              border: '1px solid #2196f3',
              borderRadius: '3px',
              background: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 新增
          </button>
        </div>
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{ 
            padding: '10px', 
            background: '#ffebee', 
            border: '1px solid #ffcdd2', 
            borderRadius: '4px',
            color: '#c62828'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (result.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div style={{ 
          padding: '8px 16px', 
          background: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>查询结果</span>
          <button 
            onClick={onAdd}
            style={{
              padding: '4px 10px',
              border: '1px solid #2196f3',
              borderRadius: '3px',
              background: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + 新增
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>无查询结果</p>
        </div>
        <div style={{ 
          padding: '8px 16px', 
          background: '#f5f5f5', 
          borderTop: '1px solid #ddd',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>共 {total} 行</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>每页</span>
              <select 
                value={pageSize} 
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                style={{ 
                  padding: '2px 4px', 
                  border: '1px solid #ddd', 
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={5000}>5000</option>
              </select>
              <span>条</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 安全地获取列名
  const columns = result.length > 0 && typeof result[0] === 'object' && result[0] !== null 
    ? Object.keys(result[0]) 
    : [];

  // 检测数据类型
  const detectDataType = (value: any): string => {
    if (value === null || value === undefined) return 'string';
    
    const type = typeof value;
    if (type === 'number') {
      if (Number.isInteger(value)) {
        return 'integer';
      } else {
        return 'decimal';
      }
    }
    
    if (type === 'string') {
      // 检测日期格式
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, // ISO 8601
        /^\d{2}\/\d{2}\/\d{4}$/ // MM/DD/YYYY
      ];
      
      for (const pattern of datePatterns) {
        if (pattern.test(value)) {
          return 'date';
        }
      }
      
      return 'string';
    }
    
    return 'string';
  };

  const handleEditStart = (row: QueryResultType, index: number) => {
    setEditingRow(index);
    setEditedData({ ...row });
    setOriginalData({ ...row });
  };

  const handleEditChange = (field: string, value: string) => {
    if (editedData) {
      const dataType = detectDataType(originalData?.[field]);
      let convertedValue: any = value;
      
      if (value === '') {
        convertedValue = '';
      } else if (dataType === 'integer' && /^-?\d+$/.test(value)) {
        convertedValue = parseInt(value, 10);
      } else if (dataType === 'decimal' && /^-?\d+(\.\d+)?$/.test(value)) {
        convertedValue = parseFloat(value);
      } else if (dataType === 'date') {
        convertedValue = value;
      }
      
      setEditedData({ ...editedData, [field]: convertedValue });
    }
  };

  const generateUpdateSql = (original: QueryResultType, edited: QueryResultType): string => {
    if (!tableName) return '';
    
    // Helper function to quote column names
    const quoteColumn = (column: string) => {
      return `[${column}]`;
    };
    
    const setClauses = [];
    for (const column of columns) {
      if (original[column] !== edited[column]) {
        const originalValue = original[column];
        const value = edited[column];
        let sqlValue;
        
        if (value === null || value === undefined || value === '') {
          sqlValue = 'NULL';
        } else if (typeof originalValue === 'number' || typeof value === 'number') {
          sqlValue = value;
        } else {
          sqlValue = `'${String(value).replace(/'/g, "''")}'`;
        }
        
        setClauses.push(`${quoteColumn(column)} = ${sqlValue}`);
      }
    }
    
    if (setClauses.length === 0) return '';
    
    // Create a WHERE clause using all columns to ensure we only update the specific row
    const whereClause = columns.map(column => {
      const value = original[column];
      let sqlValue;
      
      if (value === null || value === undefined) {
        sqlValue = 'NULL';
      } else if (typeof value === 'number') {
        sqlValue = value;
      } else {
        sqlValue = `'${String(value).replace(/'/g, "''")}'`;
      }
      
      return `${quoteColumn(column)} = ${sqlValue}`;
    }).join(' AND ');
    
    return `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClause}`;
  };

  const handleEditSave = async (index: number) => {
    if (editedData && originalData && tableName) {
      setSaving(true);
      try {
        const updateSql = generateUpdateSql(originalData, editedData);
        if (updateSql) {
          await queryApi.execute(connectionId, updateSql, 1, 1000);
          onEdit(editedData, index);
        }
      } catch (error: any) {
        console.error('更新失败:', error);
        const errorMessage = error.response?.data?.message || error.message || '未知错误';
        alert('更新失败: ' + errorMessage);
      } finally {
        setSaving(false);
        setEditingRow(null);
        setEditedData(null);
        setOriginalData(null);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingRow(null);
    setEditedData(null);
    setOriginalData(null);
  };

  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    setIsResizing(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column] || '100px');
  };

  const handleResize = (e: MouseEvent) => {
    if (isResizing) {
      const width = parseInt(startWidth) + (e.clientX - startX);
      if (width > 50) {
        setColumnWidths(prev => ({ ...prev, [isResizing]: `${width}px` }));
      }
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(null);
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
      <div style={{ 
        padding: '8px 16px', 
        background: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>查询结果</span>
        <button 
          onClick={onAdd}
          style={{
            padding: '4px 10px',
            border: '1px solid #2196f3',
            borderRadius: '3px',
            background: '#2196f3',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          + 新增
        </button>
      </div>
      
      {/* 表格内容 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {columns.length > 0 ? (
          <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9f9f9' }}>
              <tr>
                <th 
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: columnWidths['rowNumber'] || '60px',
                    position: 'relative'
                  }}
                >
                  行号
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '5px',
                      cursor: 'col-resize',
                      backgroundColor: 'transparent'
                    }}
                    onMouseDown={(e) => handleResizeStart('rowNumber', e)}
                  />
                </th>
                {columns.map((column) => (
                  <th 
                    key={column} 
                    style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: columnWidths[column] || 'auto',
                      position: 'relative'
                    }}
                  >
                    {column}
                    <div 
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent'
                      }}
                      onMouseDown={(e) => handleResizeStart(column, e)}
                    />
                  </th>
                ))}
                <th 
                  style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'left', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: columnWidths['action'] || '100px',
                    position: 'relative'
                  }}
                >
                  操作
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '5px',
                      cursor: 'col-resize',
                      backgroundColor: 'transparent'
                    }}
                    onMouseDown={(e) => handleResizeStart('action', e)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {result.map((row, index) => {
                const rowNumber = (page - 1) * pageSize + index + 1;
                return (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' 
                  }}>
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: columnWidths['rowNumber'] || '60px'
                    }}>
                      {rowNumber}
                    </td>
                    {columns.map((column) => {
                      const dataType = detectDataType(row[column]);
                      return (
                        <td 
                          key={column} 
                          style={{ 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            fontSize: '12px',
                            width: columnWidths[column] || 'auto'
                          }}
                        >
                          {editingRow === index ? (
                            primaryKeyColumns.includes(column) ? (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#666',
                                backgroundColor: '#f5f5f5',
                                padding: '2px 4px',
                                borderRadius: '3px'
                              }}>
                                {row[column]}
                              </span>
                            ) : dataType === 'date' ? (
                              <input
                                type="date"
                                value={editedData?.[column] || ''}
                                onChange={(e) => handleEditChange(column, e.target.value)}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            ) : dataType === 'integer' ? (
                              <input
                                type="number"
                                value={editedData?.[column] || ''}
                                onChange={(e) => handleEditChange(column, e.target.value)}
                                step="1"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            ) : dataType === 'decimal' ? (
                              <input
                                type="number"
                                value={editedData?.[column] || ''}
                                onChange={(e) => handleEditChange(column, e.target.value)}
                                step="0.01"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                value={editedData?.[column] || ''}
                                onChange={(e) => handleEditChange(column, e.target.value)}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            )
                          ) : (
                            row[column] === null || row[column] === undefined ? '' : 
                            typeof row[column] === 'object' ? JSON.stringify(row[column]) : 
                            row[column]
                          )}
                        </td>
                      );
                    })}
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      fontSize: '12px',
                      display: 'flex',
                      gap: '5px',
                      width: columnWidths['action'] || '100px'
                    }}>
                      {editingRow === index ? (
                        <>
                          <button 
                            onClick={() => handleEditSave(index)}
                            disabled={saving}
                            style={{
                              padding: '4px',
                              border: '1px solid #4CAF50',
                              borderRadius: '3px',
                              background: saving ? '#a5d6a7' : '#4CAF50',
                              color: 'white',
                              cursor: saving ? 'not-allowed' : 'pointer',
                              fontSize: '12px'
                            }}
                            title="保存"
                          >
                            {saving ? '⏳' : '✓'}
                          </button>
                          <button 
                            onClick={handleEditCancel}
                            disabled={saving}
                            style={{
                              padding: '4px',
                              border: '1px solid #f44336',
                              borderRadius: '3px',
                              background: saving ? '#ef9a9a' : '#f44336',
                              color: 'white',
                              cursor: saving ? 'not-allowed' : 'pointer',
                              fontSize: '12px'
                            }}
                            title="取消"
                          >
                            ✗
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEditStart(row, index)}
                            style={{
                              padding: '4px',
                              border: '1px solid #4CAF50',
                              borderRadius: '3px',
                              background: '#4CAF50',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="编辑"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => onDelete(row, index)}
                            style={{
                              padding: '4px',
                              border: '1px solid #f44336',
                              borderRadius: '3px',
                              background: '#f44336',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="删除"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>查询结果格式不正确</p>
          </div>
        )}
      </div>
      
      {/* 状态栏 */}
      <div style={{ 
        padding: '8px 16px', 
        background: '#f5f5f5', 
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>共 {total} 行</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button 
              onClick={() => onPageChange(Math.max(1, page - 1))} 
              disabled={page === 1}
              style={{ 
                padding: '2px 8px', 
                border: '1px solid #ddd', 
                borderRadius: '3px', 
                background: page === 1 ? '#f5f5f5' : '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              上一页
            </button>
            <span>第 {page} 页</span>
            <button 
              onClick={() => onPageChange(page + 1)} 
              disabled={result.length < pageSize}
              style={{ 
                padding: '2px 8px', 
                border: '1px solid #ddd', 
                borderRadius: '3px', 
                background: result.length < pageSize ? '#f5f5f5' : '#fff',
                cursor: result.length < pageSize ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              下一页
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>每页</span>
            <select 
              value={pageSize} 
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ 
                padding: '2px 4px', 
                border: '1px solid #ddd', 
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>条</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryResult;
