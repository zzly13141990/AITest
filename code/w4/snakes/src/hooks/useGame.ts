import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameConfig,
  GameStatus,
  Snake,
  Food,
  Player,
  Direction,
  MAJOR_LEVEL_SCORE_REQUIREMENTS,
  Effect,
  EffectType,
  EFFECT_CONFIGS
} from '../types';
import {
  initializeSnake,
  initializePlayer,
  generateMultipleFoods,
  generateSingleFood,
  getEmptyPositions,
  isPositionOutOfBounds,
  isPositionOnSnake,
  isOppositeDirection,
  calculateScore,
  nextLevel,
  isAllLevelsCompleted
} from '../utils';
import { GAME_CONFIG, KEYMAP } from '../constants';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';

interface UseGameReturn {
  gameStatus: GameStatus;
  config: GameConfig | null;
  players: Player[];
  snakes: Snake[];
  foods: Food[][];
  effects: Effect[][];
  remainingTime: number;
  startGame: (config: GameConfig) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  goToConfig: () => void;
  setDirection: (playerIndex: number, direction: Direction) => void;
  isWin: boolean;
  // 新增状态用于双人左右分屏
  isDoubleMode: boolean;
  // 新增追踪成就解锁 - 包含完整成就信息
  recentlyUnlockedAchievements: Array<{ id: string; name: string; description: string; icon: string }>;
}

