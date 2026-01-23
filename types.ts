
export enum Severity {
  FATAL = 'FATAL',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  UNKNOWN = 'UNKNOWN'
}

export interface LogEntry {
  id: string;
  timestamp: Date | null;
  severity: Severity;
  message: string;
  raw: string;
  metadata: {
    hasStackTrace: boolean;
    signature: string;
    occurrenceCount?: number;
  };
}

export interface SearchIndex {
  invertedIndex: Map<string, Set<string>>;
  termWeights: Map<string, number>;
}

export interface LogChunk {
  id: string;
  content: string;
  entries: LogEntry[];
  tokenCount: number;
}

export interface TimeBucket {
  time: string;
  count: number;
  errorCount: number;
}

export interface ProcessingStats {
  totalEntries: number;
  severities: Record<Severity, number>;
  timeRange: { start: Date | null; end: Date | null };
  timeBuckets: TimeBucket[];
  fileSize: number;
  fileName: string;
  chunkCount: number;
}

export interface SystemMetrics {
  queryLatency: number[];
  indexingLatency: number;
  totalQueries: number;
  errorCount: number;
  rateLimitHits: number;
  memoryUsage: number;
}

export type LLMProvider = 'google-gemini' | 'openai' | 'anthropic' | 'mistral';

export interface ModelOption {
  id: string;
  provider: LLMProvider;
  name: string;
  description: string;
  capabilities: ('logic' | 'speed' | 'vision' | 'context')[];
  status: 'active' | 'requires-config' | 'experimental';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  isLoading?: boolean;
  modelId?: string;
  provider?: LLMProvider;
}

export interface AppState {
  apiKey: string | null;
  isProcessing: boolean;
  ingestionProgress: number;
  logs: LogEntry[];
  chunks: LogChunk[];
  searchIndex: SearchIndex | null;
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  selectedModelId: string;
  metrics: SystemMetrics;
  viewMode: 'diagnostic' | 'operator';
  isSettingsOpen: boolean;
}
