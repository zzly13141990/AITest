/**
 * 配置持久化单元测试
 */

import { ConfigPersistence } from './ConfigPersistence';
import { ShortcutConfig } from '../types/shortcuts';

// Mock localStorage
const mockLocalStorage: {
  store: Record<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
} = {
  store: {},
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => { mockLocalStorage.store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete mockLocalStorage.store[key]; }),
  clear: jest.fn(() => { mockLocalStorage.store = {}; })
};

// 替换全局localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('ConfigPersistence', () => {
  let configPersistence: ConfigPersistence;

  beforeEach(() => {
    // 清除localStorage
    mockLocalStorage.store = {};
    jest.clearAllMocks();

    configPersistence = new ConfigPersistence();
  });

  describe('load', () => {
    it('应该返回null当没有保存的配置时', () => {
      const result = configPersistence.load();

      expect(result).toBe(null);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sql-editor-shortcuts');
    });

    it('应该返回有效的配置数组', () => {
      const validConfig: ShortcutConfig[] = [{
        action: 'execute',
        keybinding: { modifiers: ['Ctrl'], key: 'A' },
        description: 'Test',
        category: 'Test'
      }];

      mockLocalStorage.store['sql-editor-shortcuts'] = JSON.stringify(validConfig);

      const result = configPersistence.load();

      expect(result).toEqual(validConfig);
    });

    it('应该返回null当配置格式无效时', () => {
      // 存储无效的配置（不是数组）
      mockLocalStorage.store['sql-editor-shortcuts'] = JSON.stringify({ invalid: 'data' });

      const result = configPersistence.load();

      expect(result).toBe(null);
    });

    it('应该返回null当配置项缺少必要字段时', () => {
      const invalidConfig = [{
        // 缺少action字段
        keybinding: { modifiers: ['Ctrl'], key: 'A' },
        description: 'Test',
        category: 'Test'
      }];

      mockLocalStorage.store['sql-editor-shortcuts'] = JSON.stringify(invalidConfig);

      const result = configPersistence.load();

      expect(result).toBe(null);
    });

    it('应该处理JSON解析错误', () => {
      mockLocalStorage.store['sql-editor-shortcuts'] = 'invalid json';

      const result = configPersistence.load();

      expect(result).toBe(null);
    });
  });

  describe('save', () => {
    it('应该保存配置到localStorage', () => {
      const config: ShortcutConfig[] = [{
        action: 'execute',
        keybinding: { modifiers: ['Ctrl'], key: 'A' },
        description: 'Test',
        category: 'Test'
      }];

      configPersistence.save(config);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sql-editor-shortcuts',
        JSON.stringify(config)
      );
    });

    it('应该处理保存错误', () => {
      // 模拟存储错误
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const config: ShortcutConfig[] = [{
        action: 'execute',
        keybinding: { modifiers: ['Ctrl'], key: 'A' },
        description: 'Test',
        category: 'Test'
      }];

      // 不应该抛出异常
      expect(() => configPersistence.save(config)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('应该清除配置', () => {
      mockLocalStorage.store['sql-editor-shortcuts'] = 'test';

      configPersistence.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sql-editor-shortcuts');
    });

    it('应该处理清除错误', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // 不应该抛出异常
      expect(() => configPersistence.clear()).not.toThrow();
    });
  });

  describe('hasConfig', () => {
    it('应该返回true当有配置时', () => {
      mockLocalStorage.store['sql-editor-shortcuts'] = 'test';

      const result = configPersistence.hasConfig();

      expect(result).toBe(true);
    });

    it('应该返回false当没有配置时', () => {
      const result = configPersistence.hasConfig();

      expect(result).toBe(false);
    });
  });

  describe('getVersion', () => {
    it('应该返回当前版本号', () => {
      const version = configPersistence.getVersion();

      expect(version).toBe('1.0');
    });
  });
});