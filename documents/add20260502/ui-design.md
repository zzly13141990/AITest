# SQL多语句查询与结果管理 UI设计规范

## 1. 设计风格定位

### 1.1 设计理念
- **延续现有风格**: 遵循项目已有的深色/浅色模式设计规范，保持视觉一致性
- **功能聚焦**: 专注于SQL查询增强功能，不添加冗余装饰元素
- **高效操作**: 优化查询结果的浏览和导出体验

### 1.2 适用场景
- 多语句SQL查询场景
- 需要快速过滤查询结果的场景
- 需要批量导出部分数据的场景

---

## 2. 颜色规范

### 2.1 选中状态颜色扩展

| 状态 | 色值 | 说明 |
|------|------|------|
| 选中行背景 | `#1B5E20` | 行选中时的高亮背景（绿色半透明） |
| 选中行边框 | `#4CAF50` | 选中行的边框高亮 |
| 选中行文字 | `#E8F5E9` | 选中行的文字颜色 |

### 2.2 搜索框颜色

| 状态 | 背景色 | 边框色 | 文字色 | 占位符 |
|------|--------|--------|--------|--------|
| 默认 | `var(--bg-tertiary)` | `var(--border-color)` | `var(--text-primary)` | `var(--text-muted)` |
| Focus | `var(--bg-tertiary)` | `var(--brand-primary)` | `var(--text-primary)` | `var(--text-muted)` |

---

## 3. 核心功能模块设计

### 3.1 SQL编辑器模块

#### 3.1.1 功能概述
保持单一编辑器，支持多条SQL语句输入（按分号分隔），支持多行SQL语句。

#### 3.1.2 布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│  查询 1       │                                                │
├─────────────────────────────────────────────────────────────────┤
│  SQL编辑器区域                                                 │
│                                                               │
│  SELECT * FROM table1;                                        │
│                                                               │
│  UPDATE users                                                 │
│  SET status = 'active'                                         │
│  WHERE id = 1;                                                │
│                                                               │
│  CREATE TABLE temp_table (id INT);                             │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.1.3 交互设计

| 场景 | 行为 |
|------|------|
| 输入多条SQL | 按分号分割语句，支持跨行书写 |
| 执行查询 | 逐条执行SQL，在结果区域创建对应页签 |
| 语法高亮 | 支持SQL语法高亮显示 |

---

### 3.2 结果多页签展示模块

#### 3.2.1 功能概述
执行多条SQL后，在结果区域创建多个页签，每个页签对应一条SQL的执行结果。

#### 3.2.2 布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│  结果页签区域                                                  │
│  ┌──────────┬──────────┬──────────┐                          │
│  │ 结果 1   │ 结果 2   │ 结果 3   │  ×                     │
│  └──────────┴──────────┴──────────┘                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 当前选中页签的表格内容                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 页签样式

| 元素 | 样式 |
|------|------|
| 结果页签容器 | 背景 `var(--bg-secondary)`，底部边框 `var(--border-color)` |
| 结果页签 | 高度 36px，内边距 12px 20px，圆角 4px 4px 0 0 |
| 活动页签 | 背景 `var(--bg-primary)`，底部边框 2px solid `var(--brand-primary)` |
| 非活动页签 | 背景 `var(--bg-tertiary)`，悬浮时背景 `var(--bg-secondary)` |
| 页签关闭按钮 | 悬浮显示 ×，颜色 `var(--text-muted)`，悬浮 `var(--danger-color)` |

#### 3.2.4 交互设计

| 场景 | 行为 |
|------|------|
| 执行多条SQL | 按顺序执行，每个语句对应一个结果页签 |
| 切换结果页签 | 点击页签切换显示不同查询结果 |
| 关闭结果页签 | 点击页签关闭按钮移除该结果 |
| 页签标题 | 显示SQL语句前20-30字符，过长显示省略号 |

---

### 3.3 结果二次检索模块

#### 3.3.1 功能概述
每个查询结果页签内提供搜索框，支持实时过滤表格数据。

#### 3.3.2 布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│  查询结果                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔍 [搜索框]                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 表格内容（实时过滤）                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.3 搜索框样式

| 属性 | 值 |
|------|------|
| 高度 | 32px |
| 内边距 | 0 12px |
| 圆角 | 4px |
| 图标 | 搜索图标（放大镜），颜色 `var(--text-muted)` |
| 宽度 | 280px |

#### 3.3.4 交互设计

| 场景 | 行为 |
|------|------|
| 输入搜索词 | 实时过滤表格所有列，匹配任意列包含搜索词的行 |
| 清空搜索框 | 恢复显示所有数据 |
| 搜索结果为空 | 显示"未找到匹配结果"提示 |
| 显示匹配统计 | 搜索框右侧显示"共X条，匹配Y条" |

---

### 3.4 行选中与批量导出模块

#### 3.4.1 功能概述
- 点击行号选中单行
- 按住SHIFT键点击：选中范围内所有行
- 未按住SHIFT：取消上一个选中，选中当前行
- 导出时判断是否有选中行，有则导出选中，无则导出全部

#### 3.4.2 布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│  Row │ 列1       │ 列2       │ 列3       │ 操作               │
├──────┼───────────┼───────────┼───────────┼───────────────────┤
│ [✓]  │ 数据1     │ 数据2     │ 数据3     │ 删除              │  ← 选中行
│ [ ]  │ 数据4     │ 数据5     │ 数据6     │ 删除              │
│ [✓]  │ 数据7     │ 数据8     │ 数据9     │ 删除              │  ← 选中行
│ [ ]  │ 数据10    │ 数据11    │ 数据12    │ 删除              │
└──────┴───────────┴───────────┴───────────┴───────────────────┘
```

#### 3.4.3 行号列样式

| 属性 | 值 |
|------|------|
| 宽度 | 60px |
| 对齐 | 居中 |
| 复选框尺寸 | 16px × 16px |
| 复选框颜色 | 选中时 `var(--brand-primary)` |

#### 3.4.4 选中行样式

| 状态 | 样式 |
|------|------|
| 选中行背景 | `#1B5E20`（绿色半透明） |
| 选中行边框 | 左边框 3px solid `#4CAF50` |
| 选中行文字 | `#E8F5E9` |
| 选中行悬浮 | 背景加深 10% |

#### 3.4.5 交互设计

| 场景 | 行为 |
|------|------|
| 点击行号 | 选中/取消选中该行（未按SHIFT时取消其他选中） |
| 按住SHIFT点击行号 | 选中从上次选中行到当前行的所有行 |
| 导出按钮点击 | 判断选中行数量，有则导出选中，无则导出全部 |

---

### 3.5 导出按钮优化模块

#### 3.5.1 功能概述
将导出按钮移至分页区域，使用图标展示。

#### 3.5.2 布局设计

```
┌─────────────────────────────────────────────────────────────────┐
│  共 1000 行                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ 上一页     │ │ 第 1 页     │ │ 下一页     │ │ 📥      │  │
│  └─────────────┴ └─────────────┴ └─────────────┴ └──────────┘  │
│                     每页 [ 20 ] 条                              │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.5.3 按钮样式

| 属性 | 值 |
|------|------|
| 类型 | 图标按钮 |
| 尺寸 | 32px × 32px |
| 图标 | 📥（导出图标） |
| 背景 | 默认透明，悬浮 `var(--bg-tertiary)` |
| 边框 | 1px solid `var(--border-color)` |
| 圆角 | 4px |
| tooltip | "导出选中行（若无选中则导出全部）" |

---

## 4. 组件设计规范

### 4.1 MultiStatementResult（多语句结果组件）

#### 4.1.1 组件结构

```typescript
interface StatementResult {
  id: string;
  sql: string;
  result: QueryResult[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
  success: boolean;
}

interface MultiStatementResultProps {
  results: StatementResult[];
  activeResultId: string;
  onResultChange: (id: string, updates: Partial<StatementResult>) => void;
  onResultSelect: (id: string) => void;
  onResultClose: (id: string) => void;
  onExport: (resultId: string) => void;
}
```

#### 4.1.2 组件布局

```
┌─────────────────────────────────────────────────────────────────┐
│  结果页签栏                                                     │
│  ┌──────┬──────┬──────┐                                        │
│  │ 1/3  │ 2/3  │ 3/3  │  ← 显示每个语句的执行结果               │
│  └──────┴──────┴──────┘                                        │
│                                                                 │
│  当前选中结果的表格内容                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔍 [搜索框]                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 表格                                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 分页区域 + 导出图标按钮                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.2 ResultSearch（结果搜索组件）

#### 4.2.1 组件结构

```typescript
interface ResultSearchProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
}
```

#### 4.2.2 组件样式

```css
.result-search {
  display: flex;
  align-items: center;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  height: 32px;
  width: 320px;
}

.result-search:focus-within {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.15);
}

.result-search__icon {
  color: var(--text-muted);
  margin-right: 8px;
  font-size: 14px;
}

.result-search__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
}

.result-search__input::placeholder {
  color: var(--text-muted);
}

.result-search__count {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
```

---

### 4.3 ExportButton（导出按钮组件）

#### 4.3.1 组件结构

```typescript
interface ExportButtonProps {
  selectedCount: number;
  disabled?: boolean;
  onClick: () => void;
}
```

#### 4.3.2 组件样式

```css
.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s ease;
}

.export-btn:hover {
  background-color: var(--bg-hover);
  border-color: var(--brand-primary);
}

.export-btn:active {
  background-color: var(--brand-primary);
  color: white;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### 4.4 SelectableRow（可选行组件）

#### 4.4.1 组件结构

```typescript
interface SelectableRowProps {
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  children: React.ReactNode;
}
```

#### 4.4.2 组件样式

```css
.selectable-row {
  position: relative;
  transition: background-color 0.15s ease;
}

.selectable-row:hover {
  background-color: var(--bg-hover);
}

.selectable-row--selected {
  background-color: rgba(27, 94, 32, 0.3);
}

.selectable-row--selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--brand-primary);
}

.selectable-row--selected td {
  color: var(--text-primary);
}

.selectable-row__checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--brand-primary);
}
```

---

## 5. 交互状态规范

### 5.1 选中状态

| 状态 | 视觉表现 |
|------|----------|
| 单行选中 | 行背景变为 `#1B5E20`，左边框 3px 绿色高亮 |
| 多行选中 | 所有选中行显示相同的高亮样式 |
| 悬停在选中行 | 背景色加深 10% |
| 选中行滚动 | 保持高亮状态 |

### 5.2 搜索状态

| 状态 | 视觉表现 |
|------|----------|
| 搜索中 | 实时过滤表格，显示匹配行数统计 |
| 无匹配结果 | 显示"未找到匹配结果"提示，图标 + 文字 |
| 搜索框聚焦 | 边框变为品牌色，显示外发光 |

### 5.3 导出状态

| 状态 | 视觉表现 |
|------|----------|
| 有选中行 | 导出按钮tooltip显示"导出选中的 X 行" |
| 无选中行 | 导出按钮tooltip显示"导出全部" |
| 导出中 | 按钮显示加载动画 |

---

## 6. 前端开发实现建议

### 6.1 SQL多语句解析

```typescript
const splitSqlStatements = (sql: string): string[] => {
  const statements = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeChar = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '\0';

    if (escapeChar) {
      currentStatement += char;
      escapeChar = false;
      continue;
    }

    if (char === '\\') {
      currentStatement += char;
      escapeChar = true;
      continue;
    }

    if (char === '\'' && prevChar !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = currentStatement.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      currentStatement = '';
      continue;
    }

    currentStatement += char;
  }

  const lastStatement = currentStatement.trim();
  if (lastStatement) {
    statements.push(lastStatement);
  }

  return statements;
};
```

### 6.2 行选中逻辑

```typescript
const [selectedRowKeys, setSelectedRowKeys] = useState<Set<number>>(new Set());
const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

const handleRowSelect = (index: number, shiftKey: boolean) => {
  setSelectedRowKeys(prev => {
    const newSelected = new Set(prev);
    
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.clear();
        newSelected.add(index);
      }
      setLastSelectedIndex(index);
    }
    
    return newSelected;
  });
};
```

### 6.3 搜索过滤逻辑

```typescript
const filteredResults = useMemo(() => {
  if (!searchValue.trim()) {
    return result;
  }
  
  const searchLower = searchValue.toLowerCase();
  return result.filter(row => {
    return Object.values(row).some(value => {
      const strValue = String(value ?? '').toLowerCase();
      return strValue.includes(searchLower);
    });
  });
}, [result, searchValue]);
```

### 6.4 导出逻辑

```typescript
const handleExport = () => {
  const dataToExport = selectedRowKeys.size > 0
    ? result.filter((_, index) => selectedRowKeys.has(index))
    : result;
  
  exportExcel(dataToExport);
};
```

---

## 7. 响应式适配

| 断点 | 调整策略 |
|------|----------|
| < 768px | 搜索框宽度调整为 100%，结果页签改为滚动显示 |
| < 480px | 分页区域简化，隐藏部分按钮，保留核心功能 |

---

**文档版本**: v1.0  
**创建日期**: 2026-05-02  
**适用项目**: db-query-java