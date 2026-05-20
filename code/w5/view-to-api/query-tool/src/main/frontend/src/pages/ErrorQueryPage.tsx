import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { adminApi } from '../api/admin';
import SearchBar from '../components/SearchBar';
import LogTable from '../components/LogTable';
import LogDetailModal from '../components/LogDetailModal';
import type { QueryLog, LogQueryParams } from '../types';
import dayjs from 'dayjs';

export default function ErrorQueryPage() {
  const [data, setData] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<QueryLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [params, setParams] = useState<LogQueryParams>({
    startTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    status: 'fail',
    pageNumber: 1,
    pageSize: 20,
  });

  const fetchErrors = useCallback(async (p: LogQueryParams) => {
    setLoading(true);
    try {
      const res = await adminApi.getErrors(p);
      setData(res.data?.items || []);
      setTotal(res.data?.totalCount || 0);
    } catch (err) {
      message.error('查询错误日志失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrors(params);
  }, []);

  const handleSearch = () => fetchErrors(params);

  const handlePageChange = (page: number, size: number) => {
    const newParams = { ...params, pageNumber: page, pageSize: size };
    setParams(newParams);
    fetchErrors(newParams);
  };

  const handleViewDetail = async (log: QueryLog) => {
    try {
      const res = await adminApi.getLogDetail(log.id);
      setDetail(res.data);
      setDetailOpen(true);
    } catch {
      message.error('获取日志详情失败');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, letterSpacing: '-0.01em', color: 'var(--fail)' }}>
        错误查询
      </h2>

      <SearchBar
        params={params}
        onParamsChange={setParams}
        onSearch={handleSearch}
        showDbType={false}
      />

      <LogTable
        data={data}
        loading={loading}
        total={total}
        page={params.pageNumber || 1}
        pageSize={params.pageSize || 20}
        onPageChange={handlePageChange}
        onViewDetail={handleViewDetail}
      />

      <LogDetailModal
        log={detail}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
