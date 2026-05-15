/**
 * 快捷键管理核心模块
 * 负责管理全局快捷键的注册、注销、事件处理和分发
 */

import { Keybinding, ShortcutAction, ShortcutConfig, ShortcutHandler, ModifierKey } from '../types/shortcuts';
import { defaultShortcuts } from './defaultShortcuts';
import { ConflictDetector } from './ConflictDetector';
import { ConfigPersistence } from './ConfigPersistence';

export class ShortcutManager {
  private static instance: ShortcutManager;
  
  // 快捷键配置映射
  private shortcuts: Map<ShortcutAction, ShortcutConfig>;
  
  // 快捷键处理器映射
  private handlers: Map<ShortcutAction, ShortcutHandler[]>;
  
  // 冲突检测器
  private conflictDetector: ConflictDetector;
  
  // 配置持久化器
  private configPersistence: ConfigPersistence;
  
  // 是否启用快捷键
  private enabled: boolean = true;
  
  // 上下文状态
  private context = {
    editorFocused: false,
    inputFocused: false
  };

  private constructor() {
    this.shortcuts = new Map();
    this.handlers = new Map();
    this.conflictDetector = new ConflictDetector();
    this.configPersistence = new ConfigPersistence();
    
    // 加载配置
    this.loadConfig();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ShortcutManager {
    if (!ShortcutManager.instance) {
      ShortcutManager.instance = new ShortcutManager();
    }
    return ShortcutManager.instance;
  }

  /**
   * 加载配置（从持久化存储或使用默认配置）
   */
  private loadConfig(): void {
    const savedConfig = this.configPersistence.load();
    
    if (savedConfig && savedConfig.length > 0) {
      savedConfig.forEach(config => {
        this.shortcuts.set(config.action as ShortcutAction, config);
      });
    } else {
      // 使用默认配置
      defaultShortcuts.forEach(config => {
        this.shortcuts.set(config.action, config);
      });
    }
  }

  /**
   * 保存配置到持久化存储
   */
  public saveConfig(): void {
    const configArray = Array.from(this.shortcuts.values());
    this.configPersistence.save(configArray);
  }

  /**
   * 注册快捷键处理器
   * @param action 快捷键动作
   * @param handler 处理器函数
   */
  public registerHandler(action: ShortcutAction, handler: ShortcutHandler): void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, []);
    }
    this.handlers.get(action)!.push(handler);
  }

  /**
   * 注销快捷键处理器
   * @param action 快捷键动作
   * @param handler 处理器函数（可选，不传则注销所有该动作的处理器）
   */
  public unregisterHandler(action: ShortcutAction, handler?: ShortcutHandler): void {
    const handlers = this.handlers.get(action);
    if (!handlers) return;
    
    if (handler) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.handlers.set(action, []);
    }
  }

  /**
   * 更新快捷键配置
   * @param action 快捷键动作
   * @param keybinding 新的快捷键组合
   * @returns 是否更新成功（如果有冲突则返回false）
   */
  public updateShortcut(action: ShortcutAction, keybinding: Keybinding): boolean {
    // 检测冲突
    const conflict = this.conflictDetector.detect(this.shortcuts, keybinding, action);
    if (conflict.hasConflict) {
      return false;
    }
    
    const config = this.shortcuts.get(action);
    if (config) {
      this.shortcuts.set(action, { ...config, keybinding });
      this.saveConfig();
    }
    
    return true;
  }

  /**
   * 获取所有快捷键配置
   */
  public getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 获取指定动作的快捷键配置
   * @param action 快捷键动作
   */
  public getShortcut(action: ShortcutAction): ShortcutConfig | undefined {
    return this.shortcuts.get(action);
  }

  /**
   * 恢复默认配置
   */
  public restoreDefaults(): void {
    this.shortcuts.clear();
    defaultShortcuts.forEach(config => {
      this.shortcuts.set(config.action, config);
    });
    this.saveConfig();
  }

  /**
   * 检测指定快捷键组合的冲突
   * @param keybinding 快捷键组合
   * @param excludeAction 排除的动作（用于检测时排除自身）
   */
  public detectConflict(keybinding: Keybinding, excludeAction?: ShortcutAction) {
    return this.conflictDetector.detect(this.shortcuts, keybinding, excludeAction);
  }

  /**
   * 设置上下文状态
   * @param context 上下文状态
   */
  public setContext(context: Partial<{ editorFocused: boolean; inputFocused: boolean }>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 获取当前上下文状态
   */
  public getContext() {
    return { ...this.context };
  }

  /**
   * 启用/禁用快捷键
   * @param enabled 是否启用
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 检查快捷键是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 处理键盘事件
   * @param event 键盘事件
   */
  public handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    // 对于全局快捷键（如Ctrl+T、Ctrl+W、Ctrl+Tab等），在任何处理之前先检测
    // 这些快捷键与浏览器默认行为冲突，必须最早处理
    if (this.isGlobalShortcut(event)) {
      // 立即阻止浏览器默认行为
      this.preventBrowserDefault(event);
    }

    // 获取当前按下的按键组合
    const keybinding = this.getKeybindingFromEvent(event);
    if (!keybinding) return false;

    // 查找匹配的快捷键
    const matchedAction = this.findMatchingAction(keybinding);
    if (!matchedAction) return false;

    // 根据上下文判断是否应该触发
    const shouldTrigger = this.shouldTrigger(matchedAction);
    if (!shouldTrigger) {
      // 如果是全局快捷键，即使不触发也返回true表示已处理（已阻止浏览器行为）
      if (this.isGlobalShortcutAction(matchedAction)) {
        return true;
      }
      return false;
    }

    // 对于非全局快捷键，在执行处理器之前阻止浏览器默认行为
    if (!this.isGlobalShortcutAction(matchedAction)) {
      this.preventBrowserDefault(event);
    }

    // 执行处理器
    this.executeHandlers(matchedAction, event);
    
    return true;
  }

  /**
   * 检测是否为全局快捷键（需要优先处理的快捷键）
   * @param event 键盘事件
   */
  private isGlobalShortcut(event: KeyboardEvent): boolean {
    // Ctrl/Cmd + T - 新建标签页
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
      return true;
    }
    // Ctrl/Cmd + W - 关闭标签页
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
      return true;
    }
    // Ctrl/Cmd + Tab - 切换标签页
    if ((event.ctrlKey || event.metaKey) && event.key === 'Tab') {
      return true;
    }
    // Ctrl/Cmd + Shift + Tab - 切换到上一个标签页
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Tab') {
      return true;
    }
    // Ctrl + , - 设置
    if ((event.ctrlKey || event.metaKey) && event.key === ',') {
      return true;
    }
    // F1 - 帮助
    if (event.key === 'F1') {
      return true;
    }
    return false;
  }

  /**
   * 判断动作是否为全局快捷键动作
   */
  private isGlobalShortcutAction(action: ShortcutAction): boolean {
    const globalActions: ShortcutAction[] = ['settings', 'help', 'newTab', 'closeTab', 'nextTab', 'prevTab'];
    return globalActions.includes(action);
  }

  /**
   * 阻止浏览器默认行为
   * 确保自定义快捷键能够覆盖浏览器默认快捷键
   * @param event 键盘事件
   */
  private preventBrowserDefault(event: KeyboardEvent): void {
    // 阻止事件冒泡
    event.stopPropagation();
    
    // 阻止浏览器默认行为
    event.preventDefault();
    
    // 对于某些特殊组合，需要额外处理
    // 例如：Ctrl+W在浏览器中默认关闭标签页
    // Ctrl+T默认新建标签页等
    if (event.ctrlKey || event.metaKey) {
      // 这些组合通常是浏览器保留的，需要特别处理
      event.returnValue = false;
    }
  }

  /**
   * 从键盘事件中提取快捷键组合
   * @param event 键盘事件
   */
  private getKeybindingFromEvent(event: KeyboardEvent): Keybinding | null {
    const modifiers: ModifierKey[] = [];
    
    if (event.ctrlKey || event.metaKey) {
      modifiers.push('Ctrl');
    }
    if (event.shiftKey) {
      modifiers.push('Shift');
    }
    if (event.altKey) {
      modifiers.push('Alt');
    }

    // 如果没有修饰键且不是特殊键，直接返回null
    if (modifiers.length === 0) {
      // 单独的功能键（如F1-F12）可以作为快捷键
      if (!this.isFunctionKey(event.key)) {
        return null;
      }
    }

    const key = this.normalizeKey(event.key);
    
    if (!key) return null;

    return { modifiers, key };
  }

  /**
   * 标准化按键名称
   * @param key 原始按键名称
   */
  private normalizeKey(key: string): string | null {
    // 处理特殊键
    const keyMap: { [key: string]: string } = {
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Esc',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
      'Insert': 'Insert',
      ' ': 'Space',
    };

    if (keyMap[key]) {
      return keyMap[key];
    }

    // 功能键
    if (this.isFunctionKey(key)) {
      return key;
    }

    // 字母键转为大写
    if (key.length === 1 && key.match(/[a-zA-Z]/)) {
      return key.toUpperCase();
    }

    // 数字键
    if (key.match(/[0-9]/)) {
      return key;
    }

    // 特殊字符
    const specialChars: { [key: string]: string } = {
      '.': '.',
      ',': ',',
      ';': ';',
      ':': ':',
      '/': '/',
      '\\': '\\',
      '`': '`',
      '~': '~',
      '!': '!',
      '@': '@',
      '#': '#',
      '$': '$',
      '%': '%',
      '^': '^',
      '&': '&',
      '*': '*',
      '(': '(',
      ')': ')',
      '-': '-',
      '_': '_',
      '=': '=',
      '+': '+',
      '[': '[',
      ']': ']',
      '{': '{',
      '}': '}',
      '"': '"',
      '\'': '\'',
      '<': '<',
      '>': '>',
      '?': '?',
      '|': '|',
    };

    if (specialChars[key]) {
      return specialChars[key];
    }

    return null;
  }

  /**
   * 判断是否为功能键
   * @param key 按键名称
   */
  private isFunctionKey(key: string): boolean {
    return /^F[1-9]$|^F1[0-2]$/.test(key);
  }

  /**
   * 查找匹配的快捷键动作
   * @param keybinding 快捷键组合
   */
  private findMatchingAction(keybinding: Keybinding): ShortcutAction | null {
    for (const [action, config] of this.shortcuts) {
      if (this.matchKeybinding(config.keybinding, keybinding)) {
        return action;
      }
    }
    return null;
  }

  /**
   * 比较两个快捷键组合是否匹配
   * @param configKeybinding 配置中的快捷键
   * @param eventKeybinding 事件中的快捷键
   */
  private matchKeybinding(configKeybinding: Keybinding, eventKeybinding: Keybinding): boolean {
    // 比较按键
    if (configKeybinding.key !== eventKeybinding.key) {
      return false;
    }

    // 比较修饰键（不考虑顺序）
    const configModifiers = new Set(configKeybinding.modifiers);
    const eventModifiers = new Set(eventKeybinding.modifiers);

    if (configModifiers.size !== eventModifiers.size) {
      return false;
    }

    for (const modifier of configModifiers) {
      if (!eventModifiers.has(modifier)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 判断是否应该触发快捷键
   * @param action 快捷键动作
   */
  private shouldTrigger(action: ShortcutAction): boolean {
    // 全局快捷键 - 任何时候都可以触发
    const globalActions: ShortcutAction[] = ['settings', 'help', 'newTab', 'closeTab', 'nextTab', 'prevTab'];
    
    // 编辑器快捷键 - 需要编辑器聚焦或全局可用
    const editorActions: ShortcutAction[] = ['execute', 'generate', 'format', 'comment', 'uncomment'];
    
    // 查找替换快捷键 - 在输入框中也可以使用
    const findActions: ShortcutAction[] = ['find', 'replace'];
    
    // 文件操作快捷键
    const fileActions: ShortcutAction[] = ['saveQuery', 'exportExcel'];

    // 如果是全局快捷键，任何时候都可以触发
    if (globalActions.includes(action)) {
      return true;
    }

    // 如果是查找替换快捷键，任何时候都可以触发
    if (findActions.includes(action)) {
      return true;
    }

    // 如果是编辑器快捷键，需要编辑器聚焦或者没有输入框聚焦
    if (editorActions.includes(action)) {
      if (this.context.inputFocused) {
        return false;
      }
      return true;
    }

    // 如果是文件操作快捷键，需要编辑器聚焦或者没有输入框聚焦
    if (fileActions.includes(action)) {
      if (this.context.inputFocused) {
        return false;
      }
      return true;
    }

    // 默认允许触发
    return true;
  }

  /**
   * 执行快捷键处理器
   * @param action 快捷键动作
   * @param event 键盘事件
   */
  private executeHandlers(action: ShortcutAction, event: KeyboardEvent): void {
    const handlers = this.handlers.get(action);
    if (!handlers || handlers.length === 0) return;

    // 阻止默认行为
    event.preventDefault();
    event.stopPropagation();

    // 执行所有处理器
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error executing handler for action "${action}":`, error);
      }
    });
  }

  /**
   * 格式化快捷键显示文本
   * @param keybinding 快捷键组合
   */
  public formatKeybinding(keybinding: Keybinding): string {
    const parts: string[] = [];
    
    if (keybinding.modifiers.includes('Ctrl')) {
      parts.push('Ctrl');
    }
    if (keybinding.modifiers.includes('Shift')) {
      parts.push('Shift');
    }
    if (keybinding.modifiers.includes('Alt')) {
      parts.push('Alt');
    }
    if (keybinding.modifiers.includes('Meta')) {
      parts.push('Meta');
    }
    
    parts.push(keybinding.key);
    
    return parts.join(' + ');
  }

  /**
   * 导出配置
   */
  public exportConfig(): string {
    const configArray = Array.from(this.shortcuts.values());
    return JSON.stringify(configArray, null, 2);
  }

  /**
   * 导入配置
   * @param configJson 配置JSON字符串
   * @returns 是否导入成功
   */
  public importConfig(configJson: string): boolean {
    try {
      const configArray: ShortcutConfig[] = JSON.parse(configJson);
      
      // 验证配置格式
      for (const config of configArray) {
        if (!config.action || !config.keybinding || !config.description) {
          return false;
        }
      }
      
      // 检测冲突
      const tempMap = new Map(this.shortcuts);
      let hasConflict = false;
      
      for (const config of configArray) {
        const conflict = this.conflictDetector.detect(tempMap, config.keybinding, config.action as ShortcutAction);
        if (conflict.hasConflict) {
          hasConflict = true;
          break;
        }
        tempMap.set(config.action as ShortcutAction, config);
      }
      
      if (hasConflict) {
        return false;
      }
      
      // 应用配置
      configArray.forEach(config => {
        this.shortcuts.set(config.action as ShortcutAction, config);
      });
      
      this.saveConfig();
      return true;
    } catch {
      return false;
    }
  }
}