import axios from 'axios';
import { Connection, Metadata } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  getByConnectionId: async (connectionId: number): Promise<Metadata[]> => {
    const response = await api.get(`/metadata/connection/${connectionId}`);
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
};
