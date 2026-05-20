# Tetris — 俄罗斯方块

基于 **Vue 3 + TypeScript + Vite** 构建的现代俄罗斯方块游戏，支持单人模式和双人对战。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 语言 | TypeScript |
| 构建工具 | Vite 5 |
| 路由 | Vue Router 4（Hash 模式） |
| 渲染 | Canvas 2D |
| 音效 | Web Audio API |
| 持久化 | localStorage |

## 功能特性

### 核心玩法
- **7 种经典方块** — I、O、T、L、J、S、Z，含标准形状与颜色
- **幽灵方块** — 半透明预览当前方块落点位置
- **墙踢系统** — 旋转时自动微调位置，手感流畅
- **计分规则** — 1 行 100 分、2 行 300 分、3 行 600 分、4 行 1000 分
- **等级递增** — 每消除 10 行升一级（最高 20 级），下落速度随等级加快
- **连击系统** — 连续消除行叠加连击计数

### 道具系统
方块随机附带道具（15% 概率），分为三种：

| 道具 | 效果 | 持续时间 |
| --- | --- | --- |
| 加速 (Speed Up) | 加快下落速度 | 10 秒 |
| 减速 (Speed Down) | 减慢下落速度 | 10 秒 |
| 落底 (Drop) | 方块直接落底 | 即时 |

### 双人对战模式
- 同屏双人竞技，同一键盘控制
- 玩家 1: 方向键 / WASD(旋转=W) + 空格(落底)
- 玩家 2: IJKL(旋转=I) + U(落底)
- 道具击中对方生效
- 一方方块堆满顶部则对战结束
- 显示获胜者和双方最终分数

### 成就系统（5 个）
| 成就 | 解锁条件 |
| --- | --- |
| 初次游戏 | 完成第一局游戏 |
| 消除高手 | 单局消除 50 行 |
| 连击大师 | 连续消除 4 行 |
| 等级达人 | 达到 10 级 |
| 分数王者 | 单局得分超过 10000 分 |

### 排行榜
- 单人 / 对战模式分开排行
- 取前 10 名，按分数降序排列
- 数据持久化至 localStorage

### 音效
基于 Web Audio API 合成，无需外部音频文件：
- 行消除音效（频率递进）
- 方块落地、移动、旋转音效
- 道具激活音效
- 游戏结束音效
- 支持一键静音

