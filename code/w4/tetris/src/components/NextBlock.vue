<template>
  <div class="next-block-card card">
    <h3 class="title">下一方块</h3>
    <div class="preview-container">
      <canvas 
        ref="canvasRef" 
        :width="canvasSize" 
        :height="canvasSize"
        class="preview-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { Block } from '../types/tetris';

interface Props {
  block: Block | null;
}

const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const cellSize = 25;
const canvasSize = 120;

function drawBlock(block: Block) {
  if (!ctx.value) return;
  
  const context = ctx.value;
  context.clearRect(0, 0, canvasSize, canvasSize);
  
  const shape = block.shape;
  const blockWidth = shape[0].length;
  const blockHeight = shape.length;
  
  // 计算居中位置
  const offsetX = (canvasSize - blockWidth * cellSize) / 2;
  const offsetY = (canvasSize - blockHeight * cellSize) / 2;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        
        // 主方块
        context.fillStyle = block.color.main;
        context.fillRect(x, y, cellSize - 2, cellSize - 2);
        
        // 边框
        context.strokeStyle = block.color.border;
        context.lineWidth = 2;
        context.strokeRect(x + 1, y + 1, cellSize - 4, cellSize - 4);
        
        // 高光效果
        const gradient = context.createLinearGradient(x, y, x + cellSize, y + cellSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        context.fillStyle = gradient;
        context.fillRect(x, y, cellSize - 2, cellSize - 2);
      }
    }
  }
}

watch(
  () => props.block,
  (newBlock) => {
    if (newBlock) {
      drawBlock(newBlock);
    } else if (ctx.value) {
      ctx.value.clearRect(0, 0, canvasSize, canvasSize);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d');
    if (props.block) {
      drawBlock(props.block);
    }
  }
});
</script>

<style scoped>
.next-block-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-canvas {
  display: block;
}
</style>
