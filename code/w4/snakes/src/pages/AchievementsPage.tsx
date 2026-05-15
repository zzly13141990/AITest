import { useState, useEffect } from 'react';
import { Achievement } from '../types';
import { storageService } from '../services/storageService';
import { COLORS } from '../constants';
import '../index.css';

interface AchievementsPageProps {
  onBack: () => void;
}

type Category = 'all' | 'score' | 'skill' | 'collection';

export function AchievementsPage({ onBack }: AchievementsPageProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await storageService.getAchievements();
      setAchievements(data);
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
    setLoading(false);
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const categoryLabels: Record<Category, string> = {
    all: '全部',
    score: '得分类',
    skill: '技巧类',
    collection: '收集类'
  };

  return (
    <div className="page-container">
      <div className="game-card" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button className="secondary-button" onClick={onBack}>← 返回</button>
          <h1 style={{ margin: 0, color: COLORS.textPrimary }}>🏅 成就</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* 成就进度条 */}
        <div style={{ 
          background: COLORS.cardBackground, 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '24px',
          border: `1px solid ${COLORS.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>成就进度</span>
            <span style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: '24px' }}>
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div style={{
            height: '16px',
            background: COLORS.border,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
              borderRadius: '8px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        </div>

        {/* 分类标签 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {(['all', 'score', 'skill', 'collection'] as Category[]).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `2px solid ${selectedCategory === category ? COLORS.primary : COLORS.border}`,
                background: selectedCategory === category ? COLORS.primary : 'transparent',
                color: selectedCategory === category ? '#fff' : COLORS.textPrimary,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {/* 成就卡片网格 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
            加载中...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: COLORS.cardBackground,
                  border: `2px solid ${achievement.unlocked ? COLORS.achievementUnlocked : COLORS.border}`,
                  opacity: achievement.unlocked ? 1 : 0.6,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = achievement.unlocked 
                    ? `0 8px 24px rgba(78, 205, 196, 0.2)` 
                    : 'none';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 图标 */}
                <div style={{
                  fontSize: '48px',
                  textAlign: 'center',
                  marginBottom: '12px',
                  filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
                }}>
                  {achievement.icon}
                </div>

                {/* 名称 */}
                <div style={{
                  color: achievement.unlocked ? COLORS.textPrimary : COLORS.textTertiary,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '8px'
                }}>
                  {achievement.name}
                </div>

                {/* 描述 */}
                <div style={{
                  color: COLORS.textSecondary,
                  fontSize: '12px',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  {achievement.description}
                </div>

                {/* 进度条（如果有目标） */}
                {achievement.target && !achievement.unlocked && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      fontSize: '11px',
                      color: COLORS.textTertiary,
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      {achievement.progress || 0} / {achievement.target}
                    </div>
                    <div style={{
                      height: '6px',
                      background: COLORS.border,
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(((achievement.progress || 0) / achievement.target) * 100, 100)}%`,
                        background: COLORS.info,
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                )}

                {/* 解锁标记 */}
                {achievement.unlocked && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '16px'
                  }}>✓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredAchievements.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
            暂无该分类的成就
          </div>
        )}
      </div>
    </div>
  );
}
