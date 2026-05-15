/**
 * 快捷键类型定义
 */

/**
 * 修饰键类型
 */
export type ModifierKey = 'Ctrl' | 'Shift' | 'Alt' | 'Meta';

/**
 * 快捷键组合
 */
export interface Keybinding {
  modifiers: ModifierKey[];
  key: string;
}

/**
 * 快捷键动作类型
 */
export type ShortcutAction = 
  | 'execute'           // 执行查询
  | 'generate'          // LLM生成
  | 'newTab'            // 新建标签页
  | 'closeTab'          // 关闭当前标签页
  | 'nextTab'           // 下一个标签页
  | 'prevTab'           // 上一个标签页
  | 'saveQuery'         // 保存查询
  | 'exportExcel'       // 导出Excel
  | 'find'              // 查找
  | 'replace'           // 替换
  | 'comment'           // 注释代码
  | 'uncomment'         // 取消注释
  | 'format'            // 格式化SQL
  | 'settings'          // 打开设置
  | 'help';             // 帮助

/**
 * 快捷键配置项
 */
export interface ShortcutConfig {
  action: ShortcutAction;
  keybinding: Keybinding;
  description: string;
  category: string;
}

/**
 * 冲突检测结果
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflictingActions: ShortcutAction[];
}

/**
 * 快捷键上下文
 */
export interface ShortcutContext {
  editorFocused: boolean;
  inputFocused: boolean;
}

/**
 * 快捷键事件处理函数
 */
export type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * 快捷键配置集合
 */
export interface ShortcutConfigMap {
  [action: string]: ShortcutConfig;
}