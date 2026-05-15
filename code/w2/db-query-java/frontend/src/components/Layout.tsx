import React, { ReactNode, useState, createContext, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionApi, metadataApi } from '../api';
import { Connection, Metadata } from '../types';
import ConnectionForm from './ConnectionForm';
import { useTheme } from '../contexts/ThemeContext';
import { ShortcutManager } from '../shortcuts/ShortcutManager';
import CopyButton from './CopyButton';

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

const getDbIconClass = (databaseType: string): string => {
  switch (databaseType) {
    case 'SQL Server':
      return 'sqlserver';
    case 'MySQL':
      return 'mysql';
    case 'PostgreSQL':
      return 'postgresql';
    case 'Oracle':
      return 'oracle';
    default:
      return 'default';
  }
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const shortcutManager = ShortcutManager.getInstance();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [metadataByConnection, setMetadataByConnection] = useState<Map<number, Metadata[]>>(new Map());
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connection?: Connection } | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Map<number, Set<string>>>(new Map()); // 每个连接独立的分类展开状态
  const [expandedTables, setExpandedTables] = useState<Map<number, Set<string>>>(new Map()); // 每个连接独立的展开数据表
  const [metadataLoading, setMetadataLoading] = useState<Map<number, boolean>>(new Map()); // 元数据提取加载状态
  const [showConnectionForm, setShowConnectionForm] = useState<boolean>(false);
  const [selectedView, setSelectedView] = useState<Metadata | null>(null); // 选中的视图
  const [showViewModal, setShowViewModal] = useState<boolean>(false); // 视图详情模态框
  
  // 存储过程详情模态框
  const [selectedProcedure, setSelectedProcedure] = useState<Metadata | null>(null); // 选中的存储过程
  const [showProcedureModal, setShowProcedureModal] = useState<boolean>(false); // 存储过程详情模态框
  
  // 函数详情模态框
  const [selectedFunction, setSelectedFunction] = useState<Metadata | null>(null); // 选中的函数
  const [showFunctionModal, setShowFunctionModal] = useState<boolean>(false); // 函数详情模态框
  
  // 触发器详情模态框
  const [selectedTrigger, setSelectedTrigger] = useState<Metadata | null>(null); // 选中的触发器
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false); // 触发器详情模态框
  
  // 惰性加载相关状态
  const [metadataCounts, setMetadataCounts] = useState<Map<number, { [key: string]: number }>>(new Map()); // 各连接的元数据数量
  const [loadedCategories, setLoadedCategories] = useState<Map<number, Set<string>>>(new Map()); // 已加载的分类
  const [categoryItems, setCategoryItems] = useState<Map<number, Map<string, string[]>>>(new Map()); // 各分类的项
  const [categoryLoading, setCategoryLoading] = useState<Map<string, boolean>>(new Map()); // 分类加载状态
  
  // 分页相关状态
  const [categoryPages, setCategoryPages] = useState<Map<string, number>>(new Map()); // 各分类的当前页码
  const [categoryHasMore, setCategoryHasMore] = useState<Map<string, boolean>>(new Map()); // 各分类是否有更多数据
  
  // 表结构相关状态
  const [tableStructures, setTableStructures] = useState<Map<string, any>>(new Map()); // 表结构数据
  const [tableStructureLoading, setTableStructureLoading] = useState<Map<string, boolean>>(new Map()); // 表结构加载状态
  
  // 新加载数据标记
  const [newlyLoadedItems, setNewlyLoadedItems] = useState<Set<string>>(new Set()); // 新加载的项目
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState<string>(''); // 搜索关键词
  const [isSearching, setIsSearching] = useState<boolean>(false); // 是否正在搜索
  const [searchResults, setSearchResults] = useState<Map<number, Map<string, string[]>>>(new Map()); // 搜索结果
  
  // 拖拽相关状态
  const [sidebarWidth, setSidebarWidth] = useState<number>(300); // 左侧导航宽度
  const [isDragging, setIsDragging] = useState<boolean>(false); // 是否正在拖拽

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

  // 快捷键事件监听 - 使用 capture 模式确保优先处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 处理快捷键
      const handled = shortcutManager.handleKeyEvent(event);
      
      // 如果我们处理了这个快捷键，确保阻止所有默认行为
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        if (event.ctrlKey || event.metaKey) {
          event.returnValue = false;
        }
      }
    };

    // 使用 capture 模式（第三个参数为 true）确保在事件冒泡前处理
    // 这样可以优先于浏览器默认行为
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // 注册快捷键处理器
  useEffect(() => {
    // 注册设置页面快捷键
    const handleSettings = () => {
      navigate('/settings');
    };
    
    shortcutManager.registerHandler('settings', handleSettings);
    
    return () => {
      shortcutManager.unregisterHandler('settings', handleSettings);
    };
  }, [navigate]);

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

  const handleViewClick = async (connectionId: number, viewName: string) => {
    try {
      // 从后端获取视图详情
      const viewDetails = await metadataApi.getViewDetails(connectionId, viewName);
      // 创建临时Metadata对象
      const viewItem: Metadata = {
        id: 0,
        connectionId,
        tableName: viewDetails.name,
        tableType: 'VIEW',
        columns: '[]',
        primaryKeys: '[]',
        foreignKeys: '[]',
        uniqueKeys: '[]',
        checkConstraints: '[]',
        indexes: '[]',
        triggers: '[]',
        tableReferences: '[]',
        createBody: viewDetails.createBody
      };
      setSelectedView(viewItem);
      setShowViewModal(true);
    } catch (error) {
      console.error('获取视图详情失败:', error);
      alert('获取视图详情失败: ' + (error as Error).message);
    }
  };
  
  const handleProcedureClick = async (connectionId: number, procedureName: string) => {
    try {
      // 从后端获取存储过程详情
      const procedureDetails = await metadataApi.getProcedureDetails(connectionId, procedureName);
      // 创建临时Metadata对象
      const procedureItem: Metadata = {
        id: 0,
        connectionId,
        tableName: procedureDetails.name,
        tableType: 'PROC',
        columns: '[]',
        primaryKeys: '[]',
        foreignKeys: '[]',
        uniqueKeys: '[]',
        checkConstraints: '[]',
        indexes: '[]',
        triggers: '[]',
        tableReferences: '[]',
        createBody: procedureDetails.createBody
      };
      setSelectedProcedure(procedureItem);
      setShowProcedureModal(true);
    } catch (error) {
      console.error('获取存储过程详情失败:', error);
      alert('获取存储过程详情失败: ' + (error as Error).message);
    }
  };
  
  const handleFunctionClick = async (connectionId: number, functionName: string) => {
    try {
      // 从后端获取函数详情
      const functionDetails = await metadataApi.getFunctionDetails(connectionId, functionName);
      // 创建临时Metadata对象
      const functionItem: Metadata = {
        id: 0,
        connectionId,
        tableName: functionDetails.name,
        tableType: 'FUNCTION',
        columns: '[]',
        primaryKeys: '[]',
        foreignKeys: '[]',
        uniqueKeys: '[]',
        checkConstraints: '[]',
        indexes: '[]',
        triggers: '[]',
        tableReferences: '[]',
        createBody: functionDetails.createBody
      };
      setSelectedFunction(functionItem);
      setShowFunctionModal(true);
    } catch (error) {
      console.error('获取函数详情失败:', error);
      alert('获取函数详情失败: ' + (error as Error).message);
    }
  };
  
  const handleTriggerClick = async (connectionId: number, triggerName: string) => {
    try {
      // 从后端获取触发器详情
      const triggerDetails = await metadataApi.getTriggerDetails(connectionId, triggerName);
      // 创建临时Metadata对象
      const triggerItem: Metadata = {
        id: 0,
        connectionId,
        tableName: triggerDetails.name,
        tableType: 'TRIGGER',
        columns: '[]',
        primaryKeys: '[]',
        foreignKeys: '[]',
        uniqueKeys: '[]',
        checkConstraints: '[]',
        indexes: '[]',
        triggers: '[]',
        tableReferences: '[]',
        createBody: triggerDetails.createBody
      };
      setSelectedTrigger(triggerItem);
      setShowTriggerModal(true);
    } catch (error) {
      console.error('获取触发器详情失败:', error);
      alert('获取触发器详情失败: ' + (error as Error).message);
    }
  };

  const handleObjectClick = (connectionId: number, itemName: string, itemType: string) => {
    console.log('handleObjectClick called with:', { connectionId, itemName, itemType });
    console.log('callbackManager.onTableClick:', !!callbackManager.onTableClick);
    console.log('callbackManager.onObjectClick:', !!callbackManager.onObjectClick);
    
    // 直接使用 callbackManager 获取最新的回调函数
    const currentOnTableClick = callbackManager.onTableClick;
    const currentOnObjectClick = callbackManager.onObjectClick;
    
    // 当点击视图时，显示视图详情
    if (itemType === 'VIEW') {
      handleViewClick(connectionId, itemName);
    } 
    // 当点击存储过程时，显示存储过程详情
    else if (itemType === 'PROC') {
      handleProcedureClick(connectionId, itemName);
    }
    // 当点击函数时，显示函数详情
    else if (itemType === 'FUNCTION') {
      handleFunctionClick(connectionId, itemName);
    }
    // 当点击触发器时，显示触发器详情
    else if (itemType === 'TRIGGER') {
      handleTriggerClick(connectionId, itemName);
    }
    // 当点击数据表时，调用onTableClick回调函数
    else if (itemType === 'TABLE' && currentOnTableClick) {
      console.log('Calling onTableClick with:', itemName);
      try {
        currentOnTableClick(itemName);
        console.log('onTableClick callback executed successfully');
      } catch (err) {
        console.error('Error in onTableClick callback:', err);
      }
    } else if (currentOnObjectClick) {
      // 对于其他对象类型，创建临时Metadata对象并调用onObjectClick回调函数
      const tempItem: Metadata = {
        id: 0,
        connectionId,
        tableName: itemName,
        tableType: itemType,
        columns: '[]',
        primaryKeys: '[]',
        foreignKeys: '[]',
        uniqueKeys: '[]',
        checkConstraints: '[]',
        indexes: '[]',
        triggers: '[]',
        tableReferences: '[]',
        createBody: ''
      };
      console.log('Calling onObjectClick with:', tempItem);
      try {
        currentOnObjectClick(tempItem);
        console.log('onObjectClick callback executed successfully');
      } catch (err) {
        console.error('Error in onObjectClick callback:', err);
      }
    } else {
      console.log('No callback defined! onTableClick:', !!currentOnTableClick, 'onObjectClick:', !!currentOnObjectClick);
    }
  };

  const loadCategoryData = (connectionId: number, category: string, page: number = 1): Promise<void> => {
    // 设置加载状态
    setCategoryLoading(prev => new Map(prev).set(`${connectionId}_${category}`, true));
    
    // 根据分类类型加载数据
    let apiCall: Promise<string[]>;
    switch (category) {
      case 'TABLE':
        apiCall = metadataApi.getTables(connectionId, page);
        break;
      case 'VIEW':
        apiCall = metadataApi.getViews(connectionId, page);
        break;
      case 'PROC':
        apiCall = metadataApi.getProcedures(connectionId, page);
        break;
      case 'FUNCTION':
        apiCall = metadataApi.getFunctions(connectionId, page);
        break;
      case 'TRIGGER':
        apiCall = metadataApi.getTriggers(connectionId, page);
        break;
      default:
        apiCall = Promise.resolve([]);
    }
    
    return apiCall
      .then(items => {
        // 处理存储过程和函数名称，移除分号和数字
        const processedItems = items.map(item => {
          // 移除分号和后面的数字
          return item.replace(/;\d+$/, '');
        });
        
        // 更新分类项
        setCategoryItems(prevMap => {
          const connectionItems = prevMap.get(connectionId) || new Map();
          const existingItems = connectionItems.get(category) || [];
          const updatedItems = page === 1 ? processedItems : [...existingItems, ...processedItems];
          connectionItems.set(category, updatedItems);
          
          // 标记新加载的项目
          if (page > 1) {
            setNewlyLoadedItems(prev => {
              const newSet = new Set(prev);
              processedItems.forEach(item => {
                newSet.add(`${connectionId}_${category}_${item}`);
              });
              // 3秒后移除标记
              setTimeout(() => {
                setNewlyLoadedItems(innerPrev => {
                  const innerNewSet = new Set(innerPrev);
                  processedItems.forEach(item => {
                    innerNewSet.delete(`${connectionId}_${category}_${item}`);
                  });
                  return innerNewSet;
                });
              }, 3000);
              return newSet;
            });
          }
          
          return new Map(prevMap).set(connectionId, connectionItems);
        });
        
        // 更新已加载分类
        setLoadedCategories(prevMap => {
          const connectionLoaded = prevMap.get(connectionId) || new Set();
          connectionLoaded.add(category);
          return new Map(prevMap).set(connectionId, connectionLoaded);
        });
        
        // 更新页码
        setCategoryPages(prev => new Map(prev).set(`${connectionId}_${category}`, page));
        
        // 更新是否有更多数据
        setCategoryHasMore(prev => new Map(prev).set(`${connectionId}_${category}`, processedItems.length === 1000));
      })
      .catch(error => {
        console.error(`加载${category}数据失败:`, error);
        // 即使失败也标记为已加载，避免重复加载
        setLoadedCategories(prevMap => {
          const connectionLoaded = prevMap.get(connectionId) || new Set();
          connectionLoaded.add(category);
          return new Map(prevMap).set(connectionId, connectionLoaded);
        });
      })
      .finally(() => {
        // 清除加载状态
        setCategoryLoading(prev => {
          const newMap = new Map(prev);
          newMap.delete(`${connectionId}_${category}`);
          return newMap;
        });
      });
  };

  const handleCategoryToggle = (connectionId: number, category: string) => {
    setExpandedCategories(prev => {
      const connectionCategories = prev.get(connectionId) || new Set();
      const newConnectionCategories = new Set(connectionCategories);
      if (newConnectionCategories.has(category)) {
        newConnectionCategories.delete(category);
      } else {
        newConnectionCategories.add(category);
        // 展开时加载对应分类的数据
        const loaded = loadedCategories.get(connectionId) || new Set();
        if (!loaded.has(category)) {
          // 加载第一页数据
          loadCategoryData(connectionId, category, 1);
        }
      }
      return new Map(prev).set(connectionId, newConnectionCategories);
    });
  };

  // 加载更多数据
  const loadMoreData = (connectionId: number, category: string) => {
    const currentPage = categoryPages.get(`${connectionId}_${category}`) || 1;
    const hasMore = categoryHasMore.get(`${connectionId}_${category}`) || false;
    
    if (hasMore && !categoryLoading.get(`${connectionId}_${category}`)) {
      // 保存滚动位置
      const sidebarElement = sidebarRef.current;
      const scrollTop = sidebarElement?.scrollTop || 0;
      
      loadCategoryData(connectionId, category, currentPage + 1).then(() => {
        // 恢复滚动位置
        setTimeout(() => {
          if (sidebarElement) {
            sidebarElement.scrollTop = scrollTop;
          }
        }, 100);
      });
    }
  };

  // 加载表结构
  const loadTableStructure = (connectionId: number, tableName: string) => {
    const key = `${connectionId}_${tableName}`;
    console.log('加载表结构:', key);
    if (tableStructureLoading.get(key)) {
      console.log('表结构正在加载中:', key);
      return;
    }
    
    // 设置加载状态
    setTableStructureLoading(prev => {
      const newMap = new Map(prev);
      newMap.set(key, true);
      console.log('设置加载状态:', key, newMap.get(key));
      return newMap;
    });
    
    // 这里应该调用API获取表结构，暂时使用模拟数据
    setTimeout(() => {
      // 模拟表结构数据
      const mockStructure = {
        columns: [
          { name: 'id', type: 'INT', nullable: false, primaryKey: true },
          { name: 'name', type: 'VARCHAR(255)', nullable: false },
          { name: 'created_at', type: 'DATETIME', nullable: true }
        ],
        indexes: [
          { name: 'PRIMARY', columns: ['id'], unique: true }
        ]
      };
      
      // 更新表结构数据
      setTableStructures(prev => {
        const newMap = new Map(prev);
        newMap.set(key, mockStructure);
        console.log('更新表结构数据:', key, newMap.get(key));
        return newMap;
      });
      
      // 清除加载状态
      setTableStructureLoading(prev => {
        const newMap = new Map(prev);
        const removed = newMap.delete(key);
        console.log('清除加载状态:', key, removed, newMap.get(key));
        return newMap;
      });
    }, 1000);
  };

  // 处理数据表展开/收缩
  const handleTableToggle = (connectionId: number, tableName: string) => {
    console.log('处理表展开/收缩:', connectionId, tableName);
    setExpandedTables(prev => {
      const connectionTables = prev.get(connectionId) || new Set();
      const newConnectionTables = new Set(connectionTables);
      if (newConnectionTables.has(tableName)) {
        console.log('收缩表:', tableName);
        newConnectionTables.delete(tableName);
      } else {
        console.log('展开表:', tableName);
        newConnectionTables.add(tableName);
        // 展开时加载表结构
        loadTableStructure(connectionId, tableName);
      }
      return new Map(prev).set(connectionId, newConnectionTables);
    });
  };

  // 处理搜索
  const handleSearch = async (connectionId: number, keyword: string) => {
    // 过滤特殊符号，只保留字母、数字和下划线
    const filteredKeyword = keyword.trim().replace(/[^a-zA-Z0-9_]/g, '');
    
    if (!filteredKeyword) {
      // 清空搜索
      setIsSearching(false);
      setSearchKeyword('');
      setSearchResults(new Map());
      return;
    }
    
    // 执行搜索
    setIsSearching(true);
    setSearchKeyword(filteredKeyword);
    
    try {
      // 调用后端API搜索所有对象
      const searchData = await metadataApi.searchObjects(connectionId, filteredKeyword);
      
      // 转换为Map格式
      const results = new Map<string, string[]>();
      Object.entries(searchData).forEach(([type, items]) => {
        results.set(type, items);
      });
      
      setSearchResults(prev => {
        const newMap = new Map(prev);
        newMap.set(connectionId, results);
        return newMap;
      });
    } catch (error) {
      console.error('搜索失败:', error);
      // 搜索失败时，使用前端已加载的数据进行搜索
      const results = new Map<string, string[]>();
      const categories = ['TABLE', 'VIEW', 'PROC', 'FUNCTION', 'TRIGGER'] as const;
      const lowerKeyword = filteredKeyword.toLowerCase();
      
      categories.forEach(type => {
        const items = categoryItems.get(connectionId)?.get(type) || [];
        const filteredItems = items.filter(item => 
          item.toLowerCase().includes(lowerKeyword)
        );
        if (filteredItems.length > 0) {
          results.set(type, filteredItems);
        }
      });
      
      setSearchResults(prev => {
        const newMap = new Map(prev);
        newMap.set(connectionId, results);
        return newMap;
      });
    }
  };
  
  // 处理拖拽开始
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  // 处理拖拽移动
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      // 确保宽度在合理范围内
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // 添加和移除鼠标移动和松开事件监听器
  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = (e: MouseEvent) => {
        if (isDragging) {
          // 确保宽度在合理范围内
          const newWidth = Math.max(200, Math.min(500, e.clientX));
          setSidebarWidth(newWidth);
        }
      };
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);



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
      <div className="layout-container">
        {/* 左侧数据库连接展示区域 */}
        <div 
          ref={sidebarRef}
          className="sidebar"
          style={{ width: `${sidebarWidth}px` }}
          onContextMenu={(e) => handleContextMenu(e)}
        >
          <div className="sidebar-header">
            <h2>数据库导航</h2>
          </div>
          <div className="sidebar-content">
          {loading ? (
            <div>加载中...</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {connections.map((connection) => {
                const connectionId = Number(connection.id!);
                return (
                  <li key={connection.id} style={{ marginBottom: '5px' }}>
                    <div 
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        backgroundColor: selectedConnection?.id === connection.id ? 'var(--bg-active)' : 'transparent',
                        border: selectedConnection?.id === connection.id ? '1px solid var(--brand-primary)' : '1px solid transparent',
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
                        <div className={`db-icon ${getDbIconClass(connection.databaseType)}`}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{connection.connectionName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{connection.databaseType}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{connection.host}:{connection.port}</div>
                        </div>
                      </div>
                      <button
                        style={{
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
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
                            // 展开时获取元数据数量
                            if (!metadataCounts.has(connectionId)) {
                              // 设置加载状态
                              setMetadataLoading(prev => new Map(prev).set(connectionId, true));
                              // 获取元数据数量
                              metadataApi.getMetadataCount(connectionId)
                                .then(counts => {
                                  setMetadataCounts(prevMap => new Map(prevMap).set(connectionId, counts));
                                  // 初始化已加载分类和分类项
                                  setLoadedCategories(prevMap => new Map(prevMap).set(connectionId, new Set()));
                                  setCategoryItems(prevMap => new Map(prevMap).set(connectionId, new Map()));
                                })
                                .catch(error => {
                                  console.error('获取元数据数量失败:', error);
                                  setMetadataCounts(prevMap => new Map(prevMap).set(connectionId, {}));
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
                          fontSize: '12px', 
                          color: 'var(--text-secondary)', 
                          marginBottom: '3px'
                        }}>提取元数据中...</div>
                        <div style={{ 
                          width: '100%', 
                          height: '4px', 
                          backgroundColor: 'var(--bg-tertiary)', 
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
                        {/* 数据库对象标题和搜索框 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'nowrap' }}>
                          <h4 style={{ fontSize: '12px', margin: '0', whiteSpace: 'nowrap' }}>数据库对象</h4>
                          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 1, minWidth: '0' }}>
                            <input
                              type="text"
                              placeholder="搜索..."
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '3px',
                                marginRight: '5px',
                                width: '120px',
                                flexShrink: 1,
                                minWidth: '80px'
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSearch(connectionId, (e.target as HTMLInputElement).value);
                                }
                              }}
                            />
                            <button
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleSearch(connectionId, searchKeyword)}
                            >
                              搜索
                            </button>
                          </div>
                        </div>
                        
                        {/* 搜索结果或全部数据 */}
                        {isSearching && searchResults.get(connectionId) ? (
                          // 显示搜索结果
                          <div>
                            {Array.from(searchResults.get(connectionId)?.entries() || []).map(([type, items]) => (
                              <div key={type} style={{ marginBottom: '10px' }}>
                                <div 
                                  style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 'bold', 
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span style={{ marginRight: '5px' }}>▼</span>
                                  {type} ({items.length})
                                </div>
                                <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '5px 0' }}>
                                  {items.map((itemName) => {
                                    // 使用组合键确保唯一性
                                    const uniqueKey = `${connectionId}_${type}_${itemName}`;
                                    return (
                                      <li key={uniqueKey} style={{ marginBottom: '2px' }}>
                                        <div 
                                          style={{
                                            fontSize: '12px',
                                            padding: '2px 0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          {type === 'TABLE' && (
                                            <span 
                                              style={{ marginRight: '5px', cursor: 'pointer' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleTableToggle(connectionId, itemName);
                                              }}
                                            >
                                              {(expandedTables.get(connectionId) || new Set()).has(itemName) ? '▼' : '▶'}
                                            </span>
                                          )}
                                          <span 
                                            onClick={() => handleObjectClick(connectionId, itemName, type)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            {itemName}
                                          </span>
                                        </div>
                                        {type === 'TABLE' && (expandedTables.get(connectionId) || new Set()).has(itemName) && (
                                          <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '2px 0' }}>
                                            {(() => {
                                              const key = `${connectionId}_${itemName}`;
                                              const isLoading = tableStructureLoading.get(key) || false;
                                              const structure = tableStructures.get(key);
                                              console.log('表结构状态:', key, 'isLoading:', isLoading, 'structure:', structure);
                                              
                                              if (isLoading) {
                                                return <li style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>表结构加载中...</li>;
                                              } else if (structure) {
                                                return (
                                                  <>
                                                    <li style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>列:</li>
                                                    {structure.columns.map((column: any, index: number) => (
                                                      <li key={index} style={{ fontSize: '10px', padding: '1px 0' }}>
                                                        {column.name} ({column.type}) {column.primaryKey ? '(主键)' : ''} {column.nullable ? '(可空)' : ''}
                                                      </li>
                                                    ))}
                                                    {structure.indexes.length > 0 && (
                                                      <>
                                                        <li style={{ fontSize: '11px', fontWeight: 'bold', margin: '3px 0' }}>索引:</li>
                                                        {structure.indexes.map((index: any, idx: number) => (
                                                          <li key={idx} style={{ fontSize: '10px', padding: '1px 0' }}>
                                                            {index.name}: {index.columns.join(', ')} {index.unique ? '(唯一)' : ''}
                                                          </li>
                                                        ))}
                                                      </>
                                                    )}
                                                  </>
                                                );
                                              } else {
                                                return <li style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>表结构加载失败</li>;
                                              }
                                            })()}
                                          </ul>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // 显示全部数据
                          <>
                            {/* 按类别分组 */}
                            {(['TABLE', 'VIEW', 'PROC', 'FUNCTION', 'TRIGGER'] as const).map((type) => {
                          const count = metadataCounts.get(connectionId)?.[type] || 0;
                          if (count === 0) return null;
                          const items = categoryItems.get(connectionId)?.get(type) || [];
                          const isLoading = categoryLoading.get(`${connectionId}_${type}`) || false;
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
                                onClick={() => handleCategoryToggle(connectionId, type)}
                              >
                                <span style={{ marginRight: '5px' }}>{(expandedCategories.get(connectionId) || new Set()).has(type) ? '▼' : '▶'}</span>
                                {type} ({count})
                              </div>
                              {(expandedCategories.get(connectionId) || new Set()).has(type) && (
                                <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '5px 0' }}>
                                  {isLoading ? (
                                    <li style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>加载中...</li>
                                  ) : items.length > 0 ? (
                                    <>
                                      {items.map((itemName) => {
                                        const isNewlyLoaded = newlyLoadedItems.has(`${connectionId}_${type}_${itemName}`);
                                        // 使用组合键确保唯一性
                                        const uniqueKey = `${connectionId}_${type}_${itemName}`;
                                        return (
                                          <li key={uniqueKey} style={{ marginBottom: '2px' }}>
                                            <div 
                                              style={{
                                                fontSize: '12px',
                                                padding: '2px 0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                backgroundColor: isNewlyLoaded ? 'var(--bg-tertiary)' : 'transparent'
                                              }}
                                            >
                                              {type === 'TABLE' && (
                                                <span 
                                                  style={{ marginRight: '5px', cursor: 'pointer' }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTableToggle(connectionId, itemName);
                                                  }}
                                                >
                                                  {(expandedTables.get(connectionId) || new Set()).has(itemName) ? '▼' : '▶'}
                                                </span>
                                              )}
                                              <span 
                                                onClick={() => handleObjectClick(connectionId, itemName, type)}
                                                style={{ cursor: 'pointer' }}
                                              >
                                                {itemName}
                                              </span>
                                            </div>
                                            {type === 'TABLE' && (expandedTables.get(connectionId) || new Set()).has(itemName) && (
                                              <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '2px 0' }}>
                                                {(() => {
                                                  const key = `${connectionId}_${itemName}`;
                                                  const isLoading = tableStructureLoading.get(key) || false;
                                                  const structure = tableStructures.get(key);
                                                  console.log('表结构状态:', key, 'isLoading:', isLoading, 'structure:', structure);
                                                  
                                                  if (isLoading) {
                                                    return <li style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>表结构加载中...</li>;
                                                  } else if (structure) {
                                                    return (
                                                      <>
                                                        <li style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}>列:</li>
                                                        {structure.columns.map((column: any, index: number) => (
                                                          <li key={index} style={{ fontSize: '10px', padding: '1px 0' }}>
                                                            {column.name} ({column.type}) {column.primaryKey ? '(主键)' : ''} {column.nullable ? '(可空)' : ''}
                                                          </li>
                                                        ))}
                                                        {structure.indexes.length > 0 && (
                                                          <>
                                                            <li style={{ fontSize: '11px', fontWeight: 'bold', margin: '3px 0' }}>索引:</li>
                                                            {structure.indexes.map((index: any, idx: number) => (
                                                              <li key={idx} style={{ fontSize: '10px', padding: '1px 0' }}>
                                                                {index.name}: {index.columns.join(', ')} {index.unique ? '(唯一)' : ''}
                                                              </li>
                                                            ))}
                                                          </>
                                                        )}
                                                      </>
                                                    );
                                                  } else {
                                                    return <li style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>表结构加载失败</li>;
                                                  }
                                                })()}
                                              </ul>
                                            )}
                                          </li>
                                        );
                                      })}
                                      {/* 加载更多按钮 */}
                                      {categoryHasMore.get(`${connectionId}_${type}`) && (
                                        <li style={{ marginTop: '5px' }}>
                                          <button
                                            style={{
                                              fontSize: '11px',
                                              padding: '3px 8px',
                                              background: 'var(--bg-tertiary)',
                                              border: '1px solid var(--border-color)',
                                              borderRadius: '4px',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => loadMoreData(connectionId, type)}
                                            disabled={categoryLoading.get(`${connectionId}_${type}`) || false}
                                          >
                                            {categoryLoading.get(`${connectionId}_${type}`) ? '加载中...' : '加载更多'}
                                          </button>
                                        </li>
                                      )}
                                    </>
                                  ) : (
                                    <li style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>无数据</li>
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        })}                          </>
                        )}
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
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {contextMenu.connection ? (
                <>
                  <div className="context-menu-item" onClick={handleCreateConnection}>
                    + 创建连接
                  </div>
                  <div className="context-menu-divider"></div>
                  <div className="context-menu-item" onClick={() => handleEditConnection(contextMenu.connection!)}>
                    ✏️ 编辑
                  </div>
                  <div className="context-menu-item" style={{ color: 'var(--danger-color)' }} onClick={() => handleDeleteConnection(contextMenu.connection!)}>
                    🗑️ 删除
                  </div>
                </>
              ) : (
                <div className="context-menu-item" onClick={handleCreateConnection}>
                  + 创建连接
                </div>
              )}
            </div>
          )}
          </div> {/* 关闭 sidebar-content */}
        </div>
        
        {/* 拖拽手柄 */}
        <div
          style={{
            width: '4px',
            background: isDragging ? 'var(--brand-primary)' : 'var(--border-color)',
            cursor: 'col-resize',
            flexShrink: 0,
            userSelect: 'none'
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
        />

        {/* 右侧主区域 */}
        <div className="main-content">
          {/* 顶部标题区域 */}
          <div style={{ 
            padding: '10px 20px', 
            borderBottom: '1px solid var(--border-color)', 
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
              <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>SQL语言编写工具</h1>
            </div>
            
            {/* 设置按钮和主题切换 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => navigate('/settings')}
                style={{
                  padding: '6px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease-out'
                }}
                title="快捷键设置 (Ctrl + ,)"
              >
                ⚙️
              </button>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                  title="浅色模式"
                >
                  ☀️
                </button>
                <button 
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                  title="深色模式"
                >
                  🌙
                </button>
                <button 
                  className={`theme-button ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                  title="跟随系统"
                >
                  💻
                </button>
              </div>
            </div>
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
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <ConnectionForm
                connection={editingConnection}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {/* 视图详情模态框 */}
        {showViewModal && selectedView && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>视图详情: {selectedView.tableName}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CopyButton text={(selectedView as any).createBody || ''} />
                  <button
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setShowViewModal(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>创建语句:</h4>
                <pre style={{
                  background: 'var(--bg-tertiary)',
                  padding: '15px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {(selectedView as any).createBody || '无创建语句'}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        {/* 存储过程详情模态框 */}
        {showProcedureModal && selectedProcedure && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>存储过程详情: {selectedProcedure.tableName}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CopyButton text={(selectedProcedure as any).createBody || ''} />
                  <button
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setShowProcedureModal(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>创建语句:</h4>
                <pre style={{
                  background: 'var(--bg-tertiary)',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}>
                  {(selectedProcedure as any).createBody || '无创建语句'}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        {/* 函数详情模态框 */}
        {showFunctionModal && selectedFunction && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>函数详情: {selectedFunction.tableName}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CopyButton text={(selectedFunction as any).createBody || ''} />
                  <button
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setShowFunctionModal(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>创建语句:</h4>
                <pre style={{
                  background: 'var(--bg-tertiary)',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}>
                  {(selectedFunction as any).createBody || '无创建语句'}
                </pre>
              </div>
            </div>
          </div>
        )}
        
        {/* 触发器详情模态框 */}
        {showTriggerModal && selectedTrigger && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>触发器详情: {selectedTrigger.tableName}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CopyButton text={(selectedTrigger as any).createBody || ''} />
                  <button
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => setShowTriggerModal(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>创建语句:</h4>
                <pre style={{
                  background: 'var(--bg-tertiary)',
                  padding: '15px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}>
                  {(selectedTrigger as any).createBody || '无创建语句'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConnectionContext.Provider>
  );
};

export default Layout;
