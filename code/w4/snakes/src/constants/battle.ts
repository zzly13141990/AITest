// 对战相关常量
import type { BattleItemType } from '../types/battle';

export const BATTLE_CONFIG = {
  SERVER_URL: 'http://localhost:3001',
  GRID_WIDTH: 30,
  GRID_HEIGHT: 30,
  CELL_SIZE: 20,
  GAME_DURATION_OPTIONS: [
    { label: '3分钟', value: 180 },
    { label: '5分钟', value: 300 },
    { label: '10分钟', value: 600 },
  ],
  MAX_PLAYERS_OPTIONS: [2, 3, 4],
};

export const ITEM_COLORS: Record<'normal' | BattleItemType, string> = {
  normal: '#4ECDC4',
  freeze: '#00BCD4',
  grow: '#9C27B0',
  fog: '#795548',
  speed: '#FF9800',
  reverse: '#FF5252',
  poison: '#7CFC00',
  speedBoost: '#00FFFF',
};

export const ITEM_NAMES: Record<BattleItemType, string> = {
  freeze: '冰冻弹',
  grow: '增长术',
  fog: '迷雾弹',
  speed: '加速符',
  reverse: '混乱术',
  poison: '毒食物',
  speedBoost: '速度光环',
};

export const ITEM_ICONS: Record<BattleItemType, string> = {
  freeze: '❄️',
  grow: '🐍',
  fog: '🌫️',
  speed: '⚡',
  reverse: '🔄',
  poison: '☠️',
  speedBoost: '🏃',
};

export const PLAYER_COLORS = [
  '#4ECDC4',
  '#FF6B6B',
  '#45B7D1',
  '#96CEB4',
];

export const COLORS = {
  primary: '#6366F1',
  secondary: '#818CF8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#0F172A',
  card: '#1E293B',
  border: '#475569',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
};