### UI / UX
- **深色主题** — 深蓝底色 (#0F172A) 配蓝绿渐变主色
- **卡片式布局** — 圆角卡片 + 半透明阴影
- **CSS 动画** — 按钮悬浮缩放、方块落地震动、道具发光特效（box-shadow）
- **响应式网格** — 成就页自适应网格布局

## 项目结构

```
tetris/
├── index.html                  # HTML 入口（中文标题）
├── package.json                # 依赖与构建脚本
├── vite.config.ts              # Vite 配置（端口 3000）
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # Node 端 TS 配置
└── src/
    ├── main.ts                 # 应用入口（路由初始化）
    ├── App.vue                 # 根组件（router-view）
    ├── constants.ts            # 主题变量与路由常量（7 个符号）
    ├── style.css               # 全局样式（CSS 自定义属性）
    ├── vite-env.d.ts           # Vite 类型声明
    ├── types/
    │   └── tetris.ts           # 全部类型定义、方块形状/颜色、游戏配置（68 个符号）
    ├── router/
    │   └── index.ts            # 6 条路由定义
    ├── pages/
    │   ├── Home.vue            # 首页（模式选择 + 操作说明）
    │   ├── SingleGame.vue      # 单人模式游戏页
    │   ├── BattleGame.vue      # 双人对战游戏页
    │   ├── GameEnd.vue         # 游戏结束页（结算 + 新成就展示）
    │   ├── Rankings.vue        # 排行榜页（单人/对战切换）
    │   └── Achievements.vue    # 成就页（进度条 + 成就列表）
    ├── components/
    │   ├── GameGrid.vue        # Canvas 画布：网格 + 方块 + 幽灵方块渲染
    │   └── NextBlock.vue       # 预览下一块区域
    ├── composables/
    │   ├── useTetris.ts        # 单人游戏逻辑（22 个符号，复杂度最高）
    │   └── useBattle.ts        # 双人对战逻辑（28 个符号）
    └── utils/
        ├── tetrisUtils.ts      # 核心算法（碰撞检测、旋转、消行、计分，15 个符号）
        ├── audioUtils.ts       # Web Audio 音效合成（10 个符号）
        └── storageUtils.ts     # localStorage 持久化（成就/排行，7 个符号）
```

## 依赖图谱（CodeGraph 分析）

### 图谱统计

| 指标 | 数值 |
| --- | --- |
| 节点总数 | 242（函数 65、方法 62、参数 58、常量 27、接口 11、枚举 2） |
| 边总数 | 406（包含 240、调用 103、参数 58） |
| 文件数 | 11（全部 TypeScript） |
| 循环依赖 | 0 文件级，1 函数级（game loop 正常调用环） |
| 图质量评分 | 62/100（调用覆盖率 42.5%，调用置信度 62.1%） |

### 主线调用链

```
handleKeyDown
  └─ startGame
       ├─ createInitialGameState   [tetrisUtils]
       ├─ createBlock              [tetrisUtils] → getRandomBlockType
       ├─ spawnNewBlock
       └─ startDropTimer
            └─ tick（游戏循环）
                 ├─ getDropInterval
                 └─ drop（主下落逻辑）
                      ├─ moveBlock          [tetrisUtils]
                      ├─ lockBlock          [tetrisUtils]
                      ├─ clearLines         [tetrisUtils]
                      ├─ calculateScore     [tetrisUtils]
                      ├─ calculateLevel     [tetrisUtils]
                      ├─ applyItemToPlayer  [battle only]
                      └─ spawnNewBlock
                           └─ endGame（碰撞检测失败时）
```

### 复杂度热点

| 函数 | 文件 | 认知复杂度 | 圈复杂度 | 嵌套深度 | 可维护指数 |
| --- | --- | --- | --- | --- | --- |
| `useTetris` | composables/useTetris.ts | **80** | **50** | 4 | 30.1 ⚠️ |
| `useBattle` | composables/useBattle.ts | **78** | **45** | 4 | 28.9 ⚠️ |
| `checkCollision` | utils/tetrisUtils.ts | 16 | 9 | 4 | 63.5 |
| `lockBlock` | utils/tetrisUtils.ts | 16 | 9 | 5 | 47.3 |
| `handleKeyDown` | composables/useTetris.ts | 12 | 13 | 1 | 57.2 |

`useTetris` 和 `useBattle` 复杂度极高（认知复杂度 80/78），主要原因是它们把游戏循环、键盘事件绑定、状态更新全部放在了一个 composable 函数中。

### 耦合热点

| 文件 | 扇入 | 扇出 |
| --- | --- | --- |
| `src/types/tetris.ts` | 1 | **68** |
| `src/composables/useBattle.ts` | 1 | **28** |
| `src/composables/useTetris.ts` | 1 | **22** |
| `src/utils/tetrisUtils.ts` | 1 | **15** |

`types/tetris.ts` 扇出 68（所有文件都引用它），是代码库的中心枢纽。

### 节点角色分布

| 角色 | 数量 | 说明 |
| --- | --- | --- |
| core | 24 | 核心函数（碰撞检测、方块生成、消行、音效初始化等） |
| utility | 30 | 工具函数（startGame、drop、rotate、moveLeft 等游戏操作） |
| dead-unresolved | 87 | 接口/类型/枚举定义（Vue 组件未解析） |
| dead-leaf | 85 | 参数、常量（文件级作用域约束） |

### 游戏循环流程（flow 分析）

```
tick（每帧计时器）
  → getDropInterval（计算当前下落速度）
  → drop
    → moveBlock（尝试下落一行）
    → 碰撞？→ lockBlock → clearLines → calculateScore → calculateLevel
      → 消除行？→ applyItemToPlayer [对战] / 应用道具 [单人]
      → spawnNewBlock → checkCollision → 碰撞？→ endGame
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 路由一览

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `#/` | Home | 首页，选择模式 |
| `#/single` | SingleGame | 单人游戏 |
| `#/battle` | BattleGame | 双人对战 |
| `#/end` | GameEnd | 游戏结算 |
| `#/rankings` | Rankings | 排行榜 |
| `#/achievements` | Achievements | 成就列表 |

## 架构要点

1. **组合式函数（Composables）**：`useTetris` 和 `useBattle` 封装完整游戏循环（计时器、碰撞检测、状态更新），通过回调与页面组件解耦。
2. **Canvas 渲染**：`GameGrid` 组件使用 Canvas 2D 绘制网格、方块、幽灵方块和道具标记，响应式监听 `gameState` 变化自动重绘。
3. **不可变更新**：方块移动/旋转/锁定均创建新对象，通过 Vue reactive 系统触发渲染。
4. **道具双模式差异**：单人模式道具作用于自己，对战模式道具作用于对手。

## 可维护性提示

- `useTetris.ts`（认知复杂度 80）和 `useBattle.ts`（78）复杂度偏高，建议将键盘事件处理、游戏循环控制、道具系统拆分为独立的 composable
- `types/tetris.ts` 扇出 68，是整个代码库的耦合瓶颈，修改类型定义时需评估影响范围
- 无循环依赖，代码结构清晰，调用链可追溯
- 图质量评分 62/100，调用覆盖率偏低（42.5%），部分函数未被直接调用（如 composable 内部的 tick）