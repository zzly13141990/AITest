import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Tag, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { adminApi } from '../api/admin';
import type { StatsResponse, QueryLog } from '../types';
import dayjs from 'dayjs';

const statCardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  position: 'relative' as const,
  overflow: 'hidden',
};

export default function OverviewPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [animValues, setAnimValues] = useState({ total: 0, success: 0, fail: 0, today: 0 });
  const animRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLogs({ pageSize: 10 }),
      ]);

      console.log('=== Stats Debug ===');
      console.log('Raw statsRes:', JSON.stringify(statsRes, null, 2));
      console.log('statsRes.data:', statsRes?.data);
      console.log('typeof statsRes:', typeof statsRes);
      console.log('=== Logs Debug ===');
      console.log('Raw logsRes:', JSON.stringify(logsRes, null, 2));
      console.log('logsRes.data?.items:', logsRes?.data?.items);

      const s = statsRes?.data || statsRes;
      console.log('Final s object:', s);

      if (!s) {
        console.error('Stats data is null or undefined!');
        message.error('获取统计数据失败: 返回数据为空');
        return;
      }

      if (typeof s.totalRequests === 'undefined') {
        console.error('Stats data missing totalRequests field!', s);
        message.error('获取统计数据失败: 数据格式异常');
        return;
      }

      console.log('Setting stats - totalRequests:', s.totalRequests, 'successCount:', s.successCount);
      setStats(s);
      setRecentLogs(logsRes?.data?.items || []);

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;

        // Animate numbers for initial load
        const duration = 800;
        const startTime = performance.now();
        const startVals = { total: 0, success: 0, fail: 0, today: 0 };

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setAnimValues({
            total: Math.floor(startVals.total + (s.totalRequests - startVals.total) * progress),
            success: Math.floor(startVals.success + (s.successCount - startVals.success) * progress),
            fail: Math.floor(startVals.fail + (s.failCount - startVals.fail) * progress),
            today: Math.floor(startVals.today + (s.todayRequests - startVals.today) * progress),
          });
          if (progress < 1) {
            animRef.current = requestAnimationFrame(animate);
          }
        };
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Subsequent refreshes: update instantly without animation
        setAnimValues({
          total: s.totalRequests,
          success: s.successCount,
          fail: s.failCount,
          today: s.todayRequests,
        });
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(interval);
    };
  }, [fetchData]);

  const recentColumns = [
    {
      title: '时间',
      dataIndex: 'requestTime',
      key: 'time',
      width: 160,
      render: (t: string) => dayjs(t).format('MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => (
        <Tag color={s === 'success' ? 'green' : 'red'} style={{ borderRadius: 8, border: 'none' }}>
          {s === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '数据库',
      key: 'db',
      ellipsis: true,
      render: (_: unknown, r: QueryLog) => `${r.databaseIp}:${r.databasePort}`,
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      key: 'duration',
      width: 80,
      render: (ms: number) => (
        <span style={{ color: ms >= 1000 ? 'var(--accent-amber)' : undefined }}>{ms}ms</span>
      ),
    },
  ];

  if (loading && !stats) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
          概览
        </h2>
        <Button
          icon={<ReloadOutlined />}
          size="small"
          loading={loading}
          onClick={fetchData}
          style={{ color: 'var(--text-secondary)' }}
        >
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card style={statCardStyle} hoverable>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>总请求数</span>}
              value={animValues.total}
              prefix={<RiseOutlined style={{ color: 'var(--accent-blue)' }} />}
              valueStyle={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={statCardStyle} hoverable>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #22c55e, #4ade80)' }} />
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>成功数</span>}
              value={animValues.success}
              prefix={<CheckCircleOutlined style={{ color: 'var(--success)' }} />}
              valueStyle={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={statCardStyle} hoverable>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>失败数</span>}
              value={animValues.fail}
              prefix={<CloseCircleOutlined style={{ color: 'var(--fail)' }} />}
              valueStyle={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={statCardStyle} hoverable>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>今日请求</span>}
              value={animValues.today}
              prefix={<ClockCircleOutlined style={{ color: 'var(--accent-amber)' }} />}
              valueStyle={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>最近请求</span>}
        style={{ marginTop: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
        styles={{ header: { borderBottom: '1px solid var(--border-subtle)' } }}
      >
        <Table
          columns={recentColumns}
          dataSource={recentLogs}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </div>
  );
}
