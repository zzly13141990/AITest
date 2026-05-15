import { Position, Snake, Food, FoodType, GameConfig, LevelInfo, Player, Difficulty, CustomMap } from './types';
import { COLORS, GAME_CONFIG } from './constants';

/**
 * 生成随机数
 */
export const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 检查位置是否在自定义地图的墙壁或障碍物上
 */
export const isPositionOnCustomMapObstacle = (pos: Position, customMap: CustomMap | null | undefined): boolean => {
  if (!customMap) return false;
  
  // 检查是否在墙壁上
  const onWall = customMap.walls.some(wall => wall.x === pos.x && wall.y === pos.y);
  // 检查是否在障碍物上
  const onObstacle = customMap.obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y);
  
  return onWall || onObstacle;
};

/**
 * 检查位置是否与蛇身冲突
 */
export const isPositionOnSnake = (pos: Position, snake: Snake): boolean => {
  return snake.positions.some(p => p.x === pos.x && p.y === pos.y);
};

/**
 * 检查位置是否与多个蛇身冲突
 */
export const isPositionOnAnySnake = (pos: Position, snakes: Snake[]): boolean => {
  return snakes.some(snake => isPositionOnSnake(pos, snake));
};

/**
 * 检查位置是否越界或在自定义地图的障碍物上
 */
export const isPositionOutOfBounds = (
  pos: Position, 
  gridWidth: number, 
  gridHeight: number,
  customMap?: CustomMap | null
): boolean => {
  // 如果有自定义地图，使用自定义地图的尺寸
  const effectiveWidth = customMap ? customMap.width : gridWidth;
  const effectiveHeight = customMap ? customMap.height : gridHeight;
  
  // 检查是否越界
  const outOfBounds = pos.x < 0 || pos.x >= effectiveWidth || pos.y < 0 || pos.y >= effectiveHeight;
  
  // 检查是否在自定义地图的障碍物上
  const onObstacle = isPositionOnCustomMapObstacle(pos, customMap);
  
  return outOfBounds || onObstacle;
};

/**
 * 获取所有空闲位置（不在蛇身上且不在自定义地图障碍物上的位置）
 */
export const getEmptyPositions = (
  gridWidth: number, 
  gridHeight: number, 
  snakes: Snake[],
  customMap?: CustomMap | null
): Position[] => {
  const emptyPositions: Position[] = [];
  
  // 如果有自定义地图，使用自定义地图的尺寸
  const effectiveWidth = customMap ? customMap.width : gridWidth;
  const effectiveHeight = customMap ? customMap.height : gridHeight;
  
  for (let x = 0; x < effectiveWidth; x++) {
    for (let y = 0; y < effectiveHeight; y++) {
      const pos = { x, y };
      if (
        !isPositionOnAnySnake(pos, snakes) && 
        !isPositionOnCustomMapObstacle(pos, customMap)
      ) {
        emptyPositions.push(pos);
      }
    }
  }
  
  return emptyPositions;
};

/**
 * 计算毒药出现概率
 */
const calculatePoisonChance = (level: LevelInfo, difficulty: string): number => {
  const baseChance = 0.1 + (parseInt(level.major.toString()) - 1) * 0.05 + (parseInt(level.minor.toString()) - 1) * 0.01;
  const maxChance = 0.3;
  const poisonChance = Math.min(baseChance, maxChance);
  
  // 根据难度调整
  if (difficulty === 'superHard') {
    return poisonChance * 1.5;
  } else if (difficulty === 'hard') {
    return poisonChance * 1.2;
  }
  
  return poisonChance;
};

/**
 * 选择食物类型
 */
const selectFoodType = (poisonChance: number): FoodType => {
  if (Math.random() < poisonChance) {
    return 'poison';
  }
  
  const allTypes: FoodType[] = ['speed', 'size', 'color', 'shield', 'phase', 'split', 'magnet', 'time', 'freeze', 'doubleScore'];
  return allTypes[random(0, allTypes.length - 1)];
};

/**
 * 确定食物的值和颜色
 */
