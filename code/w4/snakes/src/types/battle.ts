// 对战相关类型定义

export type Direction = 'up' | 'down' | 'left' | 'right';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export type BattleItemType = 'freeze' | 'grow' | 'fog' | 'speed' | 'reverse' | 'poison' | 'speedBoost';

export interface Position {
  x: number;
  y: number;
}

export interface BattlePlayer {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  snake: Position[];
  direction: Direction;
  nextDirection: Direction;
  score: number;
  items: BattleItem[];
  isFrozen: boolean;
  frozenUntil: number;
  isReversed: boolean;
  reversedUntil: number;
  isAlive: boolean;
  isSpectator?: boolean;
  hasSpeedBoost?: boolean;
  speedBoostUntil?: number;
  wins: number;
  losses: number;
}

export interface BattleItem {
  id: string;
  type: BattleItemType;
  count: number;
}

export interface Food {
  x: number;
  y: number;
  type: 'normal' | BattleItemType;
  color: string;
  id: string;
}

// 自定义地图类型
export interface CustomMap {
  id: string;
  name: string;
  width: number;
  height: number;
  walls: Position[];
  obstacles: Position[];
  createdAt: number;
  isDefault?: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, BattlePlayer>;
  status: RoomStatus;
  maxPlayers: number;
  hasPassword: boolean;
  password?: string;
  gameDuration: number;
  createdAt: number;
  gameStartedAt?: number;
  foods: Food[];
  gridWidth: number;
  gridHeight: number;
  walls?: Position[];
  obstacles?: Position[];
  customMap?: CustomMap | null;
  isPaused?: boolean;
  pauseRequest?: {
    fromPlayerId: string;
    confirmedBy: string[];
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
  status: RoomStatus;
  gameDuration: number;
}

// WebSocket消息类型
export type ClientMessageType =
  | 'createRoom'
  | 'joinRoom'
  | 'leaveRoom'
  | 'toggleReady'
  | 'startGame'
  | 'playerMove'
  | 'useItem'
  | 'ping'
  | 'requestPause'
  | 'confirmPause'
  | 'requestResume'
  | 'confirmResume'
  | 'selectMap'
  | 'exitGame';

export type ServerMessageType =
  | 'roomCreated'
  | 'roomJoined'
  | 'playerJoined'
  | 'playerLeft'
  | 'playerReadyChanged'
  | 'roomList'
  | 'gameStarted'
  | 'gameState'
  | 'itemUsed'
  | 'gameEnded'
  | 'pauseRequested'
  | 'pauseConfirmed'
  | 'resumeRequested'
  | 'resumeConfirmed'
  | 'error'
  | 'pong'
  | 'mapChanged'
  | 'gameExited';

export interface ClientMessage {
  type: ClientMessageType;
  data?: any;
}

export interface ServerMessage {
  type: ServerMessageType;
  data: any;
}

export interface CreateRoomData {
  name: string;
  password?: string;
  gameDuration?: number;
  maxPlayers?: number;
  playerName: string;
}

export interface JoinRoomData {
  roomId: string;
  password?: string;
  playerName: string;
}

export interface GameState {
  players: BattlePlayer[];
  foods: Food[];
  timeRemaining: number;
  isPaused: boolean;
  gridWidth: number;
  gridHeight: number;
  walls: Array<{x: number, y: number}>;
  obstacles: Array<{x: number, y: number}>;
}

export interface GameEndedData {
  winnerId: string;
  winnerName: string;
  finalStats: {
    playerId: string;
    playerName: string;
    score: number;
  }[];
}

// 页面状态
export type BattlePage = 'lobby' | 'room' | 'game' | 'result';
