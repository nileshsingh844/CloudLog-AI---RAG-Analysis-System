
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, LogEntry, LogChunk, ProcessingStats, ChatMessage, Severity, UserRole, Industry, Hypothesis, WarRoomAction, ResolvedIncident, LogSignature, PipelineStep, DiagnosticWorkflow, ModelOption, SourceLocation, AnomalyAlert, PerformanceTrend, DeploymentRisk } from '../types';
import { parseLogFile, chunkLogEntries, buildSearchIndex, generateTimeBuckets, detectTechStack, detectIndustry } from '../utils/logParser';

const STORAGE_KEY = 'cloudlog_ai_session_v16';

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast and efficient for basic analysis', capabilities: ['text'] },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Advanced reasoning for complex root cause', capabilities: ['text', 'search'] },
];

const initialWorkflow: DiagnosticWorkflow = {
  discovery: 'pending',
  summary: 'pending',
  rootCause: 'pending',
  fix: 'pending',
  report: 'pending'
};

const MOCK_TRENDS: PerformanceTrend[] = [
  {
    metric: 'API Response Time',
    status: 'degrading',
    forecast: 'Predicted failure in 6 weeks if trend continues',
    values: [
      { date: 'Jan', value: 120 }, { date: 'Feb', value: 180 }, { date: 'Mar', value: 250 }
    ]
  },
  {
    metric: 'Memory Utilization',
    status: 'degrading',
    forecast: 'Likely memory leak in user-service handlers',
    values: [
      { date: 'Jan', value: 2.0 }, { date: 'Feb', value: 2.5 }, { date: 'Mar', value: 3.2 }
    ]
  }
];

export function useLogStore() {
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
      selectedModelId: 'gemini-3-flash-preview',
      outputFormat: 'detailed',
      workflow: initialWorkflow,
      activeStep: 'ingestion',
      isSettingsOpen: false,
      discoverySignatures: [],
      activeInvestigationId: null,
      hypotheses: [],
      warRoomActions: [],
      resolvedLibrary: [],
      selectedLocation: null,
      anomalies: [],
      trends: [],
      currentDeploymentRisk: null
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...baseState, ...parsed };
      } catch (e) { console.error("Restore error", e); }
    }
    return baseState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userRole: state.userRole,
      industry: state.industry,
      messages: state.messages.filter(m => !m.isLoading),
      stats: state.stats,
      hypotheses: state.hypotheses,
      warRoomActions: state.warRoomActions,
      activeStep: state.activeStep,
      anomalies: state.anomalies,
      trends: state.trends,
      currentDeploymentRisk: state.currentDeploymentRisk
    }));
  }, [state]);

  const setUserRole = (role: UserRole) => setState(s => ({ ...s, userRole: role }));
  const setIndustry = (industry: Industry) => setState(s => ({ ...s, industry }));
  const setActiveStep = (step: PipelineStep) => setState(s => ({ ...s, activeStep: step }));
  
  const generateProactiveReport = useCallback(() => {
    setState(s => ({
      ...s,
      anomalies: [],
      trends: MOCK_TRENDS
    }));
  }, []);

  const processNewFile = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setState(s => ({ ...s, isProcessing: true, ingestionProgress: 0 }));
    
    try {
      const content = await file.text();
      const detectedStack = detectTechStack(content);
      const industryMatch = detectIndustry(content);
      const { entries, fileInfo } = parseLogFile(content, file.name);
      
      const stats: ProcessingStats = {
        totalEntries: entries.length,
        uniqueEntries: entries.length,
        severities: { [Severity.ERROR]: 10, [Severity.FATAL]: 2, [Severity.WARN]: 5, [Severity.INFO]: 100, [Severity.DEBUG]: 0, [Severity.UNKNOWN]: 0 },
        timeRange: { start: null, end: null },
        timeBuckets: [],
        fileSize: file.size,
        fileName: file.name,
        chunkCount: 1,
        uniqueChunks: 1,
        fileInfo,
        inferredFiles: [],
        referencedFiles: [],
        processedFiles: [file.name],
        crossLogPatterns: 0,
        detectedStack,
        industryMatch
      };

      setState(s => ({
        ...s,
        logs: entries,
        stats,
        industry: industryMatch,
        isProcessing: false,
        ingestionProgress: 100,
        activeStep: 'analysis'
      }));
      
      setTimeout(() => generateProactiveReport(), 2000);

    } catch (err) {
      setState(s => ({ ...s, isProcessing: false }));
    }
  }, [generateProactiveReport]);

  return {
    state,
    setUserRole,
    setIndustry,
    setActiveStep,
    addHypothesis: (theory: string) => {},
    updateHypothesisStatus: (id: string, status: any) => {},
    addAction: (label: string, assignee: any) => {},
    processNewFile,
    runDeploymentRiskCheck: (s: string) => {},
    generateProactiveReport,
    setSettingsOpen: (open: boolean) => setState(s => ({ ...s, isSettingsOpen: open })),
    setDiscoverySignatures: (sigs: any) => setState(s => ({ ...s, discoverySignatures: sigs })),
    toggleSignatureSelection: (id: string) => setState(s => ({ ...s, activeInvestigationId: id })),
    addMessage: (msg: ChatMessage) => setState(s => ({ ...s, messages: [...s.messages, msg] })),
    finishLastMessage: () => setState(s => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1].isLoading = false;
      return { ...s, messages: msgs };
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
    setSelectedLocation: (loc: SourceLocation | null) => setState(s => ({ ...s, selectedLocation: loc }))
  };
}
