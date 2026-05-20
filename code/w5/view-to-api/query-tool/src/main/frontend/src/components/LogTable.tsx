import { Table, Tag, Tooltip, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { QueryLog } from '../types';
import dayjs from 'dayjs';

interface LogTableProps {
  data: QueryLog[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, size: number) => void;
  onViewDetail: (log: QueryLog) => void;
}

export default function LogTable({
  data, loading, total, page, pageSize,
  onPageChange, onViewDetail,
}: LogTableProps) {

  const columns: ColumnsType<QueryLog> = [
    {
      title: '执行状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status: string) => {
        const isSuccess = status === 'success';
        return (
          <Tag
            className="status-glow"
            color={isSuccess ? 'green' : 'red'}
            style={{
              borderRadius: 12,
              padding: '2px 12px',
              border: 'none',
            }}
          >
            {isSuccess ? '成功' : '失败'}
          </Tag>
        );
      },
    },
    {
      title: '执行时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      width: 180,
      render: (t: string) => (
        <Tooltip title={t}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {t ? dayjs(t).format('MM-DD HH:mm') : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '执行消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string) => (
        <Tooltip title={msg}>
          <span>{msg || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '执行耗时',
      dataIndex: 'durationMs',
      key: 'durationMs',
      align: 'right',
      width: 100,
      render: (ms: number) => {
        const isSlow = ms >= 1000;
        return (
          <span style={{ color: isSlow ? 'var(--accent-amber)' : undefined, fontWeight: isSlow ? 600 : 400 }}>
            {ms}{isSlow ? ' \u26A0' : ''}
          </span>
        );
      },
    },
    {
      title: '查询结果',
      key: 'resultCount',
      align: 'center',
      width: 100,
      render: (_: unknown, record: QueryLog) => {
        let count = 0;
        if (record.resultData) {
          try {
            const parsed = JSON.parse(record.resultData);
            count = Array.isArray(parsed) ? parsed.length : 0;
          } catch {
            count = record.resultData ? record.resultData.length : 0;
          }
        }
        return (
          <Tag
            color="blue"
            style={{ borderRadius: 10, border: 'none', cursor: 'pointer', minWidth: 48, textAlign: 'center' }}
            onClick={() => onViewDetail(record)}
          >
            {count}
          </Tag>
        );
      },
    },
    {
      title: '其他元数据',
      key: 'metadata',
      width: 150,
      render: (_: unknown, record: QueryLog) => (
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          {record.databaseIp}:{record.databasePort}/{record.databaseType}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_: unknown, record: QueryLog) => (
        <Button
          type="text"
          icon={<MoreOutlined />}
          onClick={() => onViewDetail(record)}
          style={{ color: 'var(--text-secondary)' }}
        />
      ),
    },
  ];

  return (
    <Table<QueryLog>
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      scroll={{ y: 480 }}
      sticky={{ offsetHeader: 0 }}
      pagination={{
        current: page,
        pageSize: pageSize,
        total,
        showTotal: (t) => `共 ${t} 条`,
        onChange: onPageChange,
        style: { marginTop: 16 },
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      locale={{
        emptyText: '暂无数据',
      }}
    />
  );
}
