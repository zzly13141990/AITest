import { Layout, Button } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  onOpenHistory: () => void;
}

export default function Header({ onOpenHistory }: HeaderProps) {
  return (
    <AntHeader 
      className="no-print"
      style={{ 
        background: '#fff', 
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '64px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: '#2563EB', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          题
        </div>
        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600, color: '#111827' }}>
          题目生成工具
        </h1>
      </div>
      <Button 
        type="default" 
        icon={<HistoryOutlined />}
        onClick={onOpenHistory}
      >
        历史记录
      </Button>
    </AntHeader>
  );
}
