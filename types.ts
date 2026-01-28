
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
export type InvestigationStatus = 'DRAFT' | 'ACTIVE_WAR_ROOM' | 'RESOLVED' | 'ARCHIVED';

export interface SearchIndex {
  id: string;
}

export interface FileInfo {
  format: string;
  category: string;
  parserUsed: string;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
}

export interface SystemMetrics {
  totalQueries: number;
  errorCount: number;
  queryLatency: number[];
  memoryUsage: number;
  indexingLatency: number;
  rateLimitHits: number;
}

export type LLMProvider = 'google' | 'openai' | 'anthropic';

export interface TestReport {
  throughput: string;
  compressionRatio: string;
  ragAccuracy: string;
  loadTime: string;
}

export interface RegressiveReport {
  benchmarks: {
    indexingSpeed: string;
    p95Latency: string;
    memoryEfficiency: string;
    tokenCoverage: string;
  };
  testCases: {
    name: string;
    status: 'passed' | 'failed' | 'running';
    category: string;
    details: string;
    duration: string;
  }[];
}

export interface CodeFlowStep {
  file: string;
  line: number;
  method?: string;
  description: string;
  variableState?: Record<string, any>;
}

export interface CodeFix {
  title: string;
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
}

export interface UnitTest {
  code: string;
}

export interface DebugSolution {
  id: string;
  strategy: string;
  rootCause: string;
  confidence: number;
  fixes: CodeFix[];
  bestPractices: string[];
  unitTests: UnitTest[];
}

export interface AdvancedAnalysis {
  patterns: {
    signature: string;
    severity: Severity;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    example: string;
  }[];
  correlations: {
    sourceEvent: string;
    triggeredEvent: string;
    causalLink: string;
    timeDeltaMs: number;
  }[];
  bottlenecks: {
    operation: string;
    impact: 'CRITICAL' | 'WARNING' | 'INFO';
    p95LatencyMs: number;
  }[];
  securityInsights: {
    type: string;
    description: string;
    remediation: string;
  }[];
  memoryInsights: string[];
}

export interface ExportData {
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  solutions?: DebugSolution[];
  sourceFiles: CodeFile[];
  timestamp: string;
}

export interface WizardStep {
  id: string;
  label: string;
  detail: string;
  layer: TechLayer;
  command?: string;
}

export interface DiagnosticWizardPlan {
  wizardType: string;
  detectedLayer: TechLayer;
  steps: WizardStep[];
  causalityChain: {
    layer: TechLayer;
    tech: string;
    message: string;
    logicImpact: string;
  }[];
  verification: {
    strategy: string;
    scripts: string[];
    metricsToMonitor: string[];
  };
}

export interface DeploymentRisk {
  score: number;
  level: 'CRITICAL' | 'HIGH' | 'LOW';
  recommendation: string;
  findings: {
    type: 'migration' | 'code' | 'config';
    message: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

export interface HeatmapPoint {
  hour: number;
  day: string;
  intensity: number;
}

export interface DiffChunk {
  startLine: number;
  original: string;
  suggested: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  message?: string;
  duration?: number;
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
    tenantId?: string;
    transactionId?: string;
  };
  sourceFile?: string;
}

export interface ForensicComment {
  id: string;
  author: string;
  role: UserRole;
  content: string;
  timestamp: Date;
  targetId: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  status: 'active' | 'away' | 'focus';
  avatarColor: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  status?: string;
  component?: string;
  correlation?: string;
  details?: string;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: string;
  confidence_score: number;
  user_impact_percent: number;
  analyst_persona: string;
  affected_components: string[];
  root_cause_analysis: {
    primary_failure: string;
    error_signature: string;
    mechanism: string;
    description: string;
    evidence_sample?: string;
  };
  forensic_timeline: TimelineEvent[];
  remediation_plan: {
    immediate_action: string;
    steps: string[];
  };
  high_fidelity_patch: {
    configuration_changes: {
      jvm_args?: string[];
      kubernetes_resources?: {
        limits: { memory: string; cpu: string };
        requests: { memory: string; cpu: string };
      };
    };
    resiliency_pattern: {
      strategy: string;
      target: string;
      rationale: string;
    };
  };
}

export interface StructuredAnalysis {
  incident_report: IncidentReport;
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
  detectedStack: string[];
  industryMatch?: Industry;
  processedFiles: string[];
  inferredFiles: string[];
  crossLogPatterns: number;
  temporalChains?: { events: LogEntry[] }[];
  fileInfo?: FileInfo;
  referencedFiles?: {
    path: string;
    uploaded: boolean;
    mentions: number;
    severityMax: Severity;
  }[];
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  markers?: { line: number; severity: string; message: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  structuredReport?: StructuredAnalysis;
  isLoading?: boolean;
  modelId?: string;
  analysisPhase?: 'UPLOADING' | 'PARSING' | 'DETECTING' | 'SOLVING' | 'GENERATING';
}

export type PipelineStep = 'ingestion' | 'analysis' | 'proactive';

export interface LogSignature {
  id: string;
  pattern: string;
  count: number;
  severity: Severity;
  description: string;
  sample: string;
}

export interface Hypothesis {
  id: string;
  theory: string;
  author: string;
  status: 'confirmed' | 'ruled_out' | 'active';
  timestamp: Date;
}

export interface WarRoomAction {
  id: string;
  label: string;
  assignee: UserRole;
  status: 'pending' | 'completed';
}

export interface ResolvedIncident {
  id: string;
  title: string;
  solution: string;
  resolvedAt: Date;
}

export interface DiagnosticWorkflow {
  discovery: 'pending' | 'active' | 'completed';
  summary: 'pending' | 'active' | 'completed';
  rootCause: 'pending' | 'active' | 'completed';
  fix: 'pending' | 'active' | 'completed';
  report: 'pending' | 'active' | 'completed';
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export interface SourceLocation {
  filePath: string;
  line: number;
}

export interface AnomalyAlert {
  id: string;
  timestamp: Date;
  severity: Severity;
  type: string;
  message: string;
  predictedImpact: string;
  suggestedAction: string;
}

export interface PerformanceTrend {
  metric: string;
  values: { timestamp: Date; value: number }[];
  status: 'improving' | 'degrading' | 'stable';
  forecast: string;
}

export interface AppliedFix {
  fixId: string;
  appliedAt: Date;
  status: 'applied' | 'rolled_back' | 'verified';
  snapshot: string;
}

export interface AppState {
  userRole: UserRole;
  industry: Industry;
  isProcessing: boolean;
  isDiscovering: boolean;
  ingestionProgress: number;
  logs: LogEntry[];
  chunks: LogChunk[];
  sourceFiles: CodeFile[];
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
  appliedFixes: AppliedFix[];
  comments: ForensicComment[];
  teamMembers: TeamMember[];
  investigationStatus: InvestigationStatus;
  knowledgeFiles: KnowledgeFile[];
  searchIndex: SearchIndex | null;
  currentDeploymentRisk: DeploymentRisk | null;
}

export interface LogChunk {
  id: string;
  content: string;
}

export interface TimeBucket {
  time: string;
  count: number;
  errorCount: number;
}
