import type { LLMConfig, QuestionRecord } from '../types';
import { STORAGE_KEYS, DEFAULT_LLM_CONFIG } from './constants';

export class StorageService {
  // 获取 LLM 配置
  static getLLMConfig(): LLMConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_LLM_CONFIG;
    } catch {
      return DEFAULT_LLM_CONFIG;
    }
  }

  // 保存 LLM 配置
  static saveLLMConfig(config: LLMConfig): void {
    localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config));
  }

  // 获取历史记录
  static getHistory(): QuestionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTION_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 保存历史记录
  static saveHistory(record: QuestionRecord): void {
    const history = this.getHistory();
    history.unshift(record);
    // 只保留最近50条
    const limited = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.QUESTION_RECORDS, JSON.stringify(limited));
  }

  // 删除历史记录
  static deleteHistory(id: string): void {
    const history = this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTION_RECORDS, JSON.stringify(filtered));
  }

  // 清空历史记录
  static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.QUESTION_RECORDS);
  }
}
