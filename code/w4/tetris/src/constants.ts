// 颜色变量
export const COLORS = {
  // 主色调
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  secondary: '#10B981',
  secondaryHover: '#059669',
  
  // 功能色
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // 中性色
  bgMain: '#0F172A',
  bgCard: '#1E293B',
  bgCard2: '#334155',
  borderColor: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8'
};

// 字体变量
export const FONTS = {
  number: "'JetBrains Mono', 'Consolas', monospace",
  chinese: "'PingFang SC', 'Microsoft YaHei', sans-serif",
  english: "'Inter', 'Segoe UI', sans-serif"
};

// 圆角规格
export const BORDER_RADIUS = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px'
};

// 阴影规格
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
  glow: '0 0 20px rgba(59, 130, 246, 0.5)'
};

// 动画时长
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  SINGLE: '/single',
  BATTLE: '/battle',
  END: '/end'
};

// LocalStorage keys
export const STORAGE_KEYS = {
  ACHIEVEMENTS: 'tetris_achievements',
  RANKINGS: 'tetris_rankings',
  SETTINGS: 'tetris_settings'
};
