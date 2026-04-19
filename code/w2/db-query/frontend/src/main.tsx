import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Refine } from '@refinedev/core'
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router-v6'
import { RefineThemes, useNotificationProvider } from '@refinedev/antd'
import { ConfigProvider, App as AntdApp } from 'antd'
import '@refinedev/antd/dist/reset.css'
import './index.css'
import App from './App'
import { apiDataProvider } from './dataProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={apiDataProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: 'connections',
                list: '/connections',
                create: '/connections/create',
                edit: '/connections/edit/:id',
                show: '/connections/show/:id',
              },
              {
                name: 'sql-editor',
                list: '/sql-editor',
              },
            ]}
          >
            <App />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
