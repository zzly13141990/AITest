// 方块类型枚举
export enum BlockType {
  I = 'I',
  O = 'O',
  T = 'T',
  L = 'L',
  J = 'J',
  S = 'S',
  Z = 'Z'
}

// 方块形状定义
export const BLOCK_SHAPES: Record<BlockType, number[][]> = {
  [BlockType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [BlockType.O]: [
    [1, 1],
    [1, 1]
  ],
  [BlockType.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [BlockType.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [BlockType.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [BlockType.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  [BlockType.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// 方块颜色配置
export const BLOCK_COLORS: Record<BlockType, { main: string; border: string }> = {
  [BlockType.I]: { main: '#00F0F0', border: '#00B0B0' },
  [BlockType.O]: { main: '#F0F000', border: '#B0B000' },
  [BlockType.T]: { main: '#A000F0', border: '#7000B0' },
  [BlockType.L]: { main: '#F0A000', border: '#B07000' },
  [BlockType.J]: { main: '#0000F0', border: '#0000B0' },
  [BlockType.S]: { main: '#00F000', border: '#00B000' },
  [BlockType.Z]: { main: '#F00000', border: '#B00000' }
};

// 方块接口
export interface Block {
  type: BlockType;
  shape: number[][];
  x: number;
  y: number;
  color: { main: string; border: string };
  hasItem?: ItemType; // 道具标识
}

// 道具类型
export enum ItemType {
  SPEED_UP = 'SPEED_UP',    // 加速道具
  SPEED_DOWN = 'SPEED_DOWN',// 减速道具
  DROP = 'DROP'             // 落底道具
}

// 道具配置
export const ITEM_CONFIG: Record<ItemType, { color: string; iconColor: string; name: string; duration: number }> = {
  [ItemType.SPEED_UP]: { color: '#EF4444', iconColor: '#FEE2E2', name: '加速', duration: 10000 },
  [ItemType.SPEED_DOWN]: { color: '#10B981', iconColor: '#D1FAE5', name: '减速', duration: 10000 },
  [ItemType.DROP]: { color: '#F59E0B', iconColor: '#FEF3C7', name: '落底', duration: 0 }
};

// 游戏网格格子
export interface GridCell {
  filled: boolean;
  color?: { main: string; border: string };
  hasItem?: ItemType;
}

// 游戏状态接口
export interface GameState {
  grid: GridCell[][];
  currentBlock: Block | null;
  nextBlock: Block | null;
  score: number;
  level: number;
  lines: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  combo: number; // 连击数
  activeItems: { [key in ItemType]?: number }; // 当前激活的道具（过期时间戳）
}

// 游戏配置
export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  cellGap: number;
  baseDropInterval: number;
  levelUpLines: number;
  maxLevel: number;
}

// 默认游戏配置
export const DEFAULT_GAME_CONFIG: GameConfig = {
  gridWidth: 10,
  gridHeight: 20,
  cellSize: 30,
  cellGap: 2,
  baseDropInterval: 1000,
  levelUpLines: 10,
  maxLevel: 20
};

// 计分规则
export const SCORE_RULES = {
  1: 100,
  2: 300,
  3: 600,
  4: 1000
};

// 成就定义
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockTime?: number;
}

// 成就列表
export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockTime'>[] = [
  { id: 'first_game', name: '初次游戏', description: '完成第一局游戏' },
  { id: 'line_master', name: '消除高手', description: '单局消除50行' },
  { id: 'combo_master', name: '连击大师', description: '连续消除4行' },
  { id: 'level_master', name: '等级达人', description: '达到10级' },
  { id: 'score_king', name: '分数王者', description: '单局得分超过10000分' }
];

// 排行榜记录
export interface RankRecord {
  id: string;
  score: number;
  level: number;
  lines: number;
  timestamp: number;
  mode: 'single' | 'battle';
  playerName?: string;
}

// 游戏模式
export type GameMode = 'single' | 'battle';

// 双人对战玩家状态
export interface BattlePlayerState {
  id: number;
  name: string;
  gameState: GameState;
  controls: PlayerControls;
}

// 玩家按键控制
export interface PlayerControls {
  left: string[];
  right: string[];
  rotate: string[];
  down: string[];
  drop: string[];
}

// 单人模式按键控制
export const SINGLE_PLAYER_CONTROLS: PlayerControls = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  rotate: ['ArrowUp'],
  down: ['ArrowDown'],
  drop: [' ']
};

// 双人模式玩家1控制
export const PLAYER_1_CONTROLS: PlayerControls = {
  left: ['a', 'A', 'ArrowLeft'],
  right: ['d', 'D', 'ArrowRight'],
  rotate: ['w', 'W', 'ArrowUp'],
  down: ['s', 'S', 'ArrowDown'],
  drop: ['q', 'Q']
};

// 双人模式玩家2控制
export const PLAYER_2_CONTROLS: PlayerControls = {
  left: ['j', 'J'],
  right: ['l', 'L'],
  rotate: ['i', 'I'],
  down: ['k', 'K'],
  drop: ['u', 'U']
};