const determineFoodValueAndColor = (type: FoodType): { value: any; color: string } => {
  switch (type) {
    case 'speed':
      return {
        value: GAME_CONFIG.speedLevels[random(0, 2)],
        color: COLORS.foodSpeed
      };
    case 'size':
      return {
        value: GAME_CONFIG.sizeLevels[random(0, 2)],
        color: COLORS.foodSize
      };
    case 'color':
      return {
        value: GAME_CONFIG.snakeColors[random(0, 2)],
        color: COLORS.foodColor
      };
    case 'poison':
      return {
        value: 'poison',
        color: COLORS.foodPoison
      };
    case 'shield':
      return {
        value: 'shield',
        color: COLORS.foodShield
      };
    case 'phase':
      return {
        value: 'phase',
        color: COLORS.foodPhase
      };
    case 'split':
      return {
        value: 'split',
        color: COLORS.foodSplit
      };
    case 'magnet':
      return {
        value: 'magnet',
        color: COLORS.foodMagnet
      };
    case 'time':
      return {
        value: 'time',
        color: COLORS.foodTime
      };
    case 'freeze':
      return {
        value: 'freeze',
        color: COLORS.foodFreeze
      };
    case 'doubleScore':
      return {
        value: 'doubleScore',
        color: COLORS.foodDoubleScore
      };
    default:
      return {
        value: 'medium',
        color: COLORS.foodSize
      };
  }
};

/**
 * 生成随机食物
 */
export const generateFood = (
  gridWidth: number, 
  gridHeight: number, 
  snakes: Snake[], 
  difficulty: string, 
  level: LevelInfo,
  customMap?: CustomMap | null
): Food => {
  // 获取所有空闲位置
  const emptyPositions = getEmptyPositions(gridWidth, gridHeight, snakes, customMap);
  const now = Date.now();
  
  // 如果没有空闲位置，返回无效食物（游戏会结束）
  if (emptyPositions.length === 0) {
    return {
      x: -1,
      y: -1,
      type: 'size' as FoodType,
      value: 'medium',
      color: COLORS.foodSize,
      createdAt: now
    };
  }
  
  // 从空闲位置中随机选择
  const randomIndex = random(0, emptyPositions.length - 1);
  const { x, y } = emptyPositions[randomIndex];
  
  // 计算毒药出现概率
  const poisonChance = calculatePoisonChance(level, difficulty);
  
  // 选择食物类型
  const type = selectFoodType(poisonChance);
  
  // 确定食物的值和颜色
  const { value, color } = determineFoodValueAndColor(type);
  
  return { x, y, type, value, color, createdAt: now };
};

/**
 * 初始化蛇
 */
export const initializeSnake = (gridWidth: number, gridHeight: number, baseSpeed: number): Snake => {
  const startX = Math.floor(gridWidth / 2);
  const startY = Math.floor(gridHeight / 2);
  
  const positions: Position[] = [];
  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    positions.push({ x: startX, y: startY + i });
  }
  
  return {
    positions,
    direction: 'up',
    nextDirection: 'up',
    speed: baseSpeed,
    baseSpeed,
    originalBaseSpeed: baseSpeed,
    color: COLORS.snakeDefault,
    poisonEffectTime: 0,
    poisonStackCount: 0,
    isDead: false,
    deathAnimationPhase: 0,
    shieldCount: 0,
    phaseCount: 0,
    magnetTime: 0,
    doubleScoreTime: 0,
    frozenTime: 0
  };
};

/**
 * 初始化玩家
 */
export const initializePlayer = (name: string, id: string): Player => ({
  id,
  name,
  score: 0,
  level: { major: 1, minor: 1 },
  survivalTime: 0,
  isAlive: true
});

/**
 * 格式化时间显示
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * 计算得分
 */
export const calculateScore = (foodType: string, foodValue: any, config: GameConfig, level: LevelInfo): number => {
  let baseScore = 0;
  
  if (foodType === 'speed' && GAME_CONFIG.foodScores.speed[foodValue as keyof typeof GAME_CONFIG.foodScores.speed]) {
    baseScore = GAME_CONFIG.foodScores.speed[foodValue as keyof typeof GAME_CONFIG.foodScores.speed];
  } else if (foodType === 'size' && GAME_CONFIG.foodScores.size[foodValue as keyof typeof GAME_CONFIG.foodScores.size]) {
    baseScore = GAME_CONFIG.foodScores.size[foodValue as keyof typeof GAME_CONFIG.foodScores.size];
  } else if (foodType === 'color') {
    baseScore = GAME_CONFIG.foodScores.color;
  } else if (['shield', 'phase', 'split', 'magnet', 'time', 'freeze', 'doubleScore'].includes(foodType)) {
    baseScore = 30; // 新食物固定30分
  }
  
  const levelMult = GAME_CONFIG.levelMultiplier[level.major as keyof typeof GAME_CONFIG.levelMultiplier] || 1;
  const difficultyMult = GAME_CONFIG.difficultyMultiplier[config.difficulty];
  
  return Math.floor(baseScore * levelMult * difficultyMult);
};

