import React, { useEffect, useState } from 'react'
import { useShow } from '@refinedev/core'
import { Show, DeleteButton, EditButton } from '@refinedev/antd'
import { Typography, Tag, Space, Button, Descriptions, Spin, message } from 'antd'
import { DatabaseOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Connection } from '../../types/connection'
import { extractMetadata, getConnectionMetadata } from '../../dataProvider'

const { Text } = Typography

const ConnectionsShow: React.FC = () => {
  const { queryResult } = useShow<Connection>()
  const { data, isLoading } = queryResult
  const [extracting, setExtracting] = useState(false)
  const [metadata, setMetadata] = useState<{ tables: unknown[]; views: unknown[] } | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  const record = data?.data

  useEffect(() => {
    if (record?.id) {
      setMetadataLoading(true)
      getConnectionMetadata(record.id)
        .then((result) => {
          setMetadata(result)
        })
        .finally(() => {
          setMetadataLoading(false)
        })
    }
  }, [record?.id])

  const handleExtractMetadata = async () => {
    if (!record?.id) return
    setExtracting(true)
    try {
      const result = await extractMetadata(record.id)
      message.success(
        `Metadata extraction completed. Tables: ${result.tables}, Views: ${result.views}`,
      )
      const updatedMetadata = await getConnectionMetadata(record.id)
      setMetadata(updatedMetadata)
    } catch {
      message.error('Metadata extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const isMetadataExtracted = metadata !== null

  return (
    <Show
      isLoading={isLoading}
      headerButtons={
        <Space>
          <Button
            type="primary"
            icon={extracting ? <LoadingOutlined /> : <DatabaseOutlined />}
            onClick={handleExtractMetadata}
            loading={extracting}
          >
            Extract Metadata
          </Button>
          <EditButton size="large" recordItemId={record?.id} />
          <DeleteButton size="large" recordItemId={record?.id} />
        </Space>
      }
    >
      <Spin spinning={metadataLoading && !metadata}>
        <Descriptions
          title="Connection Details"
          bordered
          column={1}
        >
        <Descriptions.Item label="Name">
          <Text strong>{record?.connectionName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Host">{record?.host}</Descriptions.Item>
        <Descriptions.Item label="Port">{record?.port}</Descriptions.Item>
        <Descriptions.Item label="Database">{record?.database}</Descriptions.Item>
        <Descriptions.Item label="Username">{record?.username}</Descriptions.Item>
        <Descriptions.Item label="Metadata Status">
          {metadataLoading ? (
            <Tag icon={<LoadingOutlined spin />} color="processing">
              Checking metadata...
            </Tag>
          ) : isMetadataExtracted ? (
            <Space direction="vertical" size="small">
              <Tag icon={<CheckCircleOutlined />} color="success">
                Metadata Extracted
              </Tag>
              <Space>
                <Tag color="blue">
                  Tables: {metadata?.tables.length ?? 0}
                </Tag>
                <Tag color="green">
                  Views: {metadata?.views.length ?? 0}
                </Tag>
              </Space>
            </Space>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">
              Not Extracted
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
      </Spin>
    </Show>
  )
}

export default ConnectionsShow
