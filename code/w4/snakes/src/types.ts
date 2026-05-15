// 方向类型
export type Direction = 'up' | 'down' | 'left' | 'right';

// 游戏模式
export type GameMode = 'single' | 'double';

// 游戏难度
export type Difficulty = 'normal' | 'hard' | 'superHard';

// 食物类型
export type FoodType = 'speed' | 'size' | 'color' | 'poison' | 'shield' | 'phase' | 'split' | 'magnet' | 'time' | 'freeze' | 'doubleScore';

// 速度等级
export type SpeedLevel = 'fast' | 'medium' | 'slow';

// 大小等级
export type SizeLevel = 'large' | 'medium' | 'small';

// 位置坐标
export interface Position {
  x: number;
  y: number;
}

// 关卡信息
export interface LevelInfo {
  major: number; // 大关卡 1-4
  minor: number; // 小关卡 1-4
}

// 玩家信息
export interface Player {
  id: string;
  name: string;
  score: number;
  level: LevelInfo;
  survivalTime: number; // 总生存时间（秒）
  isAlive: boolean;
}

// 蛇信息
export interface Snake {
  positions: Position[];
  direction: Direction;
  nextDirection: Direction;
  speed: number;
  baseSpeed: number;
  originalBaseSpeed: number; // 原始基础速度（用于毒药效果结束后恢复）
  color: string;
  poisonEffectTime: number; // 毒药效果剩余时间（毫秒）
  poisonStackCount: number; // 毒药叠加层数
  isDead: boolean; // 是否死亡
  deathAnimationPhase: number; // 死亡动画阶段 0-3
  shieldCount: number; // 护盾次数
  phaseCount: number; // 穿越次数
  magnetTime: number; // 磁铁效果剩余时间
  doubleScoreTime: number; // 双倍分数剩余时间
  frozenTime: number; // 冰冻剩余时间
}

// 排行榜记录
export interface LeaderboardRecord {
  id: string;
  playerName: string;
  score: number;
  survivalTime: number;
  level: LevelInfo;
  mode: GameMode;
  difficulty: Difficulty;
  createdAt: number;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
  category: 'score' | 'skill' | 'collection';
}

// 音频配置
export interface AudioConfig {
  musicEnabled: boolean;
  soundEnabled: boolean;
  volume: number;
}

// 食物信息
export interface Food {
  x: number;
  y: number;
  type: FoodType;
  value: SpeedLevel | SizeLevel | string; // speed/size的值或color的颜色值
  color: string;
  createdAt: number; // 食物生成时间戳（毫秒）
}

// 游戏配置
export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  levelTime: number;
  player1Name: string;
  player2Name: string;
  audio?: AudioConfig;
  customMap?: CustomMap | null;
}

// 大关卡分数要求
export const MAJOR_LEVEL_SCORE_REQUIREMENTS: Record<number, number> = {
  1: 1000, // 第1→第2大关卡需要1000分
  2: 2500, // 第2→第3大关卡需要2500分
  3: 5000  // 第3→第4大关卡需要5000分
};

// 游戏状态
export type GameStatus = 'config' | 'playing' | 'paused' | 'ended';

// 游戏结果
export interface GameResult {
  players: Player[];
  isWin: boolean;
}

// ==================== 自定义地图相关类型 ====================

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

export interface MapEditorTool {
  type: 'wall' | 'obstacle' | 'eraser';
  icon: string;
  color: string;
}

export const MAP_EDITOR_TOOLS: MapEditorTool[] = [
  { type: 'wall', icon: '🧱', color: '#FF5252' },
  { type: 'obstacle', icon: '🧱', color: '#FF9800' },
  { type: 'eraser', icon: '🗑️', color: '#707070' },
];

export const DEFAULT_MAP_WIDTH = 30;
export const DEFAULT_MAP_HEIGHT = 30;

// 特效类型
export type EffectType = 'collect' | 'shield' | 'speed' | 'freeze' | 'magnet' | 'doubleScore' | 'poison';

// 特效数据
export interface Effect {
  id: string;
  type: EffectType;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  color: string;
}

// 特效配置
export interface EffectConfig {
  duration: number;
  color: string;
  name: string;
}

export const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
  collect: { duration: 500, color: '#4CAF50', name: '收集' },
  shield: { duration: 800, color: '#2196F3', name: '护盾' },
  speed: { duration: 600, color: '#FF9800', name: '加速' },
  freeze: { duration: 1000, color: '#00BCD4', name: '冰冻' },
  magnet: { duration: 700, color: '#9C27B0', name: '磁铁' },
  doubleScore: { duration: 900, color: '#FFC107', name: '双倍分数' },
  poison: { duration: 600, color: '#F44336', name: '毒药' }
};
