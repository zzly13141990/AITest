import { useState, useEffect } from 'react';
import { ConfigPage } from './pages/ConfigPage';
import { GamePage } from './pages/GamePage';
import { EndPage } from './pages/EndPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { BattleLobbyPage } from './pages/BattleLobbyPage';
import { BattleRoomPage } from './pages/BattleRoomPage';
import { BattleGamePage } from './pages/BattleGamePage';
import { BattleResultPage } from './pages/BattleResultPage';
import { MapEditorPage } from './pages/MapEditorPage';
import { useGame } from './hooks/useGame';
import { useBattle } from './hooks/useBattle';
import { COLORS } from './constants/battle';
import { CustomMap } from './types';
import { CustomMap as BattleCustomMap } from './types/battle';
import { storageService } from './services/storageService';

type Page = 'mode-select' | 'single' | 'leaderboard' | 'achievements' | 'battle' | 'map-editor';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('mode-select');
  const [customMaps, setCustomMaps] = useState<CustomMap[]>([]);
  
  // 加载自定义地图
  useEffect(() => {
    const loadMaps = async () => {
      const maps = await storageService.getCustomMaps();
      setCustomMaps(maps);
    };
    loadMaps();
  }, []);
  
  // 保存地图
  const handleSaveMap = async (map: CustomMap) => {
    const updatedMaps = [...customMaps, map];
    setCustomMaps(updatedMaps);
    await storageService.saveCustomMaps(updatedMaps);
  };
  
  const {
    gameStatus,
    config,
    players,
    snakes,
    foods,
    effects,
    remainingTime,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    goToConfig,
    isWin,
    recentlyUnlockedAchievements
  } = useGame();
  
  const {
    currentPage: battlePage,
    roomList,
    currentRoom,
    currentPlayer,
    gameState,
    gameResult,
    isConnected,
    error,
    pauseRequest,
    musicEnabled,
    effectsEnabled,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame: startBattle,
    move,
    useItem,
    requestPause,
    confirmPause,
    requestResume,
    confirmResume,
    toggleMusic,
    toggleEffects,
    goToLobby,
    clearError,
    reconnect,
    selectMap,
    exitGame,
  } = useBattle();

  // 渲染模式选择
  const renderModeSelector = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <h1 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '16px',
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>🐍 贪吃蛇</h1>
      
      <p style={{
        fontSize: '18px',
        color: COLORS.textSecondary,
        marginBottom: '48px'
      }}>选择你喜欢的游戏模式</p>
      
      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* 单机模式 */}
        <div style={{
          width: '280px',
          background: COLORS.card,
          borderRadius: '20px',
          padding: '32px',
          border: `2px solid ${COLORS.border}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }} onClick={() => setCurrentPage('single')} onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = '#4ECDC4';
        }} onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = COLORS.border;
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎮</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>单机模式</h2>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px' }}>
            单人/双人本地对战，挑战高分，解锁成就
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(78, 205, 196, 0.1)',
              color: '#4ECDC4',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>排行榜</span>
            <span style={{
              background: 'rgba(78, 205, 196, 0.1)',
              color: '#4ECDC4',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>成就系统</span>
            <span style={{
              background: 'rgba(78, 205, 196, 0.1)',
              color: '#4ECDC4',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>多种道具</span>
          </div>
        </div>
        
        {/* 对战模式 */}
        <div style={{
          width: '280px',
          background: COLORS.card,
          borderRadius: '20px',
          padding: '32px',
          border: `2px solid ${COLORS.border}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }} onClick={() => setCurrentPage('battle')} onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = COLORS.primary;
        }} onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = COLORS.border;
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚔️</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>对战大厅</h2>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px' }}>
            在线多人对战，使用道具策略制胜
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: COLORS.primary,
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>在线对战</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: COLORS.primary,
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>对战道具</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: COLORS.primary,
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>多人房间</span>
          </div>
        </div>
        {/* 地图编辑器 */}
        <div style={{
          width: '280px',
          background: COLORS.card,
          borderRadius: '20px',
          padding: '32px',
          border: `2px solid ${COLORS.border}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }} onClick={() => setCurrentPage('map-editor')} onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = '#FF9800';
        }} onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = COLORS.border;
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>地图编辑器</h2>
          <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px' }}>
            创建和分享自定义地图
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(255, 152, 0, 0.1)',
              color: '#FF9800',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>自定义地图</span>
            <span style={{
              background: 'rgba(255, 152, 0, 0.1)',
              color: '#FF9800',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>地图分享</span>
            <span style={{
              background: 'rgba(255, 152, 0, 0.1)',
              color: '#FF9800',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}>导入导出</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染单机游戏内容
  const renderSinglePlayerContent = () => (
    <>
      {gameStatus === 'config' && (
        <div style={{ position: 'relative' }}>
          <button style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 100,
            background: COLORS.card,
            color: COLORS.text,
            border: `1px solid ${COLORS.border}`,
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }} onClick={() => setCurrentPage('mode-select')}>
            ← 返回选择
          </button>
          <ConfigPage 
            onStart={startGame}
            onShowLeaderboard={() => setCurrentPage('leaderboard')}
            onShowAchievements={() => setCurrentPage('achievements')}
            customMaps={customMaps}
          />
        </div>
      )}
      
      {(gameStatus === 'playing' || gameStatus === 'paused') && config && (
        <GamePage
          config={config}
          players={players}
          snakes={snakes}
          foods={foods}
          effects={effects}
          remainingTime={remainingTime}
          isPaused={gameStatus === 'paused'}
          onPause={pauseGame}
          onResume={resumeGame}
          onBack={goToConfig}
        />
      )}
      
      {gameStatus === 'ended' && (
        <EndPage
          players={players}
          isWin={isWin}
          onRestart={restartGame}
          onBack={goToConfig}
          onShowLeaderboard={() => setCurrentPage('leaderboard')}
          onShowAchievements={() => setCurrentPage('achievements')}
        />
      )}
    </>
  );

  // 渲染对战游戏内容
  const renderBattleContent = () => (
    <>
      {/* 大厅页面 */}
      {battlePage === 'lobby' && (
        <BattleLobbyPage
          roomList={roomList}
          isConnected={isConnected}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onBack={() => setCurrentPage('mode-select')}
          onReconnect={reconnect}
        />
      )}
      
      {/* 房间页面 */}
      {battlePage === 'room' && currentRoom && currentPlayer && (
        <BattleRoomPage
          room={currentRoom}
          currentPlayer={currentPlayer}
          onToggleReady={toggleReady}
          onStartGame={startBattle}
          onLeaveRoom={leaveRoom}
          onSelectMap={selectMap}
          customMaps={customMaps as BattleCustomMap[]}
        />
      )}
      
      {/* 游戏页面 */}
      {battlePage === 'game' && gameState && currentPlayer && (
        <BattleGamePage
          gameState={gameState}
          currentPlayer={currentPlayer}
          isPaused={currentRoom?.isPaused}
          pauseRequest={pauseRequest}
          onMove={move}
          onUseItem={useItem}
          onExitGame={exitGame}
          requestPause={requestPause}
          confirmPause={confirmPause}
          requestResume={requestResume}
          confirmResume={confirmResume}
          musicEnabled={musicEnabled}
          effectsEnabled={effectsEnabled}
          toggleMusic={toggleMusic}
          toggleEffects={toggleEffects}
        />
      )}
      
      {/* 结果页面 */}
      {battlePage === 'result' && gameResult && (
        <BattleResultPage
          result={gameResult}
          onBackToRoom={exitGame}
          onBackToLobby={goToLobby}
        />
      )}
      
      {/* 错误提示 */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.danger,
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 2000,
          cursor: 'pointer'
        }} onClick={clearError}>
          {error} (点击关闭)
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 模式选择页面 */}
      {currentPage === 'mode-select' && renderModeSelector()}
      
      {/* 单机模式 */}
      {currentPage === 'single' && renderSinglePlayerContent()}
      
      {/* 排行榜 */}
      {currentPage === 'leaderboard' && (
        <LeaderboardPage onBack={() => setCurrentPage('single')} />
      )}
      
      {/* 成就页面 */}
      {currentPage === 'achievements' && (
        <AchievementsPage onBack={() => setCurrentPage('single')} />
      )}
      
      {/* 对战模式 */}
      {currentPage === 'battle' && renderBattleContent()}

      {/* 地图编辑器 */}
      {currentPage === 'map-editor' && (
        <MapEditorPage
          onBack={() => setCurrentPage('mode-select')}
          onSaveMap={handleSaveMap}
          existingMaps={customMaps}
        />
      )}

      {/* 成就解锁通知 */}
      {recentlyUnlockedAchievements.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 1000
        }}>
          {recentlyUnlockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                border: '2px solid #4ECDC4',
                boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)',
                animation: 'slideIn 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '40px' }}>{achievement.icon}</span>
                <div>
                  <div style={{ color: '#4ECDC4', fontWeight: 'bold', fontSize: '16px' }}>
                    成就解锁！
                  </div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                    {achievement.name}
                  </div>
                  <div style={{ color: '#B0B0B0', fontSize: '14px' }}>
                    {achievement.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default App;
