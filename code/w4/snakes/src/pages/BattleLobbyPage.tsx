import React, { useState, useEffect } from 'react';
import { RoomInfo, CreateRoomData, JoinRoomData } from '../types/battle';
import { BATTLE_CONFIG, COLORS } from '../constants/battle';

// 随机昵称生成
const ADJECTIVES = [
  '勇敢的', '快速的', '聪明的', '可爱的', '强大的',
  '灵活的', '快乐的', '冷静的', '神秘的', '幸运的',
  '凶猛的', '温柔的', '调皮的', '优雅的', '华丽的',
  '勇敢的', '闪电的', '钢铁的', '钻石的', '风暴的',
  '火龙的', '水神的', '风雷的', '星空的', '月光的'
];

const NOUNS = [
  '小蛇', '大蛇', '蛇王', '青蛇', '白蛇',
  '蛇灵', '蛇仙', '蛇神', '蛇精', '蛇怪',
  '小龙', '小蟒', '灵蛇', '毒蛇', '无毒蛇',
  '贪吃蛇', '玩家', '战士', '猎手', '达人'
];

function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

interface BattleLobbyPageProps {
  roomList: RoomInfo[];
  isConnected: boolean;
  onCreateRoom: (data: CreateRoomData) => void;
  onJoinRoom: (data: JoinRoomData) => void;
  onBack: () => void;
  onReconnect?: () => void;
}

