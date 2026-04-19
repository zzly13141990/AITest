export interface Connection {
  id: number
  connectionName: string
  host: string
  port: number
  database: string
  username: string
  metadataExtracted?: boolean
  tableCount?: number
  viewCount?: number
}

export interface ConnectionFormData {
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ConnectionTestResult {
  success: boolean
  message: string
}

export interface MetadataExtractionResult {
  tables: number
  views: number
}
