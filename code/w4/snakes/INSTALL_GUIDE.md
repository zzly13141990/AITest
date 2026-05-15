# 贪吃蛇对战 - 安装和打包指南

## 项目概述

这是一个使用 Electron 打包的贪吃蛇对战游戏，包含前端界面和后端服务器，打包成独立的可安装程序后，双击即可运行。

## 前置准备

### 1. 环境要求

- **Node.js**: 16.x 或更高版本
- **npm**: 6.x 或更高版本
- **Git**: 已安装（可选）

### 2. 检查环境

在命令行中执行以下命令检查环境：

```bash
node -v
npm -v
```

## 打包步骤

### 步骤 1: 安装依赖

```bash
# 安装前端和后端依赖
npm run install:all
```

### 步骤 2: 构建项目

```bash
# 构建前端
npm run build

# 构建后端（如果还没构建过）
cd backend
npm run build
cd ..
```

### 步骤 3: 安装 Electron 依赖

```bash
npm install
```

### 步骤 4: 打包成可执行文件

#### 方式 1: 开发模式测试（可选）

```bash
npm run electron:dev
```

这会在开发模式下启动 Electron 应用，用于测试功能是否正常。

#### 方式 2: Windows 打包（推荐）

```bash
npm run electron:build:win
```

这会在 `release` 目录下生成两个文件：

1. **Setup 贪吃蛇对战 1.5.0.exe** - NSIS 安装程序（推荐）
2. **贪吃蛇对战 1.5.0.exe** - 便携式可执行文件

#### 方式 3: 通用打包

```bash
npm run electron:build
```

根据系统自动选择打包目标。

## 使用说明

### 安装程序（Setup）

1. 双击运行 `Setup 贪吃蛇对战 1.5.0.exe`
2. 按照安装向导完成安装
3. 在桌面或开始菜单找到快捷方式
4. 双击即可启动游戏

### 便携式程序（Portable）

1. 将 `贪吃蛇对战 1.5.0.exe` 复制到任意目录
2. 双击直接运行
3. 无需安装

## 游戏说明

### 游戏特性

- 🎮 **本地对战**: 2人对战模式
- 🏆 **胜负统计**: 记录房间内的胜负次数
- 🗺️ **自定义地图**: 支持创建和选择自定义地图
- ✨ **道具系统**: 各种有趣的游戏道具
- 👑 **皇冠标识**: 胜率最高的玩家显示皇冠

### 游戏操作

- **方向键** 或 **WASD**: 控制蛇的移动
- **数字键 1-3**: 使用道具
- **ESC**: 暂停/继续游戏

### 联网对战

由于是本地打包，支持：
- 同一台电脑上的 2人对战
- 局域网对战（需要确保在同一网络）

## 目录结构

```
snakes/
├── src/                    # 前端源代码
├── backend/                # 后端源代码
│   ├── src/               # 后端源文件
│   └── dist/              # 后端编译输出
├── dist/                  # 前端编译输出
├── release/               # 打包后的可执行文件
├── electron-main.js       # Electron 主进程
├── electron-preload.js    # Electron 预加载脚本
└── electron-builder.yml   # Electron Builder 配置
```

## 常见问题

### Q: 打包失败怎么办？

A: 请确保：
1. Node.js 版本 >= 16
2. 已执行 `npm run install:all` 安装所有依赖
3. 已先执行 `npm run build` 构建前端

### Q: 启动后显示无法连接服务器？

A: 检查：
1. 端口 3000 是否被其他程序占用
2. 后端是否正常启动（查看控制台）

### Q: 如何创建应用图标？

A: 在项目根目录创建 `build` 文件夹，放入 `icon.ico` 文件，重新打包即可。

### Q: 可以在其他操作系统打包吗？

A: 可以！修改 `electron-builder.yml` 中的配置即可：
- `win`: Windows
- `mac`: macOS
- `linux`: Linux

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Node.js + TypeScript + Socket.IO
- **打包**: Electron + Electron Builder
- **实时通信**: Socket.IO

## 许可证

MIT License