/**
 * 检查是否反向移动
 */
export const isOppositeDirection = (dir1: string, dir2: string): boolean => {
  return (
    (dir1 === 'up' && dir2 === 'down') ||
    (dir1 === 'down' && dir2 === 'up') ||
    (dir1 === 'left' && dir2 === 'right') ||
    (dir1 === 'right' && dir2 === 'left')
  );
};

/**
 * 检查是否完成所有关卡
 */
export const isAllLevelsCompleted = (level: LevelInfo): boolean => {
  return level.major >= GAME_CONFIG.maxMajorLevel && level.minor >= GAME_CONFIG.maxMinorLevel;
};

/**
 * 检查位置是否与现有食物冲突
 */
export const isPositionOnFood = (pos: Position, foods: Food[]): boolean => {
  return foods.some(food => food.x === pos.x && food.y === pos.y);
};

/**
 * 计算毒药食物数量
 */
export const calculatePoisonFoodCount = (difficulty: Difficulty, level: LevelInfo): number => {
  // 普通难度：基数1 + 每大关卡增加0.5个（向上取整）
  let poisonCount = Math.ceil(1 + (level.major - 1) * 0.5);
  
  // 困难难度：普通 +1
  if (difficulty === 'hard') {
    poisonCount += 1;
  }
  
  // 超困难：困难 +1
  if (difficulty === 'superHard') {
    poisonCount += 1;
  }
  
  return poisonCount;
};

/**
 * 生成单个食物
 */
export const generateSingleFood = (
  gridWidth: number,
  gridHeight: number,
  snakes: Snake[],
  existingFoods: Food[],
  foodType: FoodType,
  _difficulty: Difficulty,
  _level: LevelInfo,
  customMap?: CustomMap | null
): Food | null => {
  let emptyPositions = getEmptyPositions(gridWidth, gridHeight, snakes, customMap);
  
  // 排除已有食物的位置
  emptyPositions = emptyPositions.filter(pos => 
    !existingFoods.some(food => food.x === pos.x && food.y === pos.y)
  );
  
  if (emptyPositions.length === 0) {
    return null;
  }
  
  const randomIndex = random(0, emptyPositions.length - 1);
  const { x, y } = emptyPositions[randomIndex];
  
  let value;
  let color;
  const now = Date.now();
  
  if (foodType === 'poison') {
    value = 'poison';
    color = COLORS.foodPoison;
    return { x, y, type: foodType, value, color, createdAt: now };
  } else if (GAME_CONFIG.foodTypes.includes(foodType)) {
    // 如果是指定的食物类型
    switch (foodType) {
      case 'speed':
        value = GAME_CONFIG.speedLevels[random(0, 2)];
        color = COLORS.foodSpeed;
        break;
      case 'size':
        value = GAME_CONFIG.sizeLevels[random(0, 2)];
        color = COLORS.foodSize;
        break;
      case 'color':
        value = GAME_CONFIG.snakeColors[random(0, 2)];
        color = COLORS.foodColor;
        break;
      case 'shield':
        value = 'shield';
        color = COLORS.foodShield;
        break;
      case 'phase':
        value = 'phase';
        color = COLORS.foodPhase;
        break;
      case 'split':
        value = 'split';
        color = COLORS.foodSplit;
        break;
      case 'magnet':
        value = 'magnet';
        color = COLORS.foodMagnet;
        break;
      case 'time':
        value = 'time';
        color = COLORS.foodTime;
        break;
      case 'freeze':
        value = 'freeze';
        color = COLORS.foodFreeze;
        break;
      case 'doubleScore':
        value = 'doubleScore';
        color = COLORS.foodDoubleScore;
        break;
      default:
        value = 'medium';
        color = COLORS.foodSize;
    }
    return { x, y, type: foodType, value, color, createdAt: now };
  } else {
    // 如果不是指定类型，随机选择一种新食物
    const allTypes: FoodType[] = ['speed', 'size', 'color', 'shield', 'phase', 'split', 'magnet', 'time', 'freeze', 'doubleScore'];
    const type = allTypes[random(0, allTypes.length - 1)];
    
    switch (type) {
      case 'speed':
        value = GAME_CONFIG.speedLevels[random(0, 2)];
        color = COLORS.foodSpeed;
        break;
      case 'size':
        value = GAME_CONFIG.sizeLevels[random(0, 2)];
        color = COLORS.foodSize;
        break;
      case 'color':
        value = GAME_CONFIG.snakeColors[random(0, 2)];
        color = COLORS.foodColor;
        break;
      case 'shield':
        value = 'shield';
        color = COLORS.foodShield;
        break;
      case 'phase':
        value = 'phase';
        color = COLORS.foodPhase;
        break;
      case 'split':
        value = 'split';
        color = COLORS.foodSplit;
        break;
      case 'magnet':
        value = 'magnet';
        color = COLORS.foodMagnet;
        break;
      case 'time':
        value = 'time';
        color = COLORS.foodTime;
        break;
      case 'freeze':
        value = 'freeze';
        color = COLORS.foodFreeze;
        break;
      case 'doubleScore':
        value = 'doubleScore';
        color = COLORS.foodDoubleScore;
        break;
      default:
        value = 'medium';
        color = COLORS.foodSize;
    }
    
    return { x, y, type, value, color, createdAt: now };
  }
};

