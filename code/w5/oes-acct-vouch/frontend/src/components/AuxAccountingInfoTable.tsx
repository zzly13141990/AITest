import React from 'react';
import { Table, Typography } from 'antd';
import { useVouchStore } from '../store/vouchStore';
import type { CheckTypeInfo, OtherFzhsInfo } from '../types/vouch';

const { Text } = Typography;

const AuxAccountingInfoTable: React.FC = () => {
  const { selectedRow, details, detailCheckStates } = useVouchStore();

  if (selectedRow == null) return null;

  const detail = details[selectedRow];
  if (!detail) return null;

  const checkState = detailCheckStates.get(selectedRow);
  const config = checkState?.subjConfig;
  if (!config || (config.checks.length === 0 && config.otherFzhsChecks.length === 0)) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>暂无辅助核算数据</Text>
      </div>
    );
  }

  const checkItems = detail.checkItems || [];
  if (checkItems.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>暂无辅助核算数据</Text>
      </div>
    );
  }

  // Build dynamic columns from config: all standard checks + other checks
  const allCheckConfigs: Array<{ key: string; title: string }> = [];
  config.checks.forEach((c: CheckTypeInfo) => {
    allCheckConfigs.push({ key: `check_${c.checkId}`, title: c.checkName });
  });
  config.otherFzhsChecks.forEach((o: OtherFzhsInfo) => {
    allCheckConfigs.push({
      key: `other_${o.otherFzhsIdx}`,
      title: o.displayName || o.checkTypeName || `其他${o.otherFzhsIdx}`,
    });
  });

  if (allCheckConfigs.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>暂无辅助核算数据</Text>
      </div>
    );
  }

  // Build data rows from check items (multi-row support)
  // Each CheckItem is one row with its own summary, amount, check values, and other fzhs values
  interface InfoRow {
    key: string;
    summary: string;
    amount: number;
    [colKey: string]: any;
  }

  const rows: InfoRow[] = [];

  for (let ciIdx = 0; ciIdx < checkItems.length; ciIdx++) {
    const ci = checkItems[ciIdx];
    const row: InfoRow = {
      key: `row-${ciIdx}`,
      summary: ci.summary || '',
      amount: 0,
    };

    // Amount from the check item
    const debit = ci.amtDebit || 0;
    const credit = ci.amtCredit || 0;
    row.amount = debit || credit;

    // Fill standard check values (checkValues map contains checkId -> optionId)
    if (ci.checkValues) {
      for (const [checkIdStr, optionId] of Object.entries(ci.checkValues)) {
        const checkId = Number(checkIdStr);
        const options = checkState?.checkOptions.get(checkId) || [];
        const option = options.find((o) => o.id === optionId);
        row[`check_${checkId}`] = option ? `${option.code}-${option.name}` : `选项${optionId}`;
      }
    }

    // Fill other fzhs values (info_fzhs1~5)
    for (let idx = 1; idx <= 5; idx++) {
      let value = '';
      switch (idx) {
        case 1: value = ci.infoFzhs1 || ''; break;
        case 2: value = ci.infoFzhs2 || ''; break;
        case 3: value = ci.infoFzhs3 || ''; break;
        case 4: value = ci.infoFzhs4 || ''; break;
        case 5: value = ci.infoFzhs5 || ''; break;
      }
      if (value) {
        const colKey = `other_${idx}`;
        row[colKey] = value;
      }
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>暂无辅助核算数据</Text>
      </div>
    );
  }

  const columns = [
    { title: '摘要', dataIndex: 'summary', key: 'summary', width: 200, ellipsis: true },
    ...allCheckConfigs.map((cfg) => ({
      title: cfg.title,
      dataIndex: cfg.key,
      key: cfg.key,
      width: 130,
      ellipsis: true,
    })),
    {
      title: '金额',
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
        辅助核算信息
      </Text>
      <Table
        dataSource={rows}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default AuxAccountingInfoTable;