export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface QueryHistory {
  id: string;
  connectionId: string;
  query: string;
  executedAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
}
