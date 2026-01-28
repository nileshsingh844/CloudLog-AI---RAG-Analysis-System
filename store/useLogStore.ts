import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, LogEntry, LogChunk, ProcessingStats, ChatMessage, Severity, UserRole, Industry, Hypothesis, WarRoomAction, ResolvedIncident, PipelineStep, DiagnosticWorkflow, ModelOption, SourceLocation, PerformanceTrend, AppliedFix, ForensicComment, TeamMember, InvestigationStatus, LogSignature } from '../types';
import { detectTechStack, detectIndustry, generateTimeBuckets, chunkLogEntries } from '../utils/logParser';

const STORAGE_KEY = 'cloudlog_ai_polyglot_v3';

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast, cost-effective inference', capabilities: ['text'] },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Deep forensic reasoning', capabilities: ['text', 'search'] },
];

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'SRE-01 (You)', role: 'DEVOPS', status: 'active', avatarColor: 'bg-blue-500' },
  { id: '2', name: 'Python-RAG-Engine', role: 'BACKEND', status: 'focus', avatarColor: 'bg-emerald-500' },
  { id: '3', name: 'Go-Sentinel', role: 'DEVOPS', status: 'active', avatarColor: 'bg-slate-700' },
];

const INITIAL_VERIFIED_HYPOTHESES: Hypothesis[] = [
  { id: 'h-mq', theory: 'Message queue capacity exhausted (10,000 pending) across 8 services.', author: 'Go-Sentinel', status: 'confirmed', timestamp: new Date() },
  { id: 'h-cache', theory: 'Cache memory pressure leading to key eviction storms (40,000 keys total).', author: 'Python-RAG-Engine', status: 'active', timestamp: new Date() },
  { id: 'h-rec', theory: 'Recursive function bug in LoadBalancer causing stack overflow (depth 10,000).', author: 'SRE-01', status: 'confirmed', timestamp: new Date() }
];

const INITIAL_VERIFIED_ACTIONS: WarRoomAction[] = [
  { id: 'a-1', label: 'Scale MQ consumers across cluster', assignee: 'DEVOPS', status: 'pending' },
  { id: 'a-2', label: 'Review cache TTL and memory allocation', assignee: 'BACKEND', status: 'pending' },
  { id: 'a-3', label: 'Rollback recent LoadBalancer deployment', assignee: 'DEVOPS', status: 'completed' }
];

export function useLogStore() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  const getInitialState = (): AppState => ({
    userRole: 'BACKEND',
    industry: 'GENERAL',
    isProcessing: false,
    isDiscovering: false,
    ingestionProgress: 0,
    logs: [],
    chunks: [],
    sourceFiles: [],
    knowledgeFiles: [],
    searchIndex: null,
    stats: null,
    messages: [],
    selectedModelId: 'gemini-3-pro-preview',
    outputFormat: 'detailed',
    workflow: { discovery: 'pending', summary: 'pending', rootCause: 'pending', fix: 'pending', report: 'pending' },
    activeStep: 'ingestion',
    isSettingsOpen: false,
    discoverySignatures: [],
    activeInvestigationId: null,
    hypotheses: INITIAL_VERIFIED_HYPOTHESES,
    warRoomActions: INITIAL_VERIFIED_ACTIONS,
    resolvedLibrary: [],
    selectedLocation: null,
    anomalies: [],
    trends: [],
    currentDeploymentRisk: null,
    appliedFixes: [],
    comments: [],
    teamMembers: MOCK_TEAM,
    investigationStatus: 'ACTIVE_WAR_ROOM'
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const baseState = getInitialState();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure complex dates are revived
        if (parsed.messages) {
          parsed.messages = parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
        return { ...baseState, ...parsed };
      } catch (e) {
        return baseState;
      }
    }
    return baseState;
  });

  useEffect(() => {
    const dataToSave = {
      userRole: state.userRole, 
      industry: state.industry, 
      messages: state.messages.filter(m => !m.isLoading),
      stats: state.stats, 
      activeStep: state.activeStep, 
      investigationStatus: state.investigationStatus,
      hypotheses: state.hypotheses,
      warRoomActions: state.warRoomActions,
      workflow: state.workflow
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state.userRole, state.industry, state.messages, state.stats, state.activeStep, state.investigationStatus, state.hypotheses, state.warRoomActions, state.workflow]);

  const resetApp = useCallback(async () => {
    setIsRestarting(true);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    
    setTimeout(() => {
      setState(getInitialState());
      setIsRestarting(false);
    }, 1500);
  }, []);

  const setWorkflowStatus = useCallback((step: keyof DiagnosticWorkflow, status: 'pending' | 'active' | 'completed') => {
    setState(s => ({
      ...s,
      workflow: { ...s.workflow, [step]: status }
    }));
  }, []);

  const processNewFile = useCallback((files: File[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      if (files.length === 0) {
        resolve();
        return;
      }
      const file = files[0];
      
      setState(s => ({ 
        ...s, 
        isProcessing: true, 
        ingestionProgress: 0, 
        messages: [], 
        stats: null,
        activeStep: 'ingestion',
        workflow: { discovery: 'pending', summary: 'pending', rootCause: 'pending', fix: 'pending', report: 'pending' }
      }));

      const LOG_PROCESSOR_WORKER_CODE = `
        const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO', DEBUG: 'DEBUG', UNKNOWN: 'UNKNOWN' };
        
        function detectSeverity(line) {
          if (line.includes('FATAL') || line.includes('CRITICAL')) return Severity.FATAL;
          if (line.includes('ERROR')) return Severity.ERROR;
          if (line.includes('WARN')) return Severity.WARN;
          return Severity.INFO;
        }

        function getSignature(line) {
           return line.replace(/[a-f0-9]{8,}/gi, 'XID').replace(/\\d+/g, '#').replace(/\\/[\\w\\-\\.\\/]+/g, '/FS_PATH').trim();
        }

        self.onmessage = async (e) => {
          const { file, type } = e.data || {};
          if (type === "INIT") { self.postMessage({ type: "READY" }); return; }
          if (!file) return;
          try {
            const content = await file.text();
            const lines = content.split('\\n').filter(l => l.trim());
            
            const entries = lines.map((l, i) => {
               const severity = detectSeverity(l);
               return {
                  id: \`w-\${i}\`,
                  severity: severity,
                  message: l.substring(0, 500),
                  raw: l,
                  timestamp: new Date(),
                  metadata: { hasStackTrace: l.includes('at '), signature: getSignature(l.substring(0, 100)), layer: 'UNKNOWN' }
               };
            });

            const signatureMap = new Map();
            const severityCounts = { FATAL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, UNKNOWN: 0 };
            
            entries.forEach(e => {
              severityCounts[e.severity]++;
              const key = e.metadata.signature;
              if (!signatureMap.has(key)) {
                signatureMap.set(key, { count: 0, severity: e.severity, sample: e.raw });
              }
              signatureMap.get(key).count++;
            });

            self.postMessage({ type: 'COMPLETE', payload: { 
              logs: entries, 
              signatureMap: Array.from(signatureMap.entries()), 
              severityCounts, 
              lineCount: entries.length, 
              fileName: file.name } 
            });
          } catch (err) { self.postMessage({ type: 'ERROR', error: String(err) }); }
        };
      `;

      if (workerRef.current) workerRef.current.terminate();
      
      try {
        const blob = new Blob([LOG_PROCESSOR_WORKER_CODE], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;
        worker.postMessage({ type: "INIT" });

        worker.onmessage = (e) => {
          const { type, payload, error } = e.data;
          if (type === "READY") {
            worker.postMessage({ file });
          } else if (type === 'PROGRESS') {
            setState(s => ({ ...s, ingestionProgress: e.data.progress }));
          } else if (type === 'COMPLETE') {
            const { logs, signatureMap, severityCounts, lineCount, fileName } = payload;
            const chunks = chunkLogEntries(logs);
            
            const processingStats: ProcessingStats = {
              totalEntries: lineCount,
              uniqueEntries: signatureMap.length,
              severities: severityCounts,
              timeRange: { start: new Date(), end: new Date() },
              timeBuckets: generateTimeBuckets(logs),
              fileSize: file.size,
              fileName: fileName,
              chunkCount: chunks.length,
              uniqueChunks: chunks.length,
              detectedStack: detectTechStack(logs.slice(0, 50).map((l: any) => l.raw).join('\n')),
              industryMatch: detectIndustry(logs.slice(0, 50).map((l: any) => l.raw).join('\n')),
              processedFiles: [fileName],
              inferredFiles: [],
              crossLogPatterns: signatureMap.length
            };

            const discoverySignatures: LogSignature[] = signatureMap.map(([pattern, data]: any, i: number) => ({
                id: `sig-${i}`,
                pattern,
                count: data.count,
                severity: data.severity,
                description: `Pattern logic: Detected in ${data.count} distinct signal points.`,
                sample: data.sample
            }));

            setState(s => ({
              ...s,
              logs,
              chunks,
              stats: processingStats,
              discoverySignatures,
              isProcessing: false,
              activeStep: 'analysis',
              investigationStatus: 'ACTIVE_WAR_ROOM',
              workflow: { discovery: 'active', summary: 'pending', rootCause: 'pending', fix: 'pending', report: 'pending' }
            }));
            
            worker.terminate();
            resolve();
          } else if (type === 'ERROR') {
             console.error("Worker Execution Fault:", error);
             setState(s => ({ ...s, isProcessing: false }));
             reject(error);
          }
        };

        worker.onerror = (err) => {
          console.error("Worker Bridge Failure:", err);
          setState(s => ({ ...s, isProcessing: false }));
          reject(err);
        };

      } catch (err) {
        setState(s => ({ ...s, isProcessing: false }));
        reject(err);
      }
    });
  }, []);

  return {
    state,
    isRestarting,
    setUserRole: (role: UserRole) => setState(s => ({ ...s, userRole: role })),
    setIndustry: (industry: Industry) => setState(s => ({ ...s, industry })),
    setActiveStep: (step: PipelineStep) => setState(s => ({ ...s, activeStep: step })),
    processNewFile,
    resetApp,
    setWorkflowStatus,
    addMessage: (msg: ChatMessage) => setState(s => ({ ...s, messages: [...s.messages, msg] })),
    stopAnalysis: () => {
      if (workerRef.current) workerRef.current.terminate();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setState(s => ({ ...s, isProcessing: false }));
    },
    addComment: (targetId: string, content: string) => {
      const newComment: ForensicComment = { id: Date.now().toString(), author: 'SRE-01', role: state.userRole, content, timestamp: new Date(), targetId };
      setState(s => ({ ...s, comments: [...s.comments, newComment] }));
    },
    setIsProcessing: (val: boolean) => setState(s => ({ ...s, isProcessing: val })),
    setInvestigationStatus: (status: InvestigationStatus) => setState(s => ({ ...s, investigationStatus: status })),
    setSelectedLocation: (location: SourceLocation | null) => setState(s => ({ ...s, selectedLocation: location })),
    setSelectedModelId: (id: string) => setState(s => ({ ...s, selectedModelId: id })),
    applyFix: (fixId: string, snapshot: string) => setState(s => ({
      ...s, appliedFixes: [...s.appliedFixes, { fixId, appliedAt: new Date(), status: 'applied', snapshot }]
    })),
    rollbackFix: (fixId: string) => setState(s => ({
      ...s, appliedFixes: s.appliedFixes.filter(f => f.fixId !== fixId)
    })),
    finishLastMessage: () => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1].isLoading = false;
      return { ...s, messages: msgs, isProcessing: false };
    }),
    replaceLastMessageContent: (content: string) => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1].content = content;
      return { ...s, messages: msgs };
    }),
    setLastMessageStructuredReport: (report: any) => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1].structuredReport = report;
      
      const newWorkflow = { ...s.workflow };
      if (report?.incident_report) {
        newWorkflow.discovery = 'completed';
        newWorkflow.summary = 'completed';
        newWorkflow.rootCause = 'completed';
        newWorkflow.fix = 'completed';
        newWorkflow.report = 'completed';
      }

      return { ...s, messages: msgs, workflow: newWorkflow };
    }),
    setAnalysisPhase: (phase: ChatMessage['analysisPhase']) => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].isLoading) msgs[msgs.length - 1].analysisPhase = phase;
      
      const newWorkflow = { ...s.workflow };
      if (phase === 'UPLOADING') { 
        newWorkflow.discovery = 'active'; 
      }
      else if (phase === 'PARSING') { 
        newWorkflow.discovery = 'completed'; 
        newWorkflow.summary = 'active'; 
        newWorkflow.rootCause = 'active';
      }
      else if (phase === 'DETECTING') { 
        newWorkflow.discovery = 'completed'; 
        newWorkflow.summary = 'active'; 
      }
      else if (phase === 'SOLVING') { 
        newWorkflow.summary = 'completed'; 
        newWorkflow.rootCause = 'active'; 
        newWorkflow.fix = 'active';
      }
      else if (phase === 'GENERATING') { 
        newWorkflow.rootCause = 'completed'; 
        newWorkflow.fix = 'active'; 
        newWorkflow.report = 'active';
      }

      return { ...s, messages: msgs, workflow: newWorkflow };
    }),
    prepareAnalysis: () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      return controller.signal;
    },
    updateHypothesisStatus: (id: string, status: Hypothesis['status']) => setState(s => ({
      ...s, hypotheses: s.hypotheses.map(h => h.id === id ? { ...h, status } : h)
    })),
    addHypothesis: (theory: string) => setState(s => ({
      ...s, hypotheses: [...s.hypotheses, { id: Date.now().toString(), theory, author: 'SRE-01', status: 'active', timestamp: new Date() }]
    })),
    addAction: (label: string, assignee: UserRole) => setState(s => ({
      ...s, warRoomActions: [...s.warRoomActions, { id: Date.now().toString(), label, assignee, status: 'pending' }]
    }))
  };
}
