
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

export interface SourceLocation {
  filePath: string;
  line: number;
  method?: string;
  context?: string;
  isLibrary?: boolean;
}

export interface CodeFlowStep {
  file: string;
  line: number;
  method: string;
  description: string;
  variableState?: Record<string, string>;
}

export interface CodeFix {
  title: string;
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  bestPractice?: string;
}

export interface DebugSolution {
  id: string;
  strategy: string;
  confidence: number;
  rootCause: string;
  fixes: CodeFix[];
  bestPractices: string[];
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
    sourceLocations?: SourceLocation[];
    [key: string]: any;
  };
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  content: string;
  type: 'runbook' | 'documentation' | 'policy';
  size: number;
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
  inferredFiles: string[];
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
  capabilities: ('speed' | 'logic' | 'context' | 'search')[];
  status: 'active' | 'requires-config';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  groundingLinks?: GroundingSource[];
  codeSnippets?: SourceLocation[];
  analysisSteps?: CodeFlowStep[];
  debugSolutions?: DebugSolution[];
  isLoading?: boolean;
  modelId?: string;
  provider?: LLMProvider;
}

export type PipelineStep = 'ingestion' | 'analysis' | 'code-sync' | 'knowledge' | 'debug';

export interface TestCase {
  name: string;
  category: string;
  details: string;
  duration: string;
  status: 'passed' | 'running' | 'failed';
}

export interface RegressiveReport {
  benchmarks: {
    indexingSpeed: string;
    p95Latency: string;
    memoryEfficiency: string;
    tokenCoverage: string;
  };
  testCases: TestCase[];
}

export interface TestReport {
  throughput: string;
  compressionRatio: string;
  ragAccuracy: string;
  loadTime: string;
}

export interface AppState {
  apiKey: string | null;
  isProcessing: boolean;
  isGeneratingSuggestions: boolean;
  ingestionProgress: number;
  logs: LogEntry[];
  chunks: LogChunk[];
  sourceFiles: CodeFile[];
  knowledgeFiles: KnowledgeFile[];
  searchIndex: SearchIndex | null;
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  selectedModelId: string;
  metrics: SystemMetrics;
  viewMode: 'diagnostic' | 'operator' | 'code';
  activeStep: PipelineStep;
  isSettingsOpen: boolean;
  testReport: TestReport | null;
  regressiveReport: RegressiveReport | null;
  suggestions: string[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}
