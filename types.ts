
export enum Severity {
  FATAL = 'FATAL',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  UNKNOWN = 'UNKNOWN'
}

export interface FileInfo {
  originalName: string;
  extension: string;
  format: string;
  compression: string | null;
  parserUsed: string;
  isBinary: boolean;
  category: string;
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
    [key: string]: any;
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
  fileInfo?: FileInfo;
}

export interface SystemMetrics {
  queryLatency: number[];
  indexingLatency: number;
  totalQueries: number;
  errorCount: number;
  rateLimitHits: number;
  memoryUsage: number;
}

export interface TestCase {
  name: string;
  category: 'Parser' | 'RAG' | 'Performance' | 'Security';
  status: 'passed' | 'failed' | 'running';
  duration: string;
  details: string;
}

export interface RegressiveReport {
  timestamp: Date;
  overallStatus: 'passed' | 'failed';
  testCases: TestCase[];
  benchmarks: {
    indexingSpeed: string;
    p95Latency: string;
    memoryEfficiency: string;
    tokenCoverage: string;
  };
}

export interface TestReport {
  timestamp: Date;
  throughput: string;
  compressionRatio: string;
  ragAccuracy: string;
  loadTime: string;
  status: 'passed' | 'failed';
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
  isGeneratingSuggestions: boolean;
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
  testReport: TestReport | null;
  regressiveReport: RegressiveReport | null;
  suggestions: string[];
}
