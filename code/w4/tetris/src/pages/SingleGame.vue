<template>
  <div class="single-game-container">
    <div class="header">
      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">单人模式</h1>
      <button class="btn btn-secondary" @click="toggleMute">
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
    </div>
    
    <div class="game-area">
      <GameGrid
        :game-state="gameState"
        :config="config"
        :is-shaking="isShaking"
        :active-items="gameState.activeItems"
      />
      
      <div class="side-panel">
        <NextBlock :block="gameState.nextBlock" />
        
        <div class="stats-card card">
          <div class="stat-item">
            <span class="stat-label">分数</span>
            <span class="stat-value">{{ gameState.score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">等级</span>
            <span class="stat-value">{{ gameState.level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">消除行数</span>
            <span class="stat-value">{{ gameState.lines }}</span>
          </div>
        </div>
        
        <div class="active-items-card card" v-if="hasActiveItems">
          <h3 class="card-title">道具效果</h3>
          <div class="items-list">
            <div
              v-for="(expireTime, itemType) in gameState.activeItems"
              :key="itemType"
              class="item-tag"
              :style="{ background: ITEM_CONFIG[itemType as ItemType]?.color }"
              v-if="expireTime && expireTime > Date.now()"
            >
              {{ ITEM_CONFIG[itemType as ItemType]?.name }}
              <span class="item-time">
                {{ Math.ceil((expireTime - Date.now()) / 1000) }}s
              </span>
            </div>
          </div>
        </div>
        
        <div class="hint-card card">
          <div class="hint-row">
            <span class="hint-key">Enter</span>
            <span class="hint-text">开始游戏</span>
          </div>
          <div class="hint-row">
            <span class="hint-key">P</span>
            <span class="hint-text">暂停/继续</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="game-overlay" v-if="!gameState.isPlaying && !gameState.isGameOver">
      <div class="overlay-content">
        <h2 class="overlay-title">准备开始</h2>
        <p class="overlay-subtitle">按 Enter 开始游戏</p>
        <button class="btn btn-primary" @click="startGame">
          开始游戏
        </button>
      </div>
    </div>
    
    <div class="game-overlay" v-if="gameState.isPaused">
      <div class="overlay-content">
        <h2 class="overlay-title">游戏暂停</h2>
        <p class="overlay-subtitle">按 P 继续游戏</p>
        <button class="btn btn-primary" @click="togglePause">
          继续游戏
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import GameGrid from '../components/GameGrid.vue';
import NextBlock from '../components/NextBlock.vue';
import { useTetris } from '../composables/useTetris';
import { DEFAULT_GAME_CONFIG, SINGLE_PLAYER_CONTROLS, ITEM_CONFIG, ItemType } from '../types/tetris';
import { ROUTES } from '../constants';
import * as audioUtils from '../utils/audioUtils';

const router = useRouter();

const isMuted = ref(false);

const {
  gameState,
  config,
  isShaking,
  startGame,
  togglePause
} = useTetris({
  config: DEFAULT_GAME_CONFIG,
  controls: SINGLE_PLAYER_CONTROLS,
  onGameOver: (state) => {
    audioUtils.playGameOver();
    router.push({
      path: ROUTES.END,
      query: {
        score: state.score,
        level: state.level,
        lines: state.lines,
        mode: 'single'
      }
    });
  },
  onLinesCleared: (lines) => {
    audioUtils.playClearLines(lines);
  }
});

const hasActiveItems = computed(() => {
  const now = Date.now();
  return Object.values(gameState.value.activeItems).some(
    t => t && t > now
  );
});

function goBack() {
  router.push(ROUTES.HOME);
}

function toggleMute() {
  isMuted.value = audioUtils.toggleMute();
}
</script>

<style scoped>
.single-game-container {
  width: 100%;
  height: 100vh;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0;
}

.back-btn {
  padding: 10px 20px;
}

.game-area {
  flex: 1;
  display: flex;
  gap: 24px;
  justify-content: center;
  align-items: flex-start;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 240px;
}

.stats-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-number);
}

.active-items-card {
  padding: 16px;
}

.card-title {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: white;
  font-size: 13px;
  font-weight: 600;
}

.item-time {
  font-family: var(--font-number);
  opacity: 0.9;
}

.hint-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-key {
  min-width: 60px;
  padding: 6px 10px;
  background: var(--bg-card-2);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  text-align: center;
  font-family: var(--font-number);
  font-size: 12px;
  color: var(--text-primary);
}

.hint-text {
  font-size: 13px;
  color: var(--text-muted);
}

.game-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.overlay-content {
  text-align: center;
}

.overlay-title {
  font-size: 40px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.overlay-subtitle {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0 0 32px 0;
}
</style>
