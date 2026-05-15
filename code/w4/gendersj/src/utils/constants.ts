import type { LLMConfig } from '../types';

export const SUBJECTS = [
  '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'
];

export const QUESTION_TYPES = [
  '选择题', '判断题', '填空题', '简答题', '多选题', '单选题', '计算题', '应用题'
];

export const DIFFICULTIES = ['简单', '中等', '困难'];

export const GRADES = [
  '小学1年级', '小学2年级', '小学3年级', '小学4年级', '小学5年级', '小学6年级',
  '初中1年级', '初中2年级', '初中3年级',
  '高中1年级', '高中2年级', '高中3年级',
  '大学'
];

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  modelName: 'glm-4.7',
  apiKey: '',
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
};

export const STORAGE_KEYS = {
  LLM_CONFIG: 'llm_config',
  QUESTION_RECORDS: 'question_records'
};
