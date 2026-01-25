
export enum Severity {
  FATAL = 'FATAL',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  UNKNOWN = 'UNKNOWN'
}

export type OutputFormat = 'short' | 'detailed' | 'ticket';

export interface DiagnosticWorkflow {
  discovery: 'pending' | 'active' | 'completed';
  summary: 'pending' | 'active' | 'completed';
  rootCause: 'pending' | 'active' | 'completed';
  fix: 'pending' | 'active' | 'completed';
  report: 'pending' | 'active' | 'completed';
}

export interface LogSignature {
  id: string;
  pattern: string;
  description: string;
  count: number;
  severity: Severity;
  sample: string;
  impacted_systems: string[];
}

export interface StructuredErrorPattern {
  error_code: string;
  description: string;
  occurrences: number;
  first_seen: string;
  impacted_systems: string[];
  chunks: string[];
}

export interface StructuredInferredFile {
  path: string;
  confidence: number;
  line_numbers: number[];
}

export interface StructuredAnalysis {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence_score: number; // Percentage 0-100
  executive_summary: string;
  error_patterns: StructuredErrorPattern[];
  inferred_files: StructuredInferredFile[];
  root_cause_hypothesis: string;
  suggested_actions: string[];
}

export interface LogPattern {
  signature: string;
  count: number;
  example: string;
  severity: Severity;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ErrorCorrelation {
  id: string;
  sourceEvent: string;
  triggeredEvent: string;
  timeDeltaMs: number;
  confidence: number;
  causalLink: string;
}

export interface PerformanceBottleneck {
  operation: string;
  p95LatencyMs: number;
  count: number;
  impact: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface SecurityInsight {
  type: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'LOW';
  remediation: string;
}

export interface EnvironmentProfile {
  os?: string;
  runtime?: string;
  region?: string;
  host?: string;
  env?: string;
  detectedAnomalies?: string[];
}

export interface DependencyAnomaly {
  library: string;
  currentVersion: string;
  suspectedIssue: string;
  remediation?: string;
}

export interface AdvancedAnalysis {
  patterns: LogPattern[];
  correlations: ErrorCorrelation[];
  bottlenecks: PerformanceBottleneck[];
  securityInsights: SecurityInsight[];
  memoryInsights: string[];
  environmentProfile?: EnvironmentProfile;
  dependencyAnomalies?: DependencyAnomaly[];
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

export interface UnitTest {
  title: string;
  code: string;
  language: string;
  framework?: string;
}

export interface DebugSolution {
  id: string;
  strategy: string;
  confidence: number;
  rootCause: string;
  fixes: CodeFix[];
  bestPractices: string[];
  reproSteps?: string[];
  unitTests?: UnitTest[];
  preventionStrategy?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date | null;
  severity: Severity;
  message: string;
  raw: string;
  occurrenceCount: number;
  metadata: {
    hasStackTrace: boolean;
    signature: string;
    sourceLocations?: SourceLocation[];
    [key: string]: any;
  };
}

export interface CodeMarker {
  line: number;
  severity: Severity;
  message: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  markers?: CodeMarker[];
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
  signature: string; // Hash of the normalized content
  occurrenceCount: number;
  timeRange: { start: Date | null; end: Date | null };
}

export interface TimeBucket {
  time: string;
  count: number;
  errorCount: number;
}

export interface ReferencedFile {
  path: string;
  uploaded: boolean;
  mentions: number;
  severityMax: string;
}

export interface TemporalEvent {
  id: string;
  timestamp: Date;
  message: string;
  severity: Severity;
  sourceFile: string;
}

export interface TemporalChain {
  id: string;
  events: TemporalEvent[];
}

export interface ProcessingStats {
  totalEntries: number;
  uniqueEntries: number;
  severities: Record<Severity, number>;
  timeRange: { start: Date | null; end: Date | null };
  timeBuckets: TimeBucket[];
  fileSize: number;
  fileName: string;
  chunkCount: number;
  uniqueChunks: number;
  fileInfo?: FileInfo;
  inferredFiles: string[];
  referencedFiles: ReferencedFile[];
  processedFiles: string[];
  crossLogPatterns: number;
  temporalChains?: TemporalChain[];
}

export interface SystemMetrics {
  queryLatency: number[];
  indexingLatency: 0;
  totalQueries: 0;
  errorCount: 0;
  rateLimitHits: 0;
  memoryUsage: 0;
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

export interface FixValidation {
  confidence: number;
  impactSimulation: string;
  similarResolvedIssues: string[];
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
  advancedAnalysis?: AdvancedAnalysis;
  structuredReport?: StructuredAnalysis;
  isLoading?: boolean;
  modelId?: string;
  provider?: LLMProvider;
  fixValidation?: FixValidation;
  followUpSuggestions?: string[];
  confidence_score?: number;
}

export type PipelineStep = 'ingestion' | 'analysis' | 'code-sync' | 'knowledge' | 'debug';

export interface ExportData {
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  solutions: DebugSolution[];
  sourceFiles: CodeFile[];
  timestamp: string;
}

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
  isProcessing: boolean;
  isGeneratingSuggestions: boolean;
  isDiscovering: boolean;
  isDeepDiving: boolean;
  ingestionProgress: number;
  logs: LogEntry[];
  chunks: LogChunk[];
  sourceFiles: CodeFile[];
  knowledgeFiles: KnowledgeFile[];
  searchIndex: SearchIndex | null;
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  selectedModelId: string;
  outputFormat: OutputFormat;
  workflow: DiagnosticWorkflow;
  metrics: SystemMetrics;
  viewMode: 'diagnostic' | 'operator' | 'code';
  activeStep: PipelineStep;
  isSettingsOpen: boolean;
  testReport: TestReport | null;
  regressiveReport: RegressiveReport | null;
  suggestions: string[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  requiredContextFiles: string[];
  selectedLocation: { filePath: string; line: number } | null;
  selectedFilePath: string | null;
  discoverySignatures: LogSignature[];
  selectedSignatures: string[];
  activeInvestigationId: string | null;
}
