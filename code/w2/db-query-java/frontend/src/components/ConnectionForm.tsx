import React, { useState } from 'react';
import { Connection } from '../types';
import { connectionApi } from '../api';

interface ConnectionFormProps {
  connection?: Connection;
  onSave: () => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ connection, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Connection>({
    id: connection?.id,
    connectionName: connection?.connectionName || '',
    host: connection?.host || '',
    port: connection?.port || 3306,
    databaseName: connection?.databaseName || '',
    username: connection?.username || '',
    password: connection?.password || '',
    databaseType: connection?.databaseType || 'mysql',
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    });
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const isConnected = await connectionApi.test(formData);
      if (isConnected) {
        setSuccess('连接测试成功！');
      } else {
        setError('连接测试失败，请检查连接参数');
      }
    } catch (err) {
      setError('连接测试失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (formData.id) {
        await connectionApi.update(formData.id, formData);
        setSuccess('连接更新成功！');
      } else {
        await connectionApi.create(formData);
        setSuccess('连接创建成功！');
      }
      onSave();
    } catch (err) {
      setError('操作失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>{connection ? '编辑连接' : '创建连接'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="connectionName">连接名称</label>
          <input
            type="text"
            id="connectionName"
            name="connectionName"
            value={formData.connectionName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="databaseType">数据库类型</label>
          <select
            id="databaseType"
            name="databaseType"
            value={formData.databaseType}
            onChange={handleChange}
            required
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlserver">SQL Server</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="host">主机</label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="port">端口</label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="databaseName">数据库名称</label>
          <input
            type="text"
            id="databaseName"
            name="databaseName"
            value={formData.databaseName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleTestConnection} disabled={loading}>
            {loading ? '测试中...' : '测试连接'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConnectionForm;
