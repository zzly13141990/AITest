import axios from 'axios';
import type { ApiResponse, PageResult, QueryLog, StatsResponse, LogQueryParams } from '../types';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.message || '请求失败';
    console.error('API error:', msg, error);
    return Promise.reject(error);
  }
);

export const adminApi = {
  getLogs(params: LogQueryParams): Promise<ApiResponse<PageResult<QueryLog>>> {
    return apiClient.get('/admin/logs', { params }) as any;
  },

  getErrors(params: LogQueryParams): Promise<ApiResponse<PageResult<QueryLog>>> {
    return apiClient.get('/admin/errors', { params }) as any;
  },

  getLogDetail(id: number): Promise<ApiResponse<QueryLog>> {
    return apiClient.get(`/admin/logs/${id}`) as any;
  },

  getStats(): Promise<ApiResponse<StatsResponse>> {
    return apiClient.get('/admin/stats') as any;
  },
};
