# 数据库对象详情模态框复制功能UI交互规范

---

## 1. 项目设计风格定位

### 1.1 设计理念
- **极简专业**: 遵循B端产品极简设计原则，与现有SQL编辑器系统风格保持一致
- **功能明确**: 复制按钮功能清晰，操作直观
- **即时反馈**: 提供明确的复制成功/失败视觉反馈
- **主题兼容**: 完美适配深色/浅色主题切换

### 1.2 适用场景
- 数据库开发人员查看并复制视图创建语句
- 数据库管理员复制存储过程定义进行迁移
- 数据分析人员复制函数定义进行分析
- 开发人员复制触发器逻辑进行调试

### 1.3 设计原则
| 原则 | 说明 |
|------|------|
| 一致性 | 与现有系统按钮、模态框样式保持一致 |
| 可发现性 | 复制按钮位置醒目，易于找到 |
| 反馈及时 | 复制操作后立即显示提示信息 |
| 容错性 | 处理复制失败场景，给出友好提示 |
| 主题适配 | 完美兼容深色/浅色主题 |

---

## 2. 颜色规范

### 2.1 浅色主题颜色系统
| 用途 | 色值 | 说明 |
|------|------|------|
| 品牌主色 | `#4CAF50` | 复制成功状态、按钮hover |
| 主色hover | `#66BB6A` | 按钮悬浮状态 |
| 主色active | `#43A047` | 按钮点击状态 |
| 成功色 | `#4CAF50` | Toast成功提示背景 |
| 危险色 | `#F44336` | Toast错误提示背景 |
| 信息色 | `#2196F3` | 辅助按钮颜色 |
| 背景主色 | `#f5f5f5` | 页面主背景 |
| 背景次色 | `#ffffff` | 模态框、卡片背景 |
| 边框色 | `#e0e0e0` | 模态框边框、分隔线 |
| 文本主色 | `#212529` | 按钮文字、提示文字 |
| 文本次色 | `#6c757d` | 图标颜色、辅助文字 |
| 文本弱色 | `#adb5bd` | 禁用状态文字 |

### 2.2 深色主题颜色系统
| 用途 | 色值 | 说明 |
|------|------|------|
| 品牌主色 | `#4CAF50` | 复制成功状态、按钮hover |
| 主色hover | `#66BB6A` | 按钮悬浮状态 |
| 主色active | `#43A047` | 按钮点击状态 |
| 成功色 | `#4CAF50` | Toast成功提示背景 |
| 危险色 | `#F44336` | Toast错误提示背景 |
| 信息色 | `#2196F3` | 辅助按钮颜色 |
| 背景主色 | `#1a1a2e` | 页面主背景 |
| 背景次色 | `#16213e` | 模态框、卡片背景 |
| 边框色 | `#2d3436` | 模态框边框、分隔线 |
| 文本主色 | `#e8e8e8` | 按钮文字、提示文字 |
| 文本次色 | `#b8b8b8` | 图标颜色、辅助文字 |
| 文本弱色 | `#757575` | 禁用状态文字 |

---

## 3. 字体规范

### 3.1 字体族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 3.2 字号与行高
| 层级 | 字号 (px) | 行高 (px) | 字重 | 用途 |
|------|-----------|-----------|------|------|
| Body M | 14 | 20 | 400 | 按钮文字 |
| Body S | 13 | 18 | 400 | Toast提示文字 |
| Body XS | 12 | 16 | 400 | Tooltip提示文字 |

---

## 4. 布局和间距规范

### 4.1 间距系统（8px栅格）
| 名称 | 数值 (px) | 用途 |
|------|-----------|------|
| xs | 4 | 图标与文字间距 |
| sm | 8 | 按钮内边距、元素间距 |
| md | 16 | 模态框内边距 |
| lg | 24 | 模态框头部高度 |

### 4.2 圆角规范
| 类型 | 半径 (px) | 用途 |
|------|-----------|------|
| 标准圆角 | 4 | 按钮 |
| 大圆角 | 8 | 模态框、Toast提示 |

### 4.3 阴影规范
| 层级 | 浅色主题 | 深色主题 | 用途 |
|------|----------|----------|------|
| 微阴影 | `0 1px 2px rgba(0, 0, 0, 0.05)` | `0 1px 2px rgba(0, 0, 0, 0.3)` | 按钮悬浮 |
| 大阴影 | `0 8px 24px rgba(0, 0, 0, 0.15)` | `0 8px 24px rgba(0, 0, 0, 0.5)` | 模态框 |

---

## 5. 复制按钮设计规范

### 5.1 按钮位置
- **位置**: 模态框标题区域右侧，关闭按钮左侧
- **间距**: 与关闭按钮间距8px，与标题间距16px

### 5.2 按钮尺寸
| 属性 | 数值 |
|------|------|
| 宽度 | 32px |
| 高度 | 32px |
| 内边距 | 8px |

### 5.3 按钮图标设计
- **图标类型**: 使用复制图标（📋 或 SVG 图标）
- **图标尺寸**: 16x16px
- **图标颜色**: 文本次色（浅色:`#6c757d`，深色:`#b8b8b8`）

### 5.4 按钮状态样式

#### 5.4.1 正常状态
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `#f8f9fa` | `#0f3460` |
| 边框 | `1px solid #e0e0e0` | `1px solid #2d3436` |
| 图标颜色 | `#6c757d` | `#b8b8b8` |
| 光标 | `pointer` | `pointer` |

#### 5.4.2 悬停状态
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `#e9ecef` | `#2d3436` |
| 边框 | `1px solid #ced4da` | `1px solid #495057` |
| 图标颜色 | `#495057` | `#e8e8e8` |
| 阴影 | `0 1px 2px rgba(0, 0, 0, 0.05)` | `0 1px 2px rgba(0, 0, 0, 0.3)` |

#### 5.4.3 点击状态
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `#dee2e6` | `#495057` |
| 边框 | `1px solid #adb5bd` | `1px solid #6c757d` |
| 图标颜色 | `#495057` | `#e8e8e8` |

#### 5.4.4 禁用状态
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `#f5f5f5` | `#1a1a2e` |
| 边框 | `1px solid #e0e0e0` | `1px solid #2d3436` |
| 图标颜色 | `#adb5bd` | `#757575` |
| 光标 | `not-allowed` | `not-allowed` |

#### 5.4.5 复制成功状态
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `rgba(76, 175, 80, 0.1)` | `rgba(76, 175, 80, 0.2)` |
| 边框 | `1px solid #4CAF50` | `1px solid #4CAF50` |
| 图标颜色 | `#4CAF50` | `#4CAF50` |

---

## 6. Toast提示设计规范

### 6.1 提示类型

#### 6.1.1 成功提示
- **背景色**: `#4CAF50`（浅色/深色一致）
- **文字颜色**: `#ffffff`
- **图标**: ✓ （白色对勾）
- **提示内容**: "已复制到剪贴板"

#### 6.1.2 错误提示
- **背景色**: `#F44336`（浅色/深色一致）
- **文字颜色**: `#ffffff`
- **图标**: ✗ （白色叉号）
- **提示内容**: "复制失败，请手动复制"

### 6.2 提示位置
- **位置**: 模态框顶部居中，覆盖在标题区域上方
- **偏移**: 距离模态框顶部20px

### 6.3 提示尺寸
| 属性 | 数值 |
|------|------|
| 最小宽度 | 200px |
| 最大宽度 | 360px |
| 高度 | 40px |
| 内边距 | 10px 16px |

### 6.4 提示样式
- **圆角**: 8px
- **阴影**: `0 4px 12px rgba(0, 0, 0, 0.2)`
- **字体大小**: 13px
- **字重**: 400
- **对齐方式**: 水平居中

### 6.5 提示动画
| 动画类型 | 时长 | 缓动函数 |
|----------|------|----------|
| 进入动画 | 200ms | ease-out |
| 退出动画 | 200ms | ease-in |
| 显示时长 | 3000ms | - |

---

## 7. Tooltip提示设计规范

### 7.1 触发方式
- **触发事件**: 鼠标悬停
- **显示延迟**: 300ms
- **消失延迟**: 100ms

### 7.2 Tooltip内容
- **默认状态**: "复制创建语句"
- **成功状态**: "已复制"

### 7.3 Tooltip样式
| 属性 | 浅色主题 | 深色主题 |
|------|----------|----------|
| 背景色 | `#212529` | `#2d3436` |
| 文字颜色 | `#ffffff` | `#e8e8e8` |
| 字体大小 | 12px | 12px |
| 内边距 | 6px 10px | 6px 10px |
| 圆角 | 4px | 4px |
| 阴影 | `0 2px 8px rgba(0, 0, 0, 0.15)` | `0 2px 8px rgba(0, 0, 0, 0.4)` |

### 7.4 Tooltip位置
- **位置**: 按钮上方居中
- **偏移**: 距离按钮顶部-8px（向上偏移）

---

## 8. 模态框标题区域布局

### 8.1 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│ 标题区域                                                    │
│ ┌──────────────────────────┬────────────┬────────────┐     │
│ │ 对象名称 (类型)           │ [复制按钮] │ [关闭按钮] │     │
│ └──────────────────────────┴────────────┴────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 布局参数
| 元素 | 尺寸/间距 |
|------|-----------|
| 标题区域高度 | 48px |
| 标题区域内边距 | 0 16px |
| 标题文字字号 | 16px |
| 标题文字字重 | 500 |
| 复制按钮与关闭按钮间距 | 8px |
| 按钮与右侧边缘间距 | 8px |

### 8.3 标题文字格式
- **格式**: `对象名称 (对象类型)`
- **示例**: `user_view (视图)`、`get_user_info (函数)`

---

## 9. 深色/浅色主题适配规范

