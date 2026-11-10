export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notNull: boolean;
  defaultVal: any;
  isPk: boolean;
}

export interface ForeignKeyInfo {
  from: string;
  targetTable: string;
  targetColumn: string;
}

export interface TableMeta {
  tableName: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount: number;
  sampleRows?: {
    columns: string[];
    values: any[][];
  } | null;
}

export interface SchemaResponse {
  schemaText: string;
  tables: TableMeta[];
}

export interface SafetyCheck {
  passed: boolean;
  reason?: string;
  violations?: string[];
}

export interface ExecutionResult {
  success: boolean;
  columns?: string[];
  rows?: Record<string, any>[];
  rowCount?: number;
  executionTimeMs?: number;
  error?: string;
}

export interface AgentRunResponse {
  success: boolean;
  question: string;
  sql: string;
  safetyCheck: SafetyCheck;
  execution: ExecutionResult | null;
  summary: string;
  reasoning?: string;
  error?: string;
  groundingSources?: { title: string; uri: string }[];
  webSearchQueries?: string[];
}

export interface PythonScriptFile {
  name: string;
  type: string;
  title: string;
  desc: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingSources?: { title: string; uri: string }[];
  webSearchQueries?: string[];
  model?: string;
}

export interface ChatPersona {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
}
