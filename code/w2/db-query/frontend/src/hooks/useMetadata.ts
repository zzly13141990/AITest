import { useState, useEffect } from 'react'
import type { TableInfo } from '../types/schema'

const API_BASE_URL = 'http://localhost:8000/api'

interface ColumnMetadata {
  name: string
  data_type: string
  is_nullable: boolean
  character_maximum_length?: number
}

interface TableMetadata {
  name: string
  columns: ColumnMetadata[]
}

interface ViewMetadata {
  name: string
  definition?: string
}

export function useMetadata(connectionId: number | null) {
  const [metadata, setMetadata] = useState<{ tables: TableInfo[]; views: string[] }>({ tables: [], views: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!connectionId) {
      setMetadata({ tables: [], views: [] })
      return
    }

    const fetchMetadata = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/metadata/connections/${connectionId}`)
        if (!response.ok) {
          setMetadata({ tables: [], views: [] })
          return
        }
        const result = await response.json()
        const data = result.data
        setMetadata({
          tables: (data.tables || []).map((table: TableMetadata) => ({
            name: table.name,
            schema: '',
            columns: (table.columns || []).map((col: ColumnMetadata) => ({
              name: col.name,
              type: col.data_type,
              nullable: col.is_nullable,
              isPrimaryKey: false,
            })),
          })),
          views: (data.views || []).map((v: ViewMetadata) => v.name),
        })
      } catch {
        setMetadata({ tables: [], views: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [connectionId])

  return { metadata, loading }
}
