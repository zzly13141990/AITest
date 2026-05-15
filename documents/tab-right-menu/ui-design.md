## 标签页右键菜单 UI 设计规范

---

### 1. 设计风格定位

遵循项目现有的**深色模式极简专业风格**，保持与下拉菜单组件一致的视觉语言，确保整体设计统一。

---

### 2. 菜单布局设计

#### 2.1 整体布局
```
┌─────────────────────────────┐
│ 删除除本页外的其他标签      │
├─────────────────────────────┤
│ 删除左边的标签              │
├─────────────────────────────┤
│ 删除右边的标签              │
└─────────────────────────────┘
```

#### 2.2 布局规范
| 属性 | 值 | 说明 |
|------|-----|------|
| 菜单宽度 | 180px | 固定宽度，适应最长菜单项 |
| 菜单项高度 | 36px | 与下拉菜单保持一致 |
| 圆角 | 4px | 标准圆角 |
| 阴影层级 | 中阴影 | `0 4px 8px rgba(0, 0, 0, 0.4)` |
| 边框 | 1px solid `#444444` | 次要边框 |

---

### 3. 样式规范

#### 3.1 颜色规范

| 元素 | 状态 | 背景色 | 文字色 | 边框色 |
|------|------|--------|--------|--------|
| 菜单容器 | 默认 | `#2D2D2D` | - | `#444444` |
| 菜单项 | 默认 | 透明 | `#E0E0E0` | - |
| 菜单项 | Hover | `#252525` | `#E0E0E0` | - |
| 菜单项 | 禁用 | 透明 | `#616161` | - |
| 菜单项 | 分隔线 | - | - | `#333333` |

#### 3.2 字体规范

| 属性 | 值 |
|------|-----|
| 字号 | 14px |
| 行高 | 20px |
| 字重 | 400 |
| 内边距 | 8px 16px |

#### 3.3 间距规范

| 属性 | 值 |
|------|-----|
| 菜单项左右内边距 | 16px |
| 菜单项上下内边距 | 8px |
| 菜单项间距 | 0（无间距，靠边框分隔） |

---

### 4. 交互细节设计

#### 4.1 菜单显示规则
| 场景 | 行为 |
|------|------|
| 标签页数量 ≤ 1 | 不显示右键菜单，显示浏览器默认菜单 |
| 标签页数量 > 1 | 显示自定义右键菜单 |
| 右键点击非标签区域 | 显示浏览器默认菜单 |

#### 4.2 菜单项状态规则

| 菜单项 | 禁用条件 | 启用条件 |
|--------|----------|----------|
| 删除除本页外的其他标签 | 标签页数量 = 1 | 标签页数量 > 1 |
| 删除左边的标签 | 当前标签为第一个 | 当前标签非第一个 |
| 删除右边的标签 | 当前标签为最后一个 | 当前标签非最后一个 |

#### 4.3 交互状态

| 状态 | 光标样式 | 视觉反馈 |
|------|----------|----------|
| 默认 | `default` | 无特殊效果 |
| Hover | `pointer` | 背景变为 `#252525` |
| 禁用 | `not-allowed` | 文字变为 `#616161`，无 hover 效果 |

#### 4.4 菜单关闭触发条件
- 点击菜单项后自动关闭
- 点击菜单外部区域关闭
- 按下 `Esc` 键关闭
- 鼠标右键再次点击其他区域（触发新菜单前关闭旧菜单）

---

### 5. 组件设计

#### 5.1 ContextMenu 组件结构

```typescript
interface MenuItem {
  id: string;           // 菜单项唯一标识
  label: string;        // 显示文字
  disabled: boolean;    // 是否禁用
  onClick: () => void;  // 点击回调
}

interface ContextMenuProps {
  visible: boolean;           // 是否显示
  position: { x: number; y: number };  // 显示位置
  items: MenuItem[];          // 菜单项列表
  onClose: () => void;        // 关闭回调
}
```

#### 5.2 组件样式（CSS）

