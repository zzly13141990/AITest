import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import { BarChartOutlined, UnorderedListOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <BarChartOutlined />, label: '概览' },
  { key: '/logs', icon: <UnorderedListOutlined />, label: '日志查询' },
  { key: '/errors', icon: <CloseCircleOutlined />, label: '错误查询' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sider
        width={220}
        style={{
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid var(--border-subtle)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div className="sidebar-logo">
          <span className="logo-icon">Q</span>
          <span>Qry</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 8,
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout style={{ marginLeft: 220, background: 'var(--bg-page)' }}>
        <Content
          style={{
            padding: 28,
            minHeight: '100vh',
            background: 'var(--bg-page)',
          }}
        >
          <div className="page-content">
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
