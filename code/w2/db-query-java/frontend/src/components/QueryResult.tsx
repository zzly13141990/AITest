import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QueryResult as QueryResultType } from '../types';

interface QueryResultProps {
  result: QueryResultType[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (row: QueryResultType, index: number) => void;
  loading: boolean;
  error: string;
  onExportExcel: (sql: string, selectedRows?: QueryResultType[]) => void;
  sql: string;
  updateCount?: number;
  executeTime?: number;
  fetchTime?: number;
  totalTime?: number;
}

const QueryResult: React.FC<QueryResultProps> = ({ 
  result, 
  total, 
  page, 
  pageSize, 
  onPageChange, 
  onPageSizeChange, 
  onDelete, 
  loading, 
  error, 
  onExportExcel, 
  sql,
  updateCount,
  executeTime,
  fetchTime,
  totalTime
}) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    return result.length > 0 && typeof result[0] === 'object' && result[0] !== null 
      ? Object.keys(result[0]) 
      : [];
  }, [result]);

  const filteredResult = useMemo(() => {
    if (!searchValue.trim()) {
      return result;
    }
    
    const searchLower = searchValue.toLowerCase();
    return result.filter(row => {
      return Object.values(row).some(value => {
        const strValue = String(value ?? '').toLowerCase();
        return strValue.includes(searchLower);
      });
    });
  }, [result, searchValue]);

  useEffect(() => {
    setSelectedRowIndices(new Set());
    setLastSelectedIndex(null);
  }, [result]);

  const handleRowSelect = (index: number, shiftKey: boolean, ctrlKey: boolean) => {
    setSelectedRowIndices(prev => {
      const newSelected = new Set(prev);
      
      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          newSelected.add(i);
        }
      } else if (ctrlKey) {
        if (newSelected.has(index)) {
          newSelected.delete(index);
        } else {
          newSelected.add(index);
        }
        setLastSelectedIndex(index);
      } else {
        newSelected.clear();
        newSelected.add(index);
        setLastSelectedIndex(index);
      }
      
      return newSelected;
    });
  };

  const handleExport = () => {
    const selectedRows = selectedRowIndices.size > 0
      ? filteredResult.filter((_, index) => selectedRowIndices.has(index))
      : undefined;
    onExportExcel(sql, selectedRows);
  };

  const selectedCount = selectedRowIndices.size;

  if (loading) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-header-title">查询结果</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-ring"></div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>执行查询中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-header-title">查询结果</span>
        </div>
        <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center' }}>
          <div className="alert alert-danger">
            <span>✕</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (result.length === 0) {
    if (updateCount !== undefined || executeTime !== undefined) {
      return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <span className="card-header-title">执行结果</span>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', minHeight: '0' }}>
            <div style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center'
            }}>
              {updateCount !== undefined && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  minWidth: '120px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>影响行数</span>
                  <span style={{ color: 'var(--text-secondary)' }}>:</span>
                  <span style={{ 
                    color: 'var(--success-color)', 
                    fontWeight: '600', 
                    marginLeft: '4px' 
                  }}>
                    {updateCount} 行
                  </span>
                </div>
              )}
              {executeTime !== undefined && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  minWidth: '120px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>执行时间</span>
                  <span style={{ color: 'var(--text-secondary)' }}>:</span>
                  <span style={{ color: 'var(--text-primary)', marginLeft: '4px', fontWeight: '500' }}>
                    {executeTime.toFixed(2)} ms
                  </span>
                </div>
              )}
              {fetchTime !== undefined && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  minWidth: '120px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>获取时间</span>
                  <span style={{ color: 'var(--text-secondary)' }}>:</span>
                  <span style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>
                    {fetchTime.toFixed(2)} ms
                  </span>
                </div>
              )}
              {totalTime !== undefined && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  minWidth: '100px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>总耗时</span>
                  <span style={{ color: 'var(--text-secondary)' }}>:</span>
                  <span style={{ 
                    color: 'var(--brand-primary)', 
                    fontWeight: '600', 
                    marginLeft: '4px' 
                  }}>
                    {totalTime.toFixed(2)} ms
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="result-footer" style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--success-color)', fontWeight: '500' }}>✓</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>执行完成</span>
            </div>
            <div className="pagination">
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-header-title">查询结果</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>无查询结果</p>
        </div>
        <div className="result-footer">
          <div>共 {total} 行</div>
          <div className="pagination">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>每页</span>
              <select 
                value={pageSize} 
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
              <button 
                onClick={handleExport}
                disabled={loading || result.length === 0}
                className="export-btn"
                title={selectedCount > 0 ? `导出选中的 ${selectedCount} 行` : '导出全部'}
              >
                📥
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <span className="card-header-title">查询结果</span>
      </div>
      
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="result-search">
          <span className="result-search__icon">🔍</span>
          <input
            type="text"
            className="result-search__input"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="输入搜索词过滤结果..."
          />
        </div>
      </div>
      
      <div ref={scrollContainerRef} style={{ flex: 1, overflow: 'auto' }}>
        {columns.length > 0 ? (
          <table 
            ref={tableRef} 
            style={{ 
              borderCollapse: 'collapse',
              minWidth: '100%'
            }}
          >
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th 
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    textAlign: 'center', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    minWidth: '60px',
                    backgroundColor: 'var(--bg-tertiary)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Row
                </th>
                {columns.map((column) => (
                  <th 
                    key={column} 
                    style={{ 
                      padding: '8px', 
                      border: '1px solid var(--border-color)', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-tertiary)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {column}
                  </th>
                ))}
                <th 
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    textAlign: 'left', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    minWidth: '80px',
                    backgroundColor: 'var(--bg-tertiary)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResult.length > 0 ? (
                filteredResult.map((row, displayIndex) => {
                  const rowNumber = displayIndex + 1;
                  const isSelected = selectedRowIndices.has(displayIndex);
                  
                  return (
                    <tr 
                      key={`row-${displayIndex}`} 
                      className={`selectable-row ${isSelected ? 'selectable-row--selected' : ''}`}
                    >
                      <td 
                        style={{ 
                          padding: '8px', 
                          border: '1px solid var(--border-color)', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '60px',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => handleRowSelect(displayIndex, e.shiftKey, e.ctrlKey || e.metaKey)}
                      >
                        {rowNumber}
                      </td>
                      {columns.map((column) => (
                        <td 
                          key={`${displayIndex}-${column}`} 
                          style={{ 
                            padding: '8px', 
                            border: '1px solid var(--border-color)', 
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {row[column] === null || row[column] === undefined ? '' : 
                           typeof row[column] === 'object' ? JSON.stringify(row[column]) : 
                           row[column]}
                        </td>
                      ))}
                      <td style={{ 
                        padding: '8px', 
                        border: '1px solid var(--border-color)', 
                        fontSize: '12px',
                        minWidth: '80px',
                        whiteSpace: 'nowrap'
                      }}>
                        <button 
                          onClick={() => onDelete(row, displayIndex)}
                          style={{
                            padding: '4px',
                            border: '1px solid var(--danger-color)',
                            borderRadius: '3px',
                            background: 'var(--danger-color)',
                            color: 'var(--text-white)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + 2} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    未找到匹配结果
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>查询结果格式不正确</p>
          </div>
        )}
      </div>
      
      <div className="result-footer">
        <div>共 {total} 行 {selectedCount > 0 && `(已选择 ${selectedCount} 行)`}</div>
        <div className="pagination">
          <button 
            onClick={() => onPageChange(Math.max(1, page - 1))} 
            disabled={page === 1}
          >
            上一页
          </button>
          <span>第 {page} 页</span>
          <button 
            onClick={() => onPageChange(page + 1)} 
            disabled={result.length < pageSize}
          >
            下一页
          </button>
          <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>每页</span>
            <select 
              value={pageSize} 
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
              <option value={10000}>10000</option>
            </select>
            <span>条</span>
            <button 
              onClick={handleExport}
              disabled={loading || result.length === 0}
              className="export-btn"
              title={selectedCount > 0 ? `导出选中的 ${selectedCount} 行` : '导出全部'}
            >
              📥
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryResult;
