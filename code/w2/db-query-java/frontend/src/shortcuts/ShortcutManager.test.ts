/**
 * 快捷键管理器单元测试
 */

import { ShortcutManager } from './ShortcutManager';

describe('ShortcutManager', () => {
  let shortcutManager: ShortcutManager;

  beforeEach(() => {
    // 清除单例实例
    (ShortcutManager as any).instance = null;
    
    // 创建实例
    shortcutManager = ShortcutManager.getInstance();
  });

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = ShortcutManager.getInstance();
      const instance2 = ShortcutManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAllShortcuts', () => {
    it('应该返回所有快捷键配置', () => {
      const shortcuts = shortcutManager.getAllShortcuts();
      
      expect(Array.isArray(shortcuts)).toBe(true);
      expect(shortcuts.length).toBeGreaterThan(0);
    });
  });

  describe('getShortcut', () => {
    it('应该返回指定动作的快捷键配置', () => {
      const shortcut = shortcutManager.getShortcut('execute');
      
      expect(shortcut).toBeDefined();
      expect(shortcut?.action).toBe('execute');
    });

    it('应该返回undefined当动作不存在时', () => {
      const shortcut = shortcutManager.getShortcut('nonExistentAction' as any);
      
      expect(shortcut).toBeUndefined();
    });
  });

  describe('updateShortcut', () => {
    it('应该在没有冲突时更新快捷键', () => {
      const result = shortcutManager.updateShortcut('execute', { modifiers: ['Alt'], key: 'C' });
      
      expect(result).toBe(true);
      
      // 验证配置已更新
      const shortcut = shortcutManager.getShortcut('execute');
      expect(shortcut?.keybinding).toEqual({ modifiers: ['Alt'], key: 'C' });
    });

    it('应该在有冲突时拒绝更新快捷键', () => {
      // 获取一个已存在的快捷键
      const existingShortcut = shortcutManager.getShortcut('newTab');
      if (existingShortcut) {
        // 尝试将另一个功能点设置为相同的快捷键
        const result = shortcutManager.updateShortcut('execute', existingShortcut.keybinding);
        
        expect(result).toBe(false);
      }
    });
  });

  describe('restoreDefaults', () => {
    it('应该恢复默认快捷键配置', () => {
      // 先修改一个配置
      shortcutManager.updateShortcut('execute', { modifiers: ['Alt'], key: 'C' });
      
      // 验证已修改
      expect(shortcutManager.getShortcut('execute')?.keybinding).toEqual({ modifiers: ['Alt'], key: 'C' });
      
      // 然后恢复默认
      shortcutManager.restoreDefaults();
      
      // 验证是否恢复了默认配置
      const executeShortcut = shortcutManager.getShortcut('execute');
      expect(executeShortcut?.keybinding).toEqual({ modifiers: ['Ctrl'], key: 'Enter' });
    });
  });

  describe('detectConflict', () => {
    it('应该检测到冲突', () => {
      const existingShortcut = shortcutManager.getShortcut('newTab');
      if (existingShortcut) {
        const conflict = shortcutManager.detectConflict(existingShortcut.keybinding, 'execute');
        expect(conflict.hasConflict).toBe(true);
      }
    });

    it('应该检测不到不冲突的快捷键', () => {
      const conflict = shortcutManager.detectConflict({ modifiers: ['Ctrl', 'Alt'], key: 'Z' });
      expect(conflict.hasConflict).toBe(false);
    });
  });

  describe('formatKeybinding', () => {
    it('应该正确格式化快捷键组合', () => {
      const keybinding = { modifiers: ['Ctrl' as const, 'Shift' as const], key: 'A' };
      const formatted = shortcutManager.formatKeybinding(keybinding);
      
      expect(formatted).toBe('Ctrl + Shift + A');
    });

    it('应该正确格式化单个按键', () => {
      const keybinding = { modifiers: [] as any, key: 'F1' };
      const formatted = shortcutManager.formatKeybinding(keybinding);
      
      expect(formatted).toBe('F1');
    });

    it('应该正确格式化带Alt的组合', () => {
      const keybinding = { modifiers: ['Ctrl' as const, 'Alt' as const], key: 'Del' };
      const formatted = shortcutManager.formatKeybinding(keybinding);
      
      expect(formatted).toBe('Ctrl + Alt + Del');
    });
  });

  describe('handleKeyEvent', () => {
    it('应该在禁用时返回false', () => {
      shortcutManager.setEnabled(false);
      
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'S' });
      const result = shortcutManager.handleKeyEvent(event);
      
      expect(result).toBe(false);
    });

    it('应该在启用且编辑器聚焦时处理键盘事件', () => {
      shortcutManager.setEnabled(true);
      shortcutManager.setContext({ editorFocused: true });
      
      // Ctrl+Enter 应该触发 execute 动作
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'Enter' });
      const result = shortcutManager.handleKeyEvent(event);
      
      expect(result).toBe(true);
    });

    it('应该在输入框聚焦时阻止非查找快捷键', () => {
      shortcutManager.setEnabled(true);
      shortcutManager.setContext({ inputFocused: true });
      
      // Ctrl+S 在输入框聚焦时不应触发保存
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'S' });
      const result = shortcutManager.handleKeyEvent(event);
      
      expect(result).toBe(false);
    });

    it('应该忽略不匹配的快捷键', () => {
      shortcutManager.setEnabled(true);
      shortcutManager.setContext({ editorFocused: true });
      
      // 随机组合键，不匹配任何配置
      const event = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'Z' });
      const result = shortcutManager.handleKeyEvent(event);
      
      expect(result).toBe(false);
    });
  });

  describe('setContext', () => {
    it('应该设置上下文状态', () => {
      shortcutManager.setContext({ editorFocused: true, inputFocused: false });
      
      const context = shortcutManager.getContext();
      expect(context.editorFocused).toBe(true);
      expect(context.inputFocused).toBe(false);
    });

    it('应该支持部分上下文更新', () => {
      shortcutManager.setContext({ editorFocused: true });
      
      const context = shortcutManager.getContext();
      expect(context.editorFocused).toBe(true);
      expect(context.inputFocused).toBe(false); // 默认值
    });
  });

  describe('isEnabled', () => {
    it('应该返回启用状态', () => {
      expect(shortcutManager.isEnabled()).toBe(true);
      
      shortcutManager.setEnabled(false);
      expect(shortcutManager.isEnabled()).toBe(false);
      
      shortcutManager.setEnabled(true);
      expect(shortcutManager.isEnabled()).toBe(true);
    });
  });

  describe('importConfig', () => {
    it('应该导入有效的配置', () => {
      // 使用一个不太可能与现有配置冲突的快捷键组合
      const configJson = JSON.stringify([{
        action: 'execute',
        keybinding: { modifiers: ['Ctrl', 'Alt', 'Shift'], key: 'Z' },
        description: 'Execute query',
        category: '查询操作'
      }]);
      
      const result = shortcutManager.importConfig(configJson);
      
      expect(result).toBe(true);
      
      // 验证配置已导入
      const shortcut = shortcutManager.getShortcut('execute');
      expect(shortcut).toBeDefined();
      expect(shortcut?.keybinding).toEqual({ modifiers: ['Ctrl', 'Alt', 'Shift'], key: 'Z' });
    });

    it('应该拒绝无效的JSON', () => {
      const result = shortcutManager.importConfig('invalid json');
      
      expect(result).toBe(false);
    });

    it('应该拒绝包含冲突的配置', () => {
      // 获取一个已存在的快捷键配置
      const existingShortcut = shortcutManager.getShortcut('newTab');
      if (existingShortcut) {
        // 创建包含冲突的配置
        const configJson = JSON.stringify([{
          action: 'execute',
          keybinding: existingShortcut.keybinding,
          description: 'Execute query',
          category: '查询操作'
        }]);
        
        const result = shortcutManager.importConfig(configJson);
        
        expect(result).toBe(false);
      }
    });

    it('应该拒绝缺少必要字段的配置', () => {
      // 缺少action字段
      const configJson = JSON.stringify([{
        keybinding: { modifiers: ['Ctrl'], key: 'T' },
        description: 'Custom action',
        category: 'Custom'
      }]);
      
      const result = shortcutManager.importConfig(configJson);
      
      expect(result).toBe(false);
    });
  });

  describe('exportConfig', () => {
    it('应该导出配置为JSON字符串', () => {
      const configJson = shortcutManager.exportConfig();
      
      expect(typeof configJson).toBe('string');
      
      // 验证是有效的JSON
      const parsed = JSON.parse(configJson);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('应该包含所有快捷键配置', () => {
      const configJson = shortcutManager.exportConfig();
      const parsed = JSON.parse(configJson);
      
      const actions = parsed.map((item: any) => item.action);
      expect(actions).toContain('execute');
      expect(actions).toContain('newTab');
      expect(actions).toContain('closeTab');
    });
  });
});