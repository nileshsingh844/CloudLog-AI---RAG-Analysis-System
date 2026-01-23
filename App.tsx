
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { StatsPanel } from './components/StatsPanel';
import { ChatWindow } from './components/ChatWindow';
import { LogTimeline } from './components/LogTimeline';
import { LogDistributionChart } from './components/LogDistributionChart';
import { LogTimeRange } from './components/LogTimeRange';
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
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Info, Zap, Sparkles, Database, Book, Globe, AlertTriangle, ListFilter, Sidebar, Layout, Maximize2, ChevronLeft, Search, Files, History } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    processFiles,
    processSourceFiles,
    processKnowledgeFiles,
    clearSourceFiles,
    clearKnowledgeFiles,
    clearTestReport,
    clearRegressiveReport,
    setSelectedLocation,
    setSelectedFilePath,
    addMessage, 
    updateLastMessageChunk, 
    replaceLastMessageContent,
    setLastMessageSources, 
    finishLastMessage, 
    updateLastMessageError, 
    recordQueryMetric,
    setViewMode,
    setActiveStep,
    selectModel,
    setSettingsOpen,
    setSuggestions,
    setGeneratingSuggestions,
    clearSession,
    setDiscovering,
    setDeepDiving,
    setDiscoverySignatures,
    toggleSignatureSelection,
    setContextDepth,
    addToCache
  } = useLogStore();

  const gemini = useMemo(() => new GeminiService(), []);
  
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const lastInteractedSidebar = useRef<'analysis' | 'code' | 'knowledge' | null>(null);

  // Intelligence v7.4: Background Pattern Extraction on Ingestion
  useEffect(() => {
    if (state.stats && state.chunks.length > 0 && state.discoverySignatures.length === 0 && !state.isDiscovering) {
      setDiscovering(true);
      gemini.extractUniqueSignatures(state.chunks, state.patternLibrary)
        .then(res => {
          setDiscoverySignatures(res.signatures);
          if (state.stats) {
            state.stats.temporalChains = res.temporalChains;
            state.stats.crossLogPatterns = res.signatures.filter(s => 
              s.fileOccurrenceMap && Object.keys(s.fileOccurrenceMap).length > 1
            ).length;
          }
          setDiscovering(false);
        })
        .catch(() => setDiscovering(false));
    }
  }, [state.stats, state.chunks, state.discoverySignatures.length, state.isDiscovering, gemini, state.patternLibrary]);

  const handleSendMessage = useCallback(async (query: string) => {
    if (state.isProcessing || (!state.chunks.length && !state.stats)) return;

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
        state.contextDepth,
        state.messages,
        state.analysisCache
      );

      let isFromCache = false;

      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') {
          setLastMessageSources(chunk.data);
        } else if (chunk.type === 'text') {
          updateLastMessageChunk(chunk.data);
        } else if (chunk.type === 'cache_hit') {
          isFromCache = true;
          const lastMsg = state.messages[state.messages.length - 1];
          if (lastMsg) lastMsg.isFromCache = true;
        } else if (chunk.type === 'save_to_cache') {
          addToCache(chunk.data.hash, chunk.data.query, chunk.data.result);
        } else if (chunk.type === 'structured_report') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.structuredReport = chunk.data;
        } else if (chunk.type === 'fix_validation') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.fixValidation = chunk.data;
        }
      }

      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart, false, isFromCache);
    } catch (error: any) {
      updateLastMessageError(`Engine Error: ${error.message}`);
      recordQueryMetric(performance.now() - queryStart, true);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.sourceFiles, state.knowledgeFiles, state.messages, state.selectedModelId, state.contextDepth, isFileTreeOpen, state.analysisCache, addToCache, recordQueryMetric]);

  const handleDeepDive = useCallback(() => {
    if (state.selectedSignatures.length === 0) return;
    const selectedSigs = state.discoverySignatures.filter(s => state.selectedSignatures.includes(s.id));
    const sigPatterns = selectedSigs.map(s => `[${s.pattern}]: ${s.description}`).join(', ');
    const query = `Targeted Forensic Audit for prioritized signatures: ${sigPatterns}. Focus on cross-log causality and remediation.`;
    handleSendMessage(query);
  }, [state.selectedSignatures, state.discoverySignatures, handleSendMessage]);

  const handleSidebarInteraction = (id: 'analysis' | 'code' | 'knowledge') => {
    lastInteractedSidebar.current = id;
    setIsSidebarMinimized(false);
  };

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement; desc: string }[] = [
    { id: 'ingestion', label: 'Step 1: Ingestion', icon: <Files size={16} />, desc: 'Multi-log feed' },
    { id: 'analysis', label: 'Step 2: Diagnosis', icon: <Activity size={16} />, desc: 'Temporal Causality' },
    { id: 'code-sync', label: 'Step 3: Code Sync', icon: <Code size={16} />, desc: 'Link source context' },
    { id: 'knowledge', label: 'Step 4: Enrichment', icon: <Book size={16} />, desc: 'Add runbooks & docs' },
    { id: 'debug', label: 'Step 5: Lab', icon: <ShieldAlert size={16} />, desc: 'Targeted Debug & Fix' }
  ];

  const currentStepIdx = PIPELINE_STEPS.findIndex(s => s.id === state.activeStep);
  const missingContextCount = state.requiredContextFiles.filter(f => !state.sourceFiles.some(sf => sf.path.endsWith(f) || f.endsWith(sf.path))).length;
  const selectedFile = state.sourceFiles.find(f => f.path === state.selectedFilePath) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-black text-white italic tracking-tighter uppercase">CloudLog <span className="text-blue-500">AI</span></h1>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logic v7.5</span></div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1.5">
            {PIPELINE_STEPS.map((step, idx) => {
              const isActive = state.activeStep === step.id;
              const isPast = currentStepIdx > idx;
              const isAvailable = !!state.stats || idx === 0;
              return (
                <React.Fragment key={step.id}>
                  <button onClick={() => isAvailable && setActiveStep(step.id)} disabled={!isAvailable} className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : isPast ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-600 opacity-50 cursor-not-allowed'}`}>
                    {isPast ? <CheckCircle2 size={14} className="text-emerald-400" /> : React.cloneElement(step.icon as React.ReactElement<any>, { size: 14 })}
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{step.label.split(': ')[1]}</p>
                  </button>
                  {idx < PIPELINE_STEPS.length - 1 && <ChevronRight size={14} className={isPast ? 'text-emerald-800' : 'text-slate-800'} />}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="p-2.5 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700/50 transition-all flex items-center gap-2 group hover:bg-slate-800 hover:text-white">
          <Settings size={18} className="group-hover:rotate-45 transition-transform" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Hub Settings</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col min-h-0 overflow-hidden">
        {state.stats?.isDeltaUpdate && (
          <div className="m-4 p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-700 shadow-lg">
             <div className="flex items-center gap-4">
               <History size={16} className="text-emerald-400" />
               <p className="text-xs text-slate-400 font-medium italic">Intelligence v7.3: Incremental analysis active. Only <span className="text-emerald-200 font-black">novel entries</span> processed to save logic tokens.</p>
             </div>
             <button onClick={() => setActiveStep('analysis')} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">View Findings</button>
          </div>
        )}

        {state.activeStep === 'analysis' && missingContextCount > 0 && (
          <div className="m-4 p-4 bg-amber-600/10 border border-amber-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-700 shadow-lg">
             <div className="flex items-center gap-4">
               <AlertTriangle size={18} className="text-amber-400" />
               <p className="text-xs text-slate-400 font-medium">System found <span className="text-amber-200 font-black italic">{missingContextCount} stack trace reference(s)</span> with no matching source file.</p>
             </div>
             <button onClick={() => setActiveStep('code-sync')} className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Link Code <ArrowRight size={14} /></button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {state.activeStep === 'ingestion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full overflow-y-auto px-8 py-10 scrollbar-hide">
               <div className="lg:col-span-8 space-y-12 animate-in fade-in zoom-in-95 duration-700">
                 <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4 shadow-lg"><Zap size={14} className="text-blue-400" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Cached Logic Hub</span></div>
                   <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Smart Re-Analysis</h2>
                   <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">v7.0 Logic: Persistent pattern library and analysis caching for sub-second responses on known faults.</p>
                 </div>
                 <FileUpload onFileSelect={processFiles} isProcessing={state.isProcessing} ingestionProgress={state.ingestionProgress} fileName={state.stats?.fileName} processedFiles={state.stats?.processedFiles} />
                 {state.stats && <button onClick={() => setActiveStep('analysis')} className="mt-12 flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95">Enter Analysis <ArrowRight size={24} /></button>}
               </div>
               <div className="lg:col-span-4"><TestCenter onSimulateLargeFile={() => {}} onRunPrompt={(p) => { setActiveStep('analysis'); handleSendMessage(p); }} onRunRegressive={() => {}} isProcessing={state.isProcessing} /></div>
            </div>
          )}

          {state.activeStep === 'analysis' && (
            <div className="flex h-full min-h-0 animate-in slide-in-from-right-8 duration-700">
               <div 
                onMouseEnter={() => handleSidebarInteraction('analysis')}
                className={`transition-all duration-500 ease-in-out border-r border-slate-900 bg-slate-950/30 overflow-hidden flex flex-col relative
                  ${isSidebarMinimized ? 'w-16' : 'w-[320px] lg:w-[400px]'}`}
               >
                  {!isSidebarMinimized ? (
                    <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide space-y-6">
                        <SectionHeader icon={<Activity size={14} className="text-blue-500" />} label="Causality Hub" />
                        <LogTimeRange stats={state.stats} />
                        <StatsPanel stats={state.stats} />
                        <LogDistributionChart stats={state.stats} />
                        <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center py-8 gap-10">
                        <button onClick={() => setIsSidebarMinimized(false)} className="p-3 bg-blue-600/10 rounded-xl text-blue-400 hover:bg-blue-600/20 transition-all"><Activity size={20}/></button>
                    </div>
                  )}
               </div>
               
               <div className="flex-1 flex flex-col min-h-0 bg-[#0d0f14] relative">
                  {state.messages.length === 0 ? (
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                      <div className="max-w-4xl mx-auto space-y-12">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                             <Search className="text-white w-6 h-6" />
                           </div>
                           <div>
                             <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Forensic Hub</h2>
                             <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">v7.4 Background pattern extraction active</p>
                           </div>
                        </div>
                        
                        <SignatureSelectionGrid 
                          signatures={state.discoverySignatures}
                          selectedSignatures={state.selectedSignatures}
                          onToggle={toggleSignatureSelection}
                          onDeepDive={handleDeepDive}
                          isLoading={state.isDiscovering}
                        />

                        {state.discoverySignatures.length > 0 && !state.isDiscovering && (
                          <div className="animate-in fade-in duration-1000 delay-500">
                             <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 border-b border-slate-800 pb-2">Cached Scenarios</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {["Correlate patterns across all files", "Identify shared root causes", "Simulate fix impact"].map((prompt, idx) => (
                                  <button 
                                    key={idx} 
                                    onClick={() => handleSendMessage(prompt)}
                                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-blue-500/40 transition-all group"
                                  >
                                    <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{prompt}</p>
                                  </button>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} onSelectModel={selectModel} onOpenSettings={() => setSettingsOpen(true)} suggestions={state.suggestions} sourceFiles={state.sourceFiles} stats={state.stats} allChunks={state.chunks} />
                  )}
               </div>
            </div>
          )}

          {state.activeStep === 'code-sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 px-6 py-8 animate-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-4 flex flex-col min-h-0">
                 <CodeHub inferredFiles={state.stats?.inferredFiles || []} sourceFiles={state.sourceFiles} onUpload={processSourceFiles} onClear={clearSourceFiles} />
               </div>
               <div className="lg:col-span-8 flex flex-col items-center justify-center p-10 bg-slate-900/20 border border-slate-800/50 rounded-[2.5rem] text-center space-y-10 shadow-inner">
                  <div className="p-14 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl"><Code size={60} className="text-blue-500" /></div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Code Bridge</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Map patterns to implementation. Delta processing active for incremental updates.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setActiveStep('analysis')} className="px-10 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest border border-slate-700/50 hover:text-white transition-all">Back to Diagnosis</button>
                    {state.sourceFiles.length > 0 && <button onClick={() => setActiveStep('knowledge')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all">Continue to Step 4</button>}
                  </div>
               </div>
            </div>
          )}

          {state.activeStep === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 px-6 py-8 animate-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-4 flex flex-col min-h-0">
                <KnowledgeHub knowledgeFiles={state.knowledgeFiles} onUpload={processKnowledgeFiles} onClear={clearKnowledgeFiles} isProcessing={state.isProcessing} />
               </div>
               <div className="lg:col-span-8 flex flex-col items-center justify-center p-10 bg-emerald-900/5 border border-emerald-800/20 rounded-[2.5rem] text-center space-y-10 shadow-inner">
                  <div className="p-14 bg-emerald-900/10 rounded-[3rem] border border-emerald-800/30 shadow-2xl"><Book size={60} className="text-emerald-500" /></div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Knowledge Lab</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Enrich neural context with runbooks. Pattern matching library enabled.</p>
                  </div>
                  <button onClick={() => setActiveStep('debug')} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all">Enter Debug Lab</button>
               </div>
            </div>
          )}

          {state.activeStep === 'debug' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in zoom-in-95 duration-700">
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-[#0d0f14]">
                  <div className="flex items-center gap-4">
                    <Sparkles size={16} className="text-blue-500" />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Debug Lab</h4>
                  </div>
                  <button onClick={() => setIsFileTreeOpen(!isFileTreeOpen)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${isFileTreeOpen ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    {isFileTreeOpen ? 'Hide Files' : 'Show Files'}
                  </button>
               </div>

               <div className="flex-1 flex min-h-0">
                  {isFileTreeOpen && (
                    <div className="w-64 shrink-0 bg-[#0d0f14] border-r border-slate-800/40 flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-left duration-300">
                      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
                        <FileTree files={state.sourceFiles} onSelectFile={(path) => setSelectedFilePath(path)} selectedPath={state.selectedFilePath} />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex min-h-0">
                    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-hidden">
                       <ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} onSelectModel={selectModel} onOpenSettings={() => setSettingsOpen(true)} suggestions={["Identify race conditions", "Analyze delta logs"]} sourceFiles={state.sourceFiles} stats={state.stats} allChunks={state.chunks} />
                    </div>

                    <div className="hidden xl:flex flex-col w-[300px] shrink-0 min-h-0 bg-[#0d0f14] border-l border-slate-800/40 p-4 space-y-6 overflow-y-auto scrollbar-hide">
                       <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                       {selectedFile && <CodeViewer file={selectedFile} selectedLine={state.selectedLocation?.line} />}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0d0f14] border-t border-slate-900 px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Efficiency v7.5 Active</span>
           </div>
           {state.stats && (
             <div className="hidden sm:flex items-center gap-6">
               <StatusItem label="Cache Hit" value={`${(state.metrics.cacheHitRate * 100).toFixed(1)}%`} />
               <StatusItem label="Persistence" value={`${Object.keys(state.analysisCache).length} Nodes`} />
             </div>
           )}
         </div>
         <button onClick={() => clearSession()} className="px-3 py-1 bg-slate-900/50 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Wipe Logic Cache</button>
      </footer>
      
      {state.testReport && <TestReportModal report={state.testReport} onClose={clearTestReport} />}
      {state.regressiveReport && <RegressiveReportModal report={state.regressiveReport} onClose={clearRegressiveReport} isProcessing={state.isProcessing} />}
      <IntelligenceHub 
        isOpen={state.isSettingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        selectedModelId={state.selectedModelId} 
        onSelectModel={selectModel} 
        onClearSession={clearSession} 
        contextDepth={state.contextDepth}
        onContextDepthChange={setContextDepth}
        stats={state.stats}
        onUploadRequest={() => setActiveStep('code-sync')}
      />
    </div>
  );
};

const SectionHeader = ({ icon, label }: any) => (
  <div className="flex items-center gap-2 mb-4 px-1">
    <div className="p-1.5 bg-blue-600/10 rounded border border-blue-500/10">{icon}</div>
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{label}</h3>
  </div>
);

const StatusItem = ({ label, value }: any) => (
  <div className="flex items-center gap-2">
    <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">{label}:</span>
    <span className="text-[9px] font-black text-slate-400 italic">{value}</span>
  </div>
);

export default App;