### 9.1 CSS变量定义
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
  --success-color: #4CAF50;
  --danger-color: #F44336;
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
}
```

### 9.2 主题切换适配要点
- 所有组件使用CSS变量定义颜色
- 主题切换时保持200ms过渡动画
- 确保在两种主题下文字与背景对比度符合WCAG AA标准

---

## 10. 交互流程设计

### 10.1 复制按钮交互流程
```
用户打开模态框
    ↓
复制按钮显示正常状态
    ↓
用户悬停按钮
    ↓
显示Tooltip "复制创建语句"
    ↓
用户点击按钮
    ↓
执行复制操作
    ├─ 成功 → 按钮变为成功状态，显示Toast提示
    └─ 失败 → 显示错误Toast提示
    ↓
3秒后Toast消失
    ↓
按钮恢复正常状态
```

### 10.2 禁用状态触发条件
| 条件 | 处理方式 |
|------|----------|
| 创建语句为空 | 按钮禁用，显示Tooltip "无创建语句" |
| 浏览器不支持Clipboard API | 按钮禁用，显示Tooltip "浏览器不支持" |

---

## 11. 组件代码实现建议

### 11.1 复制按钮组件
```tsx
import React, { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  disabled?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, disabled = false }) => {
  const [status, setStatus] = useState<'normal' | 'success'>('normal');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success');
      
      // 显示Toast提示（由父组件实现）
      const event = new CustomEvent('copy-success', { detail: { text } });
      document.dispatchEvent(event);
      
      // 3秒后恢复正常状态
      setTimeout(() => setStatus('normal'), 3000);
    } catch (err) {
      const event = new CustomEvent('copy-error', { detail: { error: err } });
      document.dispatchEvent(event);
    }
  }, [text, disabled]);

  const getButtonStyle = () => {
    const baseStyle = {
      width: '32px',
      height: '32px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 150ms ease-out',
      position: 'relative' as const,
      backgroundColor: 'transparent'
    };

    switch (status) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: 'var(--brand-primary)',
          color: 'var(--brand-primary)'
        };
      default:
        if (disabled) {
          return {
            ...baseStyle,
            borderColor: 'var(--border-color)',
            color: 'var(--text-tertiary)'
          };
        }
        return {
          ...baseStyle,
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)'
        };
    }
  };

  const getTooltipText = () => {
    if (disabled) return '无创建语句';
    if (status === 'success') return '已复制';
    return '复制创建语句';
  };

  return (
    <button
      style={getButtonStyle()}
      onClick={handleCopy}
      disabled={disabled}
      onMouseEnter={() => !disabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={getTooltipText()}
    >
      {/* 复制图标 */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {status === 'success' ? (
          // 对勾图标
          <path d="M5 13l4 4L19 7" />
        ) : (
          // 复制图标
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        )}
      </svg>
      
      {/* Tooltip */}
      {showTooltip && (
        <span
          style={{
            position: 'absolute' as const,
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 100
          }}
        >
          {getTooltipText()}
        </span>
      )}
    </button>
  );
};
```

### 11.2 Toast提示组件
```tsx
import React, { useEffect, useState } from 'react';

interface ToastProps {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ isVisible, message, type, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 200);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !isLeaving) return null;

  return (
    <div
      style={{
        position: 'fixed' as const,
        top: '20px',
        left: '50%',
        transform: isLeaving 
          ? 'translate(-50%, -20px)' 
          : 'translate(-50%, 0)',
        backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: isLeaving ? 0 : 1,
        transition: 'all 200ms ease-out',
        minWidth: '200px',
        maxWidth: '360px',
        justifyContent: 'center'
      }}
    >
      {type === 'success' ? (
        <span>✓</span>
      ) : (
        <span>✗</span>
      )}
      {message}
    </div>
  );
};
```

---

## 12. 可访问性规范

### 12.1 键盘可访问性
- 复制按钮支持Tab键聚焦
- 聚焦时有清晰的焦点样式（outline）
- 支持Enter/Space键触发点击

### 12.2 屏幕阅读器支持
- 按钮有清晰的aria-label描述
- Toast提示区域有aria-live属性用于动态内容播报
- 禁用状态有aria-disabled属性

### 12.3 对比度要求
- 按钮文字与背景对比度 ≥ 4.5:1（WCAG AA）
- Toast提示文字与背景对比度 ≥ 4.5:1

---

## 13. 状态转换矩阵

| 当前状态 | 触发事件 | 目标状态 |
|----------|----------|----------|
| normal | 鼠标悬停 | hover |
| hover | 鼠标离开 | normal |
| hover | 鼠标点击 | active → success/error |
| success | 3秒后 | normal |
| disabled | 创建语句加载完成 | normal |
| normal | 创建语句为空 | disabled |

---

**文档版本**: v1.0  
**创建日期**: 2026-04-30  
**适用项目**: SQL编辑器数据库对象详情模态框复制功能  
**相关文档**: 《数据库对象详情模态框复制功能需求规格说明书》