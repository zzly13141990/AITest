import { BattleItemType } from './types';

export const CONFIG = {
  PORT: 3001,
  GRID_WIDTH: 30,
  GRID_HEIGHT: 30,
  INITIAL_SNAKE_LENGTH: 3,
  GAME_TICK_RATE: 60, // 游戏状态更新频率（次/秒）
  FOOD_COUNT: 5,
  MAX_ROOMS: 100,
  ROOM_TIMEOUT: 3600000, // 房间超时时间（1小时）
};

export const ITEM_COLORS: Record<BattleItemType | 'normal', string> = {
  normal: '#4ECDC4',
  freeze: '#00BCD4',
  grow: '#9C27B0',
  fog: '#795548',
  speed: '#FF9800',
  reverse: '#FF5252',
  poison: '#7CFC00',
  speedBoost: '#00FFFF',
};

export const ITEM_WEIGHTS: Record<BattleItemType | 'normal', number> = {
  normal: 50,
  freeze: 10,
  grow: 8,
  fog: 8,
  speed: 8,
  reverse: 6,
  poison: 5,
  speedBoost: 5,
};

export const FREEZE_DURATION = 3000; // 冰冻持续3秒
export const REVERSE_DURATION = 3000; // 反向控制持续3秒
export const SPEED_DURATION = 5000; // 加速持续5秒
export const SPEED_BOOST_DURATION = 8000; // 20%速度加成持续8秒
export const GROW_AMOUNT = 5; // 增长5节
export const ITEM_COOLDOWN = 3000; // 道具使用冷却时间（3秒）
