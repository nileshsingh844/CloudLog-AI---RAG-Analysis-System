
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { ChatWindow } from './components/ChatWindow';
import { IntelligenceHub } from './components/IntelligenceHub';
import { CodeHub } from './components/CodeHub';
import { KnowledgeHub } from './components/KnowledgeHub';
import { TestCenter } from './components/TestCenter';
import { TestReportModal } from './components/TestReportModal';
import { RegressiveReportModal } from './components/RegressiveReportModal';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { SmartFeatures } from './components/SmartFeatures';
import { SignatureSelectionGrid } from './components/SignatureSelectionGrid';
import { ForensicEvidencePanel } from './components/ForensicEvidencePanel';
import { GeminiService } from './services/geminiService';
import { PipelineStep, Severity, DiagnosticWorkflow } from './types';
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, ChevronRight, Zap, AlertTriangle, Loader2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Target, Hash, Search, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    diagnosticCache,
    addToCache,
    processNewFile,
    processSourceFiles,
    processKnowledgeFiles,
    clearSourceFiles,
    clearKnowledgeFiles,
    setSelectedLocation,
    setSelectedFilePath,
    setOutputFormat,
    setWorkflowStep,
    addMessage, 
    updateLastMessageChunk, 
    replaceLastMessageContent,
    setLastMessageSources, 
    setLastMessageGrounding,
    setLastMessageFollowUp,
    setLastMessageStructuredReport,
    finishLastMessage, 
    updateLastMessageError, 
    recordQueryMetric,
    setViewMode,
    setActiveStep,
    selectModel,
    setSettingsOpen,
    setDiscoverySignatures,
    toggleSignatureSelection,
    setActiveInvestigationId,
    clearSession,
    simulateStressTest,
    runRegressiveSuite,
    clearTestReport,
    clearRegressiveReport,
    setDiscovering
  } = useLogStore();

  const gemini = useMemo(() => new GeminiService(), []);
  
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [contextDepth, setContextDepth] = useState(50);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const discoveryAttempted = useRef(false);
  const summaryTriggered = useRef(false);

  const updateWorkflowProgress = useCallback((query: string, isStart: boolean) => {
    const q = query.toLowerCase();
    let step: keyof DiagnosticWorkflow | null = null;
    
    if (q.includes('summarize') || q.includes('incident summary')) step = 'summary';
    else if (q.includes('root cause')) step = 'rootCause';
    else if (q.includes('fix') || q.includes('remediation') || q.includes('suggested fix')) step = 'fix';
    else if (q.includes('report') || q.includes('generate report')) step = 'report';

    if (step) {
      setWorkflowStep(step, isStart ? 'active' : 'completed');
    }
  }, [setWorkflowStep]);

  const handleSendMessage = useCallback(async (query: string) => {
    if (!state.stats || state.chunks.length === 0) {
      addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });
      addMessage({ 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "Neural Context Unavailable. Please ingest a log stream in Step 1 to activate forensic intelligence.", 
        timestamp: new Date() 
      });
      return;
    }

    if (state.isProcessing) return;

    updateWorkflowProgress(query, true);

    const cacheKey = `${state.selectedModelId}-${state.outputFormat}-${state.activeInvestigationId}-${query.substring(0, 50)}`;
    const cached = diagnosticCache[cacheKey];

    setIsSidebarMinimized(true);
    if (isFileTreeOpen) setIsFileTreeOpen(false);

    const queryStart = performance.now();
    addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });

    const botMsgId = (Date.now() + 1).toString();
    addMessage({ 
      id: botMsgId, 
      role: 'assistant', 
      content: cached ? 'Retrieving diagnostic snapshot from Neural Cache...' : 'Initializing Forensic Engine...', 
      timestamp: new Date(), 
      isLoading: true, 
      modelId: state.selectedModelId 
    });

    if (cached) {
      await new Promise(r => setTimeout(r, 400));
      setLastMessageSources(cached.sources);
      setLastMessageStructuredReport(cached.report);
      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart);
      updateWorkflowProgress(query, false);
      return;
    }

    try {
      const anchoredSig = state.discoverySignatures.find(s => s.id === state.activeInvestigationId);
      const activeSigs = anchoredSig ? [anchoredSig] : state.discoverySignatures.filter(s => state.selectedSignatures.includes(s.id));
      
      const streamResult = gemini.analyzeLogsStream(
        state.chunks, 
        state.searchIndex,
        state.sourceFiles,
        state.knowledgeFiles,
        `${query} (Output required format: ${state.outputFormat})`, 
        state.selectedModelId, 
        state.messages,
        activeSigs
      );

      let finalContent = "";
      let finalSources: string[] = [];
      let finalReport: any = null;

      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') {
          setLastMessageSources(chunk.data);
          finalSources = chunk.data;
        } else if (chunk.type === 'status') {
          replaceLastMessageContent(chunk.data);
        } else if (chunk.type === 'partial_text') {
          replaceLastMessageContent("Synthesizing: " + chunk.data.substring(0, 100) + "...");
        } else if (chunk.type === 'text') {
          replaceLastMessageContent(chunk.data);
          finalContent = chunk.data;
        } else if (chunk.type === 'structured_report') {
          setLastMessageStructuredReport(chunk.data);
          finalReport = chunk.data;
          if (!finalContent) finalContent = chunk.data.executive_summary;
        } else if (chunk.type === 'grounding') {
          setLastMessageGrounding(chunk.data);
        }
      }

      if (finalReport) {
        addToCache(cacheKey, { report: finalReport, sources: finalSources });
      }

      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart);
      updateWorkflowProgress(query, false);

      if (finalContent) {
        try {
          const suggestions = await gemini.generateFollowUpSuggestions(finalContent, query);
          setLastMessageFollowUp(suggestions);
        } catch (f) {
          console.warn("Follow-up generation skipped", f);
        }
      }
    } catch (error: any) {
      updateLastMessageError(`Critical Pipeline Error: ${error.message}. Please refresh or try another model.`);
      recordQueryMetric(performance.now() - queryStart, true);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.sourceFiles, state.knowledgeFiles, state.messages, state.selectedModelId, state.outputFormat, state.selectedSignatures, state.discoverySignatures, state.activeInvestigationId, isFileTreeOpen, addMessage, updateLastMessageChunk, replaceLastMessageContent, setLastMessageSources, setLastMessageGrounding, setLastMessageStructuredReport, finishLastMessage, updateLastMessageError, recordQueryMetric, setLastMessageFollowUp, state.stats, diagnosticCache, addToCache, updateWorkflowProgress]);

  const performSignatureScan = useCallback(async () => {
    if (!state.stats || state.chunks.length === 0 || state.isDiscovering) return;
    
    setDiscovering(true);
    setDiscoveryError(null);
    discoveryAttempted.current = true;
    
    try {
      const sigs = await gemini.extractUniqueSignatures(state.chunks);
      if (!sigs || sigs.length === 0) {
        setDiscoveryError("Signature Extraction yielded no distinct patterns. Manual interrogation enabled.");
        setDiscoverySignatures([]);
      } else {
        setDiscoverySignatures(sigs);
      }
    } catch (e: any) {
      console.error("Pattern extraction failed", e);
      setDiscoveryError("Discovery Engine fault: " + (e.message || "Unknown error") + ". Check your API connectivity and try again.");
      discoveryAttempted.current = false;
    } finally {
      setDiscovering(false);
    }
  }, [state.stats, state.chunks, state.isDiscovering, gemini, setDiscovering, setDiscoverySignatures]);

  useEffect(() => {
    if (state.activeStep === 'analysis' && state.stats && state.chunks.length > 0 && !state.isProcessing && state.messages.length === 0 && !summaryTriggered.current) {
      summaryTriggered.current = true;
      handleSendMessage("Summarize this incident and highlight the most suspicious signals across all log streams.");
    }
  }, [state.activeStep, state.stats, state.chunks.length, state.isProcessing, state.messages.length, handleSendMessage]);

  useEffect(() => {
    if (state.stats && state.chunks.length > 0 && state.discoverySignatures.length === 0 && !state.isDiscovering && !discoveryAttempted.current && !discoveryError) {
      performSignatureScan();
    }
  }, [state.stats, state.chunks, state.discoverySignatures.length, state.isDiscovering, performSignatureScan, discoveryError]);

  const handleDeepDive = useCallback(() => {
    if (state.selectedSignatures.length === 0) return;
    const sigId = state.selectedSignatures[0];
    const sig = state.discoverySignatures.find(s => s.id === sigId);
    if (!sig) return;
    setActiveInvestigationId(sigId);
    setWorkflowStep('discovery', 'completed');
    const query = `Summarize the issue for anchored signature: [${sig.pattern}]. Impacted systems: ${sig.impacted_systems.join(', ')}. Logic snapshot: ${sig.sample.substring(0, 100)}`;
    handleSendMessage(query);
  }, [state.selectedSignatures, state.discoverySignatures, handleSendMessage, setActiveInvestigationId, setWorkflowStep]);

  const activeSignature = useMemo(() => 
    state.discoverySignatures.find(s => s.id === state.activeInvestigationId) || null,
    [state.activeInvestigationId, state.discoverySignatures]
  );

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement }[] = [
    { id: 'ingestion', label: '1: Ingestion', icon: <CloudUpload size={14} /> },
    { id: 'analysis', label: '2: Diagnosis', icon: <Activity size={14} /> },
    { id: 'code-sync', label: '3: Code Sync', icon: <Code size={14} /> },
    { id: 'knowledge', label: '4: Enrichment', icon: <Zap size={14} /> },
    { id: 'debug', label: '5: Lab', icon: <ShieldAlert size={14} /> }
  ];

  const currentStepIdx = PIPELINE_STEPS.findIndex(s => s.id === state.activeStep);
  const selectedFile = state.sourceFiles.find(f => f.path === state.selectedFilePath) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 font-sans">
      <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <h1 className="text-lg font-black text-white italic tracking-tighter uppercase">CloudLog <span className="text-blue-500">AI</span></h1>
          </div>
          <nav className="hidden lg:flex items-center gap-1.5">
            {PIPELINE_STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button onClick={() => idx <= currentStepIdx && setActiveStep(step.id)} disabled={idx > currentStepIdx && !state.stats} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${state.activeStep === step.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : currentStepIdx > idx ? 'text-emerald-400' : 'text-slate-600 opacity-50'}`}>
                  {step.icon}
                  <span className="text-[10px] font-black uppercase tracking-widest">{step.label.split(': ')[1] || step.label}</span>
                </button>
                {idx < PIPELINE_STEPS.length - 1 && <ChevronRight size={14} className="text-slate-800" />}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="p-2.5 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700 hover:text-white transition-all">
          <Settings size={18} />
        </button>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {state.activeStep === 'ingestion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full overflow-y-auto px-8 py-10">
               <div className="lg:col-span-8 space-y-12 animate-in fade-in zoom-in-95 duration-700">
                 <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-lg"><Zap size={14} className="text-blue-400" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Inference Gateway</span></div>
                   <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Forensic Portal</h2>
                   <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">Map cascading failures across multi-node log streams with RAG-integrated code context.</p>
                 </div>
                 <FileUpload onFileSelect={(f) => { discoveryAttempted.current = false; setDiscoveryError(null); summaryTriggered.current = false; processNewFile(f); }} isProcessing={state.isProcessing} ingestionProgress={state.ingestionProgress} fileName={state.stats?.fileName} />
                 {state.stats && <button onClick={() => setActiveStep('analysis')} className="mt-12 flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all">Launch Audit <ArrowRight size={24} /></button>}
               </div>
               <div className="lg:col-span-4"><TestCenter onSimulateLargeFile={simulateStressTest} onRunPrompt={(p) => { setActiveStep('analysis'); handleSendMessage(p); }} onRunRegressive={runRegressiveSuite} isProcessing={state.isProcessing} /></div>
            </div>
          )}

          {state.activeStep === 'analysis' && (
            <div className="flex h-full min-h-0 relative">
              {/* Evidence Panel - Left (Collapsible) */}
              <div 
                className={`transition-all duration-500 border-r border-slate-900 bg-[#020617] h-full overflow-hidden shrink-0 
                  ${isLeftPanelCollapsed ? 'w-0' : 'w-[20%] 2xl:w-[25%]'}`}
              >
                <ForensicEvidencePanel 
                  stats={state.stats} 
                  logs={state.logs}
                  activeSignature={activeSignature} 
                  allSignatures={state.discoverySignatures}
                />
              </div>

              {/* Collapse Button Left */}
              <button 
                onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-[60] p-1 bg-slate-900 border border-slate-800 rounded-r-lg text-slate-500 hover:text-white transition-all shadow-xl
                  ${isLeftPanelCollapsed ? 'translate-x-0' : 'translate-x-[20%] 2xl:translate-x-[25%]'}`}
              >
                {isLeftPanelCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
               
              {/* Intelligence Panel - Center (Hero - 60-70% width) */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14] relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                  
                  {/* Active Investigation Sticky Bar */}
                  {activeSignature && (
                    <div className="shrink-0 bg-slate-900/80 backdrop-blur-3xl border-b border-slate-800/80 px-6 py-3 flex items-center justify-between z-[55] animate-in slide-in-from-top duration-500">
                       <div className="flex items-center gap-6 min-w-0">
                          <div className="flex items-center gap-3 shrink-0">
                             <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Target size={14} className="text-blue-400" />
                             </div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investigating:</span>
                          </div>
                          
                          <div className="flex items-center gap-3 min-w-0">
                             <p className="text-xs font-black text-white italic truncate max-w-md">
                                {activeSignature.pattern}
                             </p>
                             <div className="h-3 w-px bg-slate-800 mx-1 shrink-0" />
                             <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  activeSignature.severity === Severity.FATAL ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                  activeSignature.severity === Severity.ERROR ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                   {activeSignature.severity}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-black text-slate-500 uppercase">
                                   {activeSignature.count} Events
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-black text-slate-500 uppercase flex items-center gap-1">
                                   <Hash size={8} /> Recurrence Active
                                </span>
                             </div>
                          </div>
                       </div>

                       <button 
                         onClick={() => setIsRightPanelCollapsed(false)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-700 transition-all shadow-lg shrink-0"
                       >
                         <Search size={10} />
                         Change Selection
                       </button>
                    </div>
                  )}

                  <div className="flex h-full overflow-hidden">
                    <div className="flex-1 flex flex-col min-h-0">
                      <ChatWindow 
                        messages={state.messages} 
                        onSendMessage={handleSendMessage} 
                        isProcessing={state.isProcessing} 
                        selectedModel={state.selectedModelId} 
                        onSelectModel={selectModel} 
                        outputFormat={state.outputFormat}
                        onSelectOutputFormat={setOutputFormat}
                        workflow={state.workflow}
                        onOpenSettings={() => setSettingsOpen(true)} 
                        suggestions={state.suggestions} 
                        sourceFiles={state.sourceFiles} 
                        stats={state.stats} 
                        allChunks={state.chunks}
                        activeInvestigationId={state.activeInvestigationId}
                        signatures={state.discoverySignatures}
                        onClearInvestigation={() => setActiveInvestigationId(null)}
                      />
                    </div>
                  </div>
              </div>

              {/* Signature Selection Slider - Right (Collapsible) */}
              <div 
                className={`transition-all duration-500 border-l border-slate-900 bg-slate-950/20 h-full overflow-hidden shrink-0
                  ${isRightPanelCollapsed ? 'w-0' : 'w-[20%] 2xl:w-[25%]'}`}
              >
                <div className="w-full h-full overflow-y-auto p-6 space-y-6 scrollbar-hide">
                   <SignatureSelectionGrid 
                     signatures={state.discoverySignatures} 
                     selectedSignatures={state.selectedSignatures} 
                     onToggle={toggleSignatureSelection} 
                     onDeepDive={handleDeepDive} 
                     onRetryDiscovery={performSignatureScan}
                     isLoading={state.isDiscovering} 
                     error={discoveryError}
                   />
                </div>
              </div>

              {/* Collapse Button Right */}
              <button 
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-[60] p-1 bg-slate-900 border border-slate-800 rounded-l-lg text-slate-500 hover:text-white transition-all shadow-xl
                  ${isRightPanelCollapsed ? 'translate-x-0' : '-translate-x-[20%] 2xl:-translate-x-[25%]'}`}
              >
                {isRightPanelCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
              </button>
            </div>
          )}

          {state.activeStep === 'debug' && (
            <div className="flex-1 flex flex-col min-h-0">
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-[#0d0f14]">
                  <div className="flex items-center gap-4"><Sparkles size={16} className="text-blue-500" /><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Debug Lab</h4></div>
                  <button onClick={() => setIsFileTreeOpen(!isFileTreeOpen)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold ${isFileTreeOpen ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{isFileTreeOpen ? 'Hide Files' : 'Show Files'}</button>
               </div>
               <div className="flex-1 flex min-h-0">
                  {isFileTreeOpen && (
                    <div className="w-64 shrink-0 bg-[#0d0f14] border-r border-slate-800/40 flex flex-col min-h-0"><div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide"><FileTree files={state.sourceFiles} onSelectFile={setSelectedFilePath} selectedPath={state.selectedFilePath} /></div></div>
                  )}
                  <div className="flex-1 flex min-h-0">
                    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-hidden">
                      <ChatWindow 
                        messages={state.messages} 
                        onSendMessage={handleSendMessage} 
                        isProcessing={state.isProcessing} 
                        selectedModel={state.selectedModelId} 
                        onSelectModel={selectModel} 
                        outputFormat={state.outputFormat}
                        onSelectOutputFormat={setOutputFormat}
                        workflow={state.workflow}
                        onOpenSettings={() => setSettingsOpen(true)} 
                        suggestions={state.suggestions} 
                        sourceFiles={state.sourceFiles} 
                        stats={state.stats} 
                        allChunks={state.chunks}
                        activeInvestigationId={state.activeInvestigationId}
                        signatures={state.discoverySignatures}
                        onClearInvestigation={() => setActiveInvestigationId(null)}
                      />
                    </div>
                    <div className="hidden xl:flex flex-col w-[300px] shrink-0 min-h-0 bg-[#0d0f14] border-l border-slate-800/40 p-4 space-y-6 overflow-y-auto scrollbar-hide">
                       <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                       {selectedFile && <CodeViewer file={selectedFile} selectedLine={state.selectedLocation?.line} />}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {state.activeStep === 'code-sync' && (
             <div className="flex-1 grid grid-cols-12 gap-8 p-12 overflow-y-auto scrollbar-hide">
                <div className="col-span-4"><CodeHub inferredFiles={state.stats?.inferredFiles || []} sourceFiles={state.sourceFiles} onUpload={processSourceFiles} onClear={clearSourceFiles} /></div>
                <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-20 space-y-8">
                   <div className="p-12 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl"><Code size={64} className="text-blue-500" /></div>
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Code Mapping</h2>
                   <p className="text-slate-400 text-lg max-w-md mx-auto italic">Upload source code to bridge log stack traces to physical line logic.</p>
                   {state.sourceFiles.length > 0 && <button onClick={() => setActiveStep('knowledge')} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">Proceed to Step 4</button>}
                </div>
             </div>
          )}

          {state.activeStep === 'knowledge' && (
             <div className="flex-1 grid grid-cols-12 gap-8 p-12 overflow-y-auto scrollbar-hide">
                <div className="col-span-4"><KnowledgeHub knowledgeFiles={state.knowledgeFiles} onUpload={processKnowledgeFiles} onClear={clearKnowledgeFiles} isProcessing={state.isProcessing} /></div>
                <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-20 space-y-8">
                   <div className="p-12 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl"><Zap size={64} className="text-blue-400" /></div>
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Enrich Diagnostic</h2>
                   <p className="text-slate-400 text-lg max-w-md mx-auto italic">Add runbooks or documentation to correlate historical fix patterns with current logs.</p>
                   {state.knowledgeFiles.length > 0 && <button onClick={() => setActiveStep('debug')} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">Enter Lab</button>}
                </div>
             </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0d0f14] border-t border-slate-900 px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Node Stable</span>
         </div>
         <button onClick={clearSession} className="px-3 py-1 bg-slate-900/50 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Sanitize Hub</button>
      </footer>
      
      {state.testReport && <TestReportModal report={state.testReport} onClose={clearTestReport} />}
      {state.regressiveReport && <RegressiveReportModal report={state.regressiveReport} onClose={clearRegressiveReport} isProcessing={state.isProcessing} />}
      <IntelligenceHub isOpen={state.isSettingsOpen} onClose={() => setSettingsOpen(false)} selectedModelId={state.selectedModelId} onSelectModel={selectModel} onClearSession={clearSession} contextDepth={contextDepth} onContextDepthChange={setContextDepth} stats={state.stats} onUploadRequest={() => setActiveStep('code-sync')} />
    </div>
  );
};

export default App;
