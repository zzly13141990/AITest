import axios from 'axios';
import type { LLMConfig, QuestionConfig } from '../types';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  // 构建提示词
  private buildPrompt(config: QuestionConfig): string {
    const formatRequirements = this.getFormatRequirements(config.type);
    return `请根据以下要求生成题目：
- 科目：${config.subject}
- 题型：${config.type}
- 难度：${config.difficulty}
- 年级：${config.grade}
- 描述：${config.description}

格式要求：
${formatRequirements}

请直接输出题目内容，不需要其他说明文字。`;
  }

  // 获取格式要求
  private getFormatRequirements(type: string): string {
    const requirements: Record<string, string> = {
      '选择题': '每个题目提供A、B、C、D四个选项',
      '多选题': '每个题目提供A、B、C、D四个选项，标注为多选题',
      '单选题': '每个题目提供A、B、C、D四个选项，标注为单选题',
      '判断题': '每个题目后留出空白填写"对"或"错"',
      '填空题': '每个题目使用_____表示填空位置',
      '简答题': '每个题目后留出三行空白供书写答案',
      '计算题': '每个题目后留出三行空白供计算过程',
      '应用题': '每个题目后留出三行空白供解答过程'
    };
    return requirements[type] || '题目后留出适当空白';
  }

  // 生成题目
  async generateQuestions(config: QuestionConfig): Promise<string> {
    const prompt = this.buildPrompt(config);

    try {
      const response = await axios.post(
        this.config.apiUrl,
        {
          model: this.config.modelName,
          messages: [
            { role: 'system', content: '你是一个专业的题目生成助手，擅长生成各种科目的练习题。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 90000 // 增加到 90 秒
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接或稍后重试');
      }
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`API请求失败 (${status}): ${message}`);
      }
      if (error.request) {
        throw new Error('网络请求失败，请检查网络连接');
      }
      throw new Error(`请求失败: ${error.message}`);
    }
  }
}
