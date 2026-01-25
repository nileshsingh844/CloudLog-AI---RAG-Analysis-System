
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { StatsPanel } from './components/StatsPanel';
import { ChatWindow } from './components/ChatWindow';
import { LogTimeRange } from './components/LogTimeRange';
import { LogDistributionChart } from './components/LogDistributionChart';
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
import { GeminiService } from './services/geminiService';
import { PipelineStep, ChatMessage } from './types';
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Zap, Sparkles, AlertTriangle, Search, Microscope } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    processNewFile,
    processSourceFiles,
    processKnowledgeFiles,
    clearSourceFiles,
    clearKnowledgeFiles,
    setSelectedLocation,
    setSelectedFilePath,
    addMessage, 
    updateLastMessageChunk, 
    // Fix: add missing replaceLastMessageContent to destructuring
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
  const [contextDepth, setContextDepth] = useState(50);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const discoveryAttempted = useRef(false);

  // STAGE 1: Automatic Pattern Extraction
  const performSignatureScan = useCallback(async () => {
    if (!state.stats || state.chunks.length === 0 || state.isDiscovering) return;
    
    setDiscovering(true);
    setDiscoveryError(null);
    discoveryAttempted.current = true;
    
    try {
      const sigs = await gemini.extractUniqueSignatures(state.chunks);
      if (!sigs || sigs.length === 0) {
        setDiscoveryError("Signature Extraction yielded no distinct patterns. The log stream may be too homogeneous.");
        setDiscoverySignatures([]);
      } else {
        setDiscoverySignatures(sigs);
      }
    } catch (e: any) {
      console.error("Pattern extraction stage failed:", e);
      setDiscoveryError(e.message || "Synthesis Pipeline Interrupted: The Discovery Engine failed to resolve log patterns.");
      discoveryAttempted.current = false;
    } finally {
      setDiscovering(false);
    }
  }, [state.stats, state.chunks, state.isDiscovering, gemini, setDiscovering, setDiscoverySignatures]);

  useEffect(() => {
    if (state.stats && state.chunks.length > 0 && state.discoverySignatures.length === 0 && !state.isDiscovering && !discoveryAttempted.current && !discoveryError) {
      performSignatureScan();
    }
  }, [state.stats, state.chunks, state.discoverySignatures.length, state.isDiscovering, performSignatureScan, discoveryError]);

  const handleSendMessage = useCallback(async (query: string) => {
    // Check if the engine is ready
    if (!state.stats || state.chunks.length === 0) {
      addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });
      addMessage({ 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "Neural Context Unavailable. Please upload log files in Step 1: Ingestion to activate forensic capabilities.", 
        timestamp: new Date() 
      });
      return;
    }

    if (state.isProcessing) return;

    setIsSidebarMinimized(true);
    if (isFileTreeOpen) setIsFileTreeOpen(false);

    const queryStart = performance.now();
    addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });

    const botMsgId = (Date.now() + 1).toString();
    addMessage({ id: botMsgId, role: 'assistant', content: '', timestamp: new Date(), isLoading: true, modelId: state.selectedModelId });

    try {
      const streamResult = gemini.analyzeLogsStream(
        state.chunks, 
        state.searchIndex,
        state.sourceFiles,
        state.knowledgeFiles,
        query, 
        state.selectedModelId, 
        state.messages
      );

      let finalContent = "";
      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') setLastMessageSources(chunk.data);
        else if (chunk.type === 'status') {
           updateLastMessageChunk(`*${chunk.data}*\n\n`);
        }
        else if (chunk.type === 'text') {
          // If we receive the full summary/text, replace the loading statuses
          replaceLastMessageContent(chunk.data);
          finalContent = chunk.data;
        }
        else if (chunk.type === 'structured_report') {
           setLastMessageStructuredReport(chunk.data);
           if (!finalContent) finalContent = chunk.data.executive_summary;
        } else if (chunk.type === 'grounding') setLastMessageGrounding(chunk.data);
      }

      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart);

      // STAGE 2: Follow-up Generation
      if (finalContent) {
        try {
          const suggestions = await gemini.generateFollowUpSuggestions(finalContent, query);
          setLastMessageFollowUp(suggestions);
        } catch (f) {
          console.warn("Next Step Synthesis failed", f);
        }
      }

    } catch (error: any) {
      updateLastMessageError(`Forensic Engine Error: ${error.message}. Check API configuration.`);
      recordQueryMetric(performance.now() - queryStart, true);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.sourceFiles, state.knowledgeFiles, state.messages, state.selectedModelId, isFileTreeOpen, addMessage, updateLastMessageChunk, replaceLastMessageContent, setLastMessageSources, setLastMessageGrounding, setLastMessageStructuredReport, finishLastMessage, updateLastMessageError, recordQueryMetric, setLastMessageFollowUp, state.stats]);

  const handleDeepDive = useCallback(() => {
    if (state.selectedSignatures.length === 0) return;
    const selectedSigs = state.discoverySignatures.filter(s => state.selectedSignatures.includes(s.id));
    const sigPatterns = selectedSigs.map(s => `[${s.pattern}]: ${s.description}`).join(', ');
    const query = `Perform a targeted Deep Forensic Audit for prioritized patterns: ${sigPatterns}. Identify cross-node causality and suggest remediation.`;
    handleSendMessage(query);
  }, [state.selectedSignatures, state.discoverySignatures, handleSendMessage]);

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement }[] = [
    { id: 'ingestion', label: '1: Ingestion', icon: <CloudUpload size={14} /> },
    { id: 'analysis', label: '2: Diagnosis', icon: <Activity size={14} /> },
    { id: 'code-sync', label: '3: Code Sync', icon: <Code size={14} /> },
    { id: 'knowledge', label: '4: Enrichment', icon: <Zap size={14} /> },
    { id: 'debug', label: '5: Lab', icon: <ShieldAlert size={14} /> }
  ];

  const currentStepIdx = PIPELINE_STEPS.findIndex(s => s.id === state.activeStep);
  const selectedFile = state.sourceFiles.find(f => f.path === state.selectedFilePath) || null;

  const handleManualRetryDiscovery = () => {
    discoveryAttempted.current = false;
    setDiscoveryError(null);
    performSignatureScan();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 font-sans">
      <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
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
                   <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Diagnostic Hub</h2>
                   <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">Map semantic causality across multi-node RAG segments.</p>
                 </div>
                 <FileUpload onFileSelect={(f) => { discoveryAttempted.current = false; setDiscoveryError(null); setDiscoverySignatures([]); processNewFile(f); }} isProcessing={state.isProcessing} ingestionProgress={state.ingestionProgress} fileName={state.stats?.fileName} />
                 {state.stats && <button onClick={() => setActiveStep('analysis')} className="mt-12 flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all">Discover Patterns <ArrowRight size={24} /></button>}
               </div>
               <div className="lg:col-span-4"><TestCenter onSimulateLargeFile={simulateStressTest} onRunPrompt={(p) => { setActiveStep('analysis'); handleSendMessage(p); }} onRunRegressive={runRegressiveSuite} isProcessing={state.isProcessing} /></div>
            </div>
          )}

          {state.activeStep === 'analysis' && (
            <div className="flex h-full min-h-0">
               <div className={`transition-all duration-500 border-r border-slate-900 bg-slate-950/30 flex flex-col overflow-hidden ${isSidebarMinimized ? 'w-16' : 'w-[400px]'}`}>
                  {!isSidebarMinimized ? (
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
                        <LogTimeRange stats={state.stats} />
                        <StatsPanel stats={state.stats} />
                        <LogDistributionChart stats={state.stats} />
                        <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center py-8 gap-6"><button onClick={() => setIsSidebarMinimized(false)} className="p-3 bg-blue-600/10 rounded-xl text-blue-400"><Activity size={20}/></button></div>
                  )}
               </div>
               
               <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14] relative">
                  {(state.discoverySignatures.length === 0 && !state.isDiscovering) || discoveryError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                      <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl max-w-lg space-y-6">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                          <Microscope className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Discovery Protocol Required</h3>
                        {discoveryError && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-left animate-in shake duration-500">
                             <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                             <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{discoveryError}</p>
                          </div>
                        )}
                        <button 
                          onClick={handleManualRetryDiscovery} 
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                        >
                          <Search size={18} />
                          Scan Log Streams
                        </button>
                      </div>
                    </div>
                  ) : state.messages.length === 0 ? (
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                       <SignatureSelectionGrid 
                        signatures={state.discoverySignatures}
                        selectedSignatures={state.selectedSignatures}
                        onToggle={toggleSignatureSelection}
                        onDeepDive={handleDeepDive}
                        isLoading={state.isDiscovering}
                       />
                    </div>
                  ) : (
                    <ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} onSelectModel={selectModel} onOpenSettings={() => setSettingsOpen(true)} suggestions={state.suggestions} sourceFiles={state.sourceFiles} stats={state.stats} allChunks={state.chunks} />
                  )}
               </div>
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
                    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-hidden"><ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} onSelectModel={selectModel} onOpenSettings={() => setSettingsOpen(true)} suggestions={state.suggestions} sourceFiles={state.sourceFiles} stats={state.stats} allChunks={state.chunks} /></div>
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
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Bridge Logic</h2>
                   <p className="text-slate-400 text-lg max-w-md mx-auto italic">Step 3: Link source code to map trace points directly to logic implementation.</p>
                   {state.sourceFiles.length > 0 && <button onClick={() => setActiveStep('knowledge')} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">Proceed to Step 4</button>}
                </div>
             </div>
          )}

          {state.activeStep === 'knowledge' && (
             <div className="flex-1 grid grid-cols-12 gap-8 p-12 overflow-y-auto scrollbar-hide">
                <div className="col-span-4"><KnowledgeHub knowledgeFiles={state.knowledgeFiles} onUpload={processKnowledgeFiles} onClear={clearKnowledgeFiles} isProcessing={state.isProcessing} /></div>
                <div className="col-span-8 bg-slate-900/40 border border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-center p-20 space-y-8">
                   <div className="p-12 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl"><Zap size={64} className="text-blue-400" /></div>
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Enrich Audit</h2>
                   <p className="text-slate-400 text-lg max-w-md mx-auto italic">Step 4: Load runbooks or policy docs to cross-reference known remediation protocols.</p>
                   {state.knowledgeFiles.length > 0 && <button onClick={() => setActiveStep('debug')} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">Enter Debug Lab</button>}
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
         <button onClick={clearSession} className="px-3 py-1 bg-slate-900/50 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Sanitize Session</button>
      </footer>
      
      {state.testReport && <TestReportModal report={state.testReport} onClose={clearTestReport} />}
      {state.regressiveReport && <RegressiveReportModal report={state.regressiveReport} onClose={clearRegressiveReport} isProcessing={state.isProcessing} />}
      <IntelligenceHub isOpen={state.isSettingsOpen} onClose={() => setSettingsOpen(false)} selectedModelId={state.selectedModelId} onSelectModel={selectModel} onClearSession={clearSession} contextDepth={contextDepth} onContextDepthChange={setContextDepth} stats={state.stats} onUploadRequest={() => setActiveStep('code-sync')} />
    </div>
  );
};

export default App;
