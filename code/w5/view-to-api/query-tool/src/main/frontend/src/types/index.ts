// --- API Response Types ---

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  metadata?: unknown;
}

export interface PageResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface QueryLog {
  id: number;
  requestTime: string;
  clientIp: string;
  databaseIp: string;
  databasePort: number;
  databaseType: string;
  databaseName: string;
  sqlHash: string;
  sqlPreview: string;
  sqlFull: string;
  resultData?: string;
  status: string;
  message: string;
  durationMs: number;
  createdAt: string;
}

export interface StatsResponse {
  totalRequests: number;
  successCount: number;
  failCount: number;
  todayRequests: number;
  avgDurationMs: number;
}

export interface LogQueryParams {
  startTime?: string;
  endTime?: string;
  clientIp?: string;
  status?: string;
  databaseType?: string;
  pageNumber?: number;
  pageSize?: number;
}
