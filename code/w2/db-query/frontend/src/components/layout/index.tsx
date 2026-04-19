import React from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  DatabaseOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Content, Sider } = Layout

interface LayoutProps {
  children: React.ReactNode
}

const LayoutComponent: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/connections',
      icon: <DatabaseOutlined />,
      label: 'Connections',
    },
    {
      key: '/sql-editor',
      icon: <CodeOutlined />,
      label: 'SQL Editor',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsible>
        <div className="text-white text-center py-4 text-lg font-bold">
          DB Query
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <h2 className="m-0">DB Query Tool</h2>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
