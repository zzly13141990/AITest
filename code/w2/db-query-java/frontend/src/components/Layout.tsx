import React, { ReactNode, useState, createContext, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionApi, metadataApi } from '../api';
import { Connection, Metadata } from '../types';
import ConnectionForm from './ConnectionForm';

// 创建连接上下文
interface ConnectionContextType {
  selectedConnection: Connection | null;
  setSelectedConnection: (connection: Connection | null) => void;
  connections: Connection[];
  getMetadataByConnection: (connectionId: number) => Metadata[];
  loading: boolean;
  onTableClick?: (tableName: string) => void;
  setOnTableClick?: (callback: (tableName: string) => void) => void;
  onObjectClick?: (object: Metadata) => void;
  setOnObjectClick?: (callback: (object: Metadata) => void) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

// 自定义钩子
export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return context;
};

// 回调管理器 - 挂载到 window 对象以确保 HMR 时不丢失状态
declare global {
  interface Window {
    __dbQueryCallbacks?: {
      onTableClick: ((tableName: string) => void) | null;
      onObjectClick: ((object: Metadata) => void) | null;
    };
  }
}

if (!window.__dbQueryCallbacks) {
  window.__dbQueryCallbacks = {
    onTableClick: null,
    onObjectClick: null,
  };
}

