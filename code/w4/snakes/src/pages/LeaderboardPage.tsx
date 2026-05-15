import { useState, useEffect } from 'react';
import { LeaderboardRecord, GameMode, Difficulty } from '../types';
import { storageService } from '../services/storageService';
import { COLORS } from '../constants';
import '../index.css';

interface LeaderboardPageProps {
  onBack: () => void;
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameMode | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [selectedMode, selectedDifficulty]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await storageService.getLeaderboard(
        selectedMode === 'all' ? undefined : selectedMode,
        selectedDifficulty === 'all' ? undefined : selectedDifficulty
      );
      setRecords(data);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (index: number): string => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getRankStyle = (index: number): React.CSSProperties => {
    if (index === 0) return { borderColor: '#FFD700', borderWidth: '2px' };
    if (index === 1) return { borderColor: '#C0C0C0', borderWidth: '2px' };
    if (index === 2) return { borderColor: '#CD7F32', borderWidth: '2px' };
    return {};
  };

  return (
    <div className="page-container">
      <div className="game-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="secondary-button" onClick={onBack}>← 返回</button>
          <h1 style={{ margin: 0, color: COLORS.textPrimary }}>🏆 排行榜</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* 筛选器 */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: COLORS.textSecondary, marginBottom: '8px', display: 'block', fontSize: '14px' }}>模式</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'single', 'double'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: `2px solid ${selectedMode === mode ? COLORS.primary : COLORS.border}`,
                    background: selectedMode === mode ? COLORS.primary : 'transparent',
                    color: selectedMode === mode ? '#fff' : COLORS.textPrimary,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {mode === 'all' ? '全部' : mode === 'single' ? '单人' : '双人'}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ color: COLORS.textSecondary, marginBottom: '8px', display: 'block', fontSize: '14px' }}>难度</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'normal', 'hard', 'superHard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: `2px solid ${selectedDifficulty === diff ? COLORS.primary : COLORS.border}`,
                    background: selectedDifficulty === diff ? COLORS.primary : 'transparent',
                    color: selectedDifficulty === diff ? '#fff' : COLORS.textPrimary,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {diff === 'all' ? '全部' : diff === 'normal' ? '普通' : diff === 'hard' ? '困难' : '超困难'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 排行榜列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
            加载中...
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
            暂无记录，快去游戏吧！
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {records.map((record, index) => (
              <div
                key={record.id}
                className="leaderboard-item"
                style={{
                  ...getRankStyle(index),
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: COLORS.cardBackground,
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div style={{ 
                  fontSize: index < 3 ? '24px' : '18px', 
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {getRankIcon(index)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>
                    {record.playerName}
                  </div>
                  <div style={{ color: COLORS.textTertiary, fontSize: '12px' }}>
                    {record.mode === 'single' ? '单人' : '双人'} · 
                    {record.difficulty === 'normal' ? '普通' : record.difficulty === 'hard' ? '困难' : '超困难'}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: COLORS.primary, fontSize: '20px', fontWeight: 'bold' }}>
                    {record.score.toLocaleString()} 分
                  </div>
                  <div style={{ color: COLORS.textTertiary, fontSize: '12px' }}>
                    {formatTime(record.survivalTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 清空按钮 */}
        {records.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => {
                if (confirm('确定要清空排行榜吗？')) {
                  storageService.clearLeaderboard();
                  loadRecords();
                }
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.danger}`,
                background: 'transparent',
                color: COLORS.danger,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              清空排行榜
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
