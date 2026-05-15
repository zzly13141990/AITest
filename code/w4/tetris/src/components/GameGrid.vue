<template>
  <div 
    class="game-grid-container" 
    :class="{ 'shake': isShaking, 'item-glow': activeItemColor }"
    :style="{ '--item-glow-color': activeItemColor }"
  >
    <canvas 
      ref="canvasRef" 
      :width="canvasWidth" 
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { GameState, GameConfig, Block, GridCell, ItemType } from '../types/tetris';
import { getGhostBlock, checkCollision } from '../utils/tetrisUtils';
import { ITEM_CONFIG } from '../types/tetris';

interface Props {
  gameState: GameState;
  config: GameConfig;
  isShaking?: boolean;
  activeItems?: { [key in ItemType]?: number };
}

const props = withDefaults(defineProps<Props>(), {
  isShaking: false
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

const canvasWidth = computed(() => 
  props.config.gridWidth * (props.config.cellSize + props.config.cellGap) - props.config.cellGap
);
const canvasHeight = computed(() => 
  props.config.gridHeight * (props.config.cellSize + props.config.cellGap) - props.config.cellGap
);

const activeItemColor = computed(() => {
  if (!props.activeItems) return null;
  const now = Date.now();
  for (const [itemType, expireTime] of Object.entries(props.activeItems)) {
    if (expireTime && expireTime > now) {
      return ITEM_CONFIG[itemType as ItemType]?.color;
    }
  }
  return null;
});

function drawBlock(
  context: CanvasRenderingContext2D,
  block: Block,
  offsetX: number = 0,
  offsetY: number = 0,
  alpha: number = 1
) {
  const { shape, x, y, color, hasItem } = block;
  const cellSize = props.config.cellSize;
  const cellGap = props.config.cellGap;
  
  context.globalAlpha = alpha;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const cellX = (x + col) * (cellSize + cellGap) + offsetX;
        const cellY = (y + row) * (cellSize + cellGap) + offsetY;
        
        if (cellY >= 0) {
          drawCell(context, cellX, cellY, cellSize, color.main, color.border, hasItem);
        }
      }
    }
  }
  
  context.globalAlpha = 1;
}

function drawCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string,
  hasItem?: ItemType
) {
  // 主方块
  context.fillStyle = color;
  context.fillRect(x, y, size, size);
  
  // 边框
  context.strokeStyle = borderColor;
  context.lineWidth = 2;
  context.strokeRect(x + 1, y + 1, size - 2, size - 2);
  
  // 高光效果
  const gradient = context.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  context.fillStyle = gradient;
  context.fillRect(x, y, size, size);
  
  // 道具标记
  if (hasItem) {
    const itemConfig = ITEM_CONFIG[hasItem];
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 4;
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = itemConfig.color;
    context.fill();
    context.strokeStyle = itemConfig.iconColor;
    context.lineWidth = 2;
    context.stroke();
  }
}

function drawGrid(context: CanvasRenderingContext2D, grid: GridCell[][]) {
  const cellSize = props.config.cellSize;
  const cellGap = props.config.cellGap;
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      const x = col * (cellSize + cellGap);
      const y = row * (cellSize + cellGap);
      
      if (cell.filled && cell.color) {
        drawCell(context, x, y, cellSize, cell.color.main, cell.color.border, cell.hasItem);
      } else {
        // 空单元格背景
        context.fillStyle = '#1E293B';
        context.fillRect(x, y, cellSize, cellSize);
        context.strokeStyle = '#334155';
        context.lineWidth = 1;
        context.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }
}

function render() {
  if (!canvasRef.value || !ctx.value) return;
  
  const context = ctx.value;
  
  // 清空画布
  context.fillStyle = '#0F172A';
  context.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  // 绘制网格
  drawGrid(context, props.gameState.grid);
  
  // 绘制幽灵方块（预览）
  if (props.gameState.currentBlock) {
    const ghostBlock = getGhostBlock(props.gameState.currentBlock, props.gameState.grid, props.config);
    drawBlock(context, ghostBlock, 0, 0, 0.3);
  }
  
  // 绘制当前方块
  if (props.gameState.currentBlock) {
    drawBlock(context, props.gameState.currentBlock);
  }
}

watch(
  () => [props.gameState, props.config],
  () => {
    render();
  },
  { deep: true }
);

onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d');
    render();
  }
});
</script>

<style scoped>
.game-grid-container {
  position: relative;
  border: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.game-grid-container.item-glow {
  box-shadow: 0 0 30px var(--item-glow-color);
}

.game-canvas {
  display: block;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.1s ease-in-out;
}
</style>
