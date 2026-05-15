import {
  BlockType,
  BLOCK_SHAPES,
  BLOCK_COLORS,
  Block,
  ItemType,
  GridCell,
  GameState,
  GameConfig,
  DEFAULT_GAME_CONFIG,
  SCORE_RULES
} from '../types/tetris';

/**
 * 生成随机方块类型
 */
export function getRandomBlockType(): BlockType {
  const types = Object.values(BlockType);
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 随机生成道具
 */
export function getRandomItem(): ItemType | undefined {
  // 15%概率生成道具
  if (Math.random() > 0.15) return undefined;
  const items = Object.values(ItemType);
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * 创建方块
 */
export function createBlock(type: BlockType, config: GameConfig = DEFAULT_GAME_CONFIG): Block {
  const shape = BLOCK_SHAPES[type];
  const x = Math.floor((config.gridWidth - shape[0].length) / 2);
  const y = 0;
  
  return {
    type,
    shape: [...shape.map(row => [...row])],
    x,
    y,
    color: BLOCK_COLORS[type],
    hasItem: getRandomItem()
  };
}

/**
 * 旋转方块形状
 */
export function rotateShape(shape: number[][]): number[][] {
  const n = shape.length;
  const rotated: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    rotated[i] = [];
    for (let j = 0; j < n; j++) {
      rotated[i][j] = shape[n - 1 - j][i];
    }
  }
  
  return rotated;
}

/**
 * 检查碰撞
 */
export function checkCollision(
  block: Block,
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): boolean {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x]) {
        const newX = block.x + x;
        const newY = block.y + y;
        
        // 边界检查
        if (newX < 0 || newX >= config.gridWidth || newY >= config.gridHeight) {
          return true;
        }
        
        // 已填充格子检查
        if (newY >= 0 && grid[newY][newX].filled) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 移动方块
 */
export function moveBlock(
  block: Block,
  dx: number,
  dy: number,
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): Block {
  const newBlock: Block = {
    ...block,
    x: block.x + dx,
    y: block.y + dy,
    shape: [...block.shape.map(row => [...row])]
  };
  
  if (checkCollision(newBlock, grid, config)) {
    return block;
  }
  
  return newBlock;
}

/**
 * 旋转方块
 */
export function rotateBlock(
  block: Block,
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): Block {
  // O型方块不旋转
  if (block.type === BlockType.O) {
    return block;
  }
  
  const newBlock: Block = {
    ...block,
    shape: rotateShape(block.shape)
  };
  
  // 尝试旋转，如果碰撞则尝试微调位置（墙踢）
  if (!checkCollision(newBlock, grid, config)) {
    return newBlock;
  }
  
  // 简单的墙踢：尝试向左、右移动
  const kicks = [-1, 1, -2, 2];
  for (const kick of kicks) {
    const kickedBlock = { ...newBlock, x: newBlock.x + kick };
    if (!checkCollision(kickedBlock, grid, config)) {
      return kickedBlock;
    }
  }
  
  return block;
}

/**
 * 将方块固定到网格
 */
export function lockBlock(
  block: Block,
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): { grid: GridCell[][]; items: ItemType[] } {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const items: ItemType[] = [];
  
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x]) {
        const gridY = block.y + y;
        const gridX = block.x + x;
        if (gridY >= 0 && gridY < config.gridHeight && gridX >= 0 && gridX < config.gridWidth) {
          newGrid[gridY][gridX] = {
            filled: true,
            color: block.color,
            hasItem: block.hasItem
          };
          if (block.hasItem) {
            items.push(block.hasItem);
          }
        }
      }
    }
  }
  
  return { grid: newGrid, items };
}

/**
 * 检查并消除完整的行
 */
export function clearLines(
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): { grid: GridCell[][]; lines: number; items: ItemType[] } {
  const newGrid: GridCell[][] = [];
  let linesCleared = 0;
  const items: ItemType[] = [];
  
  for (let y = config.gridHeight - 1; y >= 0; y--) {
    const isComplete = grid[y].every(cell => cell.filled);
    
    if (isComplete) {
      linesCleared++;
      // 收集道具
      grid[y].forEach(cell => {
        if (cell.hasItem) {
          items.push(cell.hasItem);
        }
      });
    } else {
      newGrid.unshift([...grid[y].map(cell => ({ ...cell }))]);
    }
  }
  
  // 在顶部添加空行
  while (newGrid.length < config.gridHeight) {
    newGrid.unshift(
      Array.from({ length: config.gridWidth }, () => ({ filled: false }))
    );
  }
  
  return { grid: newGrid, lines: linesCleared, items };
}

/**
 * 计算分数
 */
export function calculateScore(lines: number, level: number): number {
  const baseScore = SCORE_RULES[lines as keyof typeof SCORE_RULES] || 0;
  return baseScore * level;
}

/**
 * 计算等级
 */
export function calculateLevel(lines: number, config: GameConfig = DEFAULT_GAME_CONFIG): number {
  return Math.min(Math.floor(lines / config.levelUpLines) + 1, config.maxLevel);
}

/**
 * 初始化空网格
 */
export function createEmptyGrid(config: GameConfig = DEFAULT_GAME_CONFIG): GridCell[][] {
  return Array.from({ length: config.gridHeight }, () =>
    Array.from({ length: config.gridWidth }, () => ({ filled: false }))
  );
}

/**
 * 初始化游戏状态
 */
export function createInitialGameState(config: GameConfig = DEFAULT_GAME_CONFIG): GameState {
  return {
    grid: createEmptyGrid(config),
    currentBlock: null,
    nextBlock: null,
    score: 0,
    level: 1,
    lines: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    combo: 0,
    activeItems: {}
  };
}

/**
 * 获取下落间隔（根据等级调整）
 */
export function getDropInterval(
  level: number,
  activeItems: { [key in ItemType]?: number } = {},
  config: GameConfig = DEFAULT_GAME_CONFIG
): number {
  let interval = config.baseDropInterval * Math.pow(0.8, level - 1);
  
  // 道具效果
  const now = Date.now();
  if (activeItems[ItemType.SPEED_UP] && activeItems[ItemType.SPEED_UP]! > now) {
    interval *= 0.5;
  }
  if (activeItems[ItemType.SPEED_DOWN] && activeItems[ItemType.SPEED_DOWN]! > now) {
    interval *= 2;
  }
  
  return Math.max(100, interval);
}

/**
 * 获取幽灵方块位置（直接落底的预览位置）
 */
export function getGhostBlock(
  block: Block,
  grid: GridCell[][],
  config: GameConfig = DEFAULT_GAME_CONFIG
): Block {
  let ghostBlock = { ...block };
  
  while (!checkCollision({ ...ghostBlock, y: ghostBlock.y + 1 }, grid, config)) {
    ghostBlock.y++;
  }
  
  return ghostBlock;
}
