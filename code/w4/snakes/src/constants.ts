import { FoodType, SpeedLevel, SizeLevel, Difficulty } from './types';

// ==================== 颜色常量 ====================
export const COLORS = {
  primary: '#4ECDC4',
  secondary: '#45B7D1',
  gameBackground: '#1A1A2E',
  pageBackground: '#0F0F23',
  success: '#00C853',
  warning: '#FFAB00',
  danger: '#FF5252',
  info: '#2196F3',
  snakeDefault: '#4ECDC4',
  snakeHead: '#45B7D1',
  snakeColor1: '#FF6B6B',
  snakeColor2: '#95E1D3',
  snakeColor3: '#F38181',
  foodSpeed: '#FFD93D',
  foodSize: '#6BCB77',
  foodColor: '#9B59B6',
  foodPoison: '#FF5252',
  // 新食物颜色
  foodShield: '#00BCD4',
  foodPhase: '#9C27B0',
  foodSplit: '#FF9800',
  foodMagnet: '#795548',
  foodTime: '#03A9F4',
  foodFreeze: '#B3E5FC',
  foodDoubleScore: '#FFD700',
  // 成就和UI颜色
  achievementUnlocked: '#4ECDC4',
  achievementLocked: '#707070',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#707070',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  border: '#2D2D4A',
  cardBackground: '#16162A',
  card: '#16162A',
  background: '#0F0F23',
  hoverBackground: '#252542'
};

// ==================== 尺寸常量 ====================
export const SIZES = {
  gridCell: 20,
  singleCanvasWidth: 600,
  singleCanvasHeight: 600,
  doubleCanvasWidth: 550,
  doubleCanvasHeight: 550,
  sidebarWidth: 280,
  configCardWidth: 480,
  inputHeight: 48,
  buttonHeight: 52,
  smallButtonHeight: 36
};

// ==================== 游戏配置常量 ====================
export const GAME_CONFIG = {
  // 网格尺寸
  singleGridWidth: SIZES.singleCanvasWidth / SIZES.gridCell,
  singleGridHeight: SIZES.singleCanvasHeight / SIZES.gridCell,
  doubleGridWidth: SIZES.doubleCanvasWidth / SIZES.gridCell,
  doubleGridHeight: SIZES.doubleCanvasHeight / SIZES.gridCell,
  
  // 初始蛇长度
  initialSnakeLength: 3,
  
  // 食物类型
  foodTypes: ['speed', 'size', 'color', 'poison', 'shield', 'phase', 'split', 'magnet', 'time', 'freeze', 'doubleScore'] as FoodType[],
  
  // 速度等级对应的毫秒间隔
  speedMap: {
    fast: 80,
    medium: 120,
    slow: 180
  },
  
  // 难度对应的基础速度
  difficultySpeedMap: {
    normal: 150,
    hard: 120,
    superHard: 90
  },
  
  // 大小等级对应的增长节数
  sizeGrowthMap: {
    large: 3,
    medium: 2,
    small: 1
  },
  
  // 可选的蛇颜色
  snakeColors: [COLORS.snakeColor1, COLORS.snakeColor2, COLORS.snakeColor3],
  
  // 速度等级
  speedLevels: ['fast', 'medium', 'slow'] as SpeedLevel[],
  
  // 大小等级
  sizeLevels: ['large', 'medium', 'small'] as SizeLevel[],
  
  // 毒药效果持续时间（毫秒）
  poisonDuration: 20000,
  
  // 毒药加速比例（按难度调整）
  poisonSpeedFactors: {
    normal: 0.9,    // 普通难度加速10%
    hard: 0.85,     // 困难难度加速15%
    superHard: 0.8  // 超困难加速20%
  } as Record<Difficulty, number>,
  
  // 蛇最大长度限制（防止占满地图）
  maxSnakeLength: 100,
  
  // 毒药最大叠加层数
  maxPoisonStack: 5,
  
  // 冰冻持续时间（毫秒）
  freezeDuration: 3000,
  
  // 关卡配置
  maxMajorLevel: 4,
  maxMinorLevel: 4,
  
  // 关卡递进难度增加系数
  levelSpeedFactor: 0.9, // 每关速度变为前一关的90%
  
  // 关卡加成倍数
  levelMultiplier: {
    1: 1,
    2: 1.5,
    3: 2,
    4: 2.5
  },
  
  // 难度加成倍数
  difficultyMultiplier: {
    normal: 1,
    hard: 1.5,
    superHard: 2
  },
  
  // 食物得分
  foodScores: {
    speed: { fast: 20, medium: 15, slow: 10 },
    size: { large: 30, medium: 20, small: 10 },
    color: 15
  },
  
  // 多食物生成配置
  minTotalFoods: 3,
  maxTotalFoods: 5,
  
  // 毒药刷新时间（毫秒）- 1分钟
  poisonRefreshTime: 60000
};

// ==================== 时间选项（秒） ====================
export const TIME_OPTIONS = [
  { label: '3分钟', value: 180 },
  { label: '4分钟', value: 240 },
  { label: '5分钟', value: 300 }
];

// ==================== 按键映射 ====================
export const KEYMAP = {
  player1: {
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right'
  },
  player2: {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  }
};
