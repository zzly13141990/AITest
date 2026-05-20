import React, { useMemo } from 'react';
import { Statistic, Space } from 'antd';
import { useVouchStore } from '../store/vouchStore';

const SummaryBar: React.FC = () => {
  const { details } = useVouchStore();

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    details.forEach((d) => {
      debit += d.amtDebit || 0;
      credit += d.amtCredit || 0;
    });
    return { debit, credit, diff: Math.abs(debit - credit) };
  }, [details]);

  return (
    <div
      style={{
        padding: '8px 12px',
        background: '#f0f5ff',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-around',
      }}
    >
      <Statistic
        title="借方合计"
        value={totals.debit}
        precision={2}
        prefix="¥"
      />
      <Statistic
        title="贷方合计"
        value={totals.credit}
        precision={2}
        prefix="¥"
      />
      <Statistic
        title="差额"
        value={totals.diff}
        precision={2}
        valueStyle={{ color: totals.diff > 0.01 ? '#ff4d4f' : '#52c41a' }}
      />
    </div>
  );
};

export default SummaryBar;
