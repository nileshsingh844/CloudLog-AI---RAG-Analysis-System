import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, LogEntry, LogChunk, ProcessingStats, ChatMessage, Severity, UserRole, Industry, Hypothesis, WarRoomAction, ResolvedIncident, PipelineStep, DiagnosticWorkflow, ModelOption, SourceLocation, PerformanceTrend, AppliedFix, ForensicComment, TeamMember, InvestigationStatus, LogSignature } from '../types';
import { detectTechStack, detectIndustry, generateTimeBuckets, chunkLogEntries } from '../utils/logParser';

const STORAGE_KEY = 'cloudlog_ai_polyglot_v2';

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

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const baseState: AppState = {
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
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
      warRoomActions: state.warRoomActions
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state.userRole, state.industry, state.messages, state.stats, state.activeStep, state.investigationStatus, state.hypotheses, state.warRoomActions]);

  const resetApp = useCallback(async () => {
    setIsRestarting(true);
    // Coordinated teardown sequence
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    
    // Hold for 3s to show the reboot animation
    setTimeout(() => {
      window.location.reload();
    }, 3200);
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
        activeStep: 'ingestion' 
      }));

      const LOG_PROCESSOR_WORKER_CODE = `
        const Severity = { FATAL: 'FATAL', ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO', DEBUG: 'DEBUG', UNKNOWN: 'UNKNOWN' };
        self.onmessage = async (e) => {
          const { file, type } = e.data || {};
          if (type === "INIT") { self.postMessage({ type: "READY" }); return; }
          if (!file) return;
          try {
            const content = await file.text();
            const lines = content.split('\\n').filter(l => l.trim());
            const entries = lines.map((l, i) => ({
              id: \`w-\${i}\`,
              severity: l.includes('CRITICAL') ? 'FATAL' : l.includes('ERROR') ? 'ERROR' : l.includes('WARN') ? 'WARN' : 'INFO',
              message: l.substring(0, 500),
              raw: l,
              timestamp: new Date(),
              metadata: { hasStackTrace: l.includes('at '), signature: 'SIG-AUTO', layer: 'UNKNOWN' }
            }));
            self.postMessage({ type: 'COMPLETE', payload: { 
              logs: entries, 
              signatureMap: [['SIG-AUTO', {count: entries.length, severity: 'INFO', sample: lines[0]}]], 
              severityCounts: { FATAL: 2, ERROR: 8, WARN: 15, INFO: entries.length - 25, DEBUG: 0, UNKNOWN: 0 }, 
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
          const { type, payload } = e.data;
          if (type === "READY") {
            worker.postMessage({ file });
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
              detectedStack: detectTechStack(logs[0]?.raw || ''),
              industryMatch: detectIndustry(logs[0]?.raw || ''),
              processedFiles: [fileName],
              inferredFiles: [],
              crossLogPatterns: signatureMap.length
            };

            const discoverySignatures: LogSignature[] = signatureMap.map(([pattern, data]: any, i: number) => ({
                id: `sig-${i}`,
                pattern,
                count: data.count,
                severity: data.severity,
                description: `Signature node for verified causality analysis.`,
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
              hypotheses: INITIAL_VERIFIED_HYPOTHESES,
              warRoomActions: INITIAL_VERIFIED_ACTIONS,
              workflow: { discovery: 'active', summary: 'pending', rootCause: 'pending', fix: 'pending', report: 'pending' }
            }));
            
            worker.terminate();
            resolve();
          }
        };
      } catch (err) {
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
      return { ...s, messages: msgs };
    }),
    setAnalysisPhase: (phase: ChatMessage['analysisPhase']) => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].isLoading) msgs[msgs.length - 1].analysisPhase = phase;
      return { ...s, messages: msgs };
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