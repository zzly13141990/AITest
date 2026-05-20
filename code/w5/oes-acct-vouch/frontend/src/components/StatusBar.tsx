import React from 'react';
import { Descriptions } from 'antd';
import { useVouchStore } from '../store/vouchStore';

const StatusBar: React.FC = () => {
  const { operatorInfo } = useVouchStore();

  if (!operatorInfo) return null;

  return (
    <Descriptions size="small" column={4} style={{ marginTop: 8 }}>
      <Descriptions.Item label="制单人">
        {operatorInfo.name || operatorInfo.account}
      </Descriptions.Item>
      <Descriptions.Item label="部门">
        {operatorInfo.deptName || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="员工">
        {operatorInfo.empName || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="账号">
        {operatorInfo.account}
      </Descriptions.Item>
    </Descriptions>
  );
};

export default StatusBar;
