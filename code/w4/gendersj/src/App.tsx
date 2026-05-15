import { useState } from 'react';
import { Layout, message } from 'antd';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import PreviewPanel from './components/PreviewPanel';
import HistoryDrawer from './components/HistoryDrawer';
import { useStorage } from './hooks/useStorage';
import { useLLM } from './hooks/useLLM';
import type { QuestionConfig, QuestionRecord } from './types';
import './styles/index.css';

const { Content } = Layout;

function App() {
  const { llmConfig, history, saveLLMConfig, saveToHistory, deleteFromHistory, clearHistory } = useStorage();
  const { isLoading, error, content, generate, setContent } = useLLM(llmConfig);
  const [questionConfig, setQuestionConfig] = useState<QuestionConfig>({
    subject: '数学',
    type: '选择题',
    difficulty: '简单',
    grade: '小学1年级',
    description: ''
  });
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    // 验证题目描述是否为空
    if (!questionConfig.description || !questionConfig.description.trim()) {
      message.error('请输入题目描述');
      return;
    }
    await generate(questionConfig);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSaveToHistory = (content: string) => {
    const record: QuestionRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...questionConfig,
      content
    };
    saveToHistory(record);
    message.success('已保存到历史记录');
  };

  const handleLoadHistory = (record: QuestionRecord) => {
    setQuestionConfig({
      subject: record.subject,
      type: record.type,
      difficulty: record.difficulty,
      grade: record.grade,
      description: record.description
    });
    setContent(record.content);
  };

  return (
    <Layout className="app-layout">
      <Header 
        onOpenHistory={() => setShowHistory(true)} 
      />
      <Content className="app-content">
        <div className="main-container">
          <ConfigPanel
            llmConfig={llmConfig}
            questionConfig={questionConfig}
            onLLMConfigChange={saveLLMConfig}
            onQuestionConfigChange={setQuestionConfig}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
          <PreviewPanel
            content={content}
            error={error}
            isLoading={isLoading}
            questionConfig={questionConfig}
            onRegenerate={handleRegenerate}
            onSaveToHistory={handleSaveToHistory}
          />
        </div>
      </Content>
      <HistoryDrawer
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onLoad={handleLoadHistory}
        onDelete={deleteFromHistory}
        onClear={clearHistory}
      />
    </Layout>
  );
}

export default App;
