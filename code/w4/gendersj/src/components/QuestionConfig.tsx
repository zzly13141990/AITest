import { Form, Select, Input } from 'antd';
import { SUBJECTS, QUESTION_TYPES, DIFFICULTIES, GRADES } from '../utils/constants';
import type { QuestionConfig } from '../types';

const { TextArea } = Input;

interface QuestionConfigProps {
  config: QuestionConfig;
  onChange: (config: QuestionConfig) => void;
}

export default function QuestionConfigComponent({ config, onChange }: QuestionConfigProps) {
  const handleChange = (key: keyof QuestionConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#111827' }}>题目配置</h3>
      <Form layout="vertical">
        <Form.Item label="科目">
          <Select 
            value={config.subject}
            onChange={(value) => handleChange('subject', value)}
            options={SUBJECTS.map(s => ({ label: s, value: s }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="题型">
          <Select 
            value={config.type}
            onChange={(value) => handleChange('type', value)}
            options={QUESTION_TYPES.map(t => ({ label: t, value: t }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="难度">
          <Select 
            value={config.difficulty}
            onChange={(value) => handleChange('difficulty', value)}
            options={DIFFICULTIES.map(d => ({ label: d, value: d }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="年级">
          <Select 
            value={config.grade}
            onChange={(value) => handleChange('grade', value)}
            options={GRADES.map(g => ({ label: g, value: g }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item 
          label="题目描述" 
          required 
          tooltip="题目描述为必填项"
        >
          <TextArea 
            value={config.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            placeholder="请输入题目描述或要求，例如：生成10道关于分数加法的题目"
          />
        </Form.Item>
      </Form>
    </div>
  );
}
