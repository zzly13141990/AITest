# 贪吃蛇对战大厅功能说明

## 概述

本次开发新增了完整的对战大厅功能，支持在线多人对战、房间管理、道具系统等。

## 技术架构

### 后端
- **服务器**: Node.js + Express + Socket.io
- **架构**: MVC模式
  - `RoomManager.ts`: 房间管理系统
  - `GameManager.ts`: 游戏逻辑管理器
  - `server.ts`: WebSocket服务主入口

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: React Hooks
- **通信**: Socket.io-client
- **UI**: 内联样式（与现有项目保持一致）

## 功能特性

### 1. 游戏模式选择
- 单机模式（原有功能）
- 对战大厅（新功能）

### 2. 对战大厅
- 房间列表展示
- 创建房间（支持密码保护）
- 快速加入房间
- 实时房间状态更新

### 3. 房间系统
- 房间信息展示
- 玩家列表
- 准备/取消准备
- 房主开始游戏
- 离开房间

### 4. 对战游戏
- 实时多人对战
- WASD/方向键控制
- 道具系统（数字键1-5使用）
- 观战模式
- 游戏结果展示

### 5. 道具系统
| 道具 | 图标 | 效果 | 目标选择 |
|------|------|------|----------|
| 加速 | ⚡ | 移动速度翻倍5秒 | 自己 |
| 减速 | 🐢 | 目标速度减半5秒 | 其他玩家 |
| 冰冻 | ❄️ | 目标停止移动3秒 | 其他玩家 |
| 反转 | 🔄 | 目标方向反转5秒 | 其他玩家 |
| 护盾 | 🛡️ | 免疫所有负面效果5秒 | 自己 |

## 项目结构

```
snakes/
├── backend/                          # 对战服务器
│   ├── src/
│   │   ├── types.ts                  # 类型定义
│   │   ├── constants.ts              # 常量配置
│   │   ├── utils.ts                  # 工具函数
│   │   ├── RoomManager.ts            # 房间管理
│   │   ├── GameManager.ts            # 游戏管理
│   │   └── server.ts                 # 服务器主入口
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── types/
│   │   └── battle.ts                 # 对战类型定义
│   ├── constants/
│   │   └── battle.ts                 # 对战常量配置
│   ├── services/
│   │   └── battleSocket.ts           # WebSocket服务
│   ├── hooks/
│   │   └── useBattle.ts              # 对战Hook
│   ├── pages/
│   │   ├── BattleLobbyPage.tsx       # 大厅页面
│   │   ├── BattleRoomPage.tsx        # 房间页面
│   │   ├── BattleGamePage.tsx        # 游戏页面
│   │   └── BattleResultPage.tsx      # 结果页面
│   └── App.tsx                       # 主应用（已更新）
└── package.json                      # 已更新
```

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

或使用一键安装：
```bash
npm run install:all
```

### 2. 启动对战服务器

```bash
# 方式1：从根目录启动
npm run server

# 方式2：进入backend目录启动
cd backend
npm run dev
```

服务器将在 `http://localhost:3001` 启动

### 3. 启动前端开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可使用

## 房间配置

创建房间时支持以下配置：
- **房间名称**: 必填
- **房间密码**: 可选，留空表示公开房间
- **最大玩家数**: 2-6人
- **游戏时长**: 60-300秒
- **地图大小**: 标准(20x20)、大(30x30)、特大(40x40)
- **是否允许观战**: 是/否

## 游戏规则

1. 玩家使用WASD或方向键控制蛇移动
2. 吃食物增加分数和长度
3. 撞到其他玩家或墙壁会死亡
4. 死亡后可选择观战或离开
5. 游戏结束时分数最高者获胜
6. 可收集道具并使用数字键1-5释放

## 技术亮点

1. **实时通信**: 使用Socket.io实现低延迟实时对战
2. **状态管理**: 前端使用自定义Hook统一管理对战状态
3. **游戏逻辑**: 后端完全控制游戏状态，防止作弊
4. **用户体验**: 优雅的UI、流畅的动画、实时反馈
5. **代码质量**: 完整的TypeScript类型定义、详细注释

## 注意事项

1. 确保后端服务器在3001端口运行
2. 多人对战需要多个浏览器窗口或设备
3. 观战者只能观看，不能参与游戏
4. 道具使用需要目标选择（除自己使用的道具外）

## API事件参考

### 客户端发送事件
- `setName`: 设置玩家名称
- `createRoom`: 创建房间
- `joinRoom`: 加入房间
- `leaveRoom`: 离开房间
- `toggleReady`: 切换准备状态
- `startGame`: 开始游戏
- `move`: 移动蛇
- `useItem`: 使用道具
- `spectate`: 切换观战模式

### 服务器发送事件
- `connected`: 连接成功
- `roomList`: 房间列表更新
- `roomJoined`: 成功加入房间
- `roomLeft`: 离开房间
- `roomUpdate`: 房间状态更新
- `gameStarted`: 游戏开始
- `gameState`: 游戏状态更新
- `itemUsed`: 道具使用通知
- `gameEnded`: 游戏结束
- `error`: 错误通知

## 扩展性

系统设计支持以下扩展：
- 添加更多道具类型
- 自定义地图障碍
- 排行榜系统
- 成就系统
- 聊天功能
- 回放功能
- 匹配系统
```