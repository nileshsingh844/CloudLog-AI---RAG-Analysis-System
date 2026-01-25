
export enum Severity {
  FATAL = 'FATAL',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  UNKNOWN = 'UNKNOWN'
}

export type Industry = 'GENERAL' | 'ECOMMERCE' | 'FINTECH' | 'SAAS' | 'GAMING' | 'HEALTHCARE';

export type UserRole = 'DEVOPS' | 'BACKEND' | 'FRONTEND' | 'PRODUCT_MANAGER';

export type TechLayer = 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'INFRASTRUCTURE' | 'UNKNOWN';

export type OutputFormat = 'short' | 'detailed' | 'ticket';

export interface SourceLocation {
  filePath: string;
  line: number;
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

export interface TimeBucket {
  time: string;
  count: number;
  errorCount: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export type LLMProvider = 'google';

export interface SystemMetrics {
  totalQueries: number;
  errorCount: number;
  queryLatency: number[];
  memoryUsage: number;
  indexingLatency: number;
  rateLimitHits: number;
}

export interface CodeFlowStep {
  file: string;
  line: number;
  method?: string;
  description: string;
  variableState?: Record<string, any>;
}

export interface UnitTest {
  name: string;
  code: string;
}

export interface CodeFix {
  title: string;
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
}

export interface DebugSolution {
  id: string;
  strategy: string;
  rootCause: string;
  confidence: number;
  fixes: CodeFix[];
  unitTests?: UnitTest[];
  bestPractices: string[];
}

export interface AdvancedAnalysis {
  patterns: LogSignature[];
  correlations: any[];
  bottlenecks: any[];
  securityInsights: any[];
  memoryInsights: string[];
}

export interface ExportData {
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  solutions: DebugSolution[];
  sourceFiles: CodeFile[];
  timestamp: string;
}

export interface Hypothesis {
  id: string;
  theory: string;
  author: string;
  status: 'investigating' | 'confirmed' | 'ruled_out';
  evidence_ids: string[];
}

export interface WarRoomAction {
  id: string;
  label: string;
  assignee: UserRole;
  status: 'todo' | 'in_progress' | 'done';
}

export interface ResolvedIncident {
  id: string;
  title: string;
  project: string;
  date: string;
  rootCause: string;
  resolution: string;
  tags: string[];
}

export interface AnomalyAlert {
  id: string;
  type: 'latency' | 'error_rate' | 'resource';
  severity: Severity;
  message: string;
  predictedImpact: string;
  suggestedAction: string;
  timestamp: Date;
}

export interface PerformanceTrend {
  metric: string;
  values: { date: string; value: number }[];
  status: 'stable' | 'degrading' | 'improving';
  forecast: string;
}

export interface DeploymentRisk {
  score: number; // 0-10
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: { type: 'code' | 'migration' | 'dependency'; message: string; severity: 'low' | 'medium' | 'high' }[];
  recommendation: string;
}

export interface DiagnosticWorkflow {
  discovery: 'pending' | 'active' | 'completed';
  summary: 'pending' | 'active' | 'completed';
  rootCause: 'pending' | 'active' | 'completed';
  fix: 'pending' | 'active' | 'completed';
  report: 'pending' | 'active' | 'completed';
}

export interface WizardStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  detail: string;
  command?: string;
  layer: TechLayer;
}

export interface VerificationProtocol {
  strategy: string;
  scripts: string[];
  metricsToMonitor: string[];
  successCriteria: string;
}

export interface CausalityLink {
  timestamp: Date;
  layer: TechLayer;
  tech: string;
  message: string;
  logicImpact: string;
}

export interface DiagnosticWizardPlan {
  wizardType: string;
  detectedLayer: TechLayer;
  steps: WizardStep[];
  causalityChain: CausalityLink[];
  verification: VerificationProtocol;
}

export interface LogSignature {
  id: string;
  pattern: string;
  description: string;
  count: number;
  severity: Severity;
  sample: string;
  impacted_systems: string[];
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface StructuredAnalysis {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence_score: number;
  executive_summary: string;
  error_patterns: any[];
  inferred_files: any[];
  root_cause_hypothesis: string;
  suggested_actions: string[];
  wizardPlan?: DiagnosticWizardPlan;
  user_impact_percent?: number;
  hypotheses?: string[];
  industry_metrics?: Record<string, any>;
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
  referencedFiles: any[];
  processedFiles: string[];
  crossLogPatterns: number;
  detectedStack: string[];
  temporalChains?: any[];
  industryMatch?: Industry;
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
    layer: TechLayer;
    industryTags?: string[];
    tenantId?: string;
    transactionId?: string;
    [key: string]: any;
  };
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  markers?: any[];
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
  signature: string;
  occurrenceCount: number;
  timeRange: { start: Date | null; end: Date | null };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  structuredReport?: StructuredAnalysis;
  isLoading?: boolean;
  modelId?: string;
  followUpSuggestions?: string[];
  analysisSteps?: CodeFlowStep[];
  debugSolutions?: DebugSolution[];
  confidence_score?: number;
}

export type PipelineStep = 'ingestion' | 'analysis' | 'code-sync' | 'knowledge' | 'debug' | 'war-room' | 'proactive' | 'integrations' | 'industry';

export interface AppState {
  userRole: UserRole;
  industry: Industry;
  isProcessing: boolean;
  isDiscovering: boolean;
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
  activeStep: PipelineStep;
  isSettingsOpen: boolean;
  discoverySignatures: LogSignature[];
  activeInvestigationId: string | null;
  hypotheses: Hypothesis[];
  warRoomActions: WarRoomAction[];
  resolvedLibrary: ResolvedIncident[];
  selectedLocation: SourceLocation | null;
  anomalies: AnomalyAlert[];
  trends: PerformanceTrend[];
  currentDeploymentRisk: DeploymentRisk | null;
}

export interface TestReport {
  throughput: string;
  compressionRatio: string;
  ragAccuracy: string;
  loadTime: string;
}

export interface TestCase {
  name: string;
  category: string;
  details: string;
  status: 'running' | 'passed' | 'failed';
  duration: string;
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
