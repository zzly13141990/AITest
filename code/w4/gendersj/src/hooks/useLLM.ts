import { useState, useCallback, useRef } from 'react';
import type { LLMConfig, QuestionConfig, GenerationState } from '../types';
import { LLMService } from '../services/llmService';

export function useLLM(config: LLMConfig) {
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    content: null
  });

  const isGeneratingRef = useRef(false);

  const generate = useCallback(async (questionConfig: QuestionConfig) => {
    // 防止重复提交
    if (isGeneratingRef.current) {
      return;
    }

    if (!config.apiKey) {
      setState({
        isLoading: false,
        error: '请先配置 API KEY',
        content: null
      });
      return;
    }

    isGeneratingRef.current = true;
    setState({
      isLoading: true,
      error: null,
      content: null
    });

    try {
      const service = new LLMService(config);
      const content = await service.generateQuestions(questionConfig);
      setState({
        isLoading: false,
        error: null,
        content
      });
    } catch (error: any) {
      setState({
        isLoading: false,
        error: error.message || '生成题目失败',
        content: null
      });
    } finally {
      isGeneratingRef.current = false;
    }
  }, [config]);

  const setContent = useCallback((content: string) => {
    setState(prev => ({ ...prev, content }));
  }, []);

  const clearContent = useCallback(() => {
    setState(prev => ({ ...prev, content: null, error: null }));
  }, []);

  return {
    ...state,
    generate,
    setContent,
    clearContent
  };
}
