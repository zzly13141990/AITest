/**
 * 默认快捷键配置
 */

import { ShortcutConfig } from '../types/shortcuts';

export const defaultShortcuts: ShortcutConfig[] = [
  {
    action: 'execute',
    keybinding: { modifiers: ['Ctrl'], key: 'Enter' },
    description: '执行SQL查询',
    category: '查询操作'
  },
  {
    action: 'generate',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'G' },
    description: '使用LLM生成SQL',
    category: '查询操作'
  },
  {
    action: 'newTab',
    keybinding: { modifiers: ['Ctrl'], key: 'T' },
    description: '新建查询标签页',
    category: '标签页操作'
  },
  {
    action: 'closeTab',
    keybinding: { modifiers: ['Ctrl'], key: 'W' },
    description: '关闭当前标签页',
    category: '标签页操作'
  },
  {
    action: 'nextTab',
    keybinding: { modifiers: ['Ctrl'], key: 'Tab' },
    description: '切换到下一个标签页',
    category: '标签页操作'
  },
  {
    action: 'prevTab',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'Tab' },
    description: '切换到上一个标签页',
    category: '标签页操作'
  },
  {
    action: 'saveQuery',
    keybinding: { modifiers: ['Ctrl'], key: 'S' },
    description: '保存当前查询',
    category: '文件操作'
  },
  {
    action: 'exportExcel',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'E' },
    description: '导出查询结果为Excel',
    category: '文件操作'
  },
  {
    action: 'find',
    keybinding: { modifiers: ['Ctrl'], key: 'F' },
    description: '查找文本',
    category: '编辑操作'
  },
  {
    action: 'replace',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'H' },
    description: '查找并替换',
    category: '编辑操作'
  },
  {
    action: 'comment',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'C' },
    description: '注释代码',
    category: '编辑操作'
  },
  {
    action: 'uncomment',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'U' },
    description: '取消注释',
    category: '编辑操作'
  },
  {
    action: 'format',
    keybinding: { modifiers: ['Ctrl', 'Shift'], key: 'F' },
    description: '格式化SQL代码',
    category: '编辑操作'
  },
  {
    action: 'settings',
    keybinding: { modifiers: ['Ctrl'], key: ',' },
    description: '打开设置页面',
    category: '系统操作'
  },
  {
    action: 'help',
    keybinding: { modifiers: [], key: 'F1' },
    description: '打开帮助文档',
    category: '系统操作'
  }
];