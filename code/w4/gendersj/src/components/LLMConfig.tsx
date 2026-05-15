import { Form, Input, Collapse } from 'antd';
import type { LLMConfig } from '../types';

const { Panel } = Collapse;

interface LLMConfigProps {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}

export default function LLMConfigComponent({ config, onChange }: LLMConfigProps) {
  const handleChange = (key: keyof LLMConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Collapse defaultActiveKey={['1']} style={{ marginBottom: '24px' }}>
      <Panel header="LLM 配置" key="1">
        <Form layout="vertical">
          <Form.Item label="模型名称">
            <Input 
              value={config.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder="例如: glm-4.7"
            />
          </Form.Item>
          <Form.Item label="API Key">
            <Input.Password 
              value={config.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="请输入智谱AI API Key"
            />
          </Form.Item>
          <Form.Item label="API 地址">
            <Input 
              value={config.apiUrl}
              onChange={(e) => handleChange('apiUrl', e.target.value)}
              placeholder="例如: https://open.bigmodel.cn/api/paas/v4/chat/completions"
            />
          </Form.Item>
        </Form>
      </Panel>
    </Collapse>
  );
}
