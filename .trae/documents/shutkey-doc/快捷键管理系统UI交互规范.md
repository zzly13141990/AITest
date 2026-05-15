# 快捷键管理系统UI交互规范

## 1. 项目设计风格定位

### 1.1 设计理念
- **极简专业**: 遵循B端产品极简设计原则，与现有SQL编辑器系统风格保持一致
- **低饱和度**: 采用低饱和度颜色，减少视觉疲劳，适合长时间使用
- **高对比度**: 确保文本与背景有足够的对比度，符合WCAG AA标准
- **品牌延续**: 保持原有品牌色绿色（#4CAF50）的一致性
- **清晰反馈**: 提供明确的视觉反馈，帮助用户理解操作结果

### 1.2 适用场景
- 数据库开发人员自定义快捷键配置
- 数据分析人员高效管理操作组合键
- 多平台设备配置迁移
- 夜间/日间工作环境（支持深色/浅色主题）

### 1.3 设计原则
| 原则 | 说明 |
|------|------|
| 一致性 | 与现有系统保持视觉和交互一致性 |
| 可发现性 | 功能入口清晰，易于找到 |
| 反馈及时 | 操作后立即给出视觉反馈 |
| 容错性 | 提供撤销、恢复等容错机制 |
| 可访问性 | 支持键盘导航和屏幕阅读器 |

---

## 2. 颜色规范

### 2.1 浅色主题颜色系统
| 用途 | 色值 | 说明 |
|------|------|------|
| 品牌主色 | `#4CAF50` | 主要按钮、链接、高亮 |
| 主色hover | `#66BB6A` | 主色悬浮状态 |
| 主色active | `#43A047` | 主色点击状态 |
| 信息色 | `#2196F3` | 提示信息、辅助按钮 |
| 成功色 | `#4CAF50` | 成功提示 |
| 警告色 | `#FFC107` | 警告提示 |
| 危险色 | `#F44336` | 错误提示、删除操作 |
| 背景主色 | `#f5f5f5` | 页面主背景 |
| 背景次色 | `#ffffff` | 卡片、表单背景 |
| 背景第三色 | `#f8f9fa` | 工具栏、表格标题 |
| 边框色 | `#e0e0e0` | 主要边框、分隔线 |
| 文本主色 | `#212529` | 主要文本、标题 |
| 文本次色 | `#6c757d` | 次要文本、说明文字 |
| 文本弱色 | `#adb5bd` | 辅助文本、占位符 |

### 2.2 深色主题颜色系统
| 用途 | 色值 | 说明 |
|------|------|------|
| 品牌主色 | `#4CAF50` | 主要按钮、链接、高亮 |
| 主色hover | `#66BB6A` | 主色悬浮状态 |
| 主色active | `#43A047` | 主色点击状态 |
| 信息色 | `#2196F3` | 提示信息、辅助按钮 |
| 成功色 | `#4CAF50` | 成功提示 |
| 警告色 | `#FFC107` | 警告提示 |
| 危险色 | `#F44336` | 错误提示、删除操作 |
| 背景主色 | `#1a1a2e` | 页面主背景 |
| 背景次色 | `#16213e` | 卡片、表单背景 |
| 背景第三色 | `#0f3460` | 工具栏、表格标题 |
| 边框色 | `#2d3436` | 主要边框、分隔线 |
| 文本主色 | `#e8e8e8` | 主要文本、标题 |
| 文本次色 | `#b8b8b8` | 次要文本、说明文字 |
| 文本弱色 | `#757575` | 辅助文本、占位符 |

### 2.3 快捷键特殊颜色
| 用途 | 浅色主题 | 深色主题 | 说明 |
|------|----------|----------|------|
| 快捷键键背景 | `#e9ecef` | `#2d3436` | 快捷键按键背景 |
| 快捷键键边框 | `#ced4da` | `#495057` | 快捷键按键边框 |
| 快捷键键文字 | `#495057` | `#e8e8e8` | 快捷键按键文字 |
| 冲突警告背景 | `#fff3cd` | `#3d2e00` | 冲突提示背景 |
| 冲突警告边框 | `#ffeeba` | `#5c4a00` | 冲突提示边框 |
| 冲突警告文字 | `#856404` | `#ffd32a` | 冲突提示文字 |

