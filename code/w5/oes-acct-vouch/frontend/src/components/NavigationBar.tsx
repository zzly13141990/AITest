import React from 'react';
import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useVouchStore } from '../store/vouchStore';

const NavigationBar: React.FC = () => {
  const { hasPrev, hasNext, navigateVouch, loading } = useVouchStore();

  return (
    <Space>
      <Button
        icon={<LeftOutlined />}
        disabled={!hasPrev || loading}
        onClick={() => navigateVouch('prev')}
      >
        上一张
      </Button>
      <Button
        icon={<RightOutlined />}
        disabled={!hasNext || loading}
        onClick={() => navigateVouch('next')}
      >
        下一张
      </Button>
    </Space>
  );
};

export default NavigationBar;
