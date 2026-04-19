import type { DataProvider, BaseRecord, GetListResponse, GetOneResponse, CustomResponse, GetListParams, GetOneParams, CreateParams, UpdateParams, CustomParams } from '@refinedev/core'
import dataProvider from '@refinedev/simple-rest'
import type { ApiResponse, ConnectionTestResult, MetadataExtractionResult } from '../types/connection'

const API_URL = 'http://localhost:8000'

const baseDataProvider = dataProvider(API_URL)

export const apiDataProvider: DataProvider = {
  getApiUrl: baseDataProvider.getApiUrl,
  getMany: async (...args) => baseDataProvider.getMany(...(args as Parameters<typeof baseDataProvider.getMany>)),
  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    variables,
    meta,
  }: CreateParams<TVariables>) => {
    const vars = variables as Record<string, unknown>
    const payload = {
      name: vars.name,
      host: vars.host,
      port: vars.port,
      database: vars.database,
      username: vars.username,
      password: vars.password,
    }

    return baseDataProvider.create<TData, Record<string, unknown>>({ resource, variables: payload, meta })
  },
  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    id,
    variables,
    meta,
  }: UpdateParams<TVariables>) => {
    const vars = variables as Record<string, unknown>
    const payload: Record<string, unknown> = {
      name: vars.name,
      host: vars.host,
      port: vars.port,
      database: vars.database,
      username: vars.username,
    }

    if (vars.password) {
      payload.password = vars.password
    }

    return baseDataProvider.update<TData, Record<string, unknown>>({ resource, id, variables: payload, meta })
  },
  deleteOne: async (...args) => baseDataProvider.deleteOne(...(args as Parameters<typeof baseDataProvider.deleteOne>)),

  custom: async <TData extends BaseRecord = BaseRecord, TQuery = unknown, TPayload = unknown>({
    url,
    method,
    payload,
    query,
    headers,
  }: CustomParams<TQuery, TPayload>): Promise<CustomResponse<TData>> => {
    const fullUrl = `${API_URL}${url}`

    const queryParams = query
      ? `?${new URLSearchParams(
          Object.entries(query as Record<string, string>).reduce<Record<string, string>>((acc, [key, value]) => {
            acc[key] = String(value)
            return acc
          }, {}),
        ).toString()}`
      : ''

    const response = await fetch(`${fullUrl}${queryParams}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    const result: ApiResponse<unknown> = await response.json()

    return {
      data: result.data as TData,
    }
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
    meta,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    const result = await baseDataProvider.getOne({ resource, id, meta })

    if (resource === 'connections' && result.data) {
      const connectionData = result.data as Record<string, unknown>
      const transformed = {
        id: connectionData.id,
        connectionName: connectionData.name || connectionData.connectionName,
        host: connectionData.host,
        port: connectionData.port,
        database: connectionData.database,
        username: connectionData.username,
      }
      return {
        data: transformed as unknown as TData,
      }
    }

    return result as GetOneResponse<TData>
  },

  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
    sorters,
    meta,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    const result = await baseDataProvider.getList({ resource, pagination, filters, sorters, meta })

    if (resource === 'connections') {
      const resultData = result.data as Record<string, unknown> | unknown[] | undefined
      const rawData = Array.isArray(resultData)
        ? resultData
        : resultData && 'data' in resultData && Array.isArray((resultData as Record<string, unknown>).data)
          ? ((resultData as Record<string, unknown>).data as unknown[])
          : []

      const transformedData = (rawData as Record<string, unknown>[]).map((item) => ({
        id: item.id,
        connectionName: item.name || item.connectionName,
        host: item.host,
        port: item.port,
        database: item.database,
        username: item.username,
      }))

      return {
        data: transformedData as unknown as TData[],
        total: result.total,
      }
    }

    return result as GetListResponse<TData>
  },
}

export const testConnection = async (connectionId: number): Promise<ConnectionTestResult> => {
  const response = await fetch(`${API_URL}/api/connections/${connectionId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const result: ApiResponse<ConnectionTestResult> = await response.json()
  return result.data
}

export const extractMetadata = async (connectionId: number): Promise<MetadataExtractionResult> => {
  const response = await fetch(`${API_URL}/api/metadata/connections/${connectionId}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const result: ApiResponse<MetadataExtractionResult> = await response.json()
  return result.data
}

export const getConnectionMetadata = async (connectionId: number): Promise<{ tables: unknown[]; views: unknown[] } | null> => {
  try {
    const response = await fetch(`${API_URL}/api/metadata/connections/${connectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const result: ApiResponse<{ tables: unknown[]; views: unknown[] }> = await response.json()
    return result.data
  } catch {
    return null
  }
}

export default apiDataProvider
