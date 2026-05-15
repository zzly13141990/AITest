<template>
  <div class="battle-game-container">
    <div class="header">
      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">双人对战</h1>
      <button class="btn btn-secondary" @click="toggleMute">
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
    </div>
    
    <div class="battle-area">
      <div
        v-for="player in players"
        :key="player.id"
        class="player-section"
        :class="{ 'player-1': player.id === 1, 'player-2': player.id === 2 }"
      >
        <div class="player-header">
          <h2 class="player-name">{{ player.name }}</h2>
          <div
            class="player-status"
            :class="{ 'game-over': player.gameState.isGameOver }"
          >
            {{ player.gameState.isGameOver ? '游戏结束' : '游戏中' }}
          </div>
        </div>
        
        <div class="player-game-area">
          <GameGrid
            :game-state="player.gameState"
            :config="config"
            :is-shaking="player.isShaking"
            :active-items="player.gameState.activeItems"
          />
          
          <div class="player-side-panel">
            <NextBlock :block="player.gameState.nextBlock" />
            
            <div class="stats-card card">
              <div class="stat-item">
                <span class="stat-label">分数</span>
                <span class="stat-value">{{ player.gameState.score }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">等级</span>
                <span class="stat-value">{{ player.gameState.level }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">消除行数</span>
                <span class="stat-value">{{ player.gameState.lines }}</span>
              </div>
            </div>
            
            <div class="active-items-card card" v-if="hasActiveItems(player)">
              <h3 class="card-title">道具效果</h3>
              <div class="items-list">
                <div
                  v-for="(expireTime, itemType) in player.gameState.activeItems"
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
          </div>
        </div>
        
        <div class="player-controls card">
          <h3 class="controls-title">操作按键</h3>
          <div class="controls-list">
            <div class="control-row">
              <span class="control-keys">
                {{ player.id === 1 ? 'A / ←' : 'J' }}
              </span>
              <span class="control-desc">左移</span>
            </div>
            <div class="control-row">
              <span class="control-keys">
                {{ player.id === 1 ? 'D / →' : 'L' }}
              </span>
              <span class="control-desc">右移</span>
            </div>
            <div class="control-row">
              <span class="control-keys">
                {{ player.id === 1 ? 'W / ↑' : 'I' }}
              </span>
              <span class="control-desc">旋转</span>
            </div>
            <div class="control-row">
              <span class="control-keys">
                {{ player.id === 1 ? 'S / ↓' : 'K' }}
              </span>
              <span class="control-desc">加速</span>
            </div>
            <div class="control-row">
              <span class="control-keys">
                {{ player.id === 1 ? 'Q' : 'U' }}
              </span>
              <span class="control-desc">直接落底</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="game-overlay" v-if="!gameStarted && !gameOver">
      <div class="overlay-content">
        <h2 class="overlay-title">准备开始</h2>
        <p class="overlay-subtitle">按 Enter 开始对战</p>
        <button class="btn btn-primary" @click="startGame">
          开始对战
        </button>
      </div>
    </div>
    
    <div class="game-overlay" v-if="players[0].gameState.isPaused && gameStarted">
      <div class="overlay-content">
        <h2 class="overlay-title">游戏暂停</h2>
        <p class="overlay-subtitle">按 P 继续游戏</p>
        <button class="btn btn-primary" @click="togglePause">
          继续游戏
        </button>
      </div>
    </div>
    
    <div class="game-overlay" v-if="gameOver">
      <div class="overlay-content">
        <h2 class="overlay-title">对战结束</h2>
        <p class="overlay-subtitle winner-text">
          🎉 {{ winner?.name }} 获胜！
        </p>
        <div class="final-stats">
          <div
            v-for="player in players"
            :key="player.id"
            class="final-player-stats"
          >
            <span class="final-player-name">{{ player.name }}</span>
            <span class="final-score">{{ player.gameState.score }} 分</span>
          </div>
        </div>
        <div class="overlay-buttons">
          <button class="btn btn-primary" @click="startGame">
            再来一局
          </button>
          <button class="btn btn-secondary" @click="goBack">
            返回首页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import GameGrid from '../components/GameGrid.vue';
import NextBlock from '../components/NextBlock.vue';
import { useBattle } from '../composables/useBattle';
import { ITEM_CONFIG, ItemType } from '../types/tetris';
import { ROUTES } from '../constants';
import { saveRankRecord } from '../utils/storageUtils';
import * as audioUtils from '../utils/audioUtils';

const router = useRouter();

const isMuted = ref(false);
const winner = ref<any>(null);

const {
  players,
  config,
  gameStarted,
  gameOver,
  startGame,
  togglePause
} = useBattle({
  onGameOver: (winPlayer, losePlayer) => {
    winner.value = winPlayer;
    audioUtils.playGameOver();
    
    // 保存获胜者记录
    saveRankRecord({
      id: Date.now().toString(),
      score: winPlayer.gameState.score,
      level: winPlayer.gameState.level,
      lines: winPlayer.gameState.lines,
      timestamp: Date.now(),
      mode: 'battle'
    });
  },
  onLinesCleared: (player, lines) => {
    audioUtils.playClearLines(lines);
  },
  onItemActivated: (source, item, target) => {
    audioUtils.playItem();
  }
});

function hasActiveItems(player: any) {
  const now = Date.now();
  return Object.values(player.gameState.activeItems).some(
    t => t && t > now
  );
}

function goBack() {
  router.push(ROUTES.HOME);
}

function toggleMute() {
  isMuted.value = audioUtils.toggleMute();
}
</script>

<style scoped>
.battle-game-container {
  width: 100%;
  height: 100vh;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0;
}

.back-btn {
  padding: 10px 20px;
}

.battle-area {
  flex: 1;
  display: flex;
  gap: 20px;
  justify-content: center;
}

.player-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-section.player-1 {
  align-items: flex-end;
}

.player-section.player-2 {
  align-items: flex-start;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.player-status {
  padding: 4px 12px;
  background: var(--bg-card-2);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-muted);
}

.player-status.game-over {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
}

.player-game-area {
  display: flex;
  gap: 12px;
}

.player-side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 180px;
}

.stats-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-number);
}

.active-items-card {
  padding: 12px;
}

.card-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.item-time {
  font-family: var(--font-number);
  opacity: 0.9;
}

.player-controls {
  padding: 14px;
  width: 100%;
}

.controls-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-keys {
  padding: 4px 8px;
  background: var(--bg-card-2);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-number);
  font-size: 11px;
  color: var(--text-primary);
}

.control-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.game-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.95);
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

.winner-text {
  font-size: 24px;
  color: var(--color-success);
  margin-bottom: 24px;
}

.final-stats {
  display: flex;
  gap: 40px;
  justify-content: center;
  margin-bottom: 32px;
}

.final-player-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.final-player-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.final-score {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: var(--font-number);
}

.overlay-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
