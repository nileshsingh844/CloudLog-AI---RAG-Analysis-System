
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect, useState } from 'react';
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
import { GeminiService } from './services/geminiService';
import { PipelineStep, ChatMessage } from './types';
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Info, Zap, Sparkles, Database, Book, Globe, AlertTriangle, ListFilter, Sidebar, Layout, Maximize2 } from 'lucide-react';

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
    setLastMessageSources, 
    setLastMessageGrounding,
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
    simulateStressTest,
    runRegressiveSuite,
    clearTestReport,
    clearRegressiveReport
  } = useLogStore();

  const gemini = useMemo(() => new GeminiService(), []);
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(false);

  // Workflow Auto-Discovery
  useEffect(() => {
    if (state.stats && state.chunks.length > 0 && state.suggestions.length === 0 && !state.isProcessing && !state.isGeneratingSuggestions) {
      setGeneratingSuggestions(true);
      gemini.getDiscoveryPrompts(state.stats, state.chunks)
        .then((s) => {
          setSuggestions(s);
          setGeneratingSuggestions(false);
        })
        .catch(() => setGeneratingSuggestions(false));
    }
  }, [state.stats, state.chunks, state.isProcessing, state.isGeneratingSuggestions]);

  // Forensic Audit Trigger (Step 1 Complete -> Step 2 Guidance)
  useEffect(() => {
    if (state.stats && state.messages.length === 0 && !state.isProcessing) {
      handleSendMessage("Perform a forensic audit (Step 1). Detect recurring patterns and extract all inferred source file paths for logic bridging.");
    }
  }, [state.stats, state.isProcessing]);

  const handleSendMessage = useCallback(async (query: string) => {
    if (state.isProcessing || (!state.chunks.length && !state.stats)) return;

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

      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') {
          setLastMessageSources(chunk.data);
        } else if (chunk.type === 'text') {
          updateLastMessageChunk(chunk.data);
        } else if (chunk.type === 'grounding') {
          setLastMessageGrounding(chunk.data);
        } else if (chunk.type === 'advanced_analysis') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.advancedAnalysis = chunk.data;
        } else if (chunk.type === 'analysis') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.analysisSteps = chunk.data;
        } else if (chunk.type === 'debug_solutions') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.debugSolutions = chunk.data;
        } else if (chunk.type === 'text_replace') {
           const lastMsg = state.messages[state.messages.length - 1];
           if (lastMsg) lastMsg.content = chunk.data;
        } else if (chunk.type === 'status') {
          updateLastMessageError(chunk.data);
        }
      }

      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart);
    } catch (error: any) {
      updateLastMessageError(`Engine Error: ${error.message}`);
      recordQueryMetric(performance.now() - queryStart, true);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.sourceFiles, state.knowledgeFiles, state.messages, state.selectedModelId]);

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement; desc: string }[] = [
    { id: 'ingestion', label: 'Step 1: Ingestion', icon: <CloudUpload size={16} />, desc: 'Upload raw log streams' },
    { id: 'analysis', label: 'Step 1: Analysis', icon: <Activity size={16} />, desc: 'Detect patterns & Extract paths' },
    { id: 'code-sync', label: 'Step 2: Code Sync', icon: <Code size={16} />, desc: 'Link source context' },
    { id: 'knowledge', label: 'Step 3: Enrichment', icon: <Book size={16} />, desc: 'Add runbooks & documentation' },
    { id: 'debug', label: 'Step 4: Debug', icon: <ShieldAlert size={16} />, desc: 'Fix proposal & Remediate' }
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
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Engine</span></div>
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
          <Settings size={18} className="group-hover:rotate-45 transition-transform" /><span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Settings</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col min-h-0 overflow-hidden">
        {state.activeStep === 'analysis' && missingContextCount > 0 && (
          <div className="m-4 p-4 bg-amber-600/10 border border-amber-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-700 shadow-lg">
             <div className="flex items-center gap-4">
               <AlertTriangle size={18} className="text-amber-400" />
               <p className="text-xs text-slate-400 font-medium">System found <span className="text-amber-200 font-black italic">{missingContextCount} stack trace reference(s)</span> with no matching source file. Sync code to enable highlighting.</p>
             </div>
             <button onClick={() => setActiveStep('code-sync')} className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Sync Code <ArrowRight size={14} /></button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {state.activeStep === 'ingestion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full overflow-y-auto px-8 py-10 scrollbar-hide">
               <div className="lg:col-span-8 space-y-12 animate-in fade-in zoom-in-95 duration-700">
                 <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4 shadow-lg"><Zap size={14} className="text-blue-400" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Forensic Entrypoint</span></div>
                   <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Diagnostic Gateway</h2>
                   <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">Step 1: Upload raw log streams to perform logical pattern extraction and causality mapping across neural segments.</p>
                 </div>
                 <FileUpload onFileSelect={processNewFile} isProcessing={state.isProcessing} ingestionProgress={state.ingestionProgress} fileName={state.stats?.fileName} />
                 {state.stats && <button onClick={() => setActiveStep('analysis')} className="mt-12 flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95">Inference Analysis <ArrowRight size={24} /></button>}
               </div>
               <div className="lg:col-span-4"><TestCenter onSimulateLargeFile={simulateStressTest} onRunPrompt={(p) => { setActiveStep('analysis'); handleSendMessage(p); }} onRunRegressive={runRegressiveSuite} isProcessing={state.isProcessing} /></div>
            </div>
          )}

          {state.activeStep === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-0 animate-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-3 space-y-6 overflow-y-auto px-6 py-8 scrollbar-hide border-r border-slate-900 bg-slate-950/30">
                  <SectionHeader icon={<Activity size={14} className="text-blue-500" />} label="Telemetry Overview" />
                  <LogTimeRange stats={state.stats} />
                  <StatsPanel stats={state.stats} />
                  <LogDistributionChart stats={state.stats} />
                  <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                  <LogTimeline stats={state.stats} />
               </div>
               <div className="lg:col-span-9 flex flex-col min-h-0 bg-[#0d0f14]">
                  <ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} onSelectModel={selectModel} onOpenSettings={() => setSettingsOpen(true)} suggestions={state.suggestions} sourceFiles={state.sourceFiles} stats={state.stats} />
               </div>
            </div>
          )}

          {state.activeStep === 'code-sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 px-6 py-8 animate-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-4 flex flex-col min-h-0"><CodeHub inferredFiles={state.stats?.inferredFiles || []} sourceFiles={state.sourceFiles} onUpload={processSourceFiles} onClear={clearSourceFiles} /></div>
               <div className="lg:col-span-8 flex flex-col items-center justify-center p-10 bg-slate-900/20 border border-slate-800/50 rounded-[2.5rem] text-center space-y-10 shadow-inner">
                  <div className="p-14 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl"><Code size={60} className="text-blue-500" /></div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Logical Bridge</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Step 2: Sync source code to allow neural mapping between raw log lines and high-fidelity code implementation.</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setActiveStep('analysis')} className="px-10 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest border border-slate-700/50 hover:text-white transition-all">Back to Telemetry</button>
                    {state.sourceFiles.length > 0 && <button onClick={() => setActiveStep('knowledge')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all">Proceed to Step 3</button>}
                  </div>
               </div>
            </div>
          )}

          {state.activeStep === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 px-6 py-8 animate-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-4 flex flex-col min-h-0"><KnowledgeHub knowledgeFiles={state.knowledgeFiles} onUpload={processKnowledgeFiles} onClear={clearKnowledgeFiles} isProcessing={state.isProcessing} /></div>
               <div className="lg:col-span-8 flex flex-col items-center justify-center p-10 bg-emerald-900/5 border border-emerald-800/20 rounded-[2.5rem] text-center space-y-10 shadow-inner">
                  <div className="p-14 bg-emerald-900/10 rounded-[3rem] border border-emerald-800/30 shadow-2xl"><Book size={60} className="text-emerald-500" /></div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Forensic Enrichment</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Step 3: Index project documentation and runbooks to prioritize pattern-matched remediation protocols.</p>
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
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Debug Sequence</h4>
                    <div className="h-4 w-px bg-slate-800" />
                    <div className="flex items-center gap-2">
                       <Sidebar size={14} className="text-slate-600" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Context: {state.sourceFiles.length} Code Nodes</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsFileTreeOpen(!isFileTreeOpen)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${isFileTreeOpen ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                    >
                      {isFileTreeOpen ? 'Hide Files' : 'Show Files'}
                    </button>
                  </div>
               </div>

               <div className="flex-1 flex min-h-0">
                  {/* File Tree Sidebar */}
                  {isFileTreeOpen && (
                    <div className="w-64 shrink-0 bg-[#0d0f14] border-r border-slate-800/40 flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-left duration-300">
                      <div className="p-4 border-b border-slate-800/40 shrink-0 bg-slate-900/20">
                        <div className="relative">
                          <input type="text" placeholder="Filter Files..." className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 outline-none focus:border-blue-500/50 transition-all" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
                        <FileTree 
                          files={state.sourceFiles} 
                          onSelectFile={(path) => setSelectedFilePath(path)} 
                          selectedPath={state.selectedFilePath} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Split View: Chat & Code */}
                  <div className="flex-1 flex min-h-0">
                    {/* Chat Panel - Integrated ChatGPT Experience */}
                    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-hidden">
                       <ChatWindow 
                        messages={state.messages} 
                        onSendMessage={handleSendMessage} 
                        isProcessing={state.isProcessing} 
                        selectedModel={state.selectedModelId} 
                        onSelectModel={selectModel} 
                        onOpenSettings={() => setSettingsOpen(true)} 
                        suggestions={["Perform cross-chunk causation audit", "Audit logic for concurrency leaks", "Generate remediation patch (Step 5)"]} 
                        sourceFiles={state.sourceFiles} 
                        stats={state.stats} 
                      />
                    </div>

                    {/* Code Panel */}
                    <div className="hidden xl:flex flex-col w-[300px] shrink-0 min-h-0 bg-[#0d0f14] border-l border-slate-800/40 p-4 space-y-6 overflow-y-auto scrollbar-hide">
                       <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
                       <div className="h-px bg-slate-800/40" />
                       {selectedFile ? (
                         <div className="flex-1 min-h-0 animate-in fade-in duration-300">
                           <CodeViewer 
                            file={selectedFile} 
                            selectedLine={state.selectedLocation?.line} 
                           />
                         </div>
                       ) : (
                         <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4 opacity-30">
                            <Code size={30} className="text-slate-600" />
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Context Node Selected</h4>
                              <p className="text-[9px] text-slate-600 max-w-[150px] mx-auto font-medium italic">Select a file from the explorer to visualize logic.</p>
                            </div>
                         </div>
                       )}
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
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Engine Secured</span>
           </div>
           {state.stats && (
             <div className="hidden sm:flex items-center gap-6">
               <StatusItem label="Trace Nodes" value={state.stats.chunkCount} />
               <StatusItem label="Logic Points" value={state.sourceFiles.length} />
               <StatusItem label="Latency" value={`${Math.max(0, ...state.metrics.queryLatency, 0).toFixed(0)}ms`} />
             </div>
           )}
         </div>
         <button onClick={() => confirm("Execute full engine sanitation?") && clearSession()} className="px-3 py-1 bg-slate-900/50 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 hover:border-red-500/30 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Sanitize Session</button>
      </footer>
      
      {state.testReport && <TestReportModal report={state.testReport} onClose={clearTestReport} />}
      {state.regressiveReport && <RegressiveReportModal report={state.regressiveReport} onClose={clearRegressiveReport} isProcessing={state.isProcessing} />}
      <IntelligenceHub isOpen={state.isSettingsOpen} onClose={() => setSettingsOpen(false)} selectedModelId={state.selectedModelId} onSelectModel={selectModel} onClearSession={clearSession} />
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
