import { useState, useEffect } from 'react';
import { GameConfig, GameMode, Difficulty, AudioConfig, CustomMap } from '../types';
import { TIME_OPTIONS, COLORS } from '../constants';
import { storageService } from '../services/storageService';

interface ConfigPageProps {
  onStart: (config: GameConfig) => void;
  onShowLeaderboard?: () => void;
  onShowAchievements?: () => void;
  customMaps?: CustomMap[];
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ 
  onStart, 
  onShowLeaderboard, 
  onShowAchievements,
  customMaps = [],
}) => {
  const [mode, setMode] = useState<GameMode>('single');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [levelTime, setLevelTime] = useState(240);
  const [player1Name, setPlayer1Name] = useState('玩家1');
  const [player2Name, setPlayer2Name] = useState('玩家2');
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    musicEnabled: true,
    soundEnabled: true,
    volume: 0.5
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [selectedMap, setSelectedMap] = useState<CustomMap | null>(null);
  
  // 加载音频配置
  useEffect(() => {
    storageService.getAudioConfig().then(config => {
      setAudioConfig(config);
    });
  }, []);
  
  // 保存音频配置
  const handleAudioConfigChange = (newConfig: Partial<AudioConfig>) => {
    const updatedConfig = { ...audioConfig, ...newConfig };
    setAudioConfig(updatedConfig);
    storageService.saveAudioConfig(updatedConfig);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!player1Name.trim()) {
      newErrors.player1Name = '请输入玩家1称号';
    } else if (player1Name.length > 20) {
      newErrors.player1Name = '称号长度不能超过20个字符';
    }
    
    if (mode === 'double') {
      if (!player2Name.trim()) {
        newErrors.player2Name = '请输入玩家2称号';
      } else if (player2Name.length > 20) {
        newErrors.player2Name = '称号长度不能超过20个字符';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onStart({
        mode,
        difficulty,
        levelTime,
        player1Name: player1Name.trim(),
        player2Name: player2Name.trim(),
        audio: audioConfig,
        customMap: selectedMap,
      });
    }
  };

  return (
    <div className="page-container config-page">
      <div className="config-card" style={{ position: 'relative' }}>
        <h1 className="game-title">贪吃蛇游戏</h1>
        
        {/* 帮助图标 */}
        <div 
          className="help-icon"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10
          }}
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          ?
          {showHelp && (
            <div className="help-tooltip" style={{ right: '0', left: 'auto' }}>
              <h4>操作说明</h4>
              <p><strong>单人模式：</strong>方向键 ↑↓←→ 控制移动</p>
              <p><strong>双人模式：</strong></p>
              <p>玩家1：方向键 ↑↓←→</p>
              <p>玩家2：W A S D</p>
              <p><strong>通用：</strong>空格键暂停/继续</p>
            </div>
          )}
        </div>
        
        {/* 功能按钮 */}
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
        
        <form onSubmit={handleSubmit}>
          {/* 地图选择 */}
          {customMaps.length > 0 && (
            <div className="form-section">
              <label className="form-label">🗺️ 选择地图</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMap(null)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: !selectedMap ? COLORS.primary : COLORS.card,
                    color: !selectedMap ? 'white' : COLORS.text,
                    border: '2px solid',
                    borderColor: !selectedMap ? COLORS.primary : COLORS.border,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  🏞️ 默认地图
                </button>
                {customMaps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => setSelectedMap(map)}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: selectedMap?.id === map.id ? COLORS.primary : COLORS.card,
                      color: selectedMap?.id === map.id ? 'white' : COLORS.text,
                      border: '2px solid',
                      borderColor: selectedMap?.id === map.id ? COLORS.primary : COLORS.border,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    🗺️ {map.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* 称号输入 */}
          <div className="form-section">
            <label className="form-label">玩家称号</label>
            
            {mode === 'single' ? (
              <div className="input-group">
                <input
                  type="text"
                  className={`form-input ${errors.player1Name ? 'error' : ''}`}
                  placeholder="玩家1称号"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  maxLength={20}
                />
                {errors.player1Name && <span className="error-text">{errors.player1Name}</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    className={`form-input ${errors.player1Name ? 'error' : ''}`}
                    placeholder="玩家1称号"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    maxLength={20}
                  />
                  {errors.player1Name && <span className="error-text">{errors.player1Name}</span>}
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    className={`form-input ${errors.player2Name ? 'error' : ''}`}
                    placeholder="玩家2称号"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    maxLength={20}
                  />
                  {errors.player2Name && <span className="error-text">{errors.player2Name}</span>}
                </div>
              </div>
            )}
          </div>

          {/* 游戏模式 */}
          <div className="form-section">
            <label className="form-label">游戏模式</label>
            <div className="radio-group">
              <label className={`radio-option ${mode === 'single' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="single"
                  checked={mode === 'single'}
                  onChange={() => setMode('single')}
                />
                <span className="radio-circle"></span>
                <span>单人模式</span>
              </label>
              <label className={`radio-option ${mode === 'double' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="double"
                  checked={mode === 'double'}
                  onChange={() => setMode('double')}
                />
                <span className="radio-circle"></span>
                <span>双人模式</span>
              </label>
            </div>
          </div>

          {/* 难度选择 */}
          <div className="form-section">
            <label className="form-label">游戏难度</label>
            <div className="radio-group">
              <label className={`radio-option ${difficulty === 'normal' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={difficulty === 'normal'}
                  onChange={() => setDifficulty('normal')}
                />
                <span className="radio-circle"></span>
                <span>普通</span>
              </label>
              <label className={`radio-option ${difficulty === 'hard' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={difficulty === 'hard'}
                  onChange={() => setDifficulty('hard')}
                />
                <span className="radio-circle"></span>
                <span>困难</span>
              </label>
              <label className={`radio-option ${difficulty === 'superHard' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="superHard"
                  checked={difficulty === 'superHard'}
                  onChange={() => setDifficulty('superHard')}
                />
                <span className="radio-circle"></span>
                <span>超困难</span>
              </label>
            </div>
          </div>

          {/* 生存时间 */}
          <div className="form-section">
            <label className="form-label">每关生存时间</label>
            <div className="radio-group">
              {TIME_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`radio-option ${levelTime === option.value ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="levelTime"
                    value={option.value}
                    checked={levelTime === option.value}
                    onChange={() => setLevelTime(option.value)}
                  />
                  <span className="radio-circle"></span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 音效设置 */}
          <div className="form-section">
            <label className="form-label">音效设置</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 背景音乐 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={audioConfig.musicEnabled}
                  onChange={(e) => handleAudioConfigChange({ musicEnabled: e.target.checked })}
                />
                <span>🎵 背景音乐</span>
              </label>
              {/* 音效 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={audioConfig.soundEnabled}
                  onChange={(e) => handleAudioConfigChange({ soundEnabled: e.target.checked })}
                />
                <span>🔊 游戏音效</span>
              </label>
              {/* 音量调节 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioConfig.volume}
                  onChange={(e) => handleAudioConfigChange({ volume: parseFloat(e.target.value) })}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span>🔊</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            开始游戏
          </button>
        </form>
      </div>
    </div>
  );
};
