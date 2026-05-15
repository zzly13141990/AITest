import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RoomInfo,
  Room,
  BattlePlayer,
  GameState,
  GameEndedData,
  CreateRoomData,
  JoinRoomData,
  Direction,
  BattlePage,
  CustomMap,
} from '../types/battle';
import { battleSocket } from '../services/battleSocket';

interface UseBattleReturn {
  // 状态
  currentPage: BattlePage;
  roomList: RoomInfo[];
  currentRoom: Room | null;
  currentPlayer: BattlePlayer | null;
  gameState: GameState | null;
  gameResult: GameEndedData | null;
  isConnected: boolean;
  error: string | null;
  pauseRequest: any;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  
  // 房间操作
  createRoom: (data: CreateRoomData) => void;
  joinRoom: (data: JoinRoomData) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
  selectMap: (map: CustomMap | null) => void;
  
  // 游戏操作
  move: (direction: Direction) => void;
  useItem: (itemId: string, targetPlayerId?: string) => void;
  requestPause: () => void;
  confirmPause: () => void;
  requestResume: () => void;
  confirmResume: () => void;
  exitGame: () => void;
  
  // 音频/特效
  toggleMusic: () => void;
  toggleEffects: () => void;
  
  // 导航
  goToLobby: () => void;
  
  // 工具
  clearError: () => void;
  reconnect: () => void;
}

