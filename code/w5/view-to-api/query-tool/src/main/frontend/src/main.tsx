import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './theme/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#60a5fa',
            colorBgContainer: '#252830',
            colorBgElevated: '#2c2f3a',
            colorBorder: 'rgba(255,255,255,0.10)',
            colorText: '#ecedf2',
            colorTextSecondary: '#a0a5b5',
            colorBgLayout: '#1e2028',
            borderRadius: 8,
            fontSize: 13,
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
