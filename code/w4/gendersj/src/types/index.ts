// LLM配置类型
export interface LLMConfig {
  modelName: string;
  apiKey: string;
  apiUrl: string;
}

// 题目配置类型
export interface QuestionConfig {
  subject: string;
  type: string;
  difficulty: string;
  grade: string;
  description: string;
}

// 生成记录类型
export interface QuestionRecord {
  id: string;
  timestamp: number;
  subject: string;
  type: string;
  difficulty: string;
  grade: string;
  description: string;
  content: string;
}

// 题目生成状态
export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  content: string | null;
}