export const useBattle = (): UseBattleReturn => {
  // 状态
  const [currentPage, setCurrentPage] = useState<BattlePage>('lobby');
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<BattlePlayer | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameEndedData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseRequest, setPauseRequest] = useState<any>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  
  // Refs
  const currentRoomRef = useRef<Room | null>(null);
  const currentPlayerRef = useRef<BattlePlayer | null>(null);
  
  // 更新Refs
  useEffect(() => {
    currentRoomRef.current = currentRoom;
    currentPlayerRef.current = currentPlayer;
  }, [currentRoom, currentPlayer]);

  // 当currentRoom更新时，重新同步currentPlayer
  useEffect(() => {
    if (currentRoom && currentPlayer) {
      const updatedPlayer = Array.from(currentRoom.players.values()).find(
        p => p.id === currentPlayer.id
      );
      if (updatedPlayer && updatedPlayer.isReady !== currentPlayer.isReady) {
        console.log('🔄 Syncing currentPlayer state:', updatedPlayer);
        setCurrentPlayer(updatedPlayer);
      }
    }
  }, [currentRoom, currentPlayer?.id]);

  // 检查连接状态
  useEffect(() => {
    console.log('🔗 Initializing battle socket connection...');
    
    // 初始化连接状态
    const initialStatus = battleSocket.isConnected();
    console.log('📡 Initial socket status:', initialStatus);
    setIsConnected(initialStatus);
    
    // 立即再次检查一次
    setTimeout(() => {
      const status = battleSocket.isConnected();
      console.log('📡 Delayed socket status check:', status);
      setIsConnected(status);
    }, 1000);
    
    // 监听连接事件
    const handleConnect = () => {
      console.log('🔗 useBattle: Socket connected');
      setIsConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('🔌 useBattle: Socket disconnected');
      setIsConnected(false);
    };
    
    battleSocket.onConnect(handleConnect);
    battleSocket.onDisconnect(handleDisconnect);
    
    return () => {
      battleSocket.offConnect(handleConnect);
      battleSocket.offDisconnect(handleDisconnect);
    };
  }, []);

  // 设置Socket事件监听
  useEffect(() => {
    // 房间列表
    const handleRoomList = (data: RoomInfo[]) => {
      setRoomList(data);
    };
    
    // 房间创建
    const handleRoomCreated = (data: { roomId: string; room: Room; player: BattlePlayer }) => {
      console.log('📨 Received roomCreated:', data);
      console.log('📦 data.room.players:', data.room.players);
      
      // 强制使用数组格式处理
      let playersMap = new Map<string, BattlePlayer>();
      
      if (Array.isArray(data.room.players)) {
        console.log('✅ Using array format for roomCreated');
        for (const [id, player] of data.room.players as any) {
          if (id && player) {
            playersMap.set(id, player);
          }
        }
      } else if (data.room.players && typeof data.room.players === 'object') {
        console.log('✅ Using object format for roomCreated');
        for (const [id, player] of Object.entries(data.room.players)) {
          if (id && player) {
            playersMap.set(id, player as BattlePlayer);
          }
        }
      }
      
      console.log('✅ Created playersMap for roomCreated:', playersMap);
      
      const roomWithPlayers = {
        ...data.room,
        players: playersMap,
      };
      
      setCurrentRoom(roomWithPlayers);
      setCurrentPlayer(data.player);
      setCurrentPage('room');
      setError(null);
    };
    
    // 加入房间或房间状态更新
    const handleRoomJoined = (data: { room: Room; player?: BattlePlayer }) => {
      console.log('📨 Received roomJoined:', data);
      console.log('📦 data.room.players:', data.room.players);
      console.log('📦 data.room.players type:', typeof data.room.players);
      
      // 强制使用数组格式处理
      let playersMap = new Map<string, BattlePlayer>();
      
      if (Array.isArray(data.room.players)) {
        console.log('✅ Using array format');
        for (const [id, player] of data.room.players as any) {
          if (id && player) {
            playersMap.set(id, player);
          }
        }
      } else if (data.room.players && typeof data.room.players === 'object') {
        console.log('✅ Using object format');
        for (const [id, player] of Object.entries(data.room.players)) {
          if (id && player) {
            playersMap.set(id, player as BattlePlayer);
          }
        }
      }
      
      console.log('✅ Created playersMap:', playersMap);
      
      const roomWithPlayers = {
        ...data.room,
        players: playersMap,
      };
      
      console.log('✅ Final room:', roomWithPlayers);
      
      setCurrentRoom(roomWithPlayers);
      // 只有在有 player 信息时才更新 currentPlayer（比如新加入房间时）
      if (data.player) {
        setCurrentPlayer(data.player);
        setCurrentPage('room');
        setError(null);
      } else {
        // 如果只是房间状态更新，从新房间中找到当前玩家并更新
        setCurrentPlayer(prev => {
          if (!prev) return prev;
          const updatedPlayer = roomWithPlayers.players.get(prev.id);
          if (updatedPlayer) {
            console.log('✅ Updating currentPlayer:', updatedPlayer);
            return updatedPlayer;
          }
          return prev;
        });
      }
    };
    
    // 玩家加入
    const handlePlayerJoined = (data: { player: BattlePlayer }) => {
      setCurrentRoom(prev => {
        if (!prev) return prev;
        const newPlayers = new Map(prev.players);
        newPlayers.set(data.player.id, data.player);
        return { ...prev, players: newPlayers };
      });
    };
    
    // 玩家离开
    const handlePlayerLeft = (data: { socketId: string }) => {
      setCurrentRoom(prev => {
        if (!prev) return prev;
        const newPlayers = new Map(prev.players);
        let playerToRemove: string | null = null;
        
        for (const [id, player] of newPlayers) {
          if (player.socketId === data.socketId) {
            playerToRemove = id;
            break;
          }
        }
        
        if (playerToRemove) {
          newPlayers.delete(playerToRemove);
        }
        
        return { ...prev, players: newPlayers };
      });
    };
    
    // 玩家准备状态变化
    const handlePlayerReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      console.log('📨 Received playerReadyChanged:', data);
      
      // 先更新房间
      setCurrentRoom(prev => {
        if (!prev) return prev;
        const newPlayers = new Map(prev.players);
        const player = newPlayers.get(data.playerId);
        console.log('Updating player:', player?.name, 'to isReady:', data.isReady);
        if (player) {
          const updatedPlayer = { ...player, isReady: data.isReady };
          newPlayers.set(data.playerId, updatedPlayer);
        }
        return { ...prev, players: newPlayers };
      });
      
      // 再更新当前玩家（如果是自己）
      if (currentPlayerRef.current?.id === data.playerId) {
        console.log('🎯 This is current player, updating directly!');
        setCurrentPlayer(prev => prev ? { ...prev, isReady: data.isReady } : prev);
      }
    };
    
    // 游戏开始
    const handleGameStarted = (data: { room: Room }) => {
      console.log('🎮 Received gameStarted:', data);
      console.log('🎮 data.room.players:', data.room.players);
      
      let playersMap = new Map<string, BattlePlayer>();
      
      if (Array.isArray(data.room.players)) {
        console.log('✅ Using array format for gameStarted');
        for (const [id, player] of data.room.players as any) {
          if (id && player) {
            playersMap.set(id, player);
          }
        }
      } else if (data.room.players && typeof data.room.players === 'object') {
        console.log('✅ Using object format for gameStarted');
        for (const [id, player] of Object.entries(data.room.players)) {
          if (id && player) {
            playersMap.set(id, player as BattlePlayer);
          }
        }
      }
      
      console.log('✅ Created playersMap for gameStarted:', playersMap);
      
      const roomWithPlayers = {
        ...data.room,
        players: playersMap,
      };
      
      setCurrentRoom(roomWithPlayers);
      setCurrentPage('game');
      setGameResult(null);
    };
    
    // 游戏状态更新
    const handleGameState = (data: GameState) => {
      setGameState(data);
    };
    
    // 道具使用
    const handleItemUsed = (data: any) => {
      // 可以在这里添加道具使用的视觉反馈
      console.log('Item used:', data);
    };
    
    // 游戏结束
    const handleGameEnded = (data: GameEndedData) => {
      setGameResult(data);
      setCurrentPage('result');
    };
    
    // 暂停请求
    const handlePauseRequested = (data: any) => {
      console.log('⏸️ Pause requested:', data);
      setPauseRequest(data);
    };
    
    // 暂停确认
    const handlePauseConfirmed = (data: any) => {
      console.log('✅ Pause confirmed:', data);
      // 更新当前房间的 pauseRequest
      setCurrentRoom(prev => prev ? {
        ...prev,
        pauseRequest: { fromPlayerId: data.fromPlayerId, confirmedBy: data.confirmedBy }
      } : null);
      setPauseRequest({ ...data });
      // 如果双方都确认，isPaused 会通过 gameState 自动更新
    };
    
    // 恢复请求
    const handleResumeRequested = (data: any) => {
      console.log('▶️ Resume requested:', data);
      setPauseRequest(data);
    };
    
    // 恢复确认
    const handleResumeConfirmed = (data: any) => {
      console.log('✅ Resume confirmed:', data);
      setCurrentRoom(prev => prev ? {
        ...prev,
        pauseRequest: { fromPlayerId: data.fromPlayerId, confirmedBy: data.confirmedBy }
      } : null);
      setPauseRequest({ ...data });
    };
    
    // 错误处理
    const handleError = (data: { message: string }) => {
      setError(data.message);
    };

    // 地图变更处理
    const handleMapChanged = (data: { map: CustomMap | null }) => {
      console.log('🗺️ Received mapChanged:', data);
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          customMap: data.map,
          walls: data.map ? data.map.walls : undefined,
          obstacles: data.map ? data.map.obstacles : undefined,
          gridWidth: data.map ? data.map.width : prev.gridWidth,
          gridHeight: data.map ? data.map.height : prev.gridHeight,
        };
      });
    };

    // 注册事件监听
    battleSocket.on('roomList', handleRoomList);
    battleSocket.on('roomCreated', handleRoomCreated);
    battleSocket.on('roomJoined', handleRoomJoined);
    battleSocket.on('playerJoined', handlePlayerJoined);
    battleSocket.on('playerLeft', handlePlayerLeft);
    battleSocket.on('playerReadyChanged', handlePlayerReadyChanged);
    battleSocket.on('gameStarted', handleGameStarted);
    battleSocket.on('gameState', handleGameState);
    battleSocket.on('itemUsed', handleItemUsed);
    battleSocket.on('gameEnded', handleGameEnded);
    battleSocket.on('pauseRequested', handlePauseRequested);
    battleSocket.on('pauseConfirmed', handlePauseConfirmed);
    battleSocket.on('resumeRequested', handleResumeRequested);
    battleSocket.on('resumeConfirmed', handleResumeConfirmed);
    battleSocket.on('error', handleError);
    battleSocket.on('mapChanged', handleMapChanged);

    // 游戏退出事件
    const handleGameExited = (data: { room: any }) => {
      console.log('🎮 Game exited, returning to room');
      
      // 处理房间数据
      let playersMap = new Map<string, BattlePlayer>();
      
      if (Array.isArray(data.room.players)) {
        for (const [id, player] of data.room.players as any) {
          if (id && player) {
            playersMap.set(id, player);
          }
        }
      } else if (data.room.players && typeof data.room.players === 'object') {
        for (const [id, player] of Object.entries(data.room.players)) {
          if (id && player) {
            playersMap.set(id, player as BattlePlayer);
          }
        }
      }
      
      const roomWithPlayers = {
        ...data.room,
        players: playersMap,
      };
      
      setCurrentRoom(roomWithPlayers);
      setGameState(null);
      setGameResult(null);
      setPauseRequest(null);
      setCurrentPage('room');
    };
    
    battleSocket.on('gameExited', handleGameExited);
    
    return () => {
      // 清理事件监听
      battleSocket.off('roomList', handleRoomList);
      battleSocket.off('roomCreated', handleRoomCreated);
      battleSocket.off('roomJoined', handleRoomJoined);
      battleSocket.off('playerJoined', handlePlayerJoined);
      battleSocket.off('playerLeft', handlePlayerLeft);
      battleSocket.off('playerReadyChanged', handlePlayerReadyChanged);
      battleSocket.off('gameStarted', handleGameStarted);
      battleSocket.off('gameState', handleGameState);
      battleSocket.off('itemUsed', handleItemUsed);
      battleSocket.off('gameEnded', handleGameEnded);
      battleSocket.off('pauseRequested', handlePauseRequested);
      battleSocket.off('pauseConfirmed', handlePauseConfirmed);
      battleSocket.off('resumeRequested', handleResumeRequested);
      battleSocket.off('resumeConfirmed', handleResumeConfirmed);
      battleSocket.off('error', handleError);
      battleSocket.off('mapChanged', handleMapChanged);
      battleSocket.off('gameExited', handleGameExited);
    };
  }, []);

  // 创建房间
  const createRoom = useCallback((data: CreateRoomData) => {
    battleSocket.send('createRoom', data);
  }, []);

  // 加入房间
  const joinRoom = useCallback((data: JoinRoomData) => {
    console.log('📤 Calling joinRoom with data:', data);
    battleSocket.send('joinRoom', data);
  }, []);

  // 离开房间
  const leaveRoom = useCallback(() => {
    battleSocket.send('leaveRoom');
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setGameState(null);
    setCurrentPage('lobby');
  }, []);

  // 切换准备状态
  const toggleReady = useCallback(() => {
    console.log('📤 Sending toggleReady message to server');
    battleSocket.send('toggleReady');
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    battleSocket.send('startGame');
  }, []);

  // 移动
  const move = useCallback((direction: Direction) => {
    battleSocket.send('playerMove', { direction });
  }, []);

  // 使用道具
  const useItem = useCallback((itemId: string, targetPlayerId?: string) => {
    battleSocket.send('useItem', { itemId, targetPlayerId });
  }, []);
  
  // 请求暂停
  const requestPause = useCallback(() => {
    battleSocket.send('requestPause');
  }, []);
  
  // 确认暂停
  const confirmPause = useCallback(() => {
    battleSocket.send('confirmPause');
  }, []);
  
  // 请求恢复
  const requestResume = useCallback(() => {
    battleSocket.send('requestResume');
  }, []);
  
  // 确认恢复
  const confirmResume = useCallback(() => {
    battleSocket.send('confirmResume');
  }, []);
  
  // 选择地图（发送到服务器同步）
  const selectMap = useCallback((map: CustomMap | null) => {
    battleSocket.send('selectMap', { map });
  }, []);

  // 退出游戏（返回到房间）
  const exitGame = useCallback(() => {
    battleSocket.send('exitGame');
  }, []);
  
  // 切换音乐
  const toggleMusic = useCallback(() => {
    setMusicEnabled(prev => !prev);
  }, []);
  
  // 切换特效
  const toggleEffects = useCallback(() => {
    setEffectsEnabled(prev => !prev);
  }, []);

  // 返回大厅
  const goToLobby = useCallback(() => {
    if (currentRoomRef.current && currentRoomRef.current.status !== 'waiting') {
      battleSocket.send('leaveRoom');
    }
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setGameState(null);
    setGameResult(null);
    setCurrentPage('lobby');
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 重新连接
  const reconnect = useCallback(() => {
    console.log('🔄 Manually triggering reconnect...');
    battleSocket.reconnect();
    // 等待一小段时间后重新检查连接状态
    setTimeout(() => {
      setIsConnected(battleSocket.isConnected());
    }, 1000);
  }, []);

  return {
    // 状态
    currentPage,
    roomList,
    currentRoom,
    currentPlayer,
    gameState,
    gameResult,
    isConnected,
    error,
    pauseRequest,
    musicEnabled,
    effectsEnabled,
    
    // 房间操作
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    selectMap,
    
    // 游戏操作
    move,
    useItem,
    requestPause,
    confirmPause,
    requestResume,
    confirmResume,
    exitGame,
    
    // 音频/特效
    toggleMusic,
    toggleEffects,
    
    // 导航
    goToLobby,
    
    // 工具
    clearError,
    reconnect,
  };
};
