import { LeaderboardRecord, Achievement, GameMode, Difficulty, AudioConfig, CustomMap } from '../types';

const DB_NAME = 'SnakeGameDB';
const DB_VERSION = 2;

// 成就定义
const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_game',
    name: '初出茅庐',
    description: '完成第一局游戏',
    icon: '🏆',
    category: 'skill'
  },
  {
    id: 'score_1000',
    name: '得分达人',
    description: '单局得分达到1000分',
    icon: '🎯',
    category: 'score',
    target: 1000
  },
  {
    id: 'score_3000',
    name: '蛇王',
    description: '单局得分达到3000分',
    icon: '👑',
    category: 'score',
    target: 3000
  },
  {
    id: 'survive_10min',
    name: '持久力',
    description: '单局生存时间超过10分钟',
    icon: '⏱️',
    category: 'skill',
    target: 600
  },
  {
    id: 'complete_all_levels',
    name: '完美通关',
    description: '完成所有4大关卡',
    icon: '🏅',
    category: 'skill'
  },
  {
    id: 'poison_master',
    name: '毒药大师',
    description: '单局吃毒药超过5次',
    icon: '☠️',
    category: 'skill',
    target: 5
  },
  {
    id: 'collect_all_colors',
    name: '彩虹蛇',
    description: '一局中吃到所有3种颜色食物',
    icon: '🌈',
    category: 'collection'
  },
  {
    id: 'double_player',
    name: '结伴而行',
    description: '完成一局双人模式',
    icon: '👥',
    category: 'skill'
  },
  {
    id: 'super_hard_win',
    name: '勇者无惧',
    description: '在超困难模式完成一局游戏',
    icon: '💪',
    category: 'skill'
  },
  {
    id: 'speed_demon',
    name: '速度狂魔',
    description: '同时叠加3层毒药效果',
    icon: '⚡',
    category: 'skill',
    target: 3
  }
];

class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建排行榜存储
        if (!db.objectStoreNames.contains('leaderboard')) {
          const store = db.createObjectStore('leaderboard', { keyPath: 'id' });
          store.createIndex('score', 'score', { unique: false });
          store.createIndex('mode_difficulty', ['mode', 'difficulty'], { unique: false });
        }

        // 创建成就存储
        if (!db.objectStoreNames.contains('achievements')) {
          const store = db.createObjectStore('achievements', { keyPath: 'id' });
          // 初始化成就
          ACHIEVEMENTS.forEach(achievement => {
            store.add({
              ...achievement,
              unlocked: false,
              progress: 0
            });
          });
        }

        // 创建音频配置存储
        if (!db.objectStoreNames.contains('audioConfig')) {
          const store = db.createObjectStore('audioConfig', { keyPath: 'id' });
          store.add({
            id: 'default',
            musicEnabled: true,
            soundEnabled: true,
            volume: 0.5
          });
        }

        // 创建自定义地图存储
        if (!db.objectStoreNames.contains('customMaps')) {
          db.createObjectStore('customMaps', { keyPath: 'id' });
        }
      };
    });
  }

  // ==================== 排行榜相关 ====================
  async addLeaderboardRecord(record: LeaderboardRecord): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['leaderboard'], 'readwrite');
      const store = tx.objectStore('leaderboard');
      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLeaderboard(mode?: GameMode, difficulty?: Difficulty): Promise<LeaderboardRecord[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['leaderboard'], 'readonly');
      const store = tx.objectStore('leaderboard');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let results = request.result as LeaderboardRecord[];
        
        // 筛选
        if (mode) {
          results = results.filter(r => r.mode === mode);
        }
        if (difficulty) {
          results = results.filter(r => r.difficulty === difficulty);
        }
        
        // 排序：分数高优先，时间相同则生存时间长优先
        results.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.survivalTime - a.survivalTime;
        });
        
        resolve(results.slice(0, 10)); // 返回前10名
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearLeaderboard(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['leaderboard'], 'readwrite');
      const store = tx.objectStore('leaderboard');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 成就相关 ====================
  async getAchievements(): Promise<Achievement[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['achievements'], 'readonly');
      const store = tx.objectStore('achievements');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Achievement[]);
      request.onerror = () => reject(request.error);
    });
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<void> {
    if (!this.db) await this.init();
    const achievements = await this.getAchievements();
    const achievement = achievements.find(a => a.id === id);
    
    if (!achievement) return;
    
    // 如果已经解锁，不重复处理
    if (achievement.unlocked && !updates.unlocked) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['achievements'], 'readwrite');
      const store = tx.objectStore('achievements');
      const request = store.put({
        ...achievement,
        ...updates,
        unlockedAt: updates.unlocked ? Date.now() : achievement.unlockedAt
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 音频配置 ====================
  async getAudioConfig(): Promise<AudioConfig> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['audioConfig'], 'readonly');
      const store = tx.objectStore('audioConfig');
      const request = store.get('default');
      request.onsuccess = () => {
        resolve(request.result || {
          musicEnabled: true,
          soundEnabled: true,
          volume: 0.5
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveAudioConfig(config: AudioConfig): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['audioConfig'], 'readwrite');
      const store = tx.objectStore('audioConfig');
      const request = store.put({ id: 'default', ...config });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== 自定义地图相关 ====================
  async getCustomMaps(): Promise<CustomMap[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['customMaps'], 'readonly');
      const store = tx.objectStore('customMaps');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result as CustomMap[];
        // 按创建时间倒序排列
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomMaps(maps: CustomMap[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['customMaps'], 'readwrite');
      const store = tx.objectStore('customMaps');
      store.clear(); // 先清空所有
      
      let saveCount = 0;
      let totalMaps = maps.length;
      
      if (totalMaps === 0) {
        resolve();
        return;
      }
      
      maps.forEach(map => {
        const request = store.add(map);
        request.onsuccess = () => {
          saveCount++;
          if (saveCount === totalMaps) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

export const storageService = new StorageService();
