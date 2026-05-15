import { Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import LLMConfigComponent from './LLMConfig';
import QuestionConfigComponent from './QuestionConfig';
import type { LLMConfig, QuestionConfig } from '../types';

interface ConfigPanelProps {
  llmConfig: LLMConfig;
  questionConfig: QuestionConfig;
  onLLMConfigChange: (config: LLMConfig) => void;
  onQuestionConfigChange: (config: QuestionConfig) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export default function ConfigPanel({ 
  llmConfig, 
  questionConfig, 
  onLLMConfigChange, 
  onQuestionConfigChange, 
  onGenerate,
  isLoading
}: ConfigPanelProps) {
  return (
    <div className="config-panel">
      <LLMConfigComponent 
        config={llmConfig}
        onChange={onLLMConfigChange}
      />
      <QuestionConfigComponent 
        config={questionConfig}
        onChange={onQuestionConfigChange}
      />
      <Button 
        type="primary" 
        size="large"
        icon={<ThunderboltOutlined />}
        onClick={onGenerate}
        loading={isLoading}
        style={{ width: '100%', height: '48px' }}
      >
        生成题目
      </Button>
    </div>
  );
}
