import { useState, useCallback } from 'react';
import type { LLMConfig, QuestionRecord } from '../types';
import { StorageService } from '../utils/storage';

export function useStorage() {
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(StorageService.getLLMConfig);
  const [history, setHistory] = useState<QuestionRecord[]>(StorageService.getHistory);

  const saveLLMConfig = useCallback((config: LLMConfig) => {
    setLLMConfig(config);
    StorageService.saveLLMConfig(config);
  }, []);

  const saveToHistory = useCallback((record: QuestionRecord) => {
    StorageService.saveHistory(record);
    setHistory(StorageService.getHistory());
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    StorageService.deleteHistory(id);
    setHistory(StorageService.getHistory());
  }, []);

  const clearHistory = useCallback(() => {
    StorageService.clearHistory();
    setHistory([]);
  }, []);

  return {
    llmConfig,
    history,
    saveLLMConfig,
    saveToHistory,
    deleteFromHistory,
    clearHistory
  };
}
