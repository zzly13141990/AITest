import React, { useState, useEffect } from 'react';
import { Metadata } from '../types';
import { metadataApi } from '../api';

interface MetadataSidebarProps {
  connectionId: number | null;
}

const MetadataSidebar: React.FC<MetadataSidebarProps> = ({ connectionId }) => {
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedTable, setExpandedTable] = useState<number | null>(null);

  useEffect(() => {
    if (connectionId) {
      fetchMetadata(connectionId);
    } else {
      setMetadata([]);
    }
  }, [connectionId]);

  const fetchMetadata = async (id: number) => {
    setLoading(true);
    try {
      const data = await metadataApi.getByConnectionId(id);
      setMetadata(data);
    } catch (err) {
      setError('获取元数据失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (id: number) => {
    setExpandedTable(expandedTable === id ? null : id);
  };

  if (loading) {
    return (
      <div className="sidebar" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>加载元数据中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar" style={{ height: '100%' }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!connectionId) {
    return (
      <div className="sidebar" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="alert alert-info" style={{ textAlign: 'center' }}>请选择一个数据库连接</div>
      </div>
    );
  }

  if (metadata.length === 0) {
    return (
      <div className="sidebar" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="alert alert-info" style={{ textAlign: 'center' }}>暂无元数据，请先提取元数据</div>
      </div>
    );
  }

  return (
    <div className="sidebar" style={{ height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginBottom: '15px' }}>数据库元数据</h3>
      <div style={{ maxHeight: '100%', overflow: 'auto' }}>
        {metadata.map((item) => (
          <div key={item.id} style={{ marginBottom: '10px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => toggleTable(item.id!)}
            >
              <span><strong>{item.tableName}</strong> ({item.tableType})</span>
              <span>{expandedTable === item.id ? '▼' : '▶'}</span>
            </div>
            {expandedTable === item.id && (
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>列信息</h4>
                <pre style={{ margin: 0, fontSize: '12px', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                  {item.columns}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetadataSidebar;
