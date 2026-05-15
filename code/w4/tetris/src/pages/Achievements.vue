<template>
  <div class="achievements-container">
    <div class="header">
      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">成就</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="achievements-content">
      <div class="progress-card card">
        <div class="progress-info">
          <div class="progress-text">
            已解锁 {{ unlockedCount }} / {{ totalCount }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
      
      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-card card"
          :class="{ unlocked: achievement.unlocked }"
        >
          <div class="achievement-icon">
            {{ achievement.unlocked ? '🏆' : '🔒' }}
          </div>
          <div class="achievement-details">
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div class="achievement-date" v-if="achievement.unlocked && achievement.unlockTime">
              解锁于 {{ formatDate(achievement.unlockTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loadAchievements, Achievement } from '../utils/storageUtils';

const router = useRouter();
const achievements = ref<Achievement[]>([]);

const unlockedCount = computed(() => achievements.value.filter(a => a.unlocked).length);
const totalCount = computed(() => achievements.value.length);
const progressPercent = computed(() => (unlockedCount.value / totalCount.value) * 100);

onMounted(() => {
  achievements.value = loadAchievements();
});

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.achievements-container {
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
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0;
}

.back-btn {
  padding: 10px 20px;
}

.spacer {
  width: 100px;
}

.achievements-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.progress-card {
  width: 100%;
  padding: 20px;
  margin-bottom: 24px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-card-2);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.achievements-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 4px;
}

.achievement-card {
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  transition: all 0.2s;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.achievement-card.unlocked {
  border: 2px solid var(--color-success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.achievement-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.achievement-details {
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
  margin-bottom: 6px;
}

.achievement-date {
  font-size: 11px;
  color: var(--color-success);
}
</style>