/**
 * 生成初始食物（普通食物1个 + 毒药按关卡固定数量）
 */
export const generateMultipleFoods = (
  gridWidth: number,
  gridHeight: number,
  snakes: Snake[],
  difficulty: Difficulty,
  level: LevelInfo,
  customMap?: CustomMap | null
): Food[] => {
  const foods: Food[] = [];
  let emptyPositions = getEmptyPositions(gridWidth, gridHeight, snakes, customMap);
  const now = Date.now();
  
  if (emptyPositions.length === 0) {
    return [];
  }
  
  // 生成1个新食物
  if (emptyPositions.length > 0) {
    const randomIndex = random(0, emptyPositions.length - 1);
    const { x, y } = emptyPositions[randomIndex];
    
    const allTypes: FoodType[] = ['speed', 'size', 'color', 'shield', 'phase', 'split', 'magnet', 'time', 'freeze', 'doubleScore'];
    const type = allTypes[random(0, allTypes.length - 1)];
    
    let value;
    let color;
    
    switch (type) {
      case 'speed':
        value = GAME_CONFIG.speedLevels[random(0, 2)];
        color = COLORS.foodSpeed;
        break;
      case 'size':
        value = GAME_CONFIG.sizeLevels[random(0, 2)];
        color = COLORS.foodSize;
        break;
      case 'color':
        value = GAME_CONFIG.snakeColors[random(0, 2)];
        color = COLORS.foodColor;
        break;
      case 'shield':
        value = 'shield';
        color = COLORS.foodShield;
        break;
      case 'phase':
        value = 'phase';
        color = COLORS.foodPhase;
        break;
      case 'split':
        value = 'split';
        color = COLORS.foodSplit;
        break;
      case 'magnet':
        value = 'magnet';
        color = COLORS.foodMagnet;
        break;
      case 'time':
        value = 'time';
        color = COLORS.foodTime;
        break;
      case 'freeze':
        value = 'freeze';
        color = COLORS.foodFreeze;
        break;
      case 'doubleScore':
        value = 'doubleScore';
        color = COLORS.foodDoubleScore;
        break;
      default:
        value = 'medium';
        color = COLORS.foodSize;
    }
    
    foods.push({ x, y, type, value, color, createdAt: now });
    emptyPositions.splice(randomIndex, 1);
  }
  
  // 生成毒药食物（按关卡和难度计算固定数量）
  const poisonFoodCount = calculatePoisonFoodCount(difficulty, level);
  
  for (let i = 0; i < poisonFoodCount && emptyPositions.length > 0; i++) {
    const randomIndex = random(0, emptyPositions.length - 1);
    const { x, y } = emptyPositions[randomIndex];
    
    foods.push({
      x,
      y,
      type: 'poison',
      value: 'poison',
      color: COLORS.foodPoison,
      createdAt: now
    });
    
    emptyPositions.splice(randomIndex, 1);
  }
  
  return foods;
};

/**
 * 进入下一关
 */
export const nextLevel = (currentLevel: LevelInfo): LevelInfo => {
  if (currentLevel.minor < GAME_CONFIG.maxMinorLevel) {
    return { ...currentLevel, minor: currentLevel.minor + 1 };
  } else if (currentLevel.major < GAME_CONFIG.maxMajorLevel) {
    return { major: currentLevel.major + 1, minor: 1 };
  }
  return currentLevel;
};
