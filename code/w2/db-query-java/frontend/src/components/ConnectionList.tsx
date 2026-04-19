import React, { useState, useEffect } from 'react';
import { Connection } from '../types';
import { connectionApi, metadataApi } from '../api';
import ConnectionForm from './ConnectionForm';

const ConnectionList: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const [extractingMetadata, setExtractingMetadata] = useState<number | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await connectionApi.getAll();
      setConnections(data);
    } catch (err) {
      setError('获取连接列表失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = () => {
    setEditingConnection(undefined);
    setShowForm(true);
  };

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const handleDeleteConnection = async (id: number) => {
    if (window.confirm('确定要删除这个连接吗？')) {
      try {
        await connectionApi.delete(id);
        fetchConnections();
      } catch (err) {
        setError('删除连接失败：' + (err as Error).message);
      }
    }
  };

  const handleExtractMetadata = async (connectionId: number) => {
    setExtractingMetadata(connectionId);
    try {
      await metadataApi.extract(connectionId);
      alert('元数据提取成功！');
    } catch (err) {
      setError('提取元数据失败：' + (err as Error).message);
    } finally {
      setExtractingMetadata(null);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    fetchConnections();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingConnection(undefined);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (showForm) {
    return (
      <ConnectionForm
        connection={editingConnection}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-20">
        <h2>数据库连接</h2>
        <button className="btn btn-primary" onClick={handleCreateConnection}>
          创建连接
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>连接名称</th>
            <th>数据库类型</th>
            <th>主机</th>
            <th>端口</th>
            <th>数据库名称</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((connection) => (
            <tr key={connection.id}>
              <td>{connection.connectionName}</td>
              <td>{connection.databaseType}</td>
              <td>{connection.host}</td>
              <td>{connection.port}</td>
              <td>{connection.databaseName}</td>
              <td>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEditConnection(connection)}
                >
                  编辑
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteConnection(connection.id!)}
                >
                  删除
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExtractMetadata(connection.id!)}
                  disabled={extractingMetadata === connection.id}
                >
                  {extractingMetadata === connection.id ? '提取中...' : '提取元数据'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {connections.length === 0 && (
        <div className="alert alert-info">
          暂无数据库连接，请点击"创建连接"按钮添加新连接。
        </div>
      )}
    </div>
  );
};

export default ConnectionList;
