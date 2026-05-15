export interface Connection {
  id?: number;
  connectionName: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  databaseType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Metadata {
  id?: number;
  connectionId: number;
  tableName: string;
  tableType: string;
  columns: string;
  uniqueKeys?: string;
  checkConstraints?: string;
  foreignKeys?: string;
  indexes?: string;
  tableReferences?: string;
  primaryKeys?: string;
  triggers?: string;
  createBody?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryResult {
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
