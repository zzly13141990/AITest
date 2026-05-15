import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import {
  GameState,
  GameConfig,
  DEFAULT_GAME_CONFIG,
  PlayerControls,
  ItemType,
  ITEM_CONFIG,
  Achievement,
  ACHIEVEMENTS,
  RankRecord
} from '../types/tetris';
import {
  createInitialGameState,
  createBlock,
  getRandomBlockType,
  moveBlock,
  rotateBlock,
  lockBlock,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropInterval,
  getGhostBlock,
  checkCollision
} from '../utils/tetrisUtils';
import { saveAchievements, loadAchievements, saveRankRecord, checkAndUnlockAchievements } from '../utils/storageUtils';

interface UseTetrisOptions {
  config?: GameConfig;
  controls?: PlayerControls;
  onGameOver?: (state: GameState) => void;
  onLinesCleared?: (lines: number) => void;
  onItemActivated?: (item: ItemType) => void;
}

export function useTetris(options: UseTetrisOptions = {}) {
  const config = options.config || DEFAULT_GAME_CONFIG;
  const controls = options.controls;
  
  // 游戏状态
  const gameState = ref<GameState>(createInitialGameState(config));
  const dropTimer = ref<number | null>(null);
  const lastDropTime = ref<number>(0);
  const achievements = ref<Achievement[]>([]);
  const unlockedThisGame = ref<string[]>([]);
  
  // 动画状态
  const isShaking = ref(false);
  const clearingLines = ref<number[]>([]);
  
  // 获取当前下落间隔
  const currentDropInterval = computed(() => 
    getDropInterval(gameState.value.level, gameState.value.activeItems, config)
  );
  
  // 开始游戏
  const startGame = () => {
    gameState.value = createInitialGameState(config);
    gameState.value.isPlaying = true;
    unlockedThisGame.value = [];
    
    // 生成初始方块
    gameState.value.nextBlock = createBlock(getRandomBlockType(), config);
    spawnNewBlock();
    
    // 开始游戏循环
    lastDropTime.value = Date.now();
    startDropTimer();
    
    // 加载成就
    achievements.value = loadAchievements();
  };
  
  // 暂停游戏
  const togglePause = () => {
    if (!gameState.value.isPlaying || gameState.value.isGameOver) return;
    gameState.value.isPaused = !gameState.value.isPaused;
    
    if (gameState.value.isPaused) {
      stopDropTimer();
    } else {
      lastDropTime.value = Date.now();
      startDropTimer();
    }
  };
  
  // 生成新方块
  const spawnNewBlock = () => {
    if (!gameState.value.nextBlock) {
      gameState.value.nextBlock = createBlock(getRandomBlockType(), config);
    }
    
    gameState.value.currentBlock = gameState.value.nextBlock;
    gameState.value.nextBlock = createBlock(getRandomBlockType(), config);
    
    // 检查游戏结束
    if (checkCollision(gameState.value.currentBlock, gameState.value.grid, config)) {
      endGame();
    }
  };
  
  // 下落
  const drop = () => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) return;
    if (!gameState.value.currentBlock) return;
    
    const newBlock = moveBlock(gameState.value.currentBlock, 0, 1, gameState.value.grid, config);
    
    if (newBlock.y === gameState.value.currentBlock.y) {
      // 无法下落，固定方块
      const { grid, items } = lockBlock(gameState.value.currentBlock, gameState.value.grid, config);
      gameState.value.grid = grid;
      
      // 触发震动
      triggerShake();
      
      // 检查消除行
      const { grid: clearedGrid, lines, items: lineItems } = clearLines(gameState.value.grid, config);
      
      if (lines > 0) {
        gameState.value.grid = clearedGrid;
        gameState.value.score += calculateScore(lines, gameState.value.level);
        gameState.value.lines += lines;
        gameState.value.level = calculateLevel(gameState.value.lines, config);
        gameState.value.combo++;
        
        // 回调
        options.onLinesCleared?.(lines);
        
        // 收集道具
        const allItems = [...items, ...lineItems];
        allItems.forEach(item => {
          options.onItemActivated?.(item);
        });
      } else {
        gameState.value.combo = 0;
      }
      
      // 生成新方块
      spawnNewBlock();
    } else {
      gameState.value.currentBlock = newBlock;
    }
    
    lastDropTime.value = Date.now();
  };
  
  // 硬降（直接落底）
  const hardDrop = () => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) return;
    if (!gameState.value.currentBlock) return;
    
    const ghostBlock = getGhostBlock(gameState.value.currentBlock, gameState.value.grid, config);
    gameState.value.currentBlock = ghostBlock;
    drop();
  };
  
  // 向左移动
  const moveLeft = () => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) return;
    if (!gameState.value.currentBlock) return;
    
    gameState.value.currentBlock = moveBlock(gameState.value.currentBlock, -1, 0, gameState.value.grid, config);
  };
  
  // 向右移动
  const moveRight = () => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) return;
    if (!gameState.value.currentBlock) return;
    
    gameState.value.currentBlock = moveBlock(gameState.value.currentBlock, 1, 0, gameState.value.grid, config);
  };
  
  // 旋转
  const rotate = () => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) return;
    if (!gameState.value.currentBlock) return;
    
    gameState.value.currentBlock = rotateBlock(gameState.value.currentBlock, gameState.value.grid, config);
  };
  
  // 应用道具效果
  const applyItem = (item: ItemType, toSelf: boolean = true) => {
    const itemConfig = ITEM_CONFIG[item];
    const state = toSelf ? gameState : gameState; // 在双人模式中会区分
    
    if (itemConfig.duration > 0) {
      state.value.activeItems[item] = Date.now() + itemConfig.duration;
    } else {
      // 即时效果
      if (item === ItemType.DROP && toSelf) {
        hardDrop();
      }
    }
  };
  
  // 触发震动效果
  const triggerShake = () => {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, 100);
  };
  
  // 游戏结束
  const endGame = () => {
    gameState.value.isPlaying = false;
    gameState.value.isGameOver = true;
    stopDropTimer();
    
    // 检查成就
    const unlocked = checkAndUnlockAchievements(gameState.value);
    if (unlocked.length > 0) {
      unlockedThisGame.value = unlocked;
      achievements.value = loadAchievements();
    }
    
    // 保存排行记录
    const record: RankRecord = {
      id: Date.now().toString(),
      score: gameState.value.score,
      level: gameState.value.level,
      lines: gameState.value.lines,
      timestamp: Date.now(),
      mode: 'single'
    };
    saveRankRecord(record);
    
    // 回调
    options.onGameOver?.(gameState.value);
  };
  
  // 开始下落定时器
  const startDropTimer = () => {
    stopDropTimer();
    
    const tick = () => {
      const now = Date.now();
      if (now - lastDropTime.value >= currentDropInterval.value) {
        drop();
      }
      dropTimer.value = requestAnimationFrame(tick);
    };
    
    dropTimer.value = requestAnimationFrame(tick);
  };
  
  // 停止下落定时器
  const stopDropTimer = () => {
    if (dropTimer.value !== null) {
      cancelAnimationFrame(dropTimer.value);
      dropTimer.value = null;
    }
  };
  
  // 键盘事件处理
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!controls) return;
    
    // 全局控制
    if (e.key === 'Enter' && !gameState.value.isPlaying) {
      startGame();
      return;
    }
    
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }
    
    if (!gameState.value.isPlaying || gameState.value.isPaused) return;
    
    // 玩家控制
    if (controls.left.includes(e.key)) {
      e.preventDefault();
      moveLeft();
    } else if (controls.right.includes(e.key)) {
      e.preventDefault();
      moveRight();
    } else if (controls.rotate.includes(e.key)) {
      e.preventDefault();
      rotate();
    } else if (controls.down.includes(e.key)) {
      e.preventDefault();
      drop();
    } else if (controls.drop.includes(e.key)) {
      e.preventDefault();
      hardDrop();
    }
  };
  
  // 生命周期
  onMounted(() => {
    if (controls) {
      window.addEventListener('keydown', handleKeyDown);
    }
    achievements.value = loadAchievements();
  });
  
  onUnmounted(() => {
    stopDropTimer();
    if (controls) {
      window.removeEventListener('keydown', handleKeyDown);
    }
  });
  
  return {
    gameState,
    config,
    isShaking,
    achievements,
    unlockedThisGame,
    startGame,
    togglePause,
    drop,
    hardDrop,
    moveLeft,
    moveRight,
    rotate,
    applyItem
  };
}
