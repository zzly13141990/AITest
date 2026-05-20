import { useMemo } from 'react';
import { Modal, Descriptions, Typography, Tag, Table } from 'antd';
import type { QueryLog } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface LogDetailModalProps {
  log: QueryLog | null;
  open: boolean;
  onClose: () => void;
}

export default function LogDetailModal({ log, open, onClose }: LogDetailModalProps) {
  if (!log) return null;

  const resultRows = useMemo(() => {
    if (!log.resultData) return null;
    try {
      return JSON.parse(log.resultData) as Record<string, unknown>[];
    } catch {
      return null;
    }
  }, [log.resultData]);

  const resultColumns = useMemo(() => {
    if (!resultRows || resultRows.length === 0) return [];
    const keys = Object.keys(resultRows[0]);
    return keys.map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      width: 150,
      render: (val: unknown) => {
        if (val === null || val === undefined) return '-';
        return String(val);
      },
    }));
  }, [resultRows]);

  return (
    <Modal
      title="日志详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
      styles={{
        mask: { backdropFilter: 'blur(8px)' },
        content: {
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
        },
      }}
    >
      <Descriptions
        column={2}
        size="small"
        labelStyle={{
          color: 'var(--text-tertiary)',
          fontSize: 12,
        }}
        contentStyle={{
          color: 'var(--text-primary)',
        }}
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="请求时间">
          {dayjs(log.requestTime).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="执行耗时">
          <span style={{ color: log.durationMs >= 1000 ? 'var(--accent-amber)' : undefined }}>
            {log.durationMs} ms
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="客户端 IP">{log.clientIp}</Descriptions.Item>
        <Descriptions.Item label="执行状态">
          <Tag color={log.status === 'success' ? 'green' : 'red'} style={{ border: 'none', borderRadius: 8 }}>
            {log.status === 'success' ? '成功' : '失败'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="目标数据库">
          {log.databaseIp}:{log.databasePort}
        </Descriptions.Item>
        <Descriptions.Item label="数据库类型">
          {log.databaseType}
        </Descriptions.Item>
        <Descriptions.Item label="数据库名称" span={2}>
          {log.databaseName}
        </Descriptions.Item>
        <Descriptions.Item label="执行消息" span={2}>
          {log.message || '-'}
        </Descriptions.Item>
      </Descriptions>

      {resultRows && resultColumns.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 8, display: 'block' }}>
            查询结果（{resultRows.length} 行）
          </Text>
          <Table
            columns={resultColumns}
            dataSource={resultRows.map((row, i) => ({ ...row, _key: i }))}
            rowKey="_key"
            size="small"
            pagination={false}
            scroll={{ x: 'max-content', y: 280 }}
            style={{
              background: '#0b0e14',
              borderRadius: 'var(--radius-md)',
            }}
            locale={{ emptyText: '暂无数据' }}
          />
        </div>
      )}

      <div style={{
        background: '#0b0e14',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        border: '1px solid var(--border-subtle)',
      }}>
        <Text style={{ color: 'var(--text-tertiary)', fontSize: 12, marginBottom: 8, display: 'block' }}>
          完整 SQL
        </Text>
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.6,
            color: '#e8edf5',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {log.sqlFull || log.sqlPreview || '-'}
        </pre>
      </div>
    </Modal>
  );
}
