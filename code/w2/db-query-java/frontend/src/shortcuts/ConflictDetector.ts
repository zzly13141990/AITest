/**
 * 冲突检测模块
 * 负责检测快捷键配置中的冲突
 */

import { Keybinding, ShortcutAction, ShortcutConfig, ConflictResult } from '../types/shortcuts';

export class ConflictDetector {
  /**
   * 检测指定快捷键组合是否与现有配置冲突
   * @param shortcuts 现有快捷键配置映射
   * @param keybinding 待检测的快捷键组合
   * @param excludeAction 排除的动作（用于更新时排除自身）
   */
  public detect(
    shortcuts: Map<ShortcutAction, ShortcutConfig>,
    keybinding: Keybinding,
    excludeAction?: ShortcutAction
  ): ConflictResult {
    const conflictingActions: ShortcutAction[] = [];

    for (const [action, config] of shortcuts) {
      // 排除指定的动作
      if (excludeAction && action === excludeAction) {
        continue;
      }

      // 比较快捷键组合
      if (this.matchKeybinding(config.keybinding, keybinding)) {
        conflictingActions.push(action);
      }
    }

    return {
      hasConflict: conflictingActions.length > 0,
      conflictingActions
    };
  }

  /**
   * 比较两个快捷键组合是否相同
   * @param keybinding1 第一个快捷键组合
   * @param keybinding2 第二个快捷键组合
   */
  private matchKeybinding(keybinding1: Keybinding, keybinding2: Keybinding): boolean {
    // 比较按键
    if (keybinding1.key !== keybinding2.key) {
      return false;
    }

    // 比较修饰键数量
    if (keybinding1.modifiers.length !== keybinding2.modifiers.length) {
      return false;
    }

    // 比较修饰键（不考虑顺序）
    const modifiers1 = new Set(keybinding1.modifiers);
    const modifiers2 = new Set(keybinding2.modifiers);

    for (const modifier of modifiers1) {
      if (!modifiers2.has(modifier)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取所有冲突的快捷键组合
   * @param shortcuts 快捷键配置映射
   */
  public getAllConflicts(shortcuts: Map<ShortcutAction, ShortcutConfig>): ConflictResult[] {
    const results: ConflictResult[] = [];
    const actions = Array.from(shortcuts.keys());

    for (let i = 0; i < actions.length; i++) {
      const action1 = actions[i];
      const config1 = shortcuts.get(action1)!;

      for (let j = i + 1; j < actions.length; j++) {
        const action2 = actions[j];
        const config2 = shortcuts.get(action2)!;

        if (this.matchKeybinding(config1.keybinding, config2.keybinding)) {
          // 检查是否已记录这个冲突
          const existingConflict = results.find(
            r => r.conflictingActions.includes(action1) && r.conflictingActions.includes(action2)
          );

          if (!existingConflict) {
            results.push({
              hasConflict: true,
              conflictingActions: [action1, action2]
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * 验证单个快捷键配置是否有效
   * @param keybinding 快捷键组合
   */
  public validateKeybinding(keybinding: Keybinding): { valid: boolean; message?: string } {
    // 检查按键是否为空
    if (!keybinding.key || keybinding.key.trim() === '') {
      return { valid: false, message: '按键不能为空' };
    }

    // 检查修饰键是否有效
    const validModifiers: string[] = ['Ctrl', 'Shift', 'Alt', 'Meta'];
    for (const modifier of keybinding.modifiers) {
      if (!validModifiers.includes(modifier)) {
        return { valid: false, message: `无效的修饰键: ${modifier}` };
      }
    }

    // 检查是否有重复的修饰键
    const uniqueModifiers = new Set(keybinding.modifiers);
    if (uniqueModifiers.size !== keybinding.modifiers.length) {
      return { valid: false, message: '修饰键不能重复' };
    }

    // 检查按键是否为有效字符
    const validKeyPattern = /^[a-zA-Z0-9]$|^(Up|Down|Left|Right|Enter|Tab|Esc|Backspace|Delete|Home|End|PageUp|PageDown|Insert|Space|F[1-9]|F1[0-2])$/;
    if (!validKeyPattern.test(keybinding.key)) {
      return { valid: false, message: `无效的按键: ${keybinding.key}` };
    }

    return { valid: true };
  }
}