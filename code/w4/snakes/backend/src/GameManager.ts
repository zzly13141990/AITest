import { Room, BattlePlayer, Position, BattleItemType, Food } from './types';
import { checkCollision, getRandomEmptyPosition, generateId } from './utils';
import { CONFIG, ITEM_COLORS, FREEZE_DURATION, REVERSE_DURATION, GROW_AMOUNT, ITEM_COOLDOWN, SPEED_BOOST_DURATION } from './constants';

export class GameManager {
  private roomGames: Map<string, NodeJS.Timeout> = new Map();
  private onGameUpdate: (roomId: string) => void;
  private onGameEnded: (roomId: string) => void;

  constructor(onGameUpdate: (roomId: string) => void, onGameEnded?: (roomId: string) => void) {
    this.onGameUpdate = onGameUpdate;
    this.onGameEnded = onGameEnded || (() => {});
  }

  /**
   * 开始游戏
   */
  startGame(room: Room): void {
    if (this.roomGames.has(room.id)) {
      return;
    }

    const tickInterval = 1000 / 10; // 10 ticks per second

    const gameLoop = () => {
      if (room.status !== 'playing') {
        this.stopGame(room.id);
        return;
      }

      this.updateGame(room);
      
      // 检查游戏是否结束
      if (this.checkGameEnd(room)) {
        room.status = 'ended';
        this.onGameUpdate(room.id);
        this.onGameEnded(room.id);
        this.stopGame(room.id);
      } else {
        this.onGameUpdate(room.id);
      }
    };

    const intervalId = setInterval(gameLoop, tickInterval);
    this.roomGames.set(room.id, intervalId);
  }

  /**
   * 停止游戏
   */
  stopGame(roomId: string): void {
    const intervalId = this.roomGames.get(roomId);
    if (intervalId) {
      clearInterval(intervalId);
      this.roomGames.delete(roomId);
    }
  }

  /**
   * 更新游戏状态
   */
  private updateGame(room: Room): void {
    // 如果暂停，跳过更新
    if (room.isPaused) return;
    
    const now = Date.now();
    const players = Array.from(room.players.values()).filter(p => !p.isSpectator);

    // 更新每个玩家
    for (const player of players) {
      if (!player.isAlive) continue;

      // 检查效果是否过期
      if (player.isFrozen && now > player.frozenUntil) {
        player.isFrozen = false;
      }
      if (player.isReversed && now > player.reversedUntil) {
        player.isReversed = false;
      }
      if (player.hasSpeedBoost && now > player.speedBoostUntil!) {
        player.hasSpeedBoost = false;
      }

      // 如果冰冻中，跳过移动
      if (player.isFrozen) continue;

      // 更新方向
      player.direction = player.nextDirection;

      // 移动蛇
      const head = { ...player.snake[player.snake.length - 1] };
      
      switch (player.direction) {
        case 'up': head.y -= 1; break;
        case 'down': head.y += 1; break;
        case 'left': head.x -= 1; break;
        case 'right': head.x += 1; break;
      }

      // 收集所有障碍物位置
      const allPositions: Position[] = [];
      for (const p of players) {
        if (p.id !== player.id && p.isAlive) {
          allPositions.push(...p.snake);
        }
      }

      // 检查碰撞
      const collisionWithSelf = checkCollision(head, player.snake.slice(0, -1), room.gridWidth, room.gridHeight, room.walls || [], room.obstacles || []);
      const collisionWithOthers = checkCollision(head, allPositions, room.gridWidth, room.gridHeight, room.walls || [], room.obstacles || []);
      
      console.log(`🔍 Checking collision for player ${player.name}:`, {
        head,
        collisionWithSelf,
        collisionWithOthers,
        snake: player.snake
      });
      
      if (collisionWithSelf || collisionWithOthers) {
        player.isAlive = false;
        console.log(`❌ Player ${player.name} eliminated!`);
        continue;
      }

      // 移动蛇
      player.snake.push(head);

      // 检查是否吃到食物
      const foodIndex = room.foods.findIndex(food => food.x === head.x && food.y === head.y);
      if (foodIndex !== -1) {
        const food = room.foods[foodIndex];
        
        // 加分
        player.score += 10;

        // 处理食物效果
        if (food.type === 'poison') {
          // 毒食物：立即死亡
          player.isAlive = false;
          console.log(`☠️ Player ${player.name} ate poison and died!`);
        } else if (food.type === 'speedBoost') {
          // 速度加成：+20% 速度，持续 8 秒
          player.hasSpeedBoost = true;
          player.speedBoostUntil = now + SPEED_BOOST_DURATION;
        } else if (food.type !== 'normal') {
          // 其他道具：正常添加到物品栏
          this.addItem(player, food.type);
        }

        // 移除食物
        room.foods.splice(foodIndex, 1);

        // 生成新食物
        this.spawnFood(room);
      } else {
        // 没吃到食物，移除蛇尾
        player.snake.shift();
      }
    }
  }

  /**
   * 添加道具
   */
  private addItem(player: BattlePlayer, itemType: BattleItemType): void {
    const existingItem = player.items.find(item => item.type === itemType);
    if (existingItem) {
      existingItem.count++;
    } else {
      player.items.push({
        id: generateId(),
        type: itemType,
        count: 1,
      });
    }
  }

