const API_CONFIG_STORAGE_KEY = 'IMAGE_GENERATOR_API_CONFIG';

export const storage = {
  /**
   * 获取存储的 API 配置
   */
  getApiConfig: () => {
    try {
      const savedConfig = localStorage.getItem(API_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
    return {
      apiKey: '',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/images/generations',
      llmName: 'glm-4-flash'
    };
  },

  /**
   * 保存 API 配置
   */
  setApiConfig: (config: any): void => {
    try {
      localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save API config:', error);
    }
  },

  /**
   * 清除 API 配置
   */
  clearApiConfig: (): void => {
    localStorage.removeItem(API_CONFIG_STORAGE_KEY);
  },

  /**
   * 兼容旧版本：获取存储的 API KEY
   */
  getApiKey: (): string => {
    try {
      const config = storage.getApiConfig();
      return config.apiKey;
    } catch (error) {
      return localStorage.getItem('IMAGE_GENERATOR_API_KEY') || '';
    }
  }
};
