import React, { useEffect, useRef, useState } from 'react';
import { GameState, BattlePlayer, BattleItemType, Direction } from '../types/battle';
import { BATTLE_CONFIG, COLORS, PLAYER_COLORS, ITEM_ICONS, ITEM_NAMES } from '../constants/battle';

interface BattleGamePageProps {
  gameState: GameState;
  currentPlayer: BattlePlayer;
  isPaused?: boolean;
  pauseRequest?: any;
  onMove: (direction: Direction) => void;
  onUseItem: (itemId: string, targetPlayerId?: string) => void;
  onExitGame: () => void;
  requestPause: () => void;
  confirmPause: () => void;
  requestResume: () => void;
  confirmResume: () => void;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  toggleMusic: () => void;
  toggleEffects: () => void;
}

export const BattleGamePage: React.FC<BattleGamePageProps> = ({
  gameState,
  currentPlayer,
  isPaused,
  pauseRequest,
  onMove,
  onUseItem,
  onExitGame,
  requestPause,
  confirmPause,
  requestResume,
  confirmResume,
  musicEnabled,
  effectsEnabled,
  toggleMusic,
  toggleEffects,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectingTarget, setSelectingTarget] = useState(false);
  
  // 计算画布尺寸
  const canvasWidth = (gameState.gridWidth || BATTLE_CONFIG.GRID_WIDTH) * BATTLE_CONFIG.CELL_SIZE;
  const canvasHeight = (gameState.gridHeight || BATTLE_CONFIG.GRID_HEIGHT) * BATTLE_CONFIG.CELL_SIZE;

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) {
        // 暂停时的处理
        if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'enter') {
          if (pauseRequest && pauseRequest.fromPlayerId !== currentPlayer.id && !pauseRequest.confirmedBy.includes(currentPlayer.id)) {
            if (isPaused) {
              confirmResume();
            } else {
              confirmPause();
            }
          }
        }
        return;
      }
      
      if (currentPlayer.isFrozen || !currentPlayer.isAlive) return;
      
      switch (e.key.toLowerCase()) {
        case 'p':
          if (isPaused) {
            if (pauseRequest && pauseRequest.fromPlayerId === currentPlayer.id) {
              // 如果是自己发起的，按P无效
              return;
            }
            if (!pauseRequest.confirmedBy.includes(currentPlayer.id)) {
              confirmResume();
            }
          } else {
            if (!pauseRequest) {
              requestPause();
            } else if (pauseRequest.fromPlayerId !== currentPlayer.id && !pauseRequest.confirmedBy.includes(currentPlayer.id)) {
              confirmPause();
            }
          }
          break;
        case 'w':
        case 'arrowup':
          onMove('up');
          break;
        case 's':
        case 'arrowdown':
          onMove('down');
          break;
        case 'a':
        case 'arrowleft':
          onMove('left');
          break;
        case 'd':
        case 'arrowright':
          onMove('right');
          break;
        case '1':
          tryUseItem(0);
          break;
        case '2':
          tryUseItem(1);
          break;
        case '3':
          tryUseItem(2);
          break;
        case 'escape':
          if (selectingTarget) {
            setSelectedItem(null);
            setSelectingTarget(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove, currentPlayer, isPaused, pauseRequest, confirmPause, confirmResume, requestPause, requestResume, selectingTarget]);

  // 渲染游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = BATTLE_CONFIG.CELL_SIZE;
    const gridWidth = gameState.gridWidth || BATTLE_CONFIG.GRID_WIDTH;
    const gridHeight = gameState.gridHeight || BATTLE_CONFIG.GRID_HEIGHT;
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, gridHeight * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(gridWidth * cellSize, y * cellSize);
      ctx.stroke();
    }

    // 绘制墙壁
    ctx.fillStyle = '#FF5252';
    gameState.walls?.forEach((wall) => {
      ctx.fillRect(
        wall.x * cellSize + 1,
        wall.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });

    // 绘制障碍物
    ctx.fillStyle = '#FF9800';
    gameState.obstacles?.forEach((obstacle) => {
      ctx.fillRect(
        obstacle.x * cellSize + 1,
        obstacle.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });

    // 绘制食物
    gameState.foods.forEach((food) => {
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // 绘制玩家
    gameState.players.forEach((player, index) => {
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
      
      if (!player.isAlive) {
        // 死亡玩家半透明
        ctx.globalAlpha = 0.3;
      }
      
      // 绘制蛇
      player.snake.forEach((segment, i) => {
        if (i === player.snake.length - 1) {
          // 蛇头 - 添加效果
          ctx.fillStyle = color;
          
          // 绘制蛇头主体
          ctx.fillRect(
            segment.x * cellSize + 1,
            segment.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
          );
          
          // 添加蛇头发光效果
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.fillRect(
            segment.x * cellSize + 1,
            segment.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
          );
          ctx.shadowBlur = 0;
          
          // 添加蛇眼
          const eyeSize = cellSize / 6;
          let eyeX1 = segment.x * cellSize + cellSize / 3;
          let eyeX2 = segment.x * cellSize + cellSize * 2 / 3;
          let eyeY = segment.y * cellSize + cellSize / 3;
          
          if (player.direction === 'left') {
            eyeX1 = segment.x * cellSize + cellSize / 6;
            eyeX2 = segment.x * cellSize + cellSize / 6;
            eyeY = segment.y * cellSize + cellSize / 3;
          } else if (player.direction === 'right') {
            eyeX1 = segment.x * cellSize + cellSize * 5 / 6;
            eyeX2 = segment.x * cellSize + cellSize * 5 / 6;
            eyeY = segment.y * cellSize + cellSize / 3;
          } else if (player.direction === 'up') {
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + cellSize * 2 / 3;
            eyeY = segment.y * cellSize + cellSize / 6;
          } else if (player.direction === 'down') {
            eyeX1 = segment.x * cellSize + cellSize / 3;
            eyeX2 = segment.x * cellSize + cellSize * 2 / 3;
            eyeY = segment.y * cellSize + cellSize * 5 / 6;
          }
          
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(eyeX1, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.arc(eyeX2, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(eyeX1, eyeY, eyeSize / 2, 0, Math.PI * 2);
          ctx.arc(eyeX2, eyeY, eyeSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
        } else {
          // 蛇身
          ctx.fillStyle = color + '99';
          
          ctx.fillRect(
            segment.x * cellSize + 2,
            segment.y * cellSize + 2,
            cellSize - 4,
            cellSize - 4
          );
        }
      });
      
      // 冰冻效果
      if (player.isFrozen) {
        const head = player.snake[player.snake.length - 1];
        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          head.x * cellSize - 2,
          head.y * cellSize - 2,
          cellSize + 4,
          cellSize + 4
        );
      }
      
      // 反向控制效果
      if (player.isReversed) {
        const head = player.snake[player.snake.length - 1];
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          head.x * cellSize - 2,
          head.y * cellSize - 2,
          cellSize + 4,
          cellSize + 4
        );
        ctx.setLineDash([]);
      }
      
      ctx.globalAlpha = 1;
    });
  }, [gameState]);

  // 尝试使用道具
  const tryUseItem = (index: number) => {
    if (index >= currentPlayer.items.length) return;
    
    const item = currentPlayer.items[index];
    if (!item || item.count <= 0) return;
    
    // 判断是否需要选择目标
    const needsTarget = ['freeze', 'grow', 'reverse'].includes(item.type);
    
    if (needsTarget) {
      setSelectedItem(item.id);
      setSelectingTarget(true);
    } else {
      onUseItem(item.id);
    }
  };

  // 选择目标玩家
  const selectTarget = (targetPlayerId: string) => {
    if (!selectedItem) return;
    
    onUseItem(selectedItem, targetPlayerId);
    setSelectedItem(null);
    setSelectingTarget(false);
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.ceil(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取玩家颜色
  const getPlayerColor = (index: number): string => {
    return PLAYER_COLORS[index % PLAYER_COLORS.length];
  };

  return (
    <div style={styles.container}>
      {/* 暂停覆盖层 */}
      {(isPaused || pauseRequest) && (
        <div style={styles.pauseOverlay}>
          <div style={styles.pauseModal}>
            <h2 style={styles.pauseTitle}>
              {isPaused ? '⏸️ 游戏已暂停' : '⏸️ 暂停请求'}
            </h2>
            {pauseRequest && (
              <div style={styles.pauseRequestInfo}>
                <p>
                  <strong>{pauseRequest.fromPlayerName}</strong> 发起了{isPaused ? '恢复游戏' : '暂停'}请求
                </p>
                <div style={styles.pauseConfirmations}>
                  已确认：
                  {gameState.players.map((player) => (
                    <span
                      key={player.id}
                      style={{
                        ...styles.confirmationBadge,
                        backgroundColor: pauseRequest.confirmedBy.includes(player.id)
                          ? COLORS.success
                          : COLORS.border,
                      }}
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.pauseActions}>
              {pauseRequest &&
                pauseRequest.fromPlayerId !== currentPlayer.id &&
                !pauseRequest.confirmedBy.includes(currentPlayer.id) && (
                  <button
                    style={styles.confirmButton}
                    onClick={isPaused ? confirmResume : confirmPause}
                  >
                    {isPaused ? '确认恢复' : '确认暂停'} (P/Enter)
                  </button>
                )}
              {!pauseRequest && !isPaused && (
                <button style={styles.confirmButton} onClick={requestPause}>
                  请求暂停 (P)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 顶部状态栏 */}
      <div style={styles.header}>
        <div style={styles.playersInfo}>
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              style={{
                ...styles.playerInfo,
                borderColor: currentPlayer.id === player.id ? COLORS.primary : 'transparent',
                opacity: !player.isAlive ? 0.5 : 1,
              }}
            >
              <div style={{
                ...styles.playerColorDot,
                backgroundColor: getPlayerColor(index),
              }} />
              <div style={styles.playerDetails}>
                <div style={styles.playerName}>
                  {player.name}
                  {player.isHost && <span style={styles.hostBadge}>房主</span>}
                  {currentPlayer.id === player.id && <span style={styles.youBadge}>你</span>}
                  {!player.isAlive && <span style={styles.deadBadge}>已淘汰</span>}
                  {player.hasSpeedBoost && <span style={styles.speedBoostBadge}>⚡ 速度+20%</span>}
                </div>
                <div style={styles.playerScore}>
                  得分：{player.score}
                </div>
              </div>
              {selectingTarget && player.id !== currentPlayer.id && player.isAlive && (
                <button
                  style={styles.targetButton}
                  onClick={() => selectTarget(player.id)}
                >
                  选作目标
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div style={styles.timeInfo}>
          <div style={styles.timeLabel}>剩余时间</div>
          <div style={styles.timeValue}>{formatTime(gameState.timeRemaining)}</div>
        </div>
        
        <div style={styles.headerButtons}>
          <button
            style={{
              ...styles.toggleButton,
              backgroundColor: musicEnabled ? COLORS.success : COLORS.danger,
            }}
            onClick={toggleMusic}
          >
            {musicEnabled ? '🔊 音乐' : '🔇 音乐'}
          </button>
          <button
            style={{
              ...styles.toggleButton,
              backgroundColor: effectsEnabled ? COLORS.success : COLORS.danger,
            }}
            onClick={toggleEffects}
          >
            {effectsEnabled ? '✨ 特效' : '❌ 特效'}
          </button>
          <button style={styles.leaveButton} onClick={onExitGame}>
            返回房间
          </button>
        </div>
      </div>

      {/* 游戏画布 */}
      <div style={styles.gameArea}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={styles.canvas}
        />
      </div>

      {/* 底部道具栏 */}
      <div style={styles.footer}>
        <div style={styles.itemsLabel}>道具栏</div>
        <div style={styles.itemsContainer}>
          {[0, 1, 2].map((index) => {
            const item = currentPlayer.items[index];
            const hasItem = item && item.count > 0;
            
            return (
              <div
                key={index}
                style={{
                  ...styles.itemSlot,
                  borderColor: selectedItem === item?.id ? COLORS.primary : COLORS.border,
                  opacity: hasItem ? 1 : 0.4,
                }}
                onClick={() => hasItem && tryUseItem(index)}
              >
                {hasItem ? (
                  <>
                    <div style={styles.itemIcon}>
                      {ITEM_ICONS[item.type as BattleItemType]}
                    </div>
                    <div style={styles.itemName}>
                      {ITEM_NAMES[item.type as BattleItemType]}
                    </div>
                    <div style={styles.itemCount}>×{item.count}</div>
                    <div style={styles.itemKey}>{index + 1}</div>
                  </>
                ) : (
                  <div style={styles.emptyItem}>空</div>
                )}
              </div>
            );
          })}
        </div>
        
        {selectingTarget && (
          <button
            style={styles.cancelTargetButton}
            onClick={() => {
              setSelectedItem(null);
              setSelectingTarget(false);
            }}
          >
            取消选择
          </button>
        )}
      </div>
    </div>
  );
};

// 样式
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    color: COLORS.text,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.border}`,
    flexWrap: 'wrap',
    gap: '16px',
  },
  playersInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: COLORS.background,
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid',
  },
  playerColorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hostBadge: {
    fontSize: '10px',
    backgroundColor: COLORS.warning,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  youBadge: {
    fontSize: '10px',
    backgroundColor: COLORS.primary,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  deadBadge: {
    fontSize: '10px',
    backgroundColor: COLORS.danger,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  playerScore: {
    fontSize: '12px',
    color: COLORS.textSecondary,
  },
  targetButton: {
    padding: '6px 12px',
    backgroundColor: COLORS.warning,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  timeInfo: {
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    marginBottom: '4px',
  },
  timeValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  leaveButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  canvas: {
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    backgroundColor: COLORS.background,
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: COLORS.card,
    borderTop: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  itemsLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  itemsContainer: {
    display: 'flex',
    gap: '16px',
    flex: 1,
  },
  itemSlot: {
    width: '100px',
    height: '120px',
    backgroundColor: COLORS.background,
    borderRadius: '12px',
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    cursor: 'pointer',
    position: 'relative',
  },
  itemIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  itemName: {
    fontSize: '12px',
    textAlign: 'center',
    marginBottom: '4px',
  },
  itemCount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  itemKey: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    fontSize: '12px',
    backgroundColor: COLORS.border,
    color: COLORS.textSecondary,
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItem: {
    fontSize: '14px',
    color: COLORS.textMuted,
  },
  cancelTargetButton: {
    padding: '10px 20px',
    backgroundColor: COLORS.danger,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
