# AI 图片生成工具

基于 React + TypeScript + Vite 构建的 AI 图片生成工具，集成 GLM4.6-flash API，支持 512x512 像素图片生成。

## 功能特性

- 🎨 **图片生成：根据文字描述生成图片
- 💾 **API Key 本地存储：安全保存
- 📥 **图片下载：一键下载生成的图片
- 🎭 **模拟模式：无需 API Key 时可使用模拟数据测试
- 📱 **响应式设计：支持桌面端和移动端

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **HTTP 客户端**：Axios
- **样式设计**：HVD 设计规范

## 项目结构

```
image-generator/
├── src/
│   ├── components/       # UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ImagePreview.tsx
│   │   ├── Input.tsx
│   │   └── Textarea.tsx
│   ├── services/     # API 服务
│   │   └── imageGenerator.ts
│   ├── utils/        # 工具函数
│   │   ├── image.ts
│   │   └── storage.ts
│   ├── types/        # 类型定义
│   │   └── index.ts
│   ├── App.tsx      # 主应用
│   ├── main.tsx     # 入口文件
│   └── index.css    # 全局样式
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **配置 API Key**：
   - 输入你的 GLM API Key
   - 点击保存按钮，Key 会自动保存到浏览器本地存储

2. **生成图片**：
   - 输入图片描述（例如：一只可爱的猫咪在花园里玩耍
   - 点击「生成图片」按钮
   - 等待图片生成

3. **下载图片**：
   - 图片生成后，点击「下载图片」按钮下载

3. **模拟模式（测试用）：
   - 勾选「使用模拟数据」选项可在无 API Key 时测试功能

## API 集成说明

当前集成了 GLM4.6-flash API，生成 512x512 PNG 格式图片。

## 设计规范

严格遵循 HVD 设计规范：
- 低饱和配色方案
- 清晰的组件层次和阴影
- 流畅的交互反馈

## License

MIT
