<template>
  <div class="home-container">
    <div class="content">
      <h1 class="title">俄罗斯方块</h1>
      <p class="subtitle">经典游戏 · 全新体验</p>
      
      <div class="menu-buttons">
        <button class="btn btn-primary menu-btn" @click="goToSingle">
          单人模式
        </button>
        <button class="btn btn-secondary menu-btn" @click="goToBattle">
          双人对战
        </button>
      </div>
      
      <div class="sub-menu">
        <button class="btn btn-secondary sub-menu-btn" @click="goToRankings">
          🏆 排行榜
        </button>
        <button class="btn btn-secondary sub-menu-btn" @click="goToAchievements">
          🎖️ 成就
        </button>
      </div>
      
      <div class="controls-hint card">
        <h3>操作说明</h3>
        <div class="controls-grid">
          <div class="control-item">
            <span class="key">← →</span>
            <span class="desc">移动</span>
          </div>
          <div class="control-item">
            <span class="key">↑</span>
            <span class="desc">旋转</span>
          </div>
          <div class="control-item">
            <span class="key">↓</span>
            <span class="desc">加速下落</span>
          </div>
          <div class="control-item">
            <span class="key">空格</span>
            <span class="desc">直接落地</span>
          </div>
          <div class="control-item">
            <span class="key">P</span>
            <span class="desc">暂停</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ROUTES } from '../constants';

const router = useRouter();

function goToSingle() {
  router.push(ROUTES.SINGLE);
}

function goToBattle() {
  router.push(ROUTES.BATTLE);
}

function goToRankings() {
  router.push('/rankings');
}

function goToAchievements() {
  router.push('/achievements');
}
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  padding: 20px;
}

.content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.title {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, #3B82F6, #10B981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  text-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
}

.subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin: 0 0 40px 0;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.menu-btn {
  width: 100%;
  height: 64px;
  font-size: 20px;
}

.sub-menu {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.sub-menu-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
}

.controls-hint {
  padding: 24px;
}

.controls-hint h3 {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-card-2);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: var(--font-number);
  font-size: 14px;
  color: var(--text-primary);
}

.desc {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
