/**
 * 配置持久化模块
 * 负责将快捷键配置保存到本地存储
 */

import { ShortcutConfig } from '../types/shortcuts';

export class ConfigPersistence {
  // 本地存储键名
  private readonly STORAGE_KEY = 'sql-editor-shortcuts';
  
  // 版本号，用于处理配置升级
  private readonly VERSION = '1.0';

  /**
   * 加载配置
   * @returns 快捷键配置数组，如果没有配置则返回null
   */
  public load(): ShortcutConfig[] | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      
      // 验证数据结构
      if (!this.validateConfig(parsed)) {
        // 如果配置无效，返回null，让调用方使用默认配置
        console.warn('Invalid shortcut config found, using defaults');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load shortcut config:', error);
      return null;
    }
  }

  /**
   * 保存配置
   * @param config 快捷键配置数组
   */
  public save(config: ShortcutConfig[]): void {
    try {
      const dataToStore = config;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save shortcut config:', error);
    }
  }

  /**
   * 清除配置
   */
  public clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear shortcut config:', error);
    }
  }

  /**
   * 验证配置数据结构
   * @param config 待验证的配置数据
   */
  private validateConfig(config: any): config is ShortcutConfig[] {
    if (!Array.isArray(config)) {
      return false;
    }

    for (const item of config) {
      if (!this.validateConfigItem(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证单个配置项
   * @param item 待验证的配置项
   */
  private validateConfigItem(item: any): item is ShortcutConfig {
    if (!item || typeof item !== 'object') {
      return false;
    }

    // 检查必要字段
    if (!item.action || typeof item.action !== 'string') {
      return false;
    }

    if (!item.keybinding || typeof item.keybinding !== 'object') {
      return false;
    }

    if (!item.description || typeof item.description !== 'string') {
      return false;
    }

    // 检查keybinding结构
    const keybinding = item.keybinding;
    if (!Array.isArray(keybinding.modifiers)) {
      return false;
    }

    if (!keybinding.key || typeof keybinding.key !== 'string') {
      return false;
    }

    // 验证修饰键
    const validModifiers: string[] = ['Ctrl', 'Shift', 'Alt', 'Meta'];
    for (const modifier of keybinding.modifiers) {
      if (!validModifiers.includes(modifier)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查是否有保存的配置
   */
  public hasConfig(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored !== null;
    } catch {
      return false;
    }
  }

  /**
   * 获取配置版本
   */
  public getVersion(): string {
    return this.VERSION;
  }
}