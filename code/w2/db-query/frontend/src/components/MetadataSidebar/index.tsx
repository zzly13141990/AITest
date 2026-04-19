import React from 'react'
import { Card, Typography, Collapse, Tag, Space, Spin } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { useMetadata } from '../../hooks/useMetadata'
import type { TableInfo } from '../../types/schema'

const { Text } = Typography

interface MetadataSidebarProps {
  connectionId: number | null
}

export const MetadataSidebar: React.FC<MetadataSidebarProps> = ({ connectionId }) => {
  const { metadata, loading } = useMetadata(connectionId)

  if (!connectionId) {
    return (
      <Card title="Metadata" size="small">
        <Text type="secondary">Select a connection to view metadata</Text>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card title="Metadata" size="small">
        <Spin />
      </Card>
    )
  }

  if (metadata.tables.length === 0 && metadata.views.length === 0) {
    return (
      <Card title="Metadata" size="small">
        <Text type="warning">No metadata available. Please extract metadata first.</Text>
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>Metadata ({metadata.tables.length} tables)</span>
        </Space>
      }
      size="small"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <Collapse defaultActiveKey={[]} ghost size="small">
        {metadata.tables.map((table: TableInfo) => (
          <Collapse.Panel
            header={
              <Space>
                <Text strong>{table.name}</Text>
                <Tag color="blue">{table.columns.length} cols</Tag>
              </Space>
            }
            key={table.name}
          >
            {table.columns.map((col) => (
              <div key={col.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Text code>{col.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {col.type}
                </Text>
              </div>
            ))}
          </Collapse.Panel>
        ))}
      </Collapse>
    </Card>
  )
}
