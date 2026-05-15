import React, { useState, useEffect } from 'react';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ImagePreview } from './components/ImagePreview';
import { storage } from './utils/storage';
import { downloadImage } from './utils/image';
import { generateImage, generateMockImage } from './services/imageGenerator';
import './App.css';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [llmName, setLlmName] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [enhancePrompt, setEnhancePrompt] = useState<boolean>(true);

  useEffect(() => {
    const savedConfig = storage.getApiConfig();
    if (savedConfig) {
      setApiKey(savedConfig.apiKey);
      setApiUrl(savedConfig.apiUrl);
      setLlmName(savedConfig.llmName);
    }
  }, []);

  const handleSaveApiConfig = () => {
    storage.setApiConfig({ apiKey, apiUrl, llmName });
    setError(null);
  };

  const handleGenerate = async () => {
    console.log('=== 点击生成按钮 ===');
    console.log('配置信息:', { useMock, apiKey: apiKey ? '已设置' : '未设置', apiUrl, llmName });
    console.log('Prompt:', prompt);
    
    if (!apiKey.trim() && !useMock) {
      setError('请先配置 API KEY');
      return;
    }
    if (!apiUrl.trim() && !useMock) {
      setError('请先配置 API 地址');
      return;
    }
    if (!llmName.trim() && !useMock) {
      setError('请先配置 LLM 名称');
      return;
    }
    if (!prompt.trim()) {
      setError('请输入图片描述');
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedImageUrl(null);

    try {
      let response;
      if (useMock) {
        console.log('使用模拟数据模式');
        response = await generateMockImage({ prompt });
      } else {
        console.log('调用真实API模式');
        response = await generateImage({ prompt }, apiKey, apiUrl, llmName, enhancePrompt);
      }
      console.log('生成成功，imageUrl:', response.imageUrl ? '已获取' : 'null');
      setGeneratedImageUrl(response.imageUrl);
    } catch (err: any) {
      console.error('生成失败:', err);
      setError(err.message || '图片生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadImage(generatedImageUrl, `ai-image-${timestamp}.png`);
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="main-layout">
          <div className="header-section">
            <div className="left-header">
              <h1 className="app-title">AI绘画生成器</h1>
              <button 
                className="config-toggle"
                onClick={() => setShowConfig(!showConfig)}
              >
                ⚙️ 设置
              </button>
            </div>
            <div className="right-header">
              <div className="preview-title">
                <span>图片预览区</span>
              </div>
            </div>
          </div>
          
          <div className="content-section">
            <div className="left-panel">
              {showConfig && (
                <div className="config-panel">
                  <div className="config-item">
                    <label>API 地址</label>
                    <Input
                      placeholder="请输入 API 地址"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      disabled={useMock}
                    />
                  </div>
                  <div className="config-item">
                    <label>LLM 名称</label>
                    <Input
                      placeholder="请输入 LLM 名称"
                      value={llmName}
                      onChange={(e) => setLlmName(e.target.value)}
                      disabled={useMock}
                    />
                  </div>
                  <div className="config-item">
                    <label>API KEY</label>
                    <Input
                      type="password"
                      placeholder="请输入您的 API KEY"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={useMock}
                    />
                  </div>
                  <div className="config-item">
                    <label className="mock-toggle">
                      <input
                        type="checkbox"
                        checked={enhancePrompt}
                        onChange={(e) => setEnhancePrompt(e.target.checked)}
                      />
                      自动增强提示词 (让图片更完整)
                    </label>
                  </div>
                  <div className="config-actions">
                    <label className="mock-toggle">
                      <input
                        type="checkbox"
                        checked={useMock}
                        onChange={(e) => setUseMock(e.target.checked)}
                      />
                      使用模拟数据
                    </label>
                    <Button
                      variant="secondary"
                      onClick={handleSaveApiConfig}
                      disabled={useMock}
                    >
                      保存配置
                    </Button>
                  </div>
                </div>
              )}

              <div className="input-area">
                <textarea
                  className="prompt-input"
                  placeholder="输入绘画描述"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="bottom-actions">
                <Button
                  onClick={handleGenerate}
                  isLoading={isLoading}
                  className="generate-button"
                >
                  一键生成
                </Button>
              </div>
            </div>

            <div className="right-panel">
              <div className="preview-wrapper">
                <ImagePreview
                  imageUrl={generatedImageUrl}
                  isLoading={isLoading}
                  onDownload={handleDownload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