const callbackManager = {
  get onTableClick() { return window.__dbQueryCallbacks!.onTableClick; },
  get onObjectClick() { return window.__dbQueryCallbacks!.onObjectClick; },
  
  setOnTableClick(callback: ((tableName: string) => void) | undefined) {
    window.__dbQueryCallbacks!.onTableClick = callback || null;
    console.log('callbackManager setOnTableClick:', !!callback);
  },
  
  setOnObjectClick(callback: ((object: Metadata) => void) | undefined) {
    window.__dbQueryCallbacks!.onObjectClick = callback || null;
    console.log('callbackManager setOnObjectClick:', !!callback);
  },
};

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [metadataByConnection, setMetadataByConnection] = useState<Map<number, Metadata[]>>(new Map());
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connection?: Connection } | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['TABLE'])); // 默认展开TABLE分类
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set()); // 展开的数据表
  const [expandedTableGroups, setExpandedTableGroups] = useState<Set<string>>(new Set());
  const [metadataLoading, setMetadataLoading] = useState<Map<number, boolean>>(new Map()); // 元数据提取加载状态
  const [showConnectionForm, setShowConnectionForm] = useState<boolean>(false);

  // 添加CSS动画
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await connectionApi.getAll();
      setConnections(data);
    } catch (error) {
      console.error('获取连接列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetadataByConnection = (connectionId: number): Metadata[] => {
    return metadataByConnection.get(connectionId) || [];
  };

  const handleConnectionSelect = async (connection: Connection) => {
    setSelectedConnection(connection);
    try {
      // 只获取元数据，不提取
      const data = await metadataApi.getByConnectionId(connection.id!);
      setMetadataByConnection(prev => new Map(prev).set(connection.id!, data));
    } catch (error) {
      console.error('获取元数据失败:', error);
      setMetadataByConnection(prev => new Map(prev).set(connection.id!, []));
    }
  };

  const handleContextMenu = (event: React.MouseEvent, connection?: Connection) => {
    event.preventDefault();
    if (connection) {
      setSelectedConnection(connection);
    }
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      connection
    });
  };

  const handleCreateConnection = () => {
    setContextMenu(null);
    setEditingConnection(undefined);
    setShowConnectionForm(true);
  };

  const handleExtractMetadata = async (connection: Connection) => {
    setContextMenu(null);
    try {
      await metadataApi.extract(connection.id!);
      // 重新获取元数据
      const data = await metadataApi.getByConnectionId(connection.id!);
      setMetadataByConnection(prev => new Map(prev).set(connection.id!, data));
      alert('元数据提取成功');
    } catch (error) {
      console.error('提取元数据失败:', error);
      alert('提取元数据失败: ' + (error as Error).message);
    }
  };

  const handleEditConnection = (connection: Connection) => {
    setContextMenu(null);
    setEditingConnection(connection);
    setShowConnectionForm(true);
  };

  const handleFormSave = () => {
    setShowConnectionForm(false);
    fetchConnections();
  };

  const handleFormCancel = () => {
    setShowConnectionForm(false);
    setEditingConnection(undefined);
  };

  const handleDeleteConnection = async (connection: Connection) => {
    setContextMenu(null);
    if (window.confirm(`确定要删除连接 ${connection.connectionName} 吗？`)) {
      try {
        await connectionApi.delete(connection.id!);
        // 重新获取连接列表
        const data = await connectionApi.getAll();
        setConnections(data);
        setSelectedConnection(null);
        setMetadataByConnection(prev => {
          const newMap = new Map(prev);
          newMap.delete(connection.id!);
          return newMap;
        });
        alert('删除成功');
      } catch (error) {
        console.error('删除连接失败:', error);
        alert('删除连接失败: ' + (error as Error).message);
      }
    }
  };

  const handleObjectClick = (item: Metadata) => {
    console.log('handleObjectClick called with:', item);
    console.log('callbackManager.onTableClick:', !!callbackManager.onTableClick);
    console.log('callbackManager.onObjectClick:', !!callbackManager.onObjectClick);
    
    // 直接使用 callbackManager 获取最新的回调函数
    const currentOnTableClick = callbackManager.onTableClick;
    const currentOnObjectClick = callbackManager.onObjectClick;
    
    // 当点击数据表时，调用onTableClick回调函数
    if (item.tableType === 'TABLE' && currentOnTableClick) {
      console.log('Calling onTableClick with:', item.tableName);
      try {
        currentOnTableClick(item.tableName);
        console.log('onTableClick callback executed successfully');
      } catch (err) {
        console.error('Error in onTableClick callback:', err);
      }
    } else if (currentOnObjectClick) {
      // 对于其他对象类型，调用onObjectClick回调函数
      console.log('Calling onObjectClick with:', item);
      try {
        currentOnObjectClick(item);
        console.log('onObjectClick callback executed successfully');
      } catch (err) {
        console.error('Error in onObjectClick callback:', err);
      }
    } else {
      console.log('No callback defined! onTableClick:', !!currentOnTableClick, 'onObjectClick:', !!currentOnObjectClick);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 处理数据表展开/收缩
  const handleTableToggle = (tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  // 处理表分组展开/收缩
  const handleTableGroupToggle = (groupKey: string) => {
    setExpandedTableGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const parseJsonArray = (jsonStr: string | undefined): any[] => {
    if (!jsonStr || jsonStr === '[]') return [];
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const renderTableGroups = (item: Metadata) => {
    const groups = [
      { name: 'Columns', data: item.columns, displayFn: (col: any) => `${col.columnName} (${col.dataType})` },
      { name: 'Unique Keys', data: item.uniqueKeys, displayFn: (key: any) => `${key.indexName} (${key.columnName})` },
      { name: 'Check constraints', data: item.checkConstraints, displayFn: (c: any) => `${c.constraintName}` },
      { name: 'Foreign Keys', data: item.foreignKeys, displayFn: (fk: any) => `${fk.fkName}: ${fk.fkColumn} -> ${fk.pkTable}.${fk.pkColumn}` },
      { name: 'Indexes', data: item.indexes, displayFn: (idx: any) => `${idx.indexName} (${idx.columnName})` },
      { name: 'References', data: item.tableReferences, displayFn: (ref: any) => `${ref.fkTable}.${ref.fkColumn} -> ${ref.pkColumn}` },
      { name: 'Triggers', data: item.triggers, displayFn: (t: any) => `${t.triggerName} (${t.eventManipulation})` },
    ];

    return groups.map((group) => {
      const items = parseJsonArray(group.data);
      if (items.length === 0 && group.name !== 'Columns') return null;

      const groupKey = `${item.tableName}_${group.name}`;
      return (
        <li key={group.name} style={{ marginBottom: '2px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              cursor: items.length > 0 ? 'pointer' : 'default'
            }}
            onClick={() => items.length > 0 && handleTableGroupToggle(groupKey)}
          >
            <span style={{ marginRight: '5px' }}>
              {items.length > 0 ? (expandedTableGroups.has(groupKey) ? '▼' : '▶') : ' '}
            </span>
            <span>{group.name} ({items.length})</span>
          </div>
          {items.length > 0 && expandedTableGroups.has(groupKey) && (
            <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '2px 0' }}>
              {items.map((entry: any, idx: number) => (
                <li key={idx} style={{ fontSize: '10px', padding: '1px 0' }}>
                  {group.displayFn(entry)}
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    });
  };

  const contextValue: ConnectionContextType = {
    selectedConnection,
    setSelectedConnection,
    connections,
    getMetadataByConnection,
    loading,
    onTableClick: callbackManager.onTableClick || undefined,
    setOnTableClick: callbackManager.setOnTableClick.bind(callbackManager),
    onObjectClick: callbackManager.onObjectClick || undefined,
    setOnObjectClick: callbackManager.setOnObjectClick.bind(callbackManager)
  };

  console.log('Layout contextValue:', {
    setOnTableClick: !!callbackManager.setOnTableClick,
    setOnObjectClick: !!callbackManager.setOnObjectClick,
    setOnTableClickType: typeof callbackManager.setOnTableClick
  });

  return (
    <ConnectionContext.Provider value={contextValue}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* 左侧数据库连接展示区域 */}
        <div 
          ref={sidebarRef}
          style={{ 
            width: '250px', 
            background: '#f5f5f5', 
            borderRight: '1px solid #ddd', 
            overflow: 'auto',
            padding: '10px'
          }}
          onContextMenu={(e) => handleContextMenu(e)}
        >
          <div style={{ padding: '10px 0', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
            <h3>数据库导航</h3>
          </div>
          {loading ? (
            <div>加载中...</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {connections.map((connection) => {
                const connectionId = Number(connection.id!);
                const connectionMetadata = getMetadataByConnection(connectionId);
                return (
                  <li key={connection.id} style={{ marginBottom: '5px' }}>
                    <div 
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        backgroundColor: selectedConnection?.id === connection.id ? '#e3f2fd' : 'transparent',
                        border: selectedConnection?.id === connection.id ? '1px solid #2196f3' : '1px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onClick={() => handleConnectionSelect(connection)}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, connection);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '16px' }}>
                          {connection.databaseType === 'SQL Server' && '🗄️'}
                          {connection.databaseType === 'MySQL' && '🐬'}
                          {connection.databaseType === 'PostgreSQL' && '🐘'}
                          {connection.databaseType === 'Oracle' && '🟠'}
                          {!['SQL Server', 'MySQL', 'PostgreSQL', 'Oracle'].includes(connection.databaseType) && '📦'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{connection.connectionName}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{connection.databaseType}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>{connection.host}:{connection.port}</div>
                        </div>
                      </div>
                      <button
                        style={{
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#666',
                          marginLeft: '10px',
                          width: '20px',
                          textAlign: 'center',
                          background: 'none',
                          border: 'none',
                          padding: '0',
                          outline: 'none'
                        }}
                        onClick={(e) => {
                        e.stopPropagation();
                        setExpandedConnections(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(connectionId)) {
                            newSet.delete(connectionId);
                          } else {
                            newSet.add(connectionId);
                            // 展开时加载元数据（如果不存在则提取）
                            if (!metadataByConnection.has(connectionId)) {
                              // 设置加载状态
                              setMetadataLoading(prev => new Map(prev).set(connectionId, true));
                              // 先提取元数据
                              metadataApi.extract(connectionId)
                                .then(() => {
                                  // 提取成功后获取元数据
                                  return metadataApi.getByConnectionId(connectionId);
                                })
                                .then(data => {
                                  setMetadataByConnection(prevMap => new Map(prevMap).set(connectionId, data));
                                })
                                .catch(error => {
                                  console.error('获取元数据失败:', error);
                                  setMetadataByConnection(prevMap => new Map(prevMap).set(connectionId, []));
                                })
                                .finally(() => {
                                  // 清除加载状态
                                  setMetadataLoading(prev => new Map(prev).set(connectionId, false));
                                });
                            }
                          }
                          return newSet;
                        });
                      }}
                      >
                        {expandedConnections.has(connectionId) ? '▼' : '▶'}
                      </button>
                    </div>
                    {/* 元数据提取进度条 */}
                    {metadataLoading.get(connectionId) && (
                      <div style={{ padding: '5px 10px' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#666', 
                          marginBottom: '3px'
                        }}>提取元数据中...</div>
                        <div style={{ 
                          width: '100%', 
                          height: '4px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: '30%', 
                            height: '100%', 
                            backgroundColor: '#1890ff', 
                            borderRadius: '2px',
                            animation: 'pulse 1.5s infinite'
                          }}></div>
                        </div>
                      </div>
                    )}
                    {expandedConnections.has(connectionId) && (
                      <div style={{ marginTop: '5px', paddingLeft: '10px' }}>
                        <h4 style={{ fontSize: '12px', margin: '5px 0' }}>数据库对象</h4>
                        {/* 按类别分组 */}
                        {(['TABLE', 'VIEW', 'PROC', 'FUNCTION'] as const).map((type) => {
                          const items = connectionMetadata.filter(item => item.tableType === type);
                          if (items.length === 0) return null;
                          return (
                            <div key={type} style={{ marginBottom: '10px' }}>
                              <div 
                                style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 'bold', 
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onClick={() => handleCategoryToggle(type)}
                              >
                                <span style={{ marginRight: '5px' }}>{expandedCategories.has(type) ? '▼' : '▶'}</span>
                                {type} ({items.length})
                              </div>
                              {expandedCategories.has(type) && (
                                <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '5px 0' }}>
                                  {items.map((item) => (
                                    <li key={item.id} style={{ marginBottom: '2px' }}>
                                      <div 
                                        style={{
                                          fontSize: '12px',
                                          padding: '2px 0',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        {item.tableType === 'TABLE' && (
                                          <span 
                                            style={{ marginRight: '5px', cursor: 'pointer' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTableToggle(item.tableName);
                                            }}
                                          >
                                            {expandedTables.has(item.tableName) ? '▼' : '▶'}
                                          </span>
                                        )}
                                        <span 
                                          onClick={() => handleObjectClick(item)}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          {item.tableName}
                                        </span>
                                      </div>
                                      {item.tableType === 'TABLE' && expandedTables.has(item.tableName) && (
                                        <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '2px 0' }}>
                                          {renderTableGroups(item)}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* 右键菜单 */}
          {contextMenu && (
            <div 
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                minWidth: '150px'
              }}
            >
              {contextMenu.connection ? (
                <>
                  <div 
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={handleCreateConnection}
                  >
                    创建连接
                  </div>
                  <div 
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}
                    onClick={() => handleEditConnection(contextMenu.connection!)}
                  >
                    编辑
                  </div>
                  <div 
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      borderTop: '1px solid #f0f0f0',
                      color: '#d32f2f'
                    }}
                    onClick={() => handleDeleteConnection(contextMenu.connection!)}
                  >
                    删除
                  </div>
                </>
              ) : (
                <div 
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={handleCreateConnection}
                >
                  创建连接
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧主区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 顶部标题区域 */}
          <div style={{ 
            padding: '10px 20px', 
            borderBottom: '1px solid #ddd', 
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: '#4CAF50', 
              color: 'white', 
              borderRadius: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              SQL
            </div>
            <h1 style={{ margin: 0, fontSize: '18px' }}>SQL语言编写工具</h1>
          </div>

          {/* 内容区域 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {children}
          </div>
        </div>

        {/* 连接表单模态框 */}
        {showConnectionForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <ConnectionForm
                connection={editingConnection}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}
      </div>
    </ConnectionContext.Provider>
  );
};

export default Layout;
