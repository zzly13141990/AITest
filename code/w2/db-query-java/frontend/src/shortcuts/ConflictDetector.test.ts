/**
 * 冲突检测器单元测试
 */

import { ConflictDetector } from './ConflictDetector';
import { ShortcutConfig, ShortcutAction } from '../types/shortcuts';

describe('ConflictDetector', () => {
  let conflictDetector: ConflictDetector;

  beforeEach(() => {
    conflictDetector = new ConflictDetector();
  });

  describe('detect', () => {
    it('应该检测到相同快捷键的冲突', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }],
        ['newTab', {
          action: 'newTab',
          keybinding: { modifiers: ['Ctrl'], key: 'B' },
          description: 'Action 2',
          category: 'Test'
        }]
      ]);

      const result = conflictDetector.detect(shortcuts, { modifiers: ['Ctrl'], key: 'A' });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingActions).toEqual(['execute']);
    });

    it('应该在排除自身时不检测冲突', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }]
      ]);

      const result = conflictDetector.detect(shortcuts, { modifiers: ['Ctrl'], key: 'A' }, 'execute');

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingActions).toEqual([]);
    });

    it('应该检测多个冲突', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }],
        ['newTab', {
          action: 'newTab',
          keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'A' },
          description: 'Action 2',
          category: 'Test'
        }],
        ['closeTab', {
          action: 'closeTab',
          keybinding: { modifiers: ['Ctrl'], key: 'B' },
          description: 'Action 3',
          category: 'Test'
        }]
      ]);

      const result = conflictDetector.detect(shortcuts, { modifiers: ['Ctrl', 'Shift'], key: 'A' });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingActions).toEqual(['execute', 'newTab']);
    });

    it('应该正确处理修饰键顺序不同的情况', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }]
      ]);

      // 修饰键顺序不同但组合相同
      const result = conflictDetector.detect(shortcuts, { modifiers: ['Shift', 'Ctrl'], key: 'A' });

      expect(result.hasConflict).toBe(true);
    });

    it('应该检测不到不匹配的快捷键', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }]
      ]);

      const result = conflictDetector.detect(shortcuts, { modifiers: ['Ctrl'], key: 'B' });

      expect(result.hasConflict).toBe(false);
    });
  });

  describe('getAllConflicts', () => {
    it('应该返回所有冲突', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }],
        ['newTab', {
          action: 'newTab',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 2',
          category: 'Test'
        }],
        ['closeTab', {
          action: 'closeTab',
          keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'B' },
          description: 'Action 3',
          category: 'Test'
        }],
        ['nextTab', {
          action: 'nextTab',
          keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'B' },
          description: 'Action 4',
          category: 'Test'
        }]
      ]);

      const conflicts = conflictDetector.getAllConflicts(shortcuts);

      expect(conflicts.length).toBe(2);
      expect(conflicts[0].conflictingActions).toContain('execute');
      expect(conflicts[0].conflictingActions).toContain('newTab');
      expect(conflicts[1].conflictingActions).toContain('closeTab');
      expect(conflicts[1].conflictingActions).toContain('nextTab');
    });

    it('应该返回空数组当没有冲突时', () => {
      const shortcuts = new Map<ShortcutAction, ShortcutConfig>([
        ['execute', {
          action: 'execute',
          keybinding: { modifiers: ['Ctrl'], key: 'A' },
          description: 'Action 1',
          category: 'Test'
        }],
        ['newTab', {
          action: 'newTab',
          keybinding: { modifiers: ['Ctrl'], key: 'B' },
          description: 'Action 2',
          category: 'Test'
        }]
      ]);

      const conflicts = conflictDetector.getAllConflicts(shortcuts);

      expect(conflicts.length).toBe(0);
    });
  });

  describe('validateKeybinding', () => {
    it('应该验证有效的快捷键组合', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: ['Ctrl', 'Shift'], key: 'A' });

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该拒绝空按键', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: ['Ctrl'], key: '' });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('按键不能为空');
    });

    it('应该拒绝无效的修饰键', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: ['Ctrl' as any, 'Invalid'], key: 'A' });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('无效的修饰键: Invalid');
    });

    it('应该拒绝重复的修饰键', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: ['Ctrl', 'Ctrl'], key: 'A' });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('修饰键不能重复');
    });

    it('应该拒绝无效的按键', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: [], key: 'InvalidKey' });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('无效的按键: InvalidKey');
    });

    it('应该接受功能键', () => {
      const result = conflictDetector.validateKeybinding({ modifiers: [], key: 'F5' });

      expect(result.valid).toBe(true);
    });

    it('应该接受特殊键', () => {
      expect(conflictDetector.validateKeybinding({ modifiers: ['Ctrl'], key: 'Enter' }).valid).toBe(true);
      expect(conflictDetector.validateKeybinding({ modifiers: ['Ctrl'], key: 'Tab' }).valid).toBe(true);
      expect(conflictDetector.validateKeybinding({ modifiers: [], key: 'Space' }).valid).toBe(true);
    });
  });
});