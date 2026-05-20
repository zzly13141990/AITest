# 贪吃蛇游戏

一个功能丰富的现代贪吃蛇游戏，支持单人/双人模式、多样化食物属性、关卡系统。

## 技术栈

- React 18
- TypeScript
- Vite
- Canvas

## 功能特性

### 核心玩法
- 单人模式：经典贪吃蛇玩法
- 双人模式：两位玩家各自独立游戏
- 关卡系统：4大关卡，每关4小关卡，共16关
- 难度选择：普通/困难/超困难

### 食物系统
- 🟡 速度食物：改变蛇的移动速度
- 🟢 大小食物：改变蛇的增长长度
- 🟣 颜色食物：改变蛇的颜色
- 🔴 毒药食物：减速一段时间

### 游戏功能
- 实时得分显示
- 关卡进度跟踪
- 剩余时间倒计时
- 暂停/继续功能
- 完整的游戏统计

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看游戏

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 操作说明

### 单人模式
- 方向键 ↑↓←→ 控制移动
- 空格键 暂停/继续

### 双人模式
- 玩家1：方向键 ↑↓←→
- 玩家2：W A S D
- 空格键 暂停/继续

## 项目结构

```
src/
├── components/
│   └── GameCanvas.tsx       # Canvas渲染组件
├── hooks/
│   └── useGame.ts           # 游戏核心逻辑Hook
├── pages/
│   ├── ConfigPage.tsx       # 配置页面
│   ├── GamePage.tsx         # 游戏页面
│   └── EndPage.tsx          # 结束页面
├── types.ts                 # TypeScript类型定义
├── constants.ts             # 常量配置
├── utils.ts                 # 工具函数
├── App.tsx                  # 主App组件
├── main.tsx                 # 入口文件
└── index.css                # 全局样式
```

## 游戏规则

1. 控制蛇移动，避免撞墙或撞到自己
2. 吃掉食物获得分数，身体变长
3. 每关时间结束自动进入下一关
4. 关卡递进，难度增加
5. 完成所有16关即胜利
6. 双人模式中，看谁得分更高

## 得分规则

- 速度食物（快）：20分 × 关卡系数 × 难度系数
- 速度食物（中）：15分 × 关卡系数 × 难度系数
- 速度食物（慢）：10分 × 关卡系数 × 难度系数
- 大小食物（大）：30分 × 关卡系数 × 难度系数
- 大小食物（中）：20分 × 关卡系数 × 难度系数
- 大小食物（小）：10分 × 关卡系数 × 难度系数
- 颜色食物：15分 × 关卡系数 × 难度系数
- 毒药食物：0分

## 设计规范

- 遵循UI设计规范，采用深色主题
- 响应式设计，适配不同屏幕尺寸
- 流畅的动画和交互反馈
- 完整的中文注释

## 项目架构分析

### 整体架构（前后端分离）

```
snakes/
├── frontend (React + Vite)          # 端口 5173
│   ├── src/
│   │   ├── hooks/useGame.ts         # 单机游戏引擎（970行）
│   │   ├── components/GameCanvas.tsx # Canvas 渲染
│   │   ├── pages/                   # 11个页面
│   │   ├── types.ts                 # 类型定义
│   │   ├── constants.ts             # 常量配置
│   │   ├── utils.ts                 # 工具函数
│   │   └── services/                # 存储/音频服务
│   └── App.tsx                      # 入口（模式路由）
├── backend (Node.js + Socket.io)     # 端口 3001
│   └── src/
│       ├── server.ts                # WebSocket 事件路由（14种消息类型）
│       ├── RoomManager.ts           # 房间管理（CRUD/断线重连/超时清理）
│       └── GameManager.ts           # 游戏逻辑（10 tick/s / 碰撞/道具）
├── package.json                     # v1.5.0
└── electron-builder.yml             # 桌面打包配置
```

### 前端页面

| 页面 | 功能 |
|------|------|
| mode-select | 模式选择（单机 / 对战大厅 / 地图编辑器） |
| ConfigPage | 单机配置（难度、模式、地图选择） |
| GamePage | 单机游戏界面 |
| EndPage | 单机结算 |
| LeaderboardPage | 排行榜 |
| AchievementsPage | 成就系统（7项成就） |
| BattleLobbyPage | 对战大厅（房间列表） |
| BattleRoomPage | 对战房间（准备/开始） |
| BattleGamePage | 对战游戏 |
| BattleResultPage | 对战结果 |
| MapEditorPage | 自定义地图编辑器 |

### 单机模式核心设计

- **游戏循环**: requestAnimationFrame 驱动，使用 ref 避免闭包陷阱
- **关卡系统**: 4 大关 × 4 小关 = 16 关，每关速度提升 10%
- **食物系统**: 11 种食物类型（速度/大小/颜色/毒药/护盾/穿越/分裂/磁铁/时间/冰冻/双倍分数），毒药可叠加 5 层
- **自定义地图**: 支持墙壁和障碍物绘制，影响碰撞逻辑
- **蛇头位置**: `positions[0]`（数组头部）

### 对战模式核心设计

- **通信方式**: Socket.io，统一 message 事件分发（ClientMessage/ServerMessage）
- **后端权威**: 游戏逻辑完全由后端控制，前端只负责渲染和输入，防作弊
- **房间系统**: 固定 2 人对战，支持密码保护、断线重连
- **道具系统**: 6 种道具（冰冻/生长/迷雾/加速/反转/毒）
- **暂停机制**: 全票通过制，双方都确认后才暂停/恢复
- **蛇头位置**: `snake[length-1]`（数组尾部）—— 与单机模式不一致

### 已知设计问题

1. **蛇方向参考系不一致** — 单机蛇头在 `positions[0]`，对战蛇头在 `snake[last]`，代码复用容易出 bug
2. **utils.ts 大量重复 switch** — `determineFoodValueAndColor`、`generateSingleFood`、`generateMultipleFoods` 三个函数各自维护一份食物颜色/value 映射表，约 150 行冗余
3. **前端内联样式** — 所有 UI 页面使用内联 style 对象，无可维护的 CSS 方案
4. **CodeGraph MCP 配置错位** — `.mcp.json` 中 codegraph 指向了 `oes-acct-vouch` 而非 `snakes`

## License

MIT