export const useGame = (): UseGameReturn => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('config');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [foods, setFoods] = useState<Food[][]>([]);
  const [effects, setEffects] = useState<Effect[][]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const [recentlyUnlockedAchievements, setRecentlyUnlockedAchievements] = useState<
    Array<{ id: string; name: string; description: string; icon: string }>
  >([]);

  // Refs for game loop
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const totalSurvivalTimeRef = useRef<number[]>([]);
  const pauseStartTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(0);
  const poisonEatenCountRef = useRef<number[]>([]); // 追踪吃毒药次数
  const colorFoodsEatenRef = useRef<Set<string>[]>([]); // 追踪颜色食物收集
  
  // 使用 ref 来管理游戏状态
  const gameDataRef = useRef<{
    players: Player[];
    snakes: Snake[];
    foods: Food[][];
    config: GameConfig | null;
    gameStatus: GameStatus;
  }>({
    players: [],
    snakes: [],
    foods: [],
    config: null,
    gameStatus: 'config'
  });
  
  // 使用 ref 保存 gameLoop 避免依赖问题
  const gameLoopRefFunc = useRef<(timestamp: number) => void>();

  // 同步状态到 ref
  useEffect(() => {
    gameDataRef.current.players = players;
  }, [players]);
  useEffect(() => {
    gameDataRef.current.snakes = snakes;
  }, [snakes]);
  useEffect(() => {
    gameDataRef.current.foods = foods;
  }, [foods]);
  useEffect(() => {
    gameDataRef.current.config = config;
  }, [config]);
  useEffect(() => {
    gameDataRef.current.gameStatus = gameStatus;
  }, [gameStatus]);
  useEffect(() => {
    remainingTimeRef.current = remainingTime;
  }, [remainingTime]);

  // 初始化游戏
  const initializeGame = useCallback((gameConfig: GameConfig) => {
    const isDouble = gameConfig.mode === 'double';
    const playerCount = isDouble ? 2 : 1;

    const newPlayers: Player[] = [];
    const newSnakes: Snake[] = [];
    const newFoods: Food[][] = [];
    const newEffects: Effect[][] = [];

    const baseSpeed = GAME_CONFIG.difficultySpeedMap[gameConfig.difficulty];
    // 如果有自定义地图，使用自定义地图的尺寸，否则使用默认尺寸
    const gridWidth = gameConfig.customMap 
      ? gameConfig.customMap.width 
      : (isDouble ? GAME_CONFIG.doubleGridWidth : GAME_CONFIG.singleGridWidth);
    const gridHeight = gameConfig.customMap 
      ? gameConfig.customMap.height 
      : (isDouble ? GAME_CONFIG.doubleGridHeight : GAME_CONFIG.singleGridHeight);

    for (let i = 0; i < playerCount; i++) {
      const name = i === 0 ? gameConfig.player1Name : gameConfig.player2Name;
      newPlayers.push(initializePlayer(name, `player${i + 1}`));
      const snake = initializeSnake(gridWidth, gridHeight, baseSpeed);
      newSnakes.push({
        ...snake,
        isDead: false,
        deathAnimationPhase: 0,
        shieldCount: 0,
        phaseCount: 0,
        magnetTime: 0,
        doubleScoreTime: 0,
        frozenTime: 0
      });
      newEffects.push([]);
    }
    for (let i = 0; i < playerCount; i++) {
      newFoods.push(generateMultipleFoods(
        gridWidth, 
        gridHeight, 
        [newSnakes[i]], 
        gameConfig.difficulty, 
        newPlayers[i].level,
        gameConfig.customMap
      ));
    }

    setPlayers(newPlayers);
    setSnakes(newSnakes);
    setFoods(newFoods as any);
    setEffects(newEffects);
    setRemainingTime(gameConfig.levelTime);
    remainingTimeRef.current = gameConfig.levelTime;
    setIsWin(false);
    lastMoveTimeRef.current = new Array(playerCount).fill(0);
    lastTimeRef.current = 0;
    totalSurvivalTimeRef.current = new Array(playerCount).fill(0);
    poisonEatenCountRef.current = new Array(playerCount).fill(0);
    colorFoodsEatenRef.current = new Array(playerCount).fill(null).map(() => new Set());
    pauseStartTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    
    // 同时更新 ref
    gameDataRef.current.players = newPlayers;
    gameDataRef.current.snakes = newSnakes;
    gameDataRef.current.foods = newFoods as any;
    gameDataRef.current.config = gameConfig;
  }, []);

  // 解锁成就函数
  const unlockAchievement = useCallback(async (achievementId: string) => {
    try {
      const achievements = await storageService.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.unlocked) {
        await storageService.updateAchievement(achievementId, { unlocked: true, unlockedAt: Date.now() });
        audioService.playAchievementUnlock();
        // 保存完整成就信息
        setRecentlyUnlockedAchievements(prev => [
          ...prev,
          {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon
          }
        ]);
        setTimeout(() => {
          setRecentlyUnlockedAchievements(prev => prev.filter(a => a.id !== achievementId));
        }, 3000);
      }
    } catch (e) {
      console.error('Failed to unlock achievement:', e);
    }
  }, []);

  // 更新成就进度
  const updateAchievementProgress = useCallback(async (achievementId: string, progress: number) => {
    try {
      const achievements = await storageService.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.unlocked) {
        const newProgress = Math.max(achievement.progress || 0, progress);
        await storageService.updateAchievement(achievementId, { progress: newProgress });
        if (achievement.target && newProgress >= achievement.target) {
          await unlockAchievement(achievementId);
        }
      }
    } catch (e) {
      console.error('Failed to update achievement progress:', e);
    }
  }, [unlockAchievement]);

  // 创建特效
  const createEffect = useCallback((playerIndex: number, x: number, y: number, type: EffectType, timestamp: number) => {
    const config = EFFECT_CONFIGS[type];
    const newEffect: Effect = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      startTime: timestamp,
      duration: config.duration,
      color: config.color
    };
    
    setEffects(prev => {
      const newEffects = [...prev];
      newEffects[playerIndex] = [...(newEffects[playerIndex] || []), newEffect];
      return newEffects;
    });
  }, []);

  const startGame = useCallback((gameConfig: GameConfig) => {
    setConfig(gameConfig);
    gameDataRef.current.config = gameConfig;
    initializeGame(gameConfig);
    
    // 使用配置的音频设置，如果没有提供则从存储加载
    if (gameConfig.audio) {
      audioService.setConfig(
        gameConfig.audio.musicEnabled,
        gameConfig.audio.soundEnabled,
        gameConfig.audio.volume
      );
    } else {
      // 从存储加载默认配置
      storageService.getAudioConfig().then(audioConfig => {
        audioService.setConfig(
          audioConfig.musicEnabled,
          audioConfig.soundEnabled,
          audioConfig.volume
        );
      });
    }
    
    setTimeout(() => {
      setGameStatus('playing');
      gameDataRef.current.gameStatus = 'playing';
    }, 0);
  }, [initializeGame]);

  const pauseGame = useCallback(() => {
    pauseStartTimeRef.current = performance.now();
    setGameStatus('paused');
    gameDataRef.current.gameStatus = 'paused';
  }, []);

  const resumeGame = useCallback(() => {
    const pauseDuration = performance.now() - pauseStartTimeRef.current;
    totalPausedTimeRef.current += pauseDuration;
    lastTimeRef.current = 0;
    setGameStatus('playing');
    gameDataRef.current.gameStatus = 'playing';
  }, []);

  const restartGame = useCallback(() => {
    if (config) {
      initializeGame(config);
      setGameStatus('playing');
      gameDataRef.current.gameStatus = 'playing';
    }
  }, [config, initializeGame]);

  const goToConfig = useCallback(() => {
    setGameStatus('config');
    setConfig(null);
    gameDataRef.current.gameStatus = 'config';
    gameDataRef.current.config = null;
  }, []);

  const setDirection = useCallback((playerIndex: number, direction: Direction) => {
    const currentSnakes = gameDataRef.current.snakes;
    if (currentSnakes[playerIndex] && !isOppositeDirection(currentSnakes[playerIndex].direction, direction)) {
      const newSnakes = [...currentSnakes];
      newSnakes[playerIndex] = { ...newSnakes[playerIndex], nextDirection: direction };
      setSnakes(newSnakes);
      gameDataRef.current.snakes = newSnakes;
    }
  }, []);

  // 检查并解锁成就
  const checkAchievements = useCallback(async (player: Player, config: GameConfig) => {
    if (player.score >= 1000) unlockAchievement('score_1000');
    if (player.score >= 3000) unlockAchievement('score_3000');
    if (player.survivalTime >= 600) unlockAchievement('survive_10min');
    if (isAllLevelsCompleted(player.level)) unlockAchievement('complete_all_levels');
    if (config.mode === 'double') unlockAchievement('double_player');
    if (config.difficulty === 'superHard') unlockAchievement('super_hard_win');
  }, [unlockAchievement]);

  // 保存玩家记录
  const savePlayerRecord = useCallback(async (player: Player, config: GameConfig, index: number) => {
    if (player.score > 0) {
      const record = {
        id: `${Date.now()}-${index}`,
        playerName: player.name,
        score: player.score,
        survivalTime: player.survivalTime,
        level: player.level,
        mode: config.mode,
        difficulty: config.difficulty,
        createdAt: Date.now()
      };
      await storageService.addLeaderboardRecord(record);
    }
  }, []);

  // 游戏结束时保存记录
  const handleGameEnd = useCallback(async (finalPlayers: Player[], finalConfig: GameConfig) => {
    // 解锁初出茅庐成就
    unlockAchievement('first_game');
    
    // 保存每个玩家的记录
    for (let i = 0; i < finalPlayers.length; i++) {
      const player = finalPlayers[i];
      await savePlayerRecord(player, finalConfig, i);
      await checkAchievements(player, finalConfig);
    }
  }, [unlockAchievement, savePlayerRecord, checkAchievements]);

  // 提取网格尺寸计算
  const getGridDimensions = useCallback((config: GameConfig) => {
    const isDouble = config.mode === 'double';
    return {
      width: config.customMap?.width || (isDouble ? GAME_CONFIG.doubleGridWidth : GAME_CONFIG.singleGridWidth),
      height: config.customMap?.height || (isDouble ? GAME_CONFIG.doubleGridHeight : GAME_CONFIG.singleGridHeight)
    };
  }, []);

  // 更新剩余时间
  const updateRemainingTime = useCallback((deltaTime: number) => {
    let newTime = remainingTimeRef.current - deltaTime / 1000;
    if (newTime <= 0) {
      // 进入下一关逻辑将单独提取
      setRemainingTime(newTime);
      remainingTimeRef.current = newTime;
    }
  }, []);

  // 游戏循环
  const gameLoop = useCallback((timestamp: number) => {
    const { config: currentConfig, gameStatus: currentGameStatus, players: currentPlayers, snakes: currentSnakes, foods: currentFoods } = gameDataRef.current;
    
    if (!currentConfig || currentGameStatus !== 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const { width: gridWidth, height: gridHeight } = getGridDimensions(currentConfig);

    const allSnakes = currentSnakes.filter(s => s.positions.length > 0 && !s.isDead);
    const emptyPositions = getEmptyPositions(gridWidth, gridHeight, allSnakes, currentConfig.customMap);
    
    if (emptyPositions.length === 0) {
      setGameStatus('ended');
      gameDataRef.current.gameStatus = 'ended';
      handleGameEnd(currentPlayers, currentConfig);
      return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    } else {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 更新剩余时间
      let newTime = remainingTimeRef.current - deltaTime / 1000;
      if (newTime <= 0) {
        // 进入下一关
        const newPlayers = currentPlayers.map(player => {
          if (player.isAlive) {
            // 检查大关卡分数条件
            const currentMajorLevel = Math.floor(player.level.major);
            const scoreRequirement = MAJOR_LEVEL_SCORE_REQUIREMENTS[currentMajorLevel];
            
            // 只有满足分数要求才能进入下一关
            if (scoreRequirement && player.score >= scoreRequirement) {
              const newLevel = nextLevel(player.level);
              if (isAllLevelsCompleted(newLevel)) {
                setIsWin(true);
                setGameStatus('ended');
                gameDataRef.current.gameStatus = 'ended';
                handleGameEnd(currentPlayers, currentConfig);
              }
              audioService.playLevelUp();
              return { ...player, level: newLevel };
            } else if (!scoreRequirement) {
              // 没有分数要求时正常通关
              const newLevel = nextLevel(player.level);
              if (isAllLevelsCompleted(newLevel)) {
                setIsWin(true);
                setGameStatus('ended');
                gameDataRef.current.gameStatus = 'ended';
                handleGameEnd(currentPlayers, currentConfig);
              }
              audioService.playLevelUp();
              return { ...player, level: newLevel };
            }
          }
          return player;
        });
        
        // 更新蛇的速度
        const newSnakes = currentSnakes.map((snake, index) => {
          if (currentPlayers[index]?.isAlive && !snake.isDead) {
            const newBaseSpeed = Math.floor(snake.baseSpeed * GAME_CONFIG.levelSpeedFactor);
            return {
              ...snake,
              baseSpeed: newBaseSpeed,
              originalBaseSpeed: newBaseSpeed,
              speed: snake.poisonEffectTime > 0
                ? newBaseSpeed * Math.pow(GAME_CONFIG.poisonSpeedFactors[currentConfig.difficulty], snake.poisonStackCount)
                : newBaseSpeed
            };
          }
          return snake;
        });
        
        setPlayers(newPlayers);
        setSnakes(newSnakes);
        gameDataRef.current.players = newPlayers;
        gameDataRef.current.snakes = newSnakes;
        
        setRemainingTime(currentConfig.levelTime);
        remainingTimeRef.current = currentConfig.levelTime;
      } else {
        setRemainingTime(newTime);
        remainingTimeRef.current = newTime;
      }

      // 更新玩家存活时间
      const updatedPlayers = currentPlayers.map((player, i) => {
        if (player.isAlive) {
          totalSurvivalTimeRef.current[i] += deltaTime / 1000;
          return { ...player, survivalTime: Math.floor(totalSurvivalTimeRef.current[i]) };
        }
        return player;
      });
      
      setPlayers(updatedPlayers);
      gameDataRef.current.players = updatedPlayers;

      // 更新蛇
      let updatedSnakes = [...currentSnakes];
      let updatedFoods = [...(currentFoods as any)];
      let needsUpdate = false;
      let foodRefreshNeeded = false;

      // 刷新过期的毒药食物（普通函数，不是hook）
      const refreshPoisonFoods = (timestamp: number, currentConfig: GameConfig, currentSnakes: Snake[], currentPlayers: Player[], updatedFoods: Food[][]) => {
        let refreshNeeded = false;
        const now = timestamp;
        
        updatedFoods.forEach((playerFoods, playerIndex) => {
          if (!playerFoods || !Array.isArray(playerFoods)) return;
          
          for (let i = 0; i < playerFoods.length; i++) {
            const food = playerFoods[i];
            if (food && food.type === 'poison' && food.createdAt && (now - food.createdAt >= GAME_CONFIG.poisonRefreshTime)) {
              // 计算网格尺寸
              const isDouble = currentConfig.mode === 'double';
              const gridWidth = currentConfig.customMap?.width || (isDouble ? GAME_CONFIG.doubleGridWidth : GAME_CONFIG.singleGridWidth);
              const gridHeight = currentConfig.customMap?.height || (isDouble ? GAME_CONFIG.doubleGridHeight : GAME_CONFIG.singleGridHeight);
              
              const allSnakes = currentSnakes.filter(s => s.positions.length > 0 && !s.isDead);
              
              const otherFoods = playerFoods.filter((_, idx) => idx !== i);
              
              const newFood = generateSingleFood(
                gridWidth, 
                gridHeight, 
                allSnakes, 
                otherFoods,
                'poison', 
                currentConfig.difficulty, 
                currentPlayers[playerIndex].level,
                currentConfig.customMap
              );
              
              if (newFood) {
                playerFoods[i] = newFood;
                refreshNeeded = true;
              }
            }
          }
        });
        
        return refreshNeeded;
      };

      // 刷新过期的毒药食物
      const refreshNeeded = refreshPoisonFoods(timestamp, currentConfig, currentSnakes, currentPlayers, updatedFoods);
      if (refreshNeeded) {
        foodRefreshNeeded = true;
      }

      currentSnakes.forEach((snake, index) => {
        const isDouble = currentConfig.mode === 'double';
        if (!currentPlayers[index]?.isAlive || snake.isDead) {
          // 处理死亡动画
          if (snake.isDead && snake.deathAnimationPhase < 3) {
            updatedSnakes[index] = {
              ...snake,
              deathAnimationPhase: snake.deathAnimationPhase + deltaTime / 200
            };
            needsUpdate = true;
          }
          return;
        }

        // 处理特殊效果时间
        let newPoisonEffectTime = Math.max(0, snake.poisonEffectTime - deltaTime);
        let newPoisonStackCount = snake.poisonStackCount;
        let newBaseSpeed = snake.baseSpeed;
        let originalBaseSpeed = snake.originalBaseSpeed;
        let newShieldCount = snake.shieldCount;
        let newPhaseCount = snake.phaseCount;
        let newMagnetTime = Math.max(0, snake.magnetTime - deltaTime);
        let newDoubleScoreTime = Math.max(0, snake.doubleScoreTime - deltaTime);
        let newFrozenTime = Math.max(0, snake.frozenTime - deltaTime);
        
        // 检查毒药效果是否结束
        if (newPoisonEffectTime === 0 && snake.poisonEffectTime > 0) {
          newPoisonStackCount = 0;
          newBaseSpeed = originalBaseSpeed;
        }
        
        // 获取难度相关的毒药加速因子
        const poisonSpeedFactor = GAME_CONFIG.poisonSpeedFactors[currentConfig.difficulty];
        
        // 计算当前速度（考虑叠加层）
        let currentSpeed = newBaseSpeed;
        if (newPoisonEffectTime > 0) {
          currentSpeed = newBaseSpeed * Math.pow(poisonSpeedFactor, newPoisonStackCount);
        }
        
        // 如果被冰冻，不移动
        if (newFrozenTime > 0) {
          updatedSnakes[index] = {
            ...snake,
            poisonEffectTime: newPoisonEffectTime,
            poisonStackCount: newPoisonStackCount,
            baseSpeed: newBaseSpeed,
            originalBaseSpeed: originalBaseSpeed,
            speed: currentSpeed,
            shieldCount: newShieldCount,
            phaseCount: newPhaseCount,
            magnetTime: newMagnetTime,
            doubleScoreTime: newDoubleScoreTime,
            frozenTime: newFrozenTime
          };
          return;
        }

        if (lastMoveTimeRef.current[index] === 0) {
          lastMoveTimeRef.current[index] = timestamp;
        }

        if (timestamp - lastMoveTimeRef.current[index] >= currentSpeed) {
          lastMoveTimeRef.current[index] = timestamp;
          needsUpdate = true;

          const newDirection = snake.nextDirection;
          const head = snake.positions[0];
          let newHead = { ...head };
          
          switch (newDirection) {
            case 'up': newHead.y -= 1; break;
            case 'down': newHead.y += 1; break;
            case 'left': newHead.x -= 1; break;
            case 'right': newHead.x += 1; break;
          }

          // 检查碰撞
          let hitWall = isPositionOutOfBounds(newHead, gridWidth, gridHeight, currentConfig.customMap);
          const hitSelf = isPositionOnSnake(newHead, { ...snake, positions: snake.positions.slice(0, -1) });
          
          let hitOther = false;
          if (isDouble) {
            const otherSnake = currentSnakes[1 - index];
            if (otherSnake && !otherSnake.isDead && isPositionOnSnake(newHead, otherSnake)) {
              hitOther = true;
            }
          }

          // 处理穿越墙壁
          if (hitWall && newPhaseCount > 0) {
            hitWall = false;
            newPhaseCount--;
            if (newHead.x < 0) newHead.x = gridWidth - 1;
            else if (newHead.x >= gridWidth) newHead.x = 0;
            else if (newHead.y < 0) newHead.y = gridHeight - 1;
            else if (newHead.y >= gridHeight) newHead.y = 0;
          }

          if (hitWall || hitSelf || hitOther) {
            if (newShieldCount > 0) {
              // 使用护盾抵消死亡
              newShieldCount--;
              audioService.playEatFood();
            } else {
              // 玩家死亡
              audioService.playDeath();
              
              updatedSnakes[index] = {
                ...snake,
                isDead: true,
                deathAnimationPhase: 0,
                poisonEffectTime: newPoisonEffectTime,
                poisonStackCount: newPoisonStackCount,
                shieldCount: newShieldCount,
                phaseCount: newPhaseCount,
                magnetTime: newMagnetTime,
                doubleScoreTime: newDoubleScoreTime,
                frozenTime: newFrozenTime
              };
              
              const deadPlayers = updatedPlayers.map((p, i) => {
                if (i === index) {
                  return { ...p, isAlive: false };
                }
                return p;
              });
              
              const allDead = deadPlayers.every(p => !p.isAlive);
              if (allDead) {
                setGameStatus('ended');
                gameDataRef.current.gameStatus = 'ended';
                handleGameEnd(deadPlayers, currentConfig);
              }
              
              setPlayers(deadPlayers);
              gameDataRef.current.players = deadPlayers;
              return;
            }
          }

          // 检查是否吃到任何食物
          const currentPlayerFoods = updatedFoods[index] || [];
          let ateFoodIndex = -1;
          let growth = 1;
          const isPoisonActive = newPoisonEffectTime > 0;
          let eatenFoodType: string | undefined;
          
          for (let i = 0; i < currentPlayerFoods.length; i++) {
            const food = currentPlayerFoods[i];
            if (food && newHead.x === food.x && newHead.y === food.y) {
              ateFoodIndex = i;
              break;
            }
          }
          
          if (ateFoodIndex >= 0) {
            const food = currentPlayerFoods[ateFoodIndex];
            eatenFoodType = food.type;
            audioService.playEatFood();
            
            // 根据食物类型触发特效
            let effectType: EffectType = 'collect';
            switch (food.type) {
              case 'speed':
                const speedFromFood = GAME_CONFIG.speedMap[food.value as keyof typeof GAME_CONFIG.speedMap];
                originalBaseSpeed = speedFromFood;
                newBaseSpeed = speedFromFood;
                if (newPoisonEffectTime > 0) {
                  currentSpeed = newBaseSpeed * Math.pow(poisonSpeedFactor, newPoisonStackCount);
                }
                effectType = 'speed';
                break;
              case 'size':
                growth = GAME_CONFIG.sizeGrowthMap[food.value as keyof typeof GAME_CONFIG.sizeGrowthMap];
                break;
              case 'color':
                updatedSnakes[index] = { ...updatedSnakes[index], color: food.value as string };
                colorFoodsEatenRef.current[index].add(food.value as string);
                if (colorFoodsEatenRef.current[index].size >= 3) {
                  unlockAchievement('collect_all_colors');
                }
                break;
              case 'poison':
                newPoisonEffectTime = GAME_CONFIG.poisonDuration;
                // 限制毒药叠加层数
                if (newPoisonStackCount < GAME_CONFIG.maxPoisonStack) {
                  newPoisonStackCount += 1;
                }
                if (snake.poisonStackCount === 0) {
                  originalBaseSpeed = snake.baseSpeed;
                }
                currentSpeed = newBaseSpeed * Math.pow(poisonSpeedFactor, newPoisonStackCount);
                poisonEatenCountRef.current[index]++;
                updateAchievementProgress('poison_master', poisonEatenCountRef.current[index]);
                updateAchievementProgress('speed_demon', newPoisonStackCount);
                audioService.playEatPoison();
                effectType = 'poison';
                break;
              // 新食物类型
              case 'shield':
                newShieldCount++;
                effectType = 'shield';
                break;
              case 'phase':
                newPhaseCount++;
                break;
              case 'split':
                growth = 3;
                break;
              case 'magnet':
                newMagnetTime = 10000;
                effectType = 'magnet';
                break;
              case 'time':
                newTime = Math.min(newTime + 30, currentConfig.levelTime);
                setRemainingTime(newTime);
                remainingTimeRef.current = newTime;
                break;
              case 'freeze':
                // 双人模式时冰冻对手，单人模式无效果
                if (isDouble && currentSnakes[1 - index] && !currentSnakes[1 - index].isDead) {
                  updatedSnakes[1 - index] = {
                    ...updatedSnakes[1 - index],
                    frozenTime: GAME_CONFIG.freezeDuration
                  };
                  effectType = 'freeze';
                }
                break;
              case 'doubleScore':
                newDoubleScoreTime = 15000;
                effectType = 'doubleScore';
                break;
            }
            
            // 触发特效
            createEffect(index, food.x, food.y, effectType, timestamp);

            // 计算分数
            if (food.type !== 'poison' && !(isPoisonActive && food.type !== 'color')) {
              let score = calculateScore(food.type, food.value, currentConfig, currentPlayers[index].level);
              if (newDoubleScoreTime > 0 && food.type !== 'doubleScore') {
                score *= 2;
              }
              
              const scoredPlayers = updatedPlayers.map((p, i) => {
                if (i === index) {
                  return { ...p, score: p.score + score };
                }
                return p;
              });
              
              setPlayers(scoredPlayers);
              gameDataRef.current.players = scoredPlayers;
              audioService.playScore();
            }

            // 移除被吃掉的食物，生成新的食物
            currentPlayerFoods.splice(ateFoodIndex, 1);
            
            // 如果是毒药，继续生成毒药；否则随机生成一种新食物（传入一个不存在的类型让函数随机选择）
            const newFoodType = food.type === 'poison' ? 'poison' : 'random' as any;
            const newFood = generateSingleFood(
              gridWidth, 
              gridHeight, 
              [updatedSnakes[index]], 
              currentPlayerFoods,
              newFoodType,
              currentConfig.difficulty, 
              updatedPlayers[index].level,
              currentConfig.customMap
            );
            
            if (newFood) {
              currentPlayerFoods.push(newFood);
            }
            
            updatedFoods[index] = currentPlayerFoods;
          }

          // 毒药效果期间翻倍成长
          if (ateFoodIndex >= 0 && isPoisonActive && eatenFoodType !== 'color') {
            growth *= 2;
          }

          const newPositions = [newHead, ...snake.positions];
          const currentLength = newPositions.length;
          
          if (ateFoodIndex < 0) {
            newPositions.pop();
          } else {
            const maxGrowth = GAME_CONFIG.maxSnakeLength - currentLength;
            const actualGrowth = Math.min(growth, maxGrowth);
            for (let i = 1; i < actualGrowth; i++) {
              newPositions.push({ ...snake.positions[snake.positions.length - 1] });
            }
          }
          
          while (newPositions.length > GAME_CONFIG.maxSnakeLength) {
            newPositions.pop();
          }

          updatedSnakes[index] = {
            ...snake,
            positions: newPositions,
            direction: newDirection,
            speed: currentSpeed,
            baseSpeed: newBaseSpeed,
            originalBaseSpeed: originalBaseSpeed,
            poisonEffectTime: newPoisonEffectTime,
            poisonStackCount: newPoisonStackCount,
            shieldCount: newShieldCount,
            phaseCount: newPhaseCount,
            magnetTime: newMagnetTime,
            doubleScoreTime: newDoubleScoreTime,
            frozenTime: newFrozenTime
          };
        } else {
          updatedSnakes[index] = {
            ...snake,
            poisonEffectTime: newPoisonEffectTime,
            poisonStackCount: newPoisonStackCount,
            baseSpeed: newBaseSpeed,
            originalBaseSpeed: originalBaseSpeed,
            speed: currentSpeed,
            shieldCount: newShieldCount,
            phaseCount: newPhaseCount,
            magnetTime: newMagnetTime,
            doubleScoreTime: newDoubleScoreTime,
            frozenTime: newFrozenTime
          };
        }
      });

      // 检查是否有任何蛇的毒药效果正在进行中
      const hasPoisonActive = updatedSnakes.some(snake => snake.poisonEffectTime > 0);
      
      if (needsUpdate || hasPoisonActive) {
        setSnakes(updatedSnakes);
        gameDataRef.current.snakes = updatedSnakes;
      }
      
      if (needsUpdate || foodRefreshNeeded) {
        setFoods(updatedFoods as any);
        gameDataRef.current.foods = updatedFoods as any;
      }
      
      // 清理过期特效
      setEffects(prev => {
        return prev.map(playerEffects => {
          return playerEffects.filter(effect => {
            return timestamp - effect.startTime < effect.duration;
          });
        });
      });
    }

    // 继续循环
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [handleGameEnd, unlockAchievement, updateAchievementProgress, createEffect]);
  
  // 将 gameLoop 保存到 ref 中
  useEffect(() => {
    gameLoopRefFunc.current = gameLoop;
  }, [gameLoop]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'playing') {
          pauseGame();
        } else if (gameStatus === 'paused') {
          resumeGame();
        }
        return;
      }

      if (gameStatus !== 'playing') return;

      if (config?.mode === 'double') {
        if (KEYMAP.player1[e.key as keyof typeof KEYMAP.player1]) {
          setDirection(0, KEYMAP.player1[e.key as keyof typeof KEYMAP.player1] as Direction);
        }
        if (KEYMAP.player2[e.key as keyof typeof KEYMAP.player2]) {
          setDirection(1, KEYMAP.player2[e.key as keyof typeof KEYMAP.player2] as Direction);
        }
      } else {
        if (KEYMAP.player1[e.key as keyof typeof KEYMAP.player1]) {
          setDirection(0, KEYMAP.player1[e.key as keyof typeof KEYMAP.player1] as Direction);
        } else if (KEYMAP.player2[e.key as keyof typeof KEYMAP.player2]) {
          setDirection(0, KEYMAP.player2[e.key as keyof typeof KEYMAP.player2] as Direction);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, config?.mode, setDirection, pauseGame, resumeGame]);

  // 启动/停止游戏循环
  useEffect(() => {
    if (gameStatus === 'playing') {
      lastTimeRef.current = 0;
      gameLoopRef.current = requestAnimationFrame((timestamp) => {
        gameLoopRefFunc.current?.(timestamp);
      });
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStatus]);

  return {
    gameStatus,
    config,
    players,
    snakes,
    foods,
    effects,
    remainingTime,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    goToConfig,
    setDirection,
    isWin,
    isDoubleMode: config?.mode === 'double' || false,
    recentlyUnlockedAchievements
  };
};
