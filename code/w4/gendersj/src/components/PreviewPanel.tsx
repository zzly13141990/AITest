import { Button, Space, Alert, Spin, Empty, message } from 'antd';
import { ReloadOutlined, SaveOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import { PDFService } from '../services/pdfService';
import { renderSafeHtml } from '../utils/security';
import type { QuestionConfig } from '../types';

interface PreviewPanelProps {
  content: string | null;
  error: string | null;
  isLoading: boolean;
  questionConfig: QuestionConfig;
  onRegenerate: () => void;
  onSaveToHistory: (content: string) => void;
}

export default function PreviewPanel({ 
  content, 
  error, 
  isLoading, 
  questionConfig, 
  onRegenerate,
  onSaveToHistory
}: PreviewPanelProps) {
  const handleExportPDF = async () => {
    if (!content) return;
    try {
      await PDFService.generatePDF(content, questionConfig);
      message.success('PDF导出成功');
    } catch (err: any) {
      message.error(`PDF导出失败：${err.message || '未知错误'}`);
    }
  };

  const handlePrint = () => {
    try {
      PDFService.print();
    } catch (err: any) {
      message.error(`打印失败：${err.message || '未知错误'}`);
    }
  };

  return (
    <div className="preview-panel">
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRegenerate}
            disabled={isLoading}
          >
            重新生成
          </Button>
          {content && (
            <>
              <Button 
                type="default"
                icon={<SaveOutlined />}
                onClick={() => onSaveToHistory(content)}
              >
                保存记录
              </Button>
              <Button 
                type="default"
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
              >
                导出 PDF
              </Button>
              <Button 
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                打印
              </Button>
            </>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Spin size="large" tip="正在生成题目..." />
          </div>
        )}

        {error && !isLoading && (
          <Alert 
            message="生成失败" 
            description={error} 
            type="error" 
            showIcon 
          />
        )}

        {!content && !isLoading && !error && (
          <Empty 
            description="配置好参数后，点击生成题目开始"
            style={{ marginTop: '100px' }}
          />
        )}

        {content && !isLoading && (
          <div id="pdf-content" className="a4-preview">
            <h1>{questionConfig.grade} - {questionConfig.subject} - {questionConfig.type}</h1>
            <div className="question-content" dangerouslySetInnerHTML={{ __html: renderSafeHtml(content) }} />
          </div>
        )}
      </div>
    </div>
  );
}