  /**
   * 生成新食物
   */
  private spawnFood(room: Room): void {
    const occupiedPositions: Position[] = [];
    
    for (const player of room.players.values()) {
      if (!player.isSpectator) {
        occupiedPositions.push(...player.snake);
      }
    }
    occupiedPositions.push(...room.foods);

    // 随机选择食物类型
    const type = this.getRandomFoodType();
    const pos = getRandomEmptyPosition(
      room.gridWidth, 
      room.gridHeight, 
      occupiedPositions,
      room.walls,
      room.obstacles
    );

    room.foods.push({
      ...pos,
      type,
      color: ITEM_COLORS[type],
      id: generateId(),
    });
  }

  /**
   * 随机获取食物类型
   */
  private getRandomFoodType(): BattleItemType | 'normal' {
    const rand = Math.random();
    if (rand < 0.6) return 'normal';
    if (rand < 0.7) return 'freeze';
    if (rand < 0.8) return 'grow';
    if (rand < 0.88) return 'fog';
    if (rand < 0.95) return 'speed';
    return 'reverse';
  }

  /**
   * 使用道具
   */
  useItem(player: BattlePlayer, itemId: string, targetPlayerId?: string, room?: Room): boolean {
    const itemIndex = player.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    const now = Date.now();
    
    // 检查道具冷却时间
    if (player.lastItemUsedAt && now - player.lastItemUsedAt < ITEM_COOLDOWN) {
      return false; // 冷却中，不能使用道具
    }

    const item = player.items[itemIndex];

    switch (item.type) {
      case 'freeze':
        if (room && targetPlayerId) {
          const target = room.players.get(targetPlayerId);
          if (target && target.isAlive) {
            target.isFrozen = true;
            target.frozenUntil = now + FREEZE_DURATION;
          }
        }
        break;

      case 'grow':
        if (room && targetPlayerId) {
          const target = room.players.get(targetPlayerId);
          if (target && target.isAlive) {
            for (let i = 0; i < GROW_AMOUNT; i++) {
              target.snake.unshift({ ...target.snake[0] });
            }
          }
        }
        break;

      case 'reverse':
        if (room && targetPlayerId) {
          const target = room.players.get(targetPlayerId);
          if (target && target.isAlive) {
            target.isReversed = true;
            target.reversedUntil = now + REVERSE_DURATION;
          }
        }
        break;

      case 'speed':
        // 自己加速 - 这里可以在前端体现
        player.score += 20;
        break;

      case 'fog':
        // 迷雾效果在前端处理
        player.score += 15;
        break;
    }

    // 记录道具使用时间
    player.lastItemUsedAt = now;

    // 消耗道具
    item.count--;
    if (item.count <= 0) {
      player.items.splice(itemIndex, 1);
    }

    return true;
  }

  /**
   * 检查游戏是否结束
   */
  private checkGameEnd(room: Room): boolean {
    if (!room.gameStartedAt) return false;

    const elapsed = (Date.now() - room.gameStartedAt) / 1000;
    if (elapsed >= room.gameDuration) {
      return true;
    }

    const players = Array.from(room.players.values()).filter(p => !p.isSpectator);
    const alivePlayers = players.filter(p => p.isAlive);
    
    // 如果只剩一个玩家活着，游戏结束
    if (alivePlayers.length <= 1 && players.length > 1) {
      return true;
    }

    return false;
  }

  /**
   * 获取游戏结果并更新胜负统计
   */
  getGameResult(room: Room): { winnerId: string; winnerName: string; finalStats: { playerId: string; playerName: string; score: number }[] } {
    const players = Array.from(room.players.values()).filter(p => !p.isSpectator);
    
    // 按分数排序
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    // 更新胜负统计
    sortedPlayers.forEach((player, index) => {
      if (index === 0) {
        player.wins++;
      } else {
        player.losses++;
      }
    });

    return {
      winnerId: winner.id,
      winnerName: winner.name,
      finalStats: sortedPlayers.map(p => ({
        playerId: p.id,
        playerName: p.name,
        score: p.score,
      })),
    };
  }

  /**
   * 获取游戏状态
   */
  getGameState(room: Room): {
    players: BattlePlayer[];
    foods: Food[];
    timeRemaining: number;
    isPaused: boolean;
    gridWidth: number;
    gridHeight: number;
    walls: Array<{x: number, y: number}>;
    obstacles: Array<{x: number, y: number}>;
  } {
    const players = Array.from(room.players.values());
    const elapsed = room.gameStartedAt ? (Date.now() - room.gameStartedAt) / 1000 : 0;
    const timeRemaining = Math.max(0, room.gameDuration - elapsed);

    return {
      players,
      foods: room.foods,
      timeRemaining,
      isPaused: room.isPaused || false,
      gridWidth: room.gridWidth,
      gridHeight: room.gridHeight,
      walls: room.walls || [],
      obstacles: room.obstacles || [],
    };
  }

  /**
   * 清理所有游戏
   */
  cleanup(): void {
    for (const intervalId of this.roomGames.values()) {
      clearInterval(intervalId);
    }
    this.roomGames.clear();
  }
}
