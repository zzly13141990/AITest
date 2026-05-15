import { Drawer, List, Button, Popconfirm, Space, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { QuestionRecord } from '../types';

const { Text } = Typography;

interface HistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  history: QuestionRecord[];
  onLoad: (record: QuestionRecord) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function HistoryDrawer({ 
  visible, 
  onClose, 
  history, 
  onLoad, 
  onDelete, 
  onClear 
}: HistoryDrawerProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <Drawer
      title="历史记录"
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      extra={
        history.length > 0 ? (
          <Popconfirm
            title="确定要清空所有历史记录吗？"
            onConfirm={onClear}
            okText="确定"
            cancelText="取消"
          >
            <Button danger type="text">
              清空
            </Button>
          </Popconfirm>
        ) : null
      }
    >
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无历史记录
        </div>
      ) : (
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  icon={<EyeOutlined />}
                  onClick={() => {
                    onLoad(item);
                    onClose();
                  }}
                >
                  查看
                </Button>,
                <Popconfirm
                  title="确定要删除这条记录吗？"
                  onConfirm={() => onDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{item.subject}</Text>
                    <Text type="secondary">-</Text>
                    <Text>{item.grade}</Text>
                    <Text type="secondary">-</Text>
                    <Text type="secondary">{item.type}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" ellipsis={{ rows: 2 }}>
                      {item.description}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