```css
/* 右键菜单容器 */
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  background-color: #2D2D2D;
  border: 1px solid #444444;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  padding: 4px 0;
  font-size: 14px;
  line-height: 20px;
  color: #E0E0E0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 菜单项 */
.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: default;
  transition: background-color 0.15s ease-out;
}

.context-menu-item:hover:not(.disabled) {
  background-color: #252525;
  cursor: pointer;
}

.context-menu-item.disabled {
  color: #616161;
  cursor: not-allowed;
}

/* 菜单项分隔线 */
.context-menu-divider {
  height: 1px;
  background-color: #333333;
  margin: 4px 0;
}
```

---

### 6. 与现有标签页组件的集成

#### 6.1 标签页元素扩展

在现有标签页元素上添加右键事件监听：

```tsx
<div
  key={tab.id}
  data-tab-id={tab.id}
  className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
  onClick={() => handleTabClick(tab.id)}
  onContextMenu={(e) => handleTabRightClick(e, tabIndex)}  // 新增右键事件
>
  <span>{tab.title}</span>
  <span className="tab-close" onClick={(e) => {
    e.stopPropagation();
    closeTab(tab.id);
  }}>
    ×
  </span>
</div>
```

#### 6.2 右键菜单触发逻辑

```typescript
const handleTabRightClick = (e: React.MouseEvent, tabIndex: number) => {
  // 阻止默认右键菜单
  e.preventDefault();
  
  // 标签页数量 <= 1 时不显示菜单
  if (tabs.length <= 1) return;
  
  // 计算菜单项状态
  const menuItems = [
    {
      id: 'close-other',
      label: '删除除本页外的其他标签',
      disabled: tabs.length <= 1,
      onClick: () => closeOtherTabs(tabIndex)
    },
    {
      id: 'close-left',
      label: '删除左边的标签',
      disabled: tabIndex === 0,
      onClick: () => closeLeftTabs(tabIndex)
    },
    {
      id: 'close-right',
      label: '删除右边的标签',
      disabled: tabIndex === tabs.length - 1,
      onClick: () => closeRightTabs(tabIndex)
    }
  ];
  
  // 显示右键菜单
  showContextMenu({
    x: e.clientX,
    y: e.clientY
  }, menuItems);
};
```

---

### 7. 功能函数设计

| 函数名 | 功能 | 参数 | 返回值 |
|--------|------|------|--------|
| `closeOtherTabs(currentIndex)` | 删除除当前标签外的其他标签 | `currentIndex`: 当前标签索引（Number） | 更新后的标签页数组 |
| `closeLeftTabs(currentIndex)` | 删除当前标签左侧的所有标签 | `currentIndex`: 当前标签索引（Number） | 更新后的标签页数组 |
| `closeRightTabs(currentIndex)` | 删除当前标签右侧的所有标签 | `currentIndex`: 当前标签索引（Number） | 更新后的标签页数组 |

---

### 8. 前端开发实现注意事项

1. **定位精度**：菜单定位使用 `clientX/clientY`，确保菜单显示在鼠标点击位置附近
2. **边界处理**：菜单显示时需检查是否超出视口边界，必要时调整位置
3. **事件冲突**：右键事件需使用 `preventDefault()` 阻止浏览器默认菜单
4. **状态同步**：菜单操作后需更新标签页状态并重新渲染
5. **样式一致性**：使用项目现有的 CSS 变量（如 `--bg-secondary`、`--text-primary`）确保主题一致性
6. **无障碍支持**：支持 `Esc` 键关闭菜单，提供键盘导航支持

---

### 9. 视觉效果图示意

```
标签页区域：
┌─────────────┬─────────────┬─────────────┐
│  查询 1   ×│  查询 2   ×│  查询 3   ×│  + 新建
└─────────────┴─────────────┴─────────────┘
                          ↑
                   右键点击此处
                         │
                         ▼
              ┌─────────────────────────┐
              │ 删除除本页外的其他标签   │
              ├─────────────────────────┤
              │ 删除左边的标签           │
              ├─────────────────────────┤
              │ 删除右边的标签           │ ← 当前为最后一个，此选项禁用（灰色）
              └─────────────────────────┘
```