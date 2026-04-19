import React from 'react';
import ConnectionList from '../components/ConnectionList';

const ConnectionsPage: React.FC = () => {
  return (
    <div>
      <h2>数据库连接管理</h2>
      <p>管理数据库连接，包括创建、编辑、删除和测试连接，以及提取数据库元数据。</p>
      <ConnectionList />
    </div>
  );
};

export default ConnectionsPage;
