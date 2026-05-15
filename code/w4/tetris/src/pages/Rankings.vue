<template>
  <div class="rankings-container">
    <div class="header">
      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">排行榜</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="mode-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'single' }"
        @click="switchMode('single')"
      >
        单人模式
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentMode === 'battle' }"
        @click="switchMode('battle')"
      >
        双人对战
      </button>
    </div>
    
    <div class="rankings-content">
      <div class="rankings-card card" v-if="filteredRankings.length > 0">
        <div class="ranking-list">
          <div
            v-for="(record, index) in filteredRankings"
            :key="record.id"
            class="ranking-item"
            :class="{ 'top-three': index < 3 }"
          >
            <div class="rank-number" :class="'rank-' + (index + 1)">
              {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1 }}
            </div>
            <div class="record-info">
              <div class="record-score">{{ record.score }} 分</div>
              <div class="record-details">
                等级 {{ record.level }} · 消除 {{ record.lines }} 行
              </div>
            </div>
            <div class="record-date">
              {{ formatDate(record.timestamp) }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="empty-state card" v-else>
        <div class="empty-icon">🎮</div>
        <div class="empty-text">还没有记录</div>
        <div class="empty-desc">开始游戏，争取登上排行榜吧！</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loadRankings, RankRecord } from '../utils/storageUtils';

const router = useRouter();
const currentMode = ref<'single' | 'battle'>('single');
const allRankings = ref<RankRecord[]>([]);

const filteredRankings = computed(() => {
  return allRankings.value.filter(r => r.mode === currentMode.value);
});

onMounted(() => {
  allRankings.value = loadRankings();
});

function switchMode(mode: 'single' | 'battle') {
  currentMode.value = mode;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.rankings-container {
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

.mode-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
}

.tab-btn {
  padding: 12px 32px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--text-secondary);
}

.tab-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.rankings-content {
  flex: 1;
  display: flex;
  justify-content: center;
}

.rankings-card {
  width: 100%;
  max-width: 600px;
  padding: 24px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card-2);
  border-radius: var(--radius-md);
}

.ranking-item.top-three {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 1px solid var(--color-primary);
}

.rank-number {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-number);
  color: var(--text-muted);
  background: var(--bg-main);
  border-radius: 50%;
}

.rank-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
}

.rank-2 {
  background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
  color: white;
}

.rank-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #A05A2C 100%);
  color: white;
}

.record-info {
  flex: 1;
}

.record-score {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-number);
  margin-bottom: 4px;
}

.record-details {
  font-size: 13px;
  color: var(--text-muted);
}

.record-date {
  font-size: 12px;
  color: var(--text-muted);
}

.empty-state {
  width: 100%;
  max-width: 400px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
}
</style>