export const BattleLobbyPage: React.FC<BattleLobbyPageProps> = ({
  roomList,
  isConnected,
  onCreateRoom,
  onJoinRoom,
  onBack,
  onReconnect,
}) => {
  // 创建房间表单
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRoomName, setCreateRoomName] = useState('');
  const [createRoomPassword, setCreateRoomPassword] = useState('');
  const [createGameDuration, setCreateGameDuration] = useState(180);
  const [playerName, setPlayerName] = useState('');
  
  // 组件加载时自动生成随机昵称
  useEffect(() => {
    setPlayerName(generateRandomNickname());
  }, []);
  
  // 加入房间表单
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomPassword, setJoinRoomPassword] = useState('');
  const [showJoinModal, setShowJoinModal] = useState<RoomInfo | null>(null);

  const handleCreateRoom = () => {
    if (!createRoomName.trim() || !playerName.trim()) {
      return;
    }
    
    onCreateRoom({
      name: createRoomName.trim(),
      password: createRoomPassword.trim() || undefined,
      gameDuration: createGameDuration,
      maxPlayers: 2, // 固定为2人
      playerName: playerName.trim(),
    });
    
    setShowCreateModal(false);
  };

  const handleJoinRoom = () => {
    console.log('📤 handleJoinRoom called', { playerName, showJoinModal, joinRoomPassword });
    if (!playerName.trim() || !showJoinModal) {
      console.log('❌ Cannot join room - missing player name or room');
      return;
    }
    
    console.log('✅ Calling onJoinRoom with:', {
      roomId: showJoinModal.id,
      password: joinRoomPassword.trim() || undefined,
      playerName: playerName.trim(),
    });
    
    onJoinRoom({
      roomId: showJoinModal.id,
      password: joinRoomPassword.trim() || undefined,
      playerName: playerName.trim(),
    });
    
    setShowJoinModal(null);
    setJoinRoomPassword('');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← 返回
        </button>
        <h1 style={styles.title}>贪吃蛇对战大厅</h1>
        <div style={styles.connectionStatus}>
          <div style={{
            ...styles.statusDot,
            backgroundColor: isConnected ? COLORS.success : COLORS.danger,
          }} />
          <span style={styles.statusText}>
            {isConnected ? '已连接' : '连接断开'}
          </span>
          {!isConnected && onReconnect && (
            <button
              style={styles.reconnectButton}
              onClick={onReconnect}
            >
              重新连接
            </button>
          )}
        </div>
      </div>

      {/* 主内容 */}
      <div style={styles.mainContent}>
        {/* 操作区 */}
        <div style={styles.actionSection}>
          <div style={styles.playerNameInput}>
            <div style={styles.playerNameRow}>
              <label style={styles.label}>你的昵称</label>
              <button
                style={styles.refreshButton}
                onClick={() => setPlayerName(generateRandomNickname())}
              >
                🔄 换一个
              </button>
            </div>
            <input
              style={styles.input}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="请输入昵称"
              maxLength={20}
            />
          </div>
          
          <div style={styles.actionButtons}>
            <button
              style={styles.primaryButton}
              onClick={() => setShowCreateModal(true)}
              disabled={!isConnected || !playerName.trim()}
            >
              + 创建房间
            </button>
            
            <div style={styles.quickJoin}>
              <input
                style={styles.roomIdInput}
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="输入房间号"
                maxLength={6}
              />
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  if (joinRoomId.trim() && playerName.trim()) {
                    onJoinRoom({
                      roomId: joinRoomId.trim(),
                      password: undefined,
                      playerName: playerName.trim(),
                    });
                  }
                }}
                disabled={!isConnected || !joinRoomId.trim() || !playerName.trim()}
              >
                加入
              </button>
            </div>
          </div>
        </div>

        {/* 房间列表 */}
        <div style={styles.roomListSection}>
          <h2 style={styles.sectionTitle}>房间列表</h2>
          
          {roomList.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎮</div>
              <p style={styles.emptyText}>暂无房间，创建一个吧！</p>
            </div>
          ) : (
            <div style={styles.roomGrid}>
              {roomList.map((room) => (
                <div key={room.id} style={styles.roomCard}>
                  <div style={styles.roomHeader}>
                    <div style={styles.roomName}>
                      {room.hasPassword && <span style={styles.lockIcon}>🔒</span>}
                      {room.name}
                    </div>
                    <div style={styles.roomId}>#{room.id}</div>
                  </div>
                  
                  <div style={styles.roomInfo}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>房主：</span>
                      <span style={styles.infoValue}>{room.hostName}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>玩家：</span>
                      <span style={styles.infoValue}>
                        {room.playerCount}/2
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>时长：</span>
                      <span style={styles.infoValue}>{formatDuration(room.gameDuration)}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>状态：</span>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: room.status === 'waiting' ? COLORS.success : COLORS.warning,
                      }}>
                        {room.status === 'waiting' ? '等待中' : '游戏中'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    style={{
                      ...styles.joinRoomButton,
                      opacity: (room.status !== 'waiting' || room.playerCount >= 2) ? 0.5 : 1,
                    }}
                    onClick={() => {
                      console.log('📋 Clicked join room button for:', room);
                      setShowJoinModal(room);
                    }}
                    disabled={
                      room.status !== 'waiting' ||
                      room.playerCount >= 2 ||
                      !isConnected ||
                      !playerName.trim()
                    }
                  >
                    加入房间
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创建房间弹窗 */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>创建房间</h3>
              <button style={styles.closeButton} onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>房间名称</label>
                <input
                  style={styles.input}
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  placeholder="给房间起个名字"
                  maxLength={30}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>房间密码（可选）</label>
                <input
                  style={styles.input}
                  type="password"
                  value={createRoomPassword}
                  onChange={(e) => setCreateRoomPassword(e.target.value)}
                  placeholder="留空则不需要密码"
                  maxLength={20}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>游戏时长</label>
                <select
                  style={styles.select}
                  value={createGameDuration}
                  onChange={(e) => setCreateGameDuration(Number(e.target.value))}
                >
                  {BATTLE_CONFIG.GAME_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                style={styles.confirmButton}
                onClick={handleCreateRoom}
                disabled={!createRoomName.trim() || !playerName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加入房间弹窗 */}
      {showJoinModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJoinModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>加入房间</h3>
              <button style={styles.closeButton} onClick={() => setShowJoinModal(null)}>
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.roomPreview}>
                <div style={styles.previewName}>
                  {showJoinModal.hasPassword && <span style={styles.lockIcon}>🔒</span>}
                  {showJoinModal.name}
                </div>
                <div style={styles.previewInfo}>
                  房间号：{showJoinModal.id} | 玩家：{showJoinModal.playerCount}/{showJoinModal.maxPlayers}
                </div>
              </div>
              
              {showJoinModal.hasPassword && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>房间密码</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={joinRoomPassword}
                    onChange={(e) => setJoinRoomPassword(e.target.value)}
                    placeholder="请输入房间密码"
                  />
                </div>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowJoinModal(null)}>
                取消
              </button>
              <button style={styles.confirmButton} onClick={handleJoinRoom}>
                加入
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '30px',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.text,
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  reconnectButton: {
    padding: '4px 12px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: '8px',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  actionSection: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  playerNameInput: {
    marginBottom: '20px',
  },
  playerNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  refreshButton: {
    padding: '4px 12px',
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: COLORS.textSecondary,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '16px',
    outline: 'none',
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  primaryButton: {
    padding: '14px 32px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: COLORS.card,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickJoin: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    maxWidth: '400px',
  },
  roomIdInput: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '16px',
    outline: 'none',
    textAlign: 'center',
    letterSpacing: '4px',
  },
  roomListSection: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    margin: 0,
  },
  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  roomCard: {
    backgroundColor: COLORS.background,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${COLORS.border}`,
    transition: 'all 0.2s',
  },
  roomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  roomName: {
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  lockIcon: {
    fontSize: '14px',
  },
  roomId: {
    fontSize: '14px',
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  roomInfo: {
    marginBottom: '20px',
  },
  infoItem: {
    display: 'flex',
    marginBottom: '8px',
    fontSize: '14px',
  },
  infoLabel: {
    color: COLORS.textSecondary,
    width: '70px',
  },
  infoValue: {
    color: COLORS.text,
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  joinRoomButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: COLORS.text,
    fontSize: '28px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalContent: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '16px',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '10px 24px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  roomPreview: {
    backgroundColor: COLORS.background,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  previewName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  previewInfo: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
};
