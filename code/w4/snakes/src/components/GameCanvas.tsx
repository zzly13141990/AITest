import React, { useEffect, useRef } from 'react';
import { Snake, Food, CustomMap, Effect } from '../types';
import { SIZES, COLORS } from '../constants';

interface GameCanvasProps {
  snake: Snake;
  foods: Food[];
  effects: Effect[];
  width?: number;
  height?: number;
  isPaused?: boolean;
  isDead?: boolean;
  customMap?: CustomMap | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  snake,
  foods,
  effects,
  width = SIZES.singleCanvasWidth,
  height = SIZES.singleCanvasHeight,
  isPaused = false,
  isDead = false,
  customMap = null
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const gridSize = SIZES.gridCell;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBackground = () => {
        ctx.fillStyle = COLORS.gameBackground;
        ctx.fillRect(0, 0, width, height);
      };

      const drawGrid = () => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      };

      const drawWalls = () => {
        if (!customMap) return;
        
        // 绘制墙壁（红色）
        ctx.fillStyle = '#FF5252';
        customMap.walls.forEach(wall => {
          ctx.fillRect(
            wall.x * gridSize + 1,
            wall.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
          );
        });
        
        // 绘制障碍物（橙色）
        ctx.fillStyle = '#FF9800';
        customMap.obstacles.forEach(obstacle => {
          ctx.fillRect(
            obstacle.x * gridSize + 1,
            obstacle.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
          );
        });
      };

      const render = (timestamp: number) => {
        // 清空画布
        drawBackground();

        // 绘制网格（可选）
        drawGrid();

        // 绘制自定义地图的墙壁和障碍物
        drawWalls();

      // 绘制特效（在食物下方，蛇上方）
      effects.forEach(effect => {
        const progress = (timestamp - effect.startTime) / effect.duration;
        if (progress > 1) return;

        const x = effect.x * gridSize + gridSize / 2;
        const y = effect.y * gridSize + gridSize / 2;
        
        ctx.save();
        
        // 根据特效类型绘制不同的效果
        switch (effect.type) {
          case 'collect':
          case 'shield':
          case 'speed':
          case 'freeze':
          case 'magnet':
          case 'doubleScore':
          case 'poison':
            // 通用的爆炸/波纹效果
            const maxRadius = gridSize * 4;
            const radius = maxRadius * Math.sin(progress * Math.PI / 2);
            const alpha = 1 - progress;
            
            // 外圈波纹
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `${effect.color}${Math.floor(alpha * 0.9 * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(0.5, `${effect.color}${Math.floor(alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${effect.color}00`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心星星/粒子效果
            if (progress < 0.6) {
              const particleCount = 12;
              for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const dist = radius * 0.7;
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                
                ctx.fillStyle = `${effect.color}${Math.floor((1 - progress * 1.5) * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(px, py, gridSize * 0.18, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            
            // 闪光效果
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, gridSize * 0.8 * (1 - progress), 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        
        ctx.restore();
      });

      const drawFoods = () => {
        foods.forEach((food) => {
          if (food && food.x >= 0 && food.y >= 0) {
            ctx.fillStyle = food.color;
            ctx.beginPath();
            ctx.arc(
              food.x * gridSize + gridSize / 2,
              food.y * gridSize + gridSize / 2,
              gridSize / 2 - 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        });
      };

      // 绘制多个食物
      drawFoods();

      // 如果有中毒效果，先绘制光晕
      if (snake.poisonEffectTime > 0 && snake.positions.length > 0) {
        ctx.save();
        // 计算蛇的中心位置
        const centerX = (snake.positions[0].x * gridSize + gridSize / 2);
        const centerY = (snake.positions[0].y * gridSize + gridSize / 2);
        
        // 光晕大小随叠加层数增强
        const stackCount = Math.max(1, snake.poisonStackCount);
        const maxRadius = gridSize * (3 + stackCount);
        const alpha = Math.min(0.8, 0.4 + stackCount * 0.15);
        
        // 创建径向渐变光晕
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, `rgba(255, 82, 82, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 82, 82, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 82, 82, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 绘制蛇
      snake.positions.forEach((pos, index) => {
        const isHead = index === 0;
        
        // 使用蛇自己的颜色，即使中毒也保持颜色，只是添加光晕效果
        ctx.fillStyle = isHead ? COLORS.snakeHead : snake.color;
        
        // 圆角矩形
        const x = pos.x * gridSize + 1;
        const y = pos.y * gridSize + 1;
        const w = gridSize - 2;
        const h = gridSize - 2;
        const radius = 4;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // 蛇头绘制眼睛
        if (isHead) {
          ctx.fillStyle = '#000';
          const eyeSize = 3;
          let eye1X, eye1Y, eye2X, eye2Y;
          
          switch (snake.direction) {
            case 'up':
              eye1X = x + 5;
              eye1Y = y + 5;
              eye2X = x + w - 5;
              eye2Y = y + 5;
              break;
            case 'down':
              eye1X = x + 5;
              eye1Y = y + h - 5;
              eye2X = x + w - 5;
              eye2Y = y + h - 5;
              break;
            case 'left':
              eye1X = x + 5;
              eye1Y = y + 5;
              eye2X = x + 5;
              eye2Y = y + h - 5;
              break;
            case 'right':
              eye1X = x + w - 5;
              eye1Y = y + 5;
              eye2X = x + w - 5;
              eye2Y = y + h - 5;
              break;
          }
          
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 绘制暂停/死亡遮罩
      if (isPaused || isDead) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = COLORS.textPrimary;
        ctx.font = 'bold 32px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isDead) {
          ctx.fillText('游戏结束', width / 2, height / 2);
        } else {
          ctx.fillText('游戏暂停', width / 2, height / 2);
          ctx.font = '16px Microsoft YaHei';
          ctx.fillStyle = COLORS.textSecondary;
          ctx.fillText('按空格键继续', width / 2, height / 2 + 40);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [snake, foods, effects, width, height, isPaused, isDead, gridSize, customMap]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: '12px',
        border: `2px solid ${COLORS.primary}`,
        boxShadow: `0 0 40px rgba(78, 205, 196, 0.15)`
      }}
    />
  );
};
