# 题目生成工具

一个基于 React + TypeScript + Vite 的智能化题目生成工具，支持通过 LLM 快速生成各种科目的练习题。

## 功能特性

- 🤖 **LLM 配置**：支持自定义模型、API Key 和 API 地址
- 📝 **灵活配置**：支持多种科目、题型、难度和年级
- 🎨 **美观界面**：基于 Ant Design 的现代设计风格
- 📄 **PDF 导出**：支持生成 A4 格式的 PDF 文档
- 🖨️ **打印功能**：直接调用浏览器打印
- 📜 **历史记录**：保存和管理生成的题目历史

## 技术栈

- **前端框架**：React 18
- **编程语言**：TypeScript 5
- **构建工具**：Vite 5
- **UI 组件库**：Ant Design 5
- **HTTP 客户端**：Axios
- **PDF 生成**：html2pdf.js

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 使用说明

1. **配置 LLM**：在左侧配置面板中设置模型名称、API Key 和 API 地址
2. **配置题目**：选择科目、题型、难度、年级，并输入题目描述
3. **生成题目**：点击"生成题目"按钮开始生成
4. **预览和导出**：生成后可预览、保存到历史记录、导出 PDF 或打印

## 项目结构

```
gendersj/
├── public/
├── src/
│   ├── components/       # UI 组件
│   │   ├── Header.tsx
│   │   ├── ConfigPanel.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── LLMConfig.tsx
│   │   ├── QuestionConfig.tsx
│   │   └── HistoryDrawer.tsx
│   ├── services/         # 服务层
│   │   ├── llmService.ts
│   │   └── pdfService.ts
│   ├── utils/            # 工具函数
│   │   ├── constants.ts
│   │   └── storage.ts
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useLLM.ts
│   │   └── useStorage.ts
│   ├── styles/           # 样式文件
│   │   └── index.css
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 许可证

MIT
