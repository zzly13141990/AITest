import React, { useRef, useEffect } from 'react';
import { Room, BattlePlayer, CustomMap } from '../types/battle';
import { COLORS } from '../constants/battle';

interface BattleRoomPageProps {
  room: Room;
  currentPlayer: BattlePlayer;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSelectMap?: (map: CustomMap | null) => void;
  customMaps?: CustomMap[];
}

export const BattleRoomPage: React.FC<BattleRoomPageProps> = ({
  room,
  currentPlayer,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  onSelectMap,
  customMaps = [],
}) => {
  console.log('🎮 BattleRoomPage rendering', { room, currentPlayer });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const players = Array.from(room.players.values());
  console.log('👥 Players list:', players);
  
  const isHost = currentPlayer.isHost;
  const allReady = players.filter(p => !p.isSpectator).every(p => p.isReady);
  const enoughPlayers = players.filter(p => !p.isSpectator).length >= 2;
  const canStart = isHost && allReady && enoughPlayers && room.status === 'waiting';

  // 找出胜场最多的玩家
  const nonSpectatorPlayers = players.filter(p => !p.isSpectator);
  let championPlayer = null;
  
  if (nonSpectatorPlayers.length > 0) {
    const maxWins = Math.max(...nonSpectatorPlayers.map(p => p.wins || 0));
    const playersWithMaxWins = nonSpectatorPlayers.filter(p => (p.wins || 0) === maxWins);
    
    // 只有唯一胜者时才显示皇冠
    if (playersWithMaxWins.length === 1) {
      championPlayer = playersWithMaxWins[0];
    }
  }

  // 绘制地图预览
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellSize = 15;
    const map = room.customMap;
    
    // 清空画布
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!map) {
      // 显示默认地图提示
      ctx.strokeStyle = COLORS.textSecondary;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.setLineDash([]);
      
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('默认地图 - 无限边界', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // 计算居中偏移
    const totalWidth = map.width * cellSize;
    const totalHeight = map.height * cellSize;
    const offsetX = (canvas.width - totalWidth) / 2;
    const offsetY = (canvas.height - totalHeight) / 2;
    
    // 绘制网格
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    for (let x = 0; x <= map.width; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cellSize, offsetY);
      ctx.lineTo(offsetX + x * cellSize, offsetY + totalHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= map.height; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * cellSize);
      ctx.lineTo(offsetX + totalWidth, offsetY + y * cellSize);
      ctx.stroke();
    }
    
    // 绘制墙壁
    ctx.fillStyle = '#FF5252';
    map.walls.forEach(wall => {
      ctx.fillRect(
        offsetX + wall.x * cellSize + 1,
        offsetY + wall.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
    
    // 绘制障碍物
    ctx.fillStyle = '#FF9800';
    map.obstacles.forEach(obstacle => {
      ctx.fillRect(
        offsetX + obstacle.x * cellSize + 1,
        offsetY + obstacle.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
    
    // 绘制边界（显示不可穿越）
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, totalWidth, totalHeight);
  }, [room.customMap]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  const getPlayerColor = (_index: number): string => {
    return COLORS.primary;
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <button style={styles.leaveButton} onClick={onLeaveRoom}>
          ← 离开房间
        </button>
        <div style={styles.roomInfo}>
          <h1 style={styles.roomName}>
            {room.hasPassword && <span style={styles.lockIcon}>🔒</span>}
            {room.name}
          </h1>
          <div style={styles.roomId}>房间号：{room.id}</div>
        </div>
        <div style={styles.roomSettings}>
          <div style={styles.settingItem}>
            <span style={styles.settingLabel}>时长：</span>
            <span style={styles.settingValue}>{formatDuration(room.gameDuration)}</span>
          </div>
          <div style={styles.settingItem}>
            <span style={styles.settingLabel}>人数：</span>
            <span style={styles.settingValue}>{players.length}/2</span>
          </div>
        </div>
      </div>

      {/* 地图选择区域 */}
      {isHost && onSelectMap && (
        <div style={styles.mapSelector}>
          <h3 style={styles.mapSelectorTitle}>🗺️ 选择地图</h3>
          <div style={styles.mapList}>
            <button
              style={{
                ...styles.mapItem,
                borderColor: !room.customMap ? COLORS.primary : COLORS.border,
              }}
              onClick={() => onSelectMap(null)}
            >
              <span style={styles.mapIcon}>🏞️</span>
              <span style={styles.mapName}>默认地图</span>
            </button>
            {customMaps.map((map) => (
              <button
                key={map.id}
                style={{
                  ...styles.mapItem,
                  borderColor: room.customMap?.id === map.id ? COLORS.primary : COLORS.border,
                }}
                onClick={() => onSelectMap(map)}
              >
                <span style={styles.mapIcon}>🗺️</span>
                <span style={styles.mapName}>{map.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 地图信息显示 */}
      {room.customMap && (
        <div style={styles.mapInfo}>
          <span style={styles.mapInfoLabel}>当前地图：</span>
          <span style={styles.mapInfoValue}>{room.customMap.name}</span>
        </div>
      )}

      {/* 主内容 */}
      <div style={styles.mainContent}>
        {/* 玩家列表和地图预览 */}
        <div style={styles.leftColumn}>
          <div style={styles.playersSection}>
            <h2 style={styles.sectionTitle}>玩家列表</h2>
            
            <div style={styles.playersGrid}>
              {/* 固定显示2个位置 */}
              {[0, 1].map((slotIndex) => {
                const player = players[slotIndex];
                if (player) {
                  return (
                    <div
                      key={player.id}
                      style={{
                        ...styles.playerCard,
                        borderColor: currentPlayer.id === player.id ? COLORS.primary : COLORS.border,
                        position: 'relative',
                      }}
                    >
                      {/* 皇冠图标 - 放在右上角外面 */}
                      {championPlayer && championPlayer.id === player.id && (
                        <div style={styles.crownContainer}>
                          <span style={styles.crownIcon}>👑</span>
                        </div>
                      )}
                      
                      <div style={styles.playerHeader}>
                        <div
                          style={{
                            ...styles.playerAvatar,
                            backgroundColor: getPlayerColor(slotIndex),
                          }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.playerInfo}>
                          <div style={styles.playerName}>
                            {player.name}
                            {player.isHost && <span style={styles.hostBadge}>房主</span>}
                            {currentPlayer.id === player.id && <span style={styles.youBadge}>你</span>}
                          </div>
                          <div style={styles.playerStatus}>
                            {player.isSpectator ? (
                              <span style={styles.spectatorText}>观战</span>
                            ) : player.isReady ? (
                              <span style={styles.readyText}>已准备</span>
                            ) : (
                              <span style={styles.notReadyText}>未准备</span>
                            )}
                          </div>
                          <div style={styles.playerStats}>
                            <span style={styles.winsText}>胜: {player.wins || 0}</span>
                            <span style={styles.lossesText}>负: {player.losses || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={styles.readyIndicator}>
                        <div style={{
                          ...styles.readyDot,
                          backgroundColor: player.isReady ? COLORS.success : COLORS.textMuted,
                        }} />
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={`empty-${slotIndex}`} style={styles.emptySlot}>
                      <div style={styles.emptyIcon}>+</div>
                      <div style={styles.emptyText}>等待加入...</div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          
          {/* 地图预览 */}
          <div style={styles.mapPreviewSection}>
            <h3 style={styles.mapPreviewTitle}>地图预览</h3>
            <div style={styles.mapPreviewContainer}>
              <canvas
                ref={canvasRef}
                width={250}
                height={200}
                style={styles.mapCanvas}
              />
            </div>
          </div>
        </div>

        {/* 游戏说明 */}
        <div style={styles.infoSection}>
          <h2 style={styles.sectionTitle}>游戏说明</h2>
          <div style={styles.infoContent}>
            <ul style={styles.infoList}>
              <li>使用方向键或 WASD 控制蛇的移动</li>
              <li>吃到普通食物得 10 分</li>
              <li>吃到道具食物可以获得特殊道具</li>
              <li>使用数字键 1-3 使用道具</li>
              <li>碰撞墙壁、自己或其他玩家会被淘汰</li>
              <li>游戏时间结束时，分数最高者获胜</li>
            </ul>
            
            <div style={styles.itemsPreview}>
              <div style={styles.itemPreviewTitle}>道具说明</div>
              <div style={styles.itemList}>
                <div style={styles.item}>
                  <span style={styles.itemIcon}>❄️</span>
                  <span style={styles.itemName}>冰冻弹</span>
                  <span style={styles.itemDesc}>冻结目标3秒</span>
                </div>
                <div style={styles.item}>
                  <span style={styles.itemIcon}>🐍</span>
                  <span style={styles.itemName}>增长术</span>
                  <span style={styles.itemDesc}>使目标增长5节</span>
                </div>
                <div style={styles.item}>
                  <span style={styles.itemIcon}>🌫️</span>
                  <span style={styles.itemName}>迷雾弹</span>
                  <span style={styles.itemDesc}>缩小目标视野</span>
                </div>
                <div style={styles.item}>
                  <span style={styles.itemIcon}>⚡</span>
                  <span style={styles.itemName}>加速符</span>
                  <span style={styles.itemDesc}>自己加速5秒</span>
                </div>
                <div style={styles.item}>
                  <span style={styles.itemIcon}>🔄</span>
                  <span style={styles.itemName}>混乱术</span>
                  <span style={styles.itemDesc}>反向控制3秒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div style={styles.footer}>
        {!currentPlayer.isSpectator && (
          <button
            style={{
              ...styles.readyButton,
              backgroundColor: currentPlayer.isReady ? COLORS.success : COLORS.primary,
            }}
            onClick={onToggleReady}
          >
            {currentPlayer.isReady ? '取消准备' : '准备'}
          </button>
        )}
        
        {isHost && (
          <button
            style={{
              ...styles.startButton,
              opacity: canStart ? 1 : 0.5,
            }}
            onClick={onStartGame}
            disabled={!canStart}
          >
            开始游戏
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
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  leaveButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.text,
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
  },
  roomInfo: {
    flex: 1,
    textAlign: 'center',
  },
  roomName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: COLORS.text,
  },
  lockIcon: {
    fontSize: '18px',
  },
  roomId: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  roomSettings: {
    display: 'flex',
    gap: '24px',
  },
  settingItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: '12px',
    color: COLORS.textSecondary,
  },
  settingValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: COLORS.text,
  },
  mapSelector: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  mapSelectorTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
    color: COLORS.text,
  },
  mapList: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  mapItem: {
    backgroundColor: COLORS.background,
    border: '2px solid',
    borderRadius: '8px',
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    color: COLORS.text,
  },
  mapIcon: {
    fontSize: '20px',
  },
  mapName: {
    fontSize: '14px',
    color: COLORS.text,
  },
  mapInfo: {
    backgroundColor: COLORS.card,
    borderRadius: '8px',
    padding: '12px 20px',
    marginBottom: '20px',
    display: 'inline-block',
    alignSelf: 'flex-start',
  },
  mapInfoLabel: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  mapInfoValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  playersSection: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '24px',
  },
  mapPreviewSection: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '20px',
  },
  mapPreviewTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    color: COLORS.text,
  },
  mapPreviewContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: '12px',
    padding: '16px',
  },
  mapCanvas: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    color: COLORS.text,
  },
  playersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  playerCard: {
    backgroundColor: COLORS.background,
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  playerAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.text,
  },
  hostBadge: {
    fontSize: '12px',
    backgroundColor: COLORS.warning,
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  youBadge: {
    fontSize: '12px',
    backgroundColor: COLORS.primary,
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  crownContainer: {
    position: 'absolute',
    top: '-30px',
    right: '-20px',
    zIndex: 10,
    transform: 'rotate(35deg)',
  },
  crownIcon: {
    fontSize: '32px',
    filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
  },
  playerStatus: {
    fontSize: '14px',
    marginBottom: '6px',
  },
  playerStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
  },
  winsText: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  lossesText: {
    color: COLORS.textMuted,
  },
  readyText: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  notReadyText: {
    color: COLORS.textMuted,
  },
  spectatorText: {
    color: COLORS.textSecondary,
  },
  readyIndicator: {
    display: 'flex',
    alignItems: 'center',
  },
  readyDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
  emptySlot: {
    backgroundColor: COLORS.background,
    borderRadius: '12px',
    padding: '20px',
    border: `2px dashed ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: '14px',
    color: COLORS.textMuted,
  },
  infoSection: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '24px',
  },
  infoContent: {
    fontSize: '14px',
    lineHeight: '1.8',
  },
  infoList: {
    margin: '0 0 24px 0',
    paddingLeft: '20px',
    color: COLORS.textSecondary,
  },
  itemsPreview: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  itemPreviewTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  itemList: {
    display: 'grid',
    gap: '12px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: COLORS.background,
    padding: '12px',
    borderRadius: '8px',
  },
  itemIcon: {
    fontSize: '20px',
  },
  itemName: {
    fontWeight: 'bold',
    width: '60px',
  },
  itemDesc: {
    color: COLORS.textSecondary,
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  readyButton: {
    padding: '16px 48px',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startButton: {
    padding: '16px 48px',
    backgroundColor: COLORS.success,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
