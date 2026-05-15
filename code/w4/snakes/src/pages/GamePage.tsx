import React, { useState, useEffect } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { Player, Snake, Food, GameConfig, Effect } from '../types';
import { SIZES, COLORS } from '../constants';
import { formatTime } from '../utils';

interface GamePageProps {
  config: GameConfig;
  players: Player[];
  snakes: Snake[];
  foods: Food[][]; // 二维数组
  effects: Effect[][]; // 二维特效数组
  remainingTime: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  config,
  players,
  snakes,
  foods,
  effects,
  remainingTime,
  isPaused,
  onPause,
  onResume,
  onBack
}) => {
  const isDouble = config.mode === 'double';
  const displayTime = Math.max(0, Math.ceil(remainingTime));
  const timeWarning = displayTime <= 30;
  const [scoreAnimations, setScoreAnimations] = useState<{ [key: number]: boolean }>({});
  const [prevScores, setPrevScores] = useState<{ [key: number]: number }>({});
  const [showHelp, setShowHelp] = useState(false);

  // 检测得分变化，触发动画
  useEffect(() => {
    players.forEach((player, index) => {
      if (prevScores[index] !== undefined && player.score > prevScores[index]) {
        setScoreAnimations(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
          setScoreAnimations(prev => ({ ...prev, [index]: false }));
        }, 300);
      }
      setPrevScores(prev => ({ ...prev, [index]: player.score }));
    });
  }, [players]); // 移除prevScores依赖，避免循环

  return (
    <div className="page-container game-page">
      {/* 顶部栏 */}
      <div className="game-header">
        <h1 className="game-title">贪吃蛇游戏</h1>
        <div className="header-buttons">
          {/* 帮助图标 */}
          <div 
            className="help-icon" 
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
          >
            ?
            {showHelp && (
              <div className="help-tooltip">
                <h4>操作说明</h4>
                {isDouble ? (
                  <>
                    <p><strong>玩家1：</strong>W A S D</p>
                    <p><strong>玩家2：</strong>方向键 ↑↓←→</p>
                  </>
                ) : (
                  <p><strong>方向键 ↑↓←→</strong> 或 <strong>W A S D</strong> 控制移动</p>
                )}
                <p><strong>空格键：</strong>暂停/继续</p>
              </div>
            )}
          </div>
          
          {isPaused ? (
            <button className="btn btn-secondary" onClick={onResume}>
              继续
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onPause}>
              暂停
            </button>
          )}
          <button className="btn btn-secondary" onClick={onBack}>
            返回
          </button>
        </div>
      </div>

      <div className="game-content">
        {/* 单人模式：左侧食物图例 */}
        {!isDouble && (
          <div className="sidebar left-sidebar">
            {/* 食物图例 */}
            <div className="legend-card">
              <h3>食物说明</h3>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSpeed }}></span>
                <span>速度食物 - 改变移动速度</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSize }}></span>
                <span>大小食物 - 改变增长长度</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodColor }}></span>
                <span>颜色食物 - 改变蛇的颜色</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodPoison }}></span>
                <span>毒药食物 - 临时加速</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodShield }}></span>
                <span>护盾食物 - 抵消一次死亡</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodPhase }}></span>
                <span>穿越食物 - 穿墙一次</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSplit }}></span>
                <span>分裂食物 - 增长3节</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodMagnet }}></span>
                <span>磁铁食物 - 吸引食物</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodTime }}></span>
                <span>时间食物 - 增加时间</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodFreeze }}></span>
                <span>冰冻食物 - 双人模式冰冻对手</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodDoubleScore }}></span>
                <span>双倍分数 - 分数翻倍</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 游戏画布区域 */}
        <div className="game-canvas-area">
          {isDouble ? (
            <div className="double-player-container">
              <div className="player-section">
                <div className="player-header">
                  <h3>{players[0]?.name}</h3>
                  {!players[0]?.isAlive && <span className="dead-tag">已阵亡</span>}
                </div>
                {snakes[0] && foods[0] && (
                  <GameCanvas
                    snake={snakes[0]}
                    foods={foods[0]}
                    effects={effects[0] || []}
                    width={config.customMap ? config.customMap.width * SIZES.gridCell : SIZES.doubleCanvasWidth}
                    height={config.customMap ? config.customMap.height * SIZES.gridCell : SIZES.doubleCanvasHeight}
                    isPaused={isPaused}
                    isDead={!players[0]?.isAlive}
                    customMap={config.customMap}
                  />
                )}
                <div className="player-info">
                  <span className={scoreAnimations[0] ? 'score-animate' : ''}>得分: {players[0]?.score}</span>
                  <span>关卡: {players[0]?.level.major}-{players[0]?.level.minor}</span>
                </div>
                {snakes[0]?.poisonEffectTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodPoison }}>
                    毒药效果: {Math.ceil(snakes[0].poisonEffectTime / 1000)}秒
                    <br />
                    叠加层数: {snakes[0].poisonStackCount} | 
                    加速: {(100 - 100 * Math.pow(0.7, snakes[0].poisonStackCount)).toFixed(0)}%
                  </div>
                )}
                {snakes[0]?.frozenTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodFreeze }}>
                    ❄️ 冰冻中: {Math.ceil(snakes[0].frozenTime / 1000)}秒
                  </div>
                )}
                {snakes[0]?.shieldCount > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodShield }}>
                    🛡️ 护盾: {snakes[0].shieldCount}个
                  </div>
                )}
                {snakes[0]?.phaseCount > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodPhase }}>
                    🌫️ 穿越: {snakes[0].phaseCount}次
                  </div>
                )}
                {snakes[0]?.magnetTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodMagnet }}>
                    🧲 磁铁: {Math.ceil(snakes[0].magnetTime / 1000)}秒
                  </div>
                )}
                {snakes[0]?.doubleScoreTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodDoubleScore }}>
                    ⭐ 双倍分数: {Math.ceil(snakes[0].doubleScoreTime / 1000)}秒
                  </div>
                )}
              </div>
              
              <div className="player-section">
                <div className="player-header">
                  <h3>{players[1]?.name}</h3>
                  {!players[1]?.isAlive && <span className="dead-tag">已阵亡</span>}
                </div>
                {snakes[1] && foods[1] && (
                  <GameCanvas
                    snake={snakes[1]}
                    foods={foods[1]}
                    effects={effects[1] || []}
                    width={config.customMap ? config.customMap.width * SIZES.gridCell : SIZES.doubleCanvasWidth}
                    height={config.customMap ? config.customMap.height * SIZES.gridCell : SIZES.doubleCanvasHeight}
                    isPaused={isPaused}
                    isDead={!players[1]?.isAlive}
                    customMap={config.customMap}
                  />
                )}
                <div className="player-info">
                  <span className={scoreAnimations[1] ? 'score-animate' : ''}>得分: {players[1]?.score}</span>
                  <span>关卡: {players[1]?.level.major}-{players[1]?.level.minor}</span>
                </div>
                {snakes[1]?.poisonEffectTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodPoison }}>
                    毒药效果: {Math.ceil(snakes[1].poisonEffectTime / 1000)}秒
                    <br />
                    叠加层数: {snakes[1].poisonStackCount} | 
                    加速: {(100 - 100 * Math.pow(0.7, snakes[1].poisonStackCount)).toFixed(0)}%
                  </div>
                )}
                {snakes[1]?.frozenTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodFreeze }}>
                    ❄️ 冰冻中: {Math.ceil(snakes[1].frozenTime / 1000)}秒
                  </div>
                )}
                {snakes[1]?.shieldCount > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodShield }}>
                    🛡️ 护盾: {snakes[1].shieldCount}个
                  </div>
                )}
                {snakes[1]?.phaseCount > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodPhase }}>
                    🌫️ 穿越: {snakes[1].phaseCount}次
                  </div>
                )}
                {snakes[1]?.magnetTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodMagnet }}>
                    🧲 磁铁: {Math.ceil(snakes[1].magnetTime / 1000)}秒
                  </div>
                )}
                {snakes[1]?.doubleScoreTime > 0 && (
                  <div className="player-info" style={{ color: COLORS.foodDoubleScore }}>
                    ⭐ 双倍分数: {Math.ceil(snakes[1].doubleScoreTime / 1000)}秒
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="single-player-container">
              {snakes[0] && foods[0] && (
                <GameCanvas
                  snake={snakes[0]}
                  foods={foods[0]}
                  effects={effects[0] || []}
                  width={config.customMap ? config.customMap.width * SIZES.gridCell : SIZES.singleCanvasWidth}
                  height={config.customMap ? config.customMap.height * SIZES.gridCell : SIZES.singleCanvasHeight}
                  isPaused={isPaused}
                  isDead={!players[0]?.isAlive}
                  customMap={config.customMap}
                />
              )}
            </div>
          )}
        </div>

        {/* 右侧侧边栏 */}
        <div className="sidebar">
          {!isDouble && (
            <>
              <div className="info-card">
                <h3>当前关卡</h3>
                <p className="info-value">{players[0]?.level.major}-{players[0]?.level.minor}</p>
              </div>
              
              <div className="info-card">
                <h3>剩余时间</h3>
                <p className={`info-value ${timeWarning ? 'warning' : ''}`}>
                  {formatTime(displayTime)}
                </p>
              </div>
              
              <div className="info-card">
                <h3>当前得分</h3>
                <p className={`info-value ${scoreAnimations[0] ? 'score-animate' : ''}`}>{players[0]?.score}</p>
              </div>
              
              {/* 毒药效果信息 */}
              {snakes[0]?.poisonEffectTime > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodPoison }}>毒药效果</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodPoison,fontSize:18 }}>
                    剩余: {Math.ceil(snakes[0].poisonEffectTime / 1000)}秒
                  </p>
                  <p className="info-value" style={{ color: COLORS.foodPoison,fontSize:18 }}>
                    叠加层数: {snakes[0].poisonStackCount}
                  </p>
                  <p className="info-value" style={{ color: COLORS.foodPoison ,fontSize:18}}>
                    加速: {(100 - 100 * Math.pow(0.7, snakes[0].poisonStackCount)).toFixed(0)}%
                  </p>
                </div>
              )}
              
              {/* 道具效果信息 */}
              {snakes[0]?.shieldCount > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodShield }}>🛡️ 护盾效果</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodShield,fontSize:18 }}>
                    剩余: {snakes[0].shieldCount}个
                  </p>
                </div>
              )}
              {snakes[0]?.phaseCount > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodPhase }}>🌫️ 穿越效果</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodPhase,fontSize:18 }}>
                    剩余: {snakes[0].phaseCount}次
                  </p>
                </div>
              )}
              {snakes[0]?.magnetTime > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodMagnet }}>🧲 磁铁效果</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodMagnet,fontSize:18 }}>
                    剩余: {Math.ceil(snakes[0].magnetTime / 1000)}秒
                  </p>
                </div>
              )}
              {snakes[0]?.doubleScoreTime > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodDoubleScore }}>⭐ 双倍分数</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodDoubleScore,fontSize:18 }}>
                    剩余: {Math.ceil(snakes[0].doubleScoreTime / 1000)}秒
                  </p>
                </div>
              )}
              {snakes[0]?.frozenTime > 0 && (
                <div className="info-card">
                  <h4 style={{ color: COLORS.foodFreeze }}>❄️ 冰冻效果</h4><br/>
                  <p className="info-value" style={{ color: COLORS.foodFreeze,fontSize:18 }}>
                    剩余: {Math.ceil(snakes[0].frozenTime / 1000)}秒
                  </p>
                </div>
              )}
            </>
          )}
          
          {/* 双人模式：右侧食物图例 */}
          {isDouble && (
            <div className="legend-card">
              <h3>食物说明</h3>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSpeed }}></span>
                <span>速度食物 - 改变移动速度</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSize }}></span>
                <span>大小食物 - 改变增长长度</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodColor }}></span>
                <span>颜色食物 - 改变蛇的颜色</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodPoison }}></span>
                <span>毒药食物 - 临时加速</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodShield }}></span>
                <span>护盾食物 - 抵消一次死亡</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodPhase }}></span>
                <span>穿越食物 - 穿墙一次</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodSplit }}></span>
                <span>分裂食物 - 增长3节</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodMagnet }}></span>
                <span>磁铁食物 - 吸引食物</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodTime }}></span>
                <span>时间食物 - 增加时间</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodFreeze }}></span>
                <span>冰冻食物 - 双人模式冰冻对手</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS.foodDoubleScore }}></span>
                <span>双倍分数 - 分数翻倍</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
