import axios from 'axios';
import { Connection, Metadata } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30秒超时
});

// 连接管理API
export const connectionApi = {
  getAll: async (): Promise<Connection[]> => {
    const response = await api.get('/connections');
    return response.data;
  },
  getById: async (id: number): Promise<Connection> => {
    const response = await api.get(`/connections/${id}`);
    return response.data;
  },
  create: async (connection: Connection): Promise<Connection> => {
    const response = await api.post('/connections', connection);
    return response.data;
  },
  update: async (id: number, connection: Connection): Promise<Connection> => {
    const response = await api.put(`/connections/${id}`, connection);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/connections/${id}`);
  },
  test: async (connection: Connection): Promise<boolean> => {
    const response = await api.post('/connections/test', connection);
    return response.data;
  },
};

// 元数据API
export const metadataApi = {
  extract: async (connectionId: number): Promise<void> => {
    await api.post(`/metadata/extract/${connectionId}`);
  },
  getByConnectionId: async (connectionId: number, page: number = 1, pageSize: number = 100): Promise<Metadata[]> => {
    const response = await api.get(`/metadata/connection/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getMetadataCount: async (connectionId: number): Promise<{ [key: string]: number }> => {
    const response = await api.get(`/metadata/count/${connectionId}`);
    return response.data;
  },
  getTables: async (connectionId: number, page: number = 1, pageSize: number = 1000): Promise<string[]> => {
    const response = await api.get(`/metadata/tables/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getViews: async (connectionId: number, page: number = 1, pageSize: number = 1000): Promise<string[]> => {
    const response = await api.get(`/metadata/views/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getProcedures: async (connectionId: number, page: number = 1, pageSize: number = 1000): Promise<string[]> => {
    const response = await api.get(`/metadata/procedures/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getFunctions: async (connectionId: number, page: number = 1, pageSize: number = 1000): Promise<string[]> => {
    const response = await api.get(`/metadata/functions/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getTriggers: async (connectionId: number, page: number = 1, pageSize: number = 1000): Promise<string[]> => {
    const response = await api.get(`/metadata/triggers/${connectionId}`, { params: { page, pageSize } });
    return response.data;
  },
  getViewDetails: async (connectionId: number, viewName: string): Promise<{ name: string; createBody: string }> => {
    const response = await api.get(`/metadata/view/${connectionId}/${viewName}`);
    return response.data;
  },
  getProcedureDetails: async (connectionId: number, procedureName: string): Promise<{ name: string; createBody: string }> => {
    const response = await api.get(`/metadata/procedure/${connectionId}/${procedureName}`);
    return response.data;
  },
  getFunctionDetails: async (connectionId: number, functionName: string): Promise<{ name: string; createBody: string }> => {
    const response = await api.get(`/metadata/function/${connectionId}/${functionName}`);
    return response.data;
  },
  getTriggerDetails: async (connectionId: number, triggerName: string): Promise<{ name: string; createBody: string }> => {
    const response = await api.get(`/metadata/trigger/${connectionId}/${triggerName}`);
    return response.data;
  },
  searchObjects: async (connectionId: number, keyword: string): Promise<{ [key: string]: string[] }> => {
    const response = await api.get(`/metadata/search/${connectionId}`, { params: { keyword } });
    return response.data;
  },
};

// 查询API
export const queryApi = {
  execute: async (connectionId: number, sql: string, page: number = 1, pageSize: number = 20): Promise<any> => {
    const response = await api.post(`/query/execute/${connectionId}`, { sql, page, pageSize });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },
  generate: async (connectionId: number, naturalLanguageQuery: string): Promise<string> => {
    const response = await api.post(`/query/generate/${connectionId}`, { naturalLanguageQuery });
    return response.data;
  },
  exportExcel: async (connectionId: number, sql: string): Promise<Blob> => {
    const response = await api.post(`/query/export/${connectionId}`, { sql }, {
      responseType: 'blob'
    });
    return response.data;
  },
};
