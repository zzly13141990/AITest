import React, { useState } from 'react'
import { List, useTable, EditButton, ShowButton, DeleteButton, CreateButton } from '@refinedev/antd'
import { Table, Space, Button, message } from 'antd'
import { ThunderboltOutlined, DatabaseOutlined, LoadingOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Connection } from '../../types/connection'
import { testConnection, extractMetadata } from '../../dataProvider'

const ConnectionsList: React.FC = () => {
  const { tableProps } = useTable<Connection>()
  const [testingId, setTestingId] = useState<number | null>(null)
  const [extractingId, setExtractingId] = useState<number | null>(null)

  const handleTestConnection = async (id: number) => {
    setTestingId(id)
    try {
      const result = await testConnection(id)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch {
      message.error('Connection test failed')
    } finally {
      setTestingId(null)
    }
  }

  const handleExtractMetadata = async (id: number) => {
    setExtractingId(id)
    try {
      const result = await extractMetadata(id)
      message.success(
        `Metadata extraction completed. Tables: ${result.tables}, Views: ${result.views}`,
      )
    } catch {
      message.error('Metadata extraction failed')
    } finally {
      setExtractingId(null)
    }
  }

  const columns: ColumnsType<Connection> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Name',
      dataIndex: 'connectionName',
      key: 'connectionName',
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
      width: 80,
    },
    {
      title: 'Database',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (_: unknown, record: Connection) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={testingId === record.id ? <LoadingOutlined /> : <ThunderboltOutlined />}
            onClick={() => handleTestConnection(record.id)}
            loading={testingId === record.id}
          >
            Test
          </Button>
          <Button
            size="small"
            type="default"
            icon={extractingId === record.id ? <LoadingOutlined /> : <DatabaseOutlined />}
            onClick={() => handleExtractMetadata(record.id)}
            loading={extractingId === record.id}
          >
            Extract Metadata
          </Button>
          <ShowButton size="small" recordItemId={record.id} />
          <EditButton size="small" recordItemId={record.id} />
          <DeleteButton size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ]

  return (
    <List headerButtons={<CreateButton />}>
      <Table<Connection> {...tableProps} columns={columns} rowKey="id" />
    </List>
  )
}

export default ConnectionsList
