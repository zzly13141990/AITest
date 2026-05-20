import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import VoucherEntryPage from './pages/VoucherEntryPage';
import { useVouchStore } from './store/vouchStore';

const App: React.FC = () => {
  const initParams = useVouchStore((s) => s.initParams);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    initParams({
      compCode: params.get('compCode') || '01',
      copyCode: params.get('copyCode') || '001',
      acctYear: params.get('acctYear') || '2026',
      acctMonth: params.get('acctMonth') || '05',
      account: params.get('account') || 'admin',
      vouchId: params.get('vouchId') || undefined,
      isWatch: params.get('isWatch') || undefined,
      isAudit: params.get('isAudit') || undefined,
    });
  }, [initParams]);

  return (
    <ConfigProvider locale={zhCN}>
      <VoucherEntryPage />
    </ConfigProvider>
  );
};

export default App;
