import React, { useState, useCallback, useEffect } from 'react'
import { Card, Button, Select, Typography, Table, message, Space, Spin } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import type { ColumnsType } from 'antd/es/table'

const API_BASE_URL = 'http://localhost:8000/api'

interface Connection {
  id: number
  connectionName: string
  host: string
  port: number
  database: string
  username: string
}

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
}

const SqlEditorPage: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null)
  const [sql, setSql] = useState('SELECT * FROM ')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`)
      if (!response.ok) {
        throw new Error('Failed to fetch connections')
      }
      const data = await response.json()
      setConnections(data.data || [])
    } catch (err) {
      message.error('Failed to load connections')
    }
  }

  const handleExecute = useCallback(async () => {
    if (!selectedConnectionId) {
      message.error('Please select a connection')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setExecutionTime(null)

    const startTime = Date.now()

    try {
      const response = await fetch(`${API_BASE_URL}/query/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: selectedConnectionId,
          sql: sql,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.detail || 'Failed to execute query'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const endTime = Date.now()
      setExecutionTime(endTime - startTime)
      setResult(data.data)
      message.success(`Query executed successfully. ${data.data.rowCount} rows returned.`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute query'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedConnectionId, sql])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault()
        handleExecute()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleExecute])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSql(value)
    }
  }

  const resultColumns: ColumnsType<Record<string, unknown>> = result?.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (value: unknown) => {
      if (value === null) return <span style={{ color: '#999' }}>NULL</span>
      return String(value)
    },
  })) || []

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%' }}>
          <Select
            style={{ width: 300 }}
            placeholder="Select a connection"
            value={selectedConnectionId}
            onChange={setSelectedConnectionId}
            options={connections.map((c) => ({ label: c.connectionName, value: c.id }))}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={loading}
            disabled={!selectedConnectionId}
          >
            Execute (F5)
          </Button>
          {executionTime !== null && (
            <Typography.Text type="secondary">
              Execution time: {executionTime}ms
            </Typography.Text>
          )}
        </Space>
      </Card>

      <div style={{ flex: 1, marginBottom: 16, border: '1px solid #d9d9d9', borderRadius: 4 }}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
          theme="vs-light"
        />
      </div>

      {error && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f', backgroundColor: '#fff2f0' }}>
          <Typography.Text type="danger">{error}</Typography.Text>
        </Card>
      )}

      {result && (
        <Card title={`Results (${result.rowCount} rows)`}>
          <Table
            columns={resultColumns}
            dataSource={result.rows.map((row, index) => ({ key: index, ...row }))}
            scroll={{ x: 'max-content', y: 400 }}
            size="small"
            pagination={{ pageSize: 50 }}
          />
        </Card>
      )}

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Spin size="large" tip="Executing query..." />
        </div>
      )}
    </div>
  )
}

export default SqlEditorPage
