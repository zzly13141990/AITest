import React from 'react';
import { GameEndedData } from '../types/battle';
import { COLORS } from '../constants/battle';

interface BattleResultPageProps {
  result: GameEndedData;
  onBackToRoom: () => void;
  onBackToLobby: () => void;
}

export const BattleResultPage: React.FC<BattleResultPageProps> = ({
  result,
  onBackToRoom,
  onBackToLobby,
}) => {
  // 按分数排序
  const sortedPlayers = [...result.finalStats].sort((a, b) => b.score - a.score);
  
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* 胜利标题 */}
        <div style={styles.titleSection}>
          <div style={styles.trophy}>🏆</div>
          <h1 style={styles.title}>
            {result.winnerName} 获胜！
          </h1>
        </div>
        
        {/* 玩家排名 */}
        <div style={styles.rankingsSection}>
          <h2 style={styles.sectionTitle}>最终排名</h2>
          <div style={styles.rankings}>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.playerId}
                style={{
                  ...styles.playerRank,
                  borderColor: index === 0 ? COLORS.primary : COLORS.border,
                  backgroundColor: index === 0 ? COLORS.card : 'transparent',
                }}
              >
                <div style={{
                  ...styles.rankNumber,
                  color: index === 0 ? COLORS.primary : COLORS.textSecondary,
                }}>
                  #{index + 1}
                </div>
                <div style={styles.playerInfo}>
                  <div style={styles.playerName}>{player.playerName}</div>
                  <div style={styles.playerScore}>{player.score} 分</div>
                </div>
                {index === 0 && (
                  <div style={styles.winnerBadge}>WINNER</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div style={styles.buttonsSection}>
          <button style={styles.secondaryButton} onClick={onBackToRoom}>
            返回房间
          </button>
          <button style={styles.secondaryButton} onClick={onBackToLobby}>
            返回大厅
          </button>
        </div>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  content: {
    width: '100%',
    maxWidth: '600px',
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  trophy: {
    fontSize: '80px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  rankingsSection: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  rankings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  playerRank: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    borderRadius: '16px',
    border: '2px solid',
  },
  rankNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    width: '60px',
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  playerScore: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  winnerBadge: {
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: COLORS.primary,
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  buttonsSection: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '16px 48px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondaryButton: {
    padding: '16px 48px',
    backgroundColor: 'transparent',
    color: COLORS.text,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
