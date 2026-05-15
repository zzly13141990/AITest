import React, { useState, useRef, useEffect } from 'react';
import { CustomMap, Position, MAP_EDITOR_TOOLS, DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT } from '../types';
import { COLORS } from '../constants';
import { generateId } from '../utils';

interface MapEditorPageProps {
  onBack: () => void;
  onSaveMap: (map: CustomMap) => void;
  existingMaps: CustomMap[];
}

export const MapEditorPage: React.FC<MapEditorPageProps> = ({
  onBack,
  onSaveMap,
  existingMaps,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapName, setMapName] = useState('我的地图');
  const [width, setWidth] = useState(DEFAULT_MAP_WIDTH);
  const [height, setHeight] = useState(DEFAULT_MAP_HEIGHT);
  const [walls, setWalls] = useState<Position[]>([]);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [currentTool, setCurrentTool] = useState<'wall' | 'obstacle' | 'eraser'>('wall');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const CELL_SIZE = 20; // 20px per cell

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = COLORS.gameBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#252542';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // 垂直线
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height * CELL_SIZE);
      ctx.stroke();
    }

    // 水平线
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // 绘制墙壁
    ctx.fillStyle = '#FF5252';
    walls.forEach((wall) => {
      ctx.fillRect(wall.x * CELL_SIZE, wall.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // 绘制障碍物
    ctx.fillStyle = '#FF9800';
    obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x * CELL_SIZE, obstacle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // 绘制初始玩家位置
    ctx.fillStyle = '#00C853';
    ctx.fillRect(5 * CELL_SIZE, Math.floor(height / 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }, [width, height, walls, obstacles]);

  // 获取鼠标位置
  const getGridPosition = (e: React.MouseEvent<HTMLCanvasElement>): Position | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  // 检查是否是初始位置
  const isInitialPosition = (pos: Position): boolean => {
    return pos.x >= 5 && pos.x <= 7 && pos.y === Math.floor(height / 2);
  };

  // 绘制/擦除
  const handleDraw = (pos: Position) => {
    if (isInitialPosition(pos)) return;

    if (currentTool === 'eraser') {
      setWalls(prev => prev.filter(w => w.x !== pos.x || w.y !== pos.y));
      setObstacles(prev => prev.filter(o => o.x !== pos.x || o.y !== pos.y));
    } else if (currentTool === 'wall') {
      const exists = walls.some(w => w.x === pos.x && w.y === pos.y);
      if (!exists) {
        setWalls(prev => [...prev, pos]);
        setObstacles(prev => prev.filter(o => o.x !== pos.x || o.y !== pos.y));
      }
    } else if (currentTool === 'obstacle') {
      const exists = obstacles.some(o => o.x === pos.x && o.y === pos.y);
      if (!exists) {
        setObstacles(prev => [...prev, pos]);
        setWalls(prev => prev.filter(w => w.x !== pos.x || w.y !== pos.y));
      }
    }
  };

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getGridPosition(e);
    if (pos) handleDraw(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getGridPosition(e);
    if (pos) handleDraw(pos);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  // 保存地图
  const handleSave = () => {
    const newMap: CustomMap = {
      id: generateId(),
      name: mapName || '我的地图',
      width,
      height,
      walls: [...walls],
      obstacles: [...obstacles],
      createdAt: Date.now(),
    };
    onSaveMap(newMap);
    onBack();
  };

  // 清空画布
  const handleClear = () => {
    if (confirm('确定要清空整个地图吗？')) {
      setWalls([]);
      setObstacles([]);
    }
  };

  // 导出地图为分享码
  const handleShare = () => {
    const mapData = {
      name: mapName,
      width,
      height,
      walls,
      obstacles,
    };
    const jsonString = JSON.stringify(mapData);
    const encoded = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    setShareCode(encoded);
    setShowShareModal(true);
  };

  // 复制分享码
  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    alert('分享码已复制！');
  };

  // 导入地图
  const handleImport = () => {
    try {
      const jsonString = decodeURIComponent(atob(importCode).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const mapData = JSON.parse(jsonString);
      
      setMapName(mapData.name || '导入的地图');
      setWidth(mapData.width || DEFAULT_MAP_WIDTH);
      setHeight(mapData.height || DEFAULT_MAP_HEIGHT);
      setWalls(mapData.walls || []);
      setObstacles(mapData.obstacles || []);
      
      setShowImportModal(false);
      setImportCode('');
      alert('地图导入成功！');
    } catch (error) {
      alert('分享码无效，请检查后重试！');
    }
  };

  // 加载已有地图
  const handleLoadMap = (map: CustomMap) => {
    setMapName(map.name);
    setWidth(map.width);
    setHeight(map.height);
    setWalls(map.walls);
    setObstacles(map.obstacles);
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>← 返回</button>
        <h1 style={styles.title}>地图编辑器</h1>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={() => setShowImportModal(true)}>📥 导入</button>
          <button style={styles.secondaryButton} onClick={handleShare}>📤 分享</button>
          <button style={styles.primaryButton} onClick={handleSave}>💾 保存</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* 左侧工具栏 */}
        <div style={styles.toolbar}>
          <h3 style={styles.toolbarTitle}>工具</h3>
          <div style={styles.toolButtons}>
            {MAP_EDITOR_TOOLS.map((tool) => (
              <button
                key={tool.type}
                style={{
                  ...styles.toolButton,
                  backgroundColor: currentTool === tool.type ? tool.color + '30' : COLORS.background,
                  borderColor: currentTool === tool.type ? tool.color : COLORS.border,
                }}
                onClick={() => setCurrentTool(tool.type)}
              >
                <span style={{ fontSize: '24px' }}>{tool.icon}</span>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>
                  {tool.type === 'wall' ? '墙壁' : tool.type === 'obstacle' ? '障碍物' : '橡皮擦'}
                </span>
              </button>
            ))}
          </div>

          <div style={styles.divider} />

          <h3 style={styles.toolbarTitle}>设置</h3>
          <div style={styles.settings}>
            <div style={styles.settingItem}>
              <label style={styles.label}>地图名称</label>
              <input
                style={styles.input}
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="输入地图名称"
                maxLength={30}
              />
            </div>
            <div style={styles.settingRow}>
              <div style={styles.settingItem}>
                <label style={styles.label}>宽度</label>
                <input
                  style={styles.inputSmall}
                  type="number"
                  min={10}
                  max={50}
                  value={width}
                  onChange={(e) => setWidth(Math.min(Math.max(10, Number(e.target.value)), 50))}
                />
              </div>
              <div style={styles.settingItem}>
                <label style={styles.label}>高度</label>
                <input
                  style={styles.inputSmall}
                  type="number"
                  min={10}
                  max={50}
                  value={height}
                  onChange={(e) => setHeight(Math.min(Math.max(10, Number(e.target.value)), 50))}
                />
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <button style={styles.dangerButton} onClick={handleClear}>🗑️ 清空地图</button>

          {existingMaps.length > 0 && (
            <>
              <div style={styles.divider} />
              <h3 style={styles.toolbarTitle}>已有地图</h3>
              <div style={styles.existingMaps}>
                {existingMaps.map((map) => (
                  <button
                    key={map.id}
                    style={styles.mapButton}
                    onClick={() => handleLoadMap(map)}
                  >
                    {map.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 中间画布区域 */}
        <div style={styles.canvasArea}>
          <div style={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              width={width * CELL_SIZE}
              height={height * CELL_SIZE}
              style={styles.canvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#00C853' }} />
              <span>初始位置（不可覆盖）</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#FF5252' }} />
              <span>墙壁（碰撞死亡）</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#FF9800' }} />
              <span>障碍物（碰撞死亡）</span>
            </div>
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div style={styles.properties}>
          <h3 style={styles.propertyTitle}>地图信息</h3>
          <div style={styles.propertyItem}>
            <span style={styles.propertyLabel}>名称</span>
            <span style={styles.propertyValue}>{mapName}</span>
          </div>
          <div style={styles.propertyItem}>
            <span style={styles.propertyLabel}>尺寸</span>
            <span style={styles.propertyValue}>{width} x {height}</span>
          </div>
          <div style={styles.propertyItem}>
            <span style={styles.propertyLabel}>墙壁数量</span>
            <span style={styles.propertyValue}>{walls.length}</span>
          </div>
          <div style={styles.propertyItem}>
            <span style={styles.propertyLabel}>障碍物数量</span>
            <span style={styles.propertyValue}>{obstacles.length}</span>
          </div>
        </div>
      </div>

      {/* 分享弹窗 */}
      {showShareModal && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>分享地图</h3>
              <button style={styles.closeButton} onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>复制下方分享码给朋友：</p>
              <textarea
                style={styles.codeInput}
                value={shareCode}
                readOnly
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.secondaryButton} onClick={() => setShowShareModal(false)}>关闭</button>
              <button style={styles.primaryButton} onClick={handleCopyCode}>复制分享码</button>
            </div>
          </div>
        </div>
      )}

      {/* 导入弹窗 */}
      {showImportModal && (
        <div style={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>导入地图</h3>
              <button style={styles.closeButton} onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>粘贴分享码：</p>
              <textarea
                style={styles.codeInput}
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="在此粘贴分享码..."
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.secondaryButton} onClick={() => setShowImportModal(false)}>取消</button>
              <button style={styles.primaryButton} onClick={handleImport} disabled={!importCode}>导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    marginBottom: '24px',
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
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  mainContent: {
    display: 'flex',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  toolbar: {
    width: '240px',
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '20px',
  },
  toolbarTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    color: COLORS.text,
  },
  toolButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  toolButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: COLORS.text,
  },
  divider: {
    height: '1px',
    backgroundColor: COLORS.border,
    margin: '24px 0',
  },
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  settingRow: {
    display: 'flex',
    gap: '12px',
  },
  settingItem: {
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: COLORS.textSecondary,
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
  },
  inputSmall: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    textAlign: 'center',
  },
  dangerButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: COLORS.danger,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  existingMaps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mapButton: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  canvasContainer: {
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto',
  },
  canvas: {
    border: `2px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'crosshair',
  },
  legend: {
    backgroundColor: COLORS.card,
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  legendDot: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
  },
  properties: {
    width: '240px',
    backgroundColor: COLORS.card,
    borderRadius: '16px',
    padding: '20px',
  },
  propertyTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    color: COLORS.text,
  },
  propertyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px',
    color: COLORS.text,
  },
  propertyLabel: {
    color: COLORS.textSecondary,
  },
  propertyValue: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: COLORS.card,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  },
  modalContent: {
    padding: '24px',
  },
  modalText: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    marginBottom: '16px',
  },
  codeInput: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '12px',
    fontFamily: 'monospace',
    minHeight: '100px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: `1px solid ${COLORS.border}`,
  },
};
