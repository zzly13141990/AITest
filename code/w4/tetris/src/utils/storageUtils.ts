import { Achievement, ACHIEVEMENTS, RankRecord, GameState } from '../types/tetris';
import { STORAGE_KEYS } from '../constants';

/**
 * 加载成就
 */
export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load achievements:', e);
  }
  
  // 返回默认成就列表
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
}

/**
 * 保存成就
 */
export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (e) {
    console.error('Failed to save achievements:', e);
  }
}

/**
 * 检查并解锁成就
 */
export function checkAndUnlockAchievements(gameState: GameState): string[] {
  const achievements = loadAchievements();
  const unlocked: string[] = [];
  
  achievements.forEach(achievement => {
    if (achievement.unlocked) return;
    
    let shouldUnlock = false;
    
    switch (achievement.id) {
      case 'first_game':
        shouldUnlock = true;
        break;
      case 'line_master':
        shouldUnlock = gameState.lines >= 50;
        break;
      case 'combo_master':
        shouldUnlock = gameState.combo >= 4;
        break;
      case 'level_master':
        shouldUnlock = gameState.level >= 10;
        break;
      case 'score_king':
        shouldUnlock = gameState.score >= 10000;
        break;
    }
    
    if (shouldUnlock) {
      achievement.unlocked = true;
      achievement.unlockTime = Date.now();
      unlocked.push(achievement.id);
    }
  });
  
  if (unlocked.length > 0) {
    saveAchievements(achievements);
  }
  
  return unlocked;
}

/**
 * 加载排行榜
 */
export function loadRankings(mode?: 'single' | 'battle'): RankRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RANKINGS);
    if (stored) {
      let rankings: RankRecord[] = JSON.parse(stored);
      if (mode) {
        rankings = rankings.filter(r => r.mode === mode);
      }
      return rankings.sort((a, b) => b.score - a.score).slice(0, 10);
    }
  } catch (e) {
    console.error('Failed to load rankings:', e);
  }
  
  return [];
}

/**
 * 保存排行记录
 */
export function saveRankRecord(record: RankRecord): void {
  try {
    const rankings = loadRankings();
    rankings.push(record);
    rankings.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(rankings.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save rank record:', e);
  }
}

/**
 * 清空排行榜
 */
export function clearRankings(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RANKINGS);
  } catch (e) {
    console.error('Failed to clear rankings:', e);
  }
}

/**
 * 重置成就
 */
export function resetAchievements(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
  } catch (e) {
    console.error('Failed to reset achievements:', e);
  }
}
