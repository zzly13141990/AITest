<template>
  <div class="game-end-container">
    <div class="game-end-content">
      <h1 class="end-title">游戏结束</h1>
      
      <div class="result-card card">
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">最终分数</span>
            <span class="stat-value score">{{ score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">等级</span>
            <span class="stat-value">{{ level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">消除行数</span>
            <span class="stat-value">{{ lines }}</span>
          </div>
        </div>
      </div>
      
      <div class="achievements-section" v-if="newAchievements.length > 0">
        <h2 class="achievements-title">🎉 新成就解锁！</h2>
        <div class="achievements-list">
          <div
            v-for="achievement in newAchievements"
            :key="achievement.id"
            class="achievement-badge card"
          >
            <div class="achievement-icon">🏆</div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-primary" @click="playAgain">
          再来一局
        </button>
        <button class="btn btn-secondary" @click="goHome">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { loadAchievements } from '../utils/storageUtils';
import { ROUTES } from '../constants';

const router = useRouter();
const route = useRoute();

const score = ref(0);
const level = ref(1);
const lines = ref(0);
const newAchievements = ref<any[]>([]);

onMounted(() => {
  score.value = Number(route.query.score) || 0;
  level.value = Number(route.query.level) || 1;
  lines.value = Number(route.query.lines) || 0;
  
  // 检查刚刚解锁的成就
  const savedAchievements = loadAchievements();
  const now = Date.now();
  newAchievements.value = savedAchievements.filter(
    a => a.unlocked && a.unlockTime && now - a.unlockTime < 5000
  );
});

function playAgain() {
  router.push(route.query.mode === 'battle' ? ROUTES.BATTLE : ROUTES.SINGLE);
}

function goHome() {
  router.push(ROUTES.HOME);
}
</script>

<style scoped>
.game-end-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  padding: 20px;
}

.game-end-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.end-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 32px 0;
}

.result-card {
  padding: 32px;
  margin-bottom: 24px;
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.stat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  font-size: 16px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-number);
}

.stat-value.score {
  color: var(--color-primary);
  font-size: 36px;
}

.achievements-section {
  margin-bottom: 32px;
}

.achievements-title {
  font-size: 20px;
  color: var(--color-success);
  margin: 0 0 16px 0;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-badge {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  border: 2px solid var(--color-success);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.achievement-icon {
  font-size: 32px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .btn {
  flex: 1;
}
</style>