---

## 3. 字体规范

### 3.1 字体族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 3.2 字号与行高
| 层级 | 字号 (px) | 行高 (px) | 字重 | 用途 |
|------|-----------|-----------|------|------|
| H1 | 24 | 32 | 600 | 页面主标题 |
| H2 | 20 | 28 | 600 | 区块标题 |
| H3 | 16 | 24 | 500 | 卡片标题 |
| Body L | 15 | 22 | 400 | 正文大 |
| Body M | 14 | 20 | 400 | 正文（默认） |
| Body S | 13 | 18 | 400 | 辅助文本 |
| Body XS | 12 | 16 | 400 | 小字说明 |

### 3.3 快捷键相关字体规范
| 元素 | 字号 (px) | 字重 | 说明 |
|------|-----------|------|------|
| 快捷键按键标签 | 12 | 500 | 按键组合中的单个按键 |
| 快捷键说明文字 | 14 | 400 | 快捷键功能说明 |
| 表单标签 | 14 | 500 | 配置表单标签 |
| 表单输入 | 14 | 400 | 输入框内容 |

---

## 4. 布局和间距规范

### 4.1 间距系统（8px栅格）
| 名称 | 数值 (px) | 用途 |
|------|-----------|------|
| xs | 4 | 紧凑间距、图标间距 |
| sm | 8 | 小间距、内边距 |
| md | 16 | 标准间距、组件间距 |
| lg | 24 | 大间距、区块间距 |
| xl | 32 | 超大间距、页面边距 |

### 4.2 圆角规范
| 类型 | 半径 (px) | 用途 |
|------|-----------|------|
| 小圆角 | 2 | 标签、徽章、快捷键按键 |
| 标准圆角 | 4 | 按钮、输入框、卡片 |
| 大圆角 | 8 | 模态框、弹窗 |
| 超大圆角 | 12 | 对话框、面板 |

### 4.3 阴影规范
| 层级 | 浅色主题 | 深色主题 | 用途 |
|------|----------|----------|------|
| 无阴影 | 无 | 无 | 平面元素 |
| 微阴影 | `0 1px 2px rgba(0, 0, 0, 0.05)` | `0 1px 2px rgba(0, 0, 0, 0.3)` | 按钮悬浮、卡片 |
| 中阴影 | `0 4px 12px rgba(0, 0, 0, 0.1)` | `0 4px 12px rgba(0, 0, 0, 0.4)` | 下拉菜单、浮层 |
| 大阴影 | `0 8px 24px rgba(0, 0, 0, 0.15)` | `0 8px 24px rgba(0, 0, 0, 0.5)` | 模态框、弹窗 |

### 4.4 快捷键配置页面布局规范
| 元素 | 尺寸/间距 | 说明 |
|------|-----------|------|
| 页面边距 | 24px | 页面内容与边缘距离 |
| 卡片内边距 | 20px | 配置卡片内边距 |
| 表格行高 | 48px | 功能列表行高 |
| 按钮高度 | 36px | 标准按钮高度 |
| 输入框高度 | 36px | 标准输入框高度 |

---

## 5. 全局导航和菜单结构设计

### 5.1 布局结构
快捷键管理功能集成在系统设置模块中：
- **顶部导航栏**: 系统logo、导航菜单、主题切换
- **左侧设置菜单**: 系统设置、快捷键配置、外观设置等
- **主内容区**: 快捷键配置页面内容

### 5.2 快捷键配置入口
| 入口位置 | 说明 |
|----------|------|
| 设置菜单 | 左侧菜单"快捷键"选项 |
| 编辑器工具栏 | 可选：快捷键按钮打开配置面板 |
| 右键菜单 | 可选："键盘快捷键"选项 |

### 5.3 导航层级
```
设置页面
├── 通用设置
├── 快捷键配置 ← 当前页面
├── 外观设置
├── 数据管理
└── 关于
```

---

## 6. 核心页面布局设计

### 6.1 快捷键配置页面整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│ 页面标题区域                                                    │
│ ┌─────────────┬─────────────────────────────────────────────┐  │
│ │ 快捷键配置   │  [恢复默认]  [导出配置]  [导入配置]        │  │
│ └─────────────┴─────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ 功能分类标签                                                    │
│ ┌──────┬──────┬──────┬──────┐                                 │
│ │ 全部 │ 编辑 │ 导航 │ 执行 │ ...                             │
│ └──────┴──────┴──────┴──────┘                                 │
├─────────────────────────────────────────────────────────────────┤
│ 快捷键列表表格                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 功能名称       │ 当前快捷键     │ 描述          │ 操作      ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ 执行SQL        │ [Ctrl] + [Enter]│ 执行选中SQL   │ [编辑]   ││
│ │ 删除行         │ [Ctrl] + [D]    │ 删除当前行    │ [编辑]   ││
│ │ ...            │ ...             │ ...           │ ...      ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 页面区域详解

#### 6.2.1 顶部操作栏
- **标题**: "快捷键配置"，H1级别
- **操作按钮**: 恢复默认、导出配置、导入配置（从左到右）
- **按钮样式**: 主按钮（恢复默认-危险色）、辅助按钮（导入/导出）

#### 6.2.2 分类标签栏
- **标签数量**: 根据功能分类动态生成
- **选中状态**: 下划线或背景高亮
- **交互**: 点击切换筛选

#### 6.2.3 功能列表表格
- **列定义**: 功能名称、当前快捷键、描述、操作
- **排序**: 按分类或名称排序
- **搜索**: 顶部搜索框过滤

---

## 7. 快捷键组合键输入组件设计

### 7.1 可视化按键选择器

#### 7.1.1 组件结构
```
┌─────────────────────────────────────┐
│ 快捷键输入区域                       │
│ ┌─────────────────────────────────┐ │
│ │ [按下键盘输入新的快捷键组合]     │ │
│ │   [Ctrl] + [Shift] + [A]        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────┬─────────────────┐   │
│ │   [清除]    │  [使用默认]      │   │
│ └─────────────┴─────────────────┘   │
└─────────────────────────────────────┘
```

#### 7.1.2 组件属性
```typescript
interface KeybindingInputProps {
  value: string;                    // 当前快捷键值，如 "Ctrl+Shift+A"
  onChange: (value: string) => void; // 值变化回调
  onClear: () => void;              // 清除回调
  onReset: () => void;              // 恢复默认回调
  disabled?: boolean;               // 是否禁用
  conflict?: string;                // 冲突信息
}
```

#### 7.1.3 交互流程
```
用户点击输入区域
    ↓
进入监听模式（高亮边框）
    ↓
用户按下键盘组合
    ↓
实时显示按键组合
    ↓
检测冲突
    ├─ 有冲突 → 显示红色警告
    └─ 无冲突 → 正常显示
    ↓
用户点击确定或失去焦点
    ↓
退出监听模式
```

#### 7.1.4 样式规范

**输入区域**:
- 边框：2px dashed（监听模式）/ 1px solid（正常）
- 内边距：16px
- 圆角：8px
- 背景：浅色/深色主题背景

**按键标签**:
- 内边距：4px 10px
- 字号：13px
- 圆角：4px
- 字体：monospace

**清除/默认按钮**:
- 尺寸：中等按钮
- 样式：辅助按钮

### 7.2 支持的按键类型

#### 7.2.1 修饰键
| 按键 | 显示名称 | 说明 |
|------|----------|------|
| Control | Ctrl | 控制键 |
| Alt | Alt | 交替键 |
| Shift | Shift | 上档键 |
| Meta | Cmd | Windows/Command键 |

#### 7.2.2 普通键
- **字母**: A-Z
- **数字**: 0-9
- **功能键**: F1-F12
- **特殊键**: Tab, Enter, Space, Backspace, Delete, Insert, Home, End, PageUp, PageDown
- **方向键**: ArrowUp, ArrowDown, ArrowLeft, ArrowRight

#### 7.2.3 按键顺序规则
修饰键固定顺序：`Ctrl → Alt → Shift → Meta → 普通键`

---

## 8. 冲突检测视觉反馈设计

### 8.1 冲突状态样式

#### 8.1.1 输入框状态
| 状态 | 边框颜色 | 背景颜色 | 图标 |
|------|----------|----------|------|
| 正常 | 边框色 | 背景色 | 无 |
| 监听中 | 品牌主色 | 主色浅背景 | 监听图标 |
| 有冲突 | 危险色 | 冲突背景色 | 警告图标 |

#### 8.1.2 冲突提示区域
```
┌─────────────────────────────────────┐
│ ⚠ 快捷键冲突                       │
│ 此快捷键已被"关闭标签页"功能占用    │
│                                    │
│ 解决方案：                         │
│ □ 覆盖原有配置                     │
│ □ 取消并选择其他快捷键              │
└─────────────────────────────────────┘
```

#### 8.1.3 冲突提示样式
- 背景：冲突警告背景色
- 边框：冲突警告边框色
- 文字：冲突警告文字色
- 图标：⚠ 警告图标
- 内边距：12px 16px
- 圆角：4px

### 8.2 冲突检测交互流程

```
用户输入快捷键
    ↓
实时检测冲突
    ├─ 无冲突 → 继续输入
    └─ 有冲突 → 显示警告
        ↓
用户选择处理方式
    ├─ 覆盖 → 保存新配置，更新原功能快捷键为空
    └─ 取消 → 保留原有配置，清空当前输入
```

### 8.3 冲突详情展示
| 展示内容 | 说明 |
|----------|------|
| 冲突功能名称 | 显示被占用的功能点名称 |
| 冲突快捷键 | 显示冲突的快捷键组合 |
| 解决方案选项 | 覆盖或取消 |

---

## 9. 导入导出功能UI设计

### 9.1 导出配置

#### 9.1.1 按钮设计
- **位置**: 顶部操作栏右侧
- **样式**: 辅助按钮
- **图标**: 下载图标

#### 9.1.2 交互流程
```
点击导出按钮
    ↓
生成JSON配置文件
    ↓
浏览器下载文件（shortcut-config.json）
    ↓
显示成功提示
```

#### 9.1.3 导出文件格式
```json
{
  "version": "1.0",
  "exportTime": "2026-04-29T10:00:00Z",
  "shortcuts": [
    {
      "functionId": "execute_sql",
      "functionName": "执行SQL",
      "keybinding": "Alt+C",
      "description": "执行当前行或选中的SQL",
      "category": "执行"
    }
  ]
}
```

### 9.2 导入配置

#### 9.2.1 按钮设计
- **位置**: 导出按钮右侧
- **样式**: 辅助按钮
- **图标**: 上传图标

#### 9.2.2 交互流程
```
点击导入按钮
    ↓
打开文件选择对话框
    ↓
选择JSON文件
    ↓
验证文件格式
    ├─ 格式错误 → 显示错误提示
    └─ 格式正确 → 检测冲突
        ├─ 有冲突 → 显示冲突列表，询问处理方式
        └─ 无冲突 → 确认导入
            ↓
导入成功提示
```

#### 9.2.3 导入预览对话框
```
┌─────────────────────────────────────┐
│ 导入配置预览                        │
├─────────────────────────────────────┤
│ 即将导入 5 个快捷键配置             │
├─────────────────────────────────────┤
│ 发现 1 个冲突：                     │
│ ┌─────────────────────────────────┐ │
│ │ Ctrl+D  → 删除行（已有）         │ │
│ │           关闭标签页（待导入）   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 处理方式：                         │
│ □ 覆盖所有冲突配置                 │
│ □ 跳过冲突配置                     │
├─────────────────────────────────────┤
│ [取消]                    [确认导入] │
└─────────────────────────────────────┘
```

---

## 10. 默认恢复功能交互设计

### 10.1 恢复默认按钮
- **位置**: 顶部操作栏最左侧
- **样式**: 危险按钮（红色边框/文字）
- **图标**: 重置图标

### 10.2 确认对话框
```
┌─────────────────────────────────────┐
│ 确认恢复默认配置                    │
├─────────────────────────────────────┤
│ 此操作将清除所有自定义配置，恢复到   │
│ 系统默认快捷键设置。                │
│                                    │
│ 此操作不可撤销，确定继续吗？        │
├─────────────────────────────────────┤
│ [取消]                    [确认恢复] │
└─────────────────────────────────────┘
```

### 10.3 交互流程
```
点击恢复默认按钮
    ↓
弹出确认对话框
    ├─ 取消 → 关闭对话框
    └─ 确认 → 恢复默认配置
        ↓
刷新页面显示
        ↓
显示成功提示
```

### 10.4 成功提示
- **位置**: 页面顶部
- **样式**: Toast提示
- **颜色**: 成功色
- **内容**: "快捷键配置已恢复为默认值"
- **持续时间**: 3秒

---

## 11. 通用组件库设计规范

### 11.1 快捷键按键组件（ShortcutKey）

#### 属性
```typescript
interface ShortcutKeyProps {
  keys: string[];           // 按键数组，如['Ctrl', 'Shift', 'A']
  size?: 'sm' | 'md';       // 尺寸
  status?: 'normal' | 'conflict';  // 状态
}
```

#### 样式规范
| 尺寸 | 内边距 | 字号 | 圆角 |
|------|--------|------|------|
| sm | 2px 6px | 11px | 2px |
| md | 4px 10px | 13px | 4px |

### 11.2 快捷键输入组件（KeybindingInput）

#### 属性
```typescript
interface KeybindingInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onReset: () => void;
  disabled?: boolean;
  conflict?: string;
  defaultKeybinding?: string;
}
```

### 11.3 功能列表行组件（ShortcutRow）

#### 属性
```typescript
interface ShortcutRowProps {
  functionName: string;
  keybinding: string;
  description: string;
  category: string;
  onEdit: () => void;
}
```

### 11.4 编辑弹窗组件（EditModal）

#### 属性
```typescript
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keybinding: string) => void;
  functionName: string;
  functionDescription: string;
  currentKeybinding: string;
  defaultKeybinding: string;
}
```

---

## 12. 交互状态设计规范

### 12.1 输入框状态

| 状态 | 浅色主题样式 | 深色主题样式 |
|------|--------------|--------------|
| 默认 | 边框`#e0e0e0`，背景`#ffffff` | 边框`#2d3436`，背景`#16213e` |
| 聚焦 | 边框`#4CAF50`，阴影`0 0 0 3px rgba(76,175,80,0.2)` | 边框`#4CAF50`，阴影`0 0 0 3px rgba(76,175,80,0.2)` |
| 监听中 | 边框`2px dashed #4CAF50`，背景`#f0fff0` | 边框`2px dashed #4CAF50`，背景`#0d3d0d` |
| 有冲突 | 边框`#F44336`，背景`#fff3cd` | 边框`#F44336`，背景`#3d2e00` |
| 禁用 | 边框`#e0e0e0`，背景`#f5f5f5`，透明度50% | 边框`#2d3436`，背景`#1a1a2e`，透明度50% |

### 12.2 按钮状态

| 状态 | 主按钮样式 | 辅助按钮样式 |
|------|------------|--------------|
| 默认 | 背景`#4CAF50`，文字`#fff` | 背景`transparent`，边框`#ced4da`，文字`#495057` |
| Hover | 背景`#66BB6A` | 背景`#f8f9fa` |
| Active | 背景`#43A047` | 背景`#e9ecef` |
| 禁用 | 背景`#ccc`，光标`not-allowed` | 边框`#dee2e6`，文字`#adb5bd` |

### 12.3 过渡动画规范

| 交互 | 时长 | 缓动函数 |
|------|------|----------|
| 弹窗显示/隐藏 | 200ms | ease-out |
| 按钮状态切换 | 150ms | ease-out |
| 页面切换 | 300ms | ease-in-out |
| Toast提示 | 200ms进入/退出 | ease-out |
| 表格行悬停 | 100ms | ease-out |

### 12.4 加载状态
- **按钮加载**: 显示旋转加载图标，隐藏文字
- **页面加载**: 显示骨架屏或加载动画
- **加载颜色**: 品牌主色`#4CAF50`

---

## 13. 深色/浅色主题适配规范

### 13.1 CSS变量定义

```css
:root {
  /* 浅色模式变量 */
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;
  --border-color: #e0e0e0;
  --brand-primary: #4CAF50;
  --brand-hover: #66BB6A;
  --brand-active: #43A047;
  
  /* 快捷键相关变量 */
  --key-bg: #e9ecef;
  --key-border: #ced4da;
  --key-text: #495057;
  --conflict-bg: #fff3cd;
  --conflict-border: #ffeeba;
  --conflict-text: #856404;
}

[data-theme="dark"] {
  /* 深色模式变量 */
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --text-primary: #e8e8e8;
  --text-secondary: #b8b8b8;
  --text-tertiary: #757575;
  --border-color: #2d3436;
  
  /* 快捷键相关变量 */
  --key-bg: #2d3436;
  --key-border: #495057;
  --key-text: #e8e8e8;
  --conflict-bg: #3d2e00;
  --conflict-border: #5c4a00;
  --conflict-text: #ffd32a;
}
```

### 13.2 主题切换适配要点
- 所有组件使用CSS变量定义颜色
- 主题切换时保持300ms过渡动画
- 确保在两种主题下文字与背景对比度符合WCAG AA标准
- 快捷键按键在深色模式下保持足够对比度

---

## 14. 前端开发实现建议

### 14.1 快捷键按键组件实现

```tsx
import React from 'react';

interface ShortcutKeyProps {
  keys: string[];
  size?: 'sm' | 'md';
  status?: 'normal' | 'conflict';
}

export const ShortcutKey: React.FC<ShortcutKeyProps> = ({ 
  keys, 
  size = 'md', 
  status = 'normal' 
}) => {
  const padding = size === 'sm' ? '2px 6px' : '4px 10px';
  const fontSize = size === 'sm' ? '11px' : '13px';
  
  const isConflict = status === 'conflict';
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && (
            <span style={{ 
              color: 'var(--text-secondary)', 
              fontSize: fontSize 
            }}>
              +
            </span>
          )}
          <kbd style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: padding,
            backgroundColor: isConflict ? 'var(--conflict-bg)' : 'var(--key-bg)',
            border: `1px solid ${isConflict ? 'var(--conflict-border)' : 'var(--key-border)'}`,
            borderRadius: size === 'sm' ? '2px' : '4px',
            fontSize: fontSize,
            fontWeight: '500',
            color: isConflict ? 'var(--conflict-text)' : 'var(--key-text)',
            fontFamily: 'monospace',
            minWidth: size === 'sm' ? '24px' : '32px'
          }}>
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
};
```

### 14.2 快捷键输入组件实现

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShortcutKey } from './ShortcutKey';

interface KeybindingInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onReset: () => void;
  disabled?: boolean;
  conflict?: string;
  defaultKeybinding?: string;
}

export const KeybindingInput: React.FC<KeybindingInputProps> = ({
  value,
  onChange,
  onClear,
  onReset,
  disabled = false,
  conflict,
  defaultKeybinding
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  const parseKeybinding = useCallback((keybinding: string): string[] => {
    return keybinding ? keybinding.split('+') : [];
  }, []);

  useEffect(() => {
    if (!isListening) {
      setCurrentKeys(parseKeybinding(value));
    }
  }, [value, isListening, parseKeybinding]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      ' ': 'Space',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Insert': 'Insert',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→'
    };

    const key = keyMap[e.key] || e.key;
    
    // 过滤功能键和已存在的键
    const validKeys = ['Ctrl', 'Alt', 'Shift', 'Cmd', 'Space', 'Enter', 'Tab', 
      'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown', 
      '↑', '↓', '←', '→'];
    
    if (!validKeys.includes(key) && !/^[A-Za-z0-9F1-F12]$/.test(key)) {
      return;
    }

    const upperKey = key.toUpperCase();
    
    // 确保修饰键顺序：Ctrl → Alt → Shift → Cmd → 普通键
    const modifierOrder = ['CTRL', 'ALT', 'SHIFT', 'CMD'];
    const newKeys = [...currentKeys];
    
    if (modifierOrder.includes(upperKey)) {
      if (!newKeys.includes(upperKey)) {
        newKeys.push(upperKey);
        newKeys.sort((a, b) => {
          const aIndex = modifierOrder.indexOf(a);
          const bIndex = modifierOrder.indexOf(b);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return 0;
        });
      }
    } else if (!modifierOrder.includes(upperKey)) {
      // 普通键，直接添加到末尾
      if (!newKeys.includes(upperKey)) {
        newKeys.push(upperKey);
      }
      // 普通键输入完成后退出监听模式
      onChange(newKeys.join('+'));
      setIsListening(false);
    }
    
    setCurrentKeys(newKeys);
  }, [currentKeys, onChange]);

  useEffect(() => {
    if (isListening) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isListening, handleKeyDown]);

  const handleClick = () => {
    if (disabled) return;
    setIsListening(true);
    setCurrentKeys([]);
  };

  const handleClear = () => {
    onClear();
    setCurrentKeys([]);
    setIsListening(false);
  };

  const handleReset = () => {
    onReset();
    setCurrentKeys(parseKeybinding(defaultKeybinding || ''));
    setIsListening(false);
  };

  const getBorderStyle = () => {
    if (disabled) return 'var(--border-color)';
    if (isListening) return '2px dashed var(--brand-primary)';
    if (conflict) return '1px solid var(--danger-color, #F44336)';
    return '1px solid var(--border-color)';
  };

  const getBackgroundColor = () => {
    if (disabled) return 'var(--bg-tertiary)';
    if (isListening) return 'rgba(76,175,80,0.05)';
    if (conflict) return 'var(--conflict-bg)';
    return 'var(--bg-secondary)';
  };

  return (
    <div className="keybinding-input-wrapper">
      <div
        ref={inputRef}
        onClick={handleClick}
        style={{
          border: getBorderStyle(),
          backgroundColor: getBackgroundColor(),
          borderRadius: '8px',
          padding: '16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 150ms ease-out'
        }}
      >
        {isListening ? (
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            按下键盘输入新的快捷键组合（按Esc取消）
          </span>
        ) : currentKeys.length > 0 ? (
          <ShortcutKey keys={currentKeys} />
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            点击此处设置快捷键
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={handleClear}
          disabled={disabled || !value}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: disabled || !value ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease-out'
          }}
        >
          清除
        </button>
        {defaultKeybinding && (
          <button
            onClick={handleReset}
            disabled={disabled}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease-out'
            }}
          >
            使用默认
          </button>
        )}
      </div>

      {conflict && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--conflict-bg)',
          border: '1px solid var(--conflict-border)',
          borderRadius: '4px',
          color: 'var(--conflict-text)',
          fontSize: '13px'
        }}>
          ⚠ {conflict}
        </div>
      )}
    </div>
  );
};
```

### 14.3 编辑弹窗组件实现

```tsx
import React, { useEffect, useCallback } from 'react';
import { KeybindingInput } from './KeybindingInput';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keybinding: string) => void;
  functionName: string;
  functionDescription: string;
  currentKeybinding: string;
  defaultKeybinding: string;
  conflict?: string;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  functionName,
  functionDescription,
  currentKeybinding,
  defaultKeybinding,
  conflict
}) => {
  const [keybinding, setKeybinding] = React.useState(currentKeybinding);

  useEffect(() => {
    setKeybinding(currentKeybinding);
  }, [currentKeybinding, isOpen]);

  const handleSave = useCallback(() => {
    onSave(keybinding);
    onClose();
  }, [keybinding, onSave, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          width: '480px',
          maxWidth: '90vw',
          boxShadow: 'var(--shadow-large)',
          animation: 'slideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0 
          }}>
            配置快捷键
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* 功能信息 */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {functionName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {functionDescription}
          </div>
        </div>

        {/* 快捷键输入 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-primary)',
            marginBottom: '8px' 
          }}>
            快捷键
          </label>
          <KeybindingInput
            value={keybinding}
            onChange={setKeybinding}
            onClear={() => setKeybinding('')}
            onReset={() => setKeybinding(defaultKeybinding)}
            conflict={conflict}
            defaultKeybinding={defaultKeybinding}
          />
        </div>

        {/* 按钮区域 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease-out'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!keybinding || !!conflict}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--brand-primary)',
              color: '#fff',
              cursor: !keybinding || conflict ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease-out',
              opacity: !keybinding || conflict ? 0.6 : 1
            }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 15. 可访问性规范

### 15.1 键盘可访问性
- 所有交互元素支持Tab键导航
- 弹窗支持ESC键关闭
- 按钮和链接有明确的焦点状态样式
- 快捷键输入区域支持键盘激活

### 15.2 屏幕阅读器支持
- 所有按钮有清晰的aria-label
- 弹窗有role="dialog"和aria-modal属性
- 冲突提示区域有aria-live属性用于动态内容播报
- 表格有合适的thead和tbody结构

### 15.3 对比度要求
- 文字与背景对比度 ≥ 4.5:1（WCAG AA）
- 按钮文字与背景对比度 ≥ 4.5:1
- 快捷键按键文字与背景对比度 ≥ 4.5:1

### 15.4 语义化标签
- 使用<button>标签而非<div>实现可点击元素
- 使用<table>实现数据表格
- 使用<label>关联表单控件

---

## 16. 完整功能列表与默认快捷键

### 16.1 功能分类
| 分类 | 功能点 |
|------|--------|
| 执行 | 执行SQL、执行全部SQL |
| 编辑 | 删除行、格式化SQL、注释代码 |
| 导航 | 新建标签页、关闭标签页、切换标签页 |
| 文件 | 保存查询、打开文件 |

### 16.2 默认快捷键配置
| 功能点 | 默认快捷键 | 描述 | 分类 |
|--------|-----------|------|------|
| execute_sql | Alt+C | 执行当前行或选中的SQL | 执行 |
| execute_all | Ctrl+Shift+Enter | 执行全部SQL | 执行 |
| delete_line | Ctrl+D | 删除当前行 | 编辑 |
| close_tab | Ctrl+W | 关闭当前标签页 | 导航 |
| new_tab | Ctrl+T | 新建标签页 | 导航 |
| save_query | Ctrl+S | 保存查询 | 文件 |
| format_sql | Ctrl+Shift+F | 格式化SQL | 编辑 |
| toggle_comment | Ctrl+/ | 切换注释 | 编辑 |
| prev_tab | Ctrl+Tab | 切换到上一个标签 | 导航 |
| next_tab | Ctrl+Shift+Tab | 切换到下一个标签 | 导航 |

---

**文档版本**: v1.0  
**创建日期**: 2026-04-29  
**适用项目**: SQL编辑器快捷键管理功能  
**相关文档**: 《软件需求规格说明书》