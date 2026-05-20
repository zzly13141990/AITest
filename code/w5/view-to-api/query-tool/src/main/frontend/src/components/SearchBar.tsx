import { Input, Select, DatePicker, Button, Card, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { LogQueryParams } from '../types';

const { RangePicker } = DatePicker;

interface SearchBarProps {
  params: LogQueryParams;
  onParamsChange: (params: LogQueryParams) => void;
  onSearch: () => void;
  showDbType?: boolean;
}

export default function SearchBar({ params, onParamsChange, onSearch, showDbType = true }: SearchBarProps) {
  const handleDateChange = (_: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => {
    onParamsChange({
      ...params,
      startTime: dateStrings[0] || undefined,
      endTime: dateStrings[1] || undefined,
      pageNumber: 1,
    });
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.06)',
      }}
    >
      <Space wrap size={12}>
        <RangePicker
          size="large"
          showTime
          defaultValue={[dayjs().subtract(3, 'day'), dayjs()]}
          onChange={handleDateChange as any}
          style={{ minWidth: 320, background: 'var(--bg-input)' }}
          presets={[
            { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] },
            { label: '最近24小时', value: [dayjs().subtract(1, 'day'), dayjs()] },
            { label: '最近3天', value: [dayjs().subtract(3, 'day'), dayjs()] },
            { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
            { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
          ]}
        />

        <Input
          size="large"
          placeholder="请求 IP（模糊匹配）"
          allowClear
          value={params.clientIp || ''}
          onChange={(e) => onParamsChange({ ...params, clientIp: e.target.value, pageNumber: 1 })}
          style={{ width: 180, background: 'var(--bg-input)' }}
        />

        <Select
          size="large"
          placeholder="状态"
          allowClear
          value={params.status || undefined}
          onChange={(v) => onParamsChange({ ...params, status: v, pageNumber: 1 })}
          style={{ width: 120 }}
          options={[
            { value: 'success', label: '成功' },
            { value: 'fail', label: '失败' },
          ]}
        />

        {showDbType && (
          <Select
            size="large"
            placeholder="数据库类型"
            allowClear
            value={params.databaseType || undefined}
            onChange={(v) => onParamsChange({ ...params, databaseType: v, pageNumber: 1 })}
            style={{ width: 150 }}
            options={[
              { value: 'mysql', label: 'MySQL' },
              { value: 'sqlserver', label: 'SQL Server' },
              { value: 'oracle', label: 'Oracle' },
            ]}
          />
        )}

        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={onSearch}
        >
          查询
        </Button>
      </Space>
    </Card>
  );
}
