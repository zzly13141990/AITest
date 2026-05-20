import React from 'react';
import { Table, Typography } from 'antd';
import { useVouchStore } from '../store/vouchStore';

const { Text } = Typography;

const CashFlowInfoTable: React.FC = () => {
  const { selectedRow } = useVouchStore();

  if (selectedRow != null) return null;

  const columns = [
    { title: '现金流量摘要', dataIndex: 'summary', key: 'summary', width: 200 },
    { title: '现金流量项目', dataIndex: 'itemName', key: 'itemName', width: 300 },
    {
      title: '现金流量金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => {
        if (val == null) return '';
        return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
      },
    },
  ];

  return (
    <div style={{ margin: '8px 0' }}>
      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        现金流量信息
      </Text>
      <Table
        dataSource={[]}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey="key"
        locale={{ emptyText: '暂无现金流量数据' }}
      />
    </div>
  );
};

export default CashFlowInfoTable;