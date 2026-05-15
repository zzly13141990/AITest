import React from 'react';
import { Player } from '../types';
import { COLORS } from '../constants';
import { formatTime } from '../utils';

interface EndPageProps {
  players: Player[];
  isWin: boolean;
  onRestart: () => void;
  onBack: () => void;
  onShowLeaderboard?: () => void;
  onShowAchievements?: () => void;
}

export const EndPage: React.FC<EndPageProps> = ({
  players,
  isWin,
  onRestart,
  onBack,
  onShowLeaderboard,
  onShowAchievements
}) => {
  return (
    <div className="page-container end-page">
      <div className="end-card">
        <h1 
          className="end-title" 
          style={{ color: isWin ? COLORS.success : COLORS.danger }}
        >
          {isWin ? '恭喜通关！' : '游戏结束'}
        </h1>
        
        <div className="results-container">
          {players.map((player) => (
            <div key={player.id} className="player-result">
              <h2 className="player-name">{player.name}</h2>
              
              <div className="score-display">
                <span className="score-label">总得分</span>
                <span className="score-value">{player.score}</span>
              </div>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">总生存时间</span>
                  <span className="stat-value">{formatTime(player.survivalTime)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">到达关卡</span>
                  <span className="stat-value">{player.level.major}-{player.level.minor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {players.length === 2 && (
          <div className="vs-result">
            {players[0].score > players[1].score ? (
              <p style={{ color: COLORS.primary }}>🎉 {players[0].name} 获胜！</p>
            ) : players[0].score < players[1].score ? (
              <p style={{ color: COLORS.primary }}>🎉 {players[1].name} 获胜！</p>
            ) : (
              <p style={{ color: COLORS.warning }}>🤝 平局！</p>
            )}
          </div>
        )}

        {/* 功能按钮 */}
        {(onShowLeaderboard || onShowAchievements) && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            justifyContent: 'center'
          }}>
            {onShowLeaderboard && (
              <button
                type="button"
                onClick={onShowLeaderboard}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.primary}`,
                  background: 'transparent',
                  color: COLORS.primary,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🏆 排行榜
              </button>
            )}
            {onShowAchievements && (
              <button
                type="button"
                onClick={onShowAchievements}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.primary}`,
                  background: 'transparent',
                  color: COLORS.primary,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🎖️ 成就
              </button>
            )}
          </div>
        )}
        
        <div className="end-buttons">
          <button className="btn btn-primary btn-large" onClick={onRestart}>
            再来一局
          </button>
          <button className="btn btn-secondary btn-large" onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};
