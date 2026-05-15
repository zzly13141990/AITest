import { ref, reactive, onMounted, onUnmounted } from 'vue';
import {
  GameState,
  GameConfig,
  DEFAULT_GAME_CONFIG,
  PlayerControls,
  PLAYER_1_CONTROLS,
  PLAYER_2_CONTROLS,
  ItemType,
  ITEM_CONFIG
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
  checkCollision
} from '../utils/tetrisUtils';

interface PlayerState {
  id: number;
  name: string;
  gameState: GameState;
  controls: PlayerControls;
  isShaking: boolean;
}

interface UseBattleOptions {
  config?: GameConfig;
  onGameOver?: (winner: PlayerState, loser: PlayerState) => void;
  onLinesCleared?: (player: PlayerState, lines: number) => void;
  onItemActivated?: (sourcePlayer: PlayerState, item: ItemType, targetPlayer: PlayerState) => void;
}

export function useBattle(options: UseBattleOptions = {}) {
  const config = options.config || { ...DEFAULT_GAME_CONFIG, cellSize: 26 };
  
  // 创建两个响应式玩家
  const player1: PlayerState = reactive({
    id: 1,
    name: '玩家1',
    gameState: createInitialGameState(config),
    controls: PLAYER_1_CONTROLS,
    isShaking: false
  });
  
  const player2: PlayerState = reactive({
    id: 2,
    name: '玩家2',
    gameState: createInitialGameState(config),
    controls: PLAYER_2_CONTROLS,
    isShaking: false
  });
  
  const players = ref<[PlayerState, PlayerState]>([player1, player2]);
  const gameStarted = ref(false);
  const gameOver = ref(false);
  const dropTimers = ref<[number | null, number | null]>([null, null]);
  const lastDropTimes = ref<[number, number]>([0, 0]);
  
  // 初始化单个玩家
  function initPlayer(player: PlayerState) {
    player.gameState = createInitialGameState(config);
    player.gameState.nextBlock = createBlock(getRandomBlockType(), config);
    spawnNewBlock(player);
  }
  
  // 开始游戏
  function startGame() {
    players.value.forEach(player => {
      initPlayer(player);
      player.gameState.isPlaying = true;
    });
    gameStarted.value = true;
    gameOver.value = false;
    startDropTimers();
  }
  
  // 暂停/继续游戏
  function togglePause() {
    if (!gameStarted.value || gameOver.value) return;
    
    const isPaused = players.value[0].gameState.isPaused;
    players.value.forEach((player, index) => {
      player.gameState.isPaused = !isPaused;
      if (!isPaused) {
        lastDropTimes.value[index] = Date.now();
      }
    });
    
    if (isPaused) {
      // 原来是暂停状态，现在继续
      startDropTimers();
    } else {
      // 原来是运行状态，现在暂停
      stopDropTimers();
    }
  }
  
  // 为玩家生成新方块
  function spawnNewBlock(player: PlayerState) {
    if (!player.gameState.nextBlock) {
      player.gameState.nextBlock = createBlock(getRandomBlockType(), config);
    }
    
    player.gameState.currentBlock = player.gameState.nextBlock;
    player.gameState.nextBlock = createBlock(getRandomBlockType(), config);
    
    // 检查游戏结束
    if (checkCollision(player.gameState.currentBlock, player.gameState.grid, config)) {
      endGame(player);
    }
  }
  
  // 下落
  function drop(player: PlayerState) {
    if (!player.gameState.isPlaying || player.gameState.isPaused || player.gameState.isGameOver) return;
    if (!player.gameState.currentBlock) return;
    
    const newBlock = moveBlock(player.gameState.currentBlock, 0, 1, player.gameState.grid, config);
    
    if (newBlock.y === player.gameState.currentBlock.y) {
      // 无法下落，固定方块
      const { grid, items } = lockBlock(player.gameState.currentBlock, player.gameState.grid, config);
      player.gameState.grid = grid;
      
      // 触发震动
      triggerShake(player);
      
      // 检查消除行
      const { grid: clearedGrid, lines, items: lineItems } = clearLines(player.gameState.grid, config);
      
      if (lines > 0) {
        player.gameState.grid = clearedGrid;
        player.gameState.score += calculateScore(lines, player.gameState.level);
        player.gameState.lines += lines;
        player.gameState.level = calculateLevel(player.gameState.lines, config);
        player.gameState.combo++;
        
        // 回调
        options.onLinesCleared?.(player, lines);
        
        // 收集道具并作用于对方
        const allItems = [...items, ...lineItems];
        const otherPlayer = players.value.find(p => p.id !== player.id)!;
        allItems.forEach(item => {
          applyItemToPlayer(item, otherPlayer, player);
        });
      } else {
        player.gameState.combo = 0;
      }
      
      // 生成新方块
      spawnNewBlock(player);
    } else {
      player.gameState.currentBlock = newBlock;
    }
    
    const playerIndex = players.value.findIndex(p => p.id === player.id);
    lastDropTimes.value[playerIndex] = Date.now();
  }
  
  // 硬降
  function hardDrop(player: PlayerState) {
    if (!player.gameState.isPlaying || player.gameState.isPaused || player.gameState.isGameOver) return;
    if (!player.gameState.currentBlock) return;
    
    let ghostBlock = { ...player.gameState.currentBlock };
    while (!checkCollision({ ...ghostBlock, y: ghostBlock.y + 1 }, player.gameState.grid, config)) {
      ghostBlock.y++;
    }
    player.gameState.currentBlock = ghostBlock;
    drop(player);
  }
  
  // 向左移动
  function moveLeft(player: PlayerState) {
    if (!player.gameState.isPlaying || player.gameState.isPaused || player.gameState.isGameOver) return;
    if (!player.gameState.currentBlock) return;
    
    player.gameState.currentBlock = moveBlock(player.gameState.currentBlock, -1, 0, player.gameState.grid, config);
  }
  
  // 向右移动
  function moveRight(player: PlayerState) {
    if (!player.gameState.isPlaying || player.gameState.isPaused || player.gameState.isGameOver) return;
    if (!player.gameState.currentBlock) return;
    
    player.gameState.currentBlock = moveBlock(player.gameState.currentBlock, 1, 0, player.gameState.grid, config);
  }
  
  // 旋转
  function rotate(player: PlayerState) {
    if (!player.gameState.isPlaying || player.gameState.isPaused || player.gameState.isGameOver) return;
    if (!player.gameState.currentBlock) return;
    
    player.gameState.currentBlock = rotateBlock(player.gameState.currentBlock, player.gameState.grid, config);
  }
  
  // 应用道具效果到玩家
  function applyItemToPlayer(item: ItemType, targetPlayer: PlayerState, sourcePlayer: PlayerState) {
    const itemConfig = ITEM_CONFIG[item];
    
    if (itemConfig.duration > 0) {
      targetPlayer.gameState.activeItems[item] = Date.now() + itemConfig.duration;
    } else {
      // 即时效果
      if (item === ItemType.DROP) {
        hardDrop(targetPlayer);
      }
    }
    
    options.onItemActivated?.(sourcePlayer, item, targetPlayer);
  }
  
  // 触发震动
  function triggerShake(player: PlayerState) {
    player.isShaking = true;
    setTimeout(() => {
      player.isShaking = false;
    }, 100);
  }
  
  // 游戏结束
  function endGame(losingPlayer: PlayerState) {
    losingPlayer.gameState.isGameOver = true;
    losingPlayer.gameState.isPlaying = false;
    
    gameOver.value = true;
    stopDropTimers();
    
    const winningPlayer = players.value.find(p => p.id !== losingPlayer.id)!;
    options.onGameOver?.(winningPlayer, losingPlayer);
  }
  
  // 开始下落定时器
  function startDropTimers() {
    stopDropTimers();
    
    players.value.forEach((player, index) => {
      const tick = () => {
        const now = Date.now();
        const interval = getDropInterval(player.gameState.level, player.gameState.activeItems, config);
        if (now - lastDropTimes.value[index] >= interval) {
          drop(player);
        }
        if (!gameOver.value && !player.gameState.isPaused) {
          dropTimers.value[index] = requestAnimationFrame(tick);
        }
      };
      dropTimers.value[index] = requestAnimationFrame(tick);
      lastDropTimes.value[index] = Date.now();
    });
  }
  
  // 停止下落定时器
  function stopDropTimers() {
    dropTimers.value.forEach((timer, index) => {
      if (timer !== null) {
        cancelAnimationFrame(timer);
        dropTimers.value[index] = null;
      }
    });
  }
  
  // 键盘事件处理
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !gameStarted.value) {
      startGame();
      return;
    }
    
    if (event.key.toLowerCase() === 'p') {
      togglePause();
      return;
    }
    
    players.value.forEach(player => {
      const controls = player.controls;
      
      if (controls.left.includes(event.key)) {
        event.preventDefault();
        moveLeft(player);
      } else if (controls.right.includes(event.key)) {
        event.preventDefault();
        moveRight(player);
      } else if (controls.rotate.includes(event.key)) {
        event.preventDefault();
        rotate(player);
      } else if (controls.down.includes(event.key)) {
        event.preventDefault();
        drop(player);
      } else if (controls.drop.includes(event.key)) {
        event.preventDefault();
        hardDrop(player);
      }
    });
  }
  
  // 生命周期
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    stopDropTimers();
    window.removeEventListener('keydown', handleKeyDown);
  });
  
  return {
    players,
    config,
    gameStarted,
    gameOver,
    startGame,
    togglePause
  };
}
