
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { StatsPanel } from './components/StatsPanel';
import { ChatWindow } from './components/ChatWindow';
import { LogTimeline } from './components/LogTimeline';
import { LogTimeRange } from './components/LogTimeRange';
import { IntelligenceHub } from './components/IntelligenceHub';
import { CodeHub } from './components/CodeHub';
import { GeminiService } from './services/geminiService';
import { PipelineStep, ChatMessage } from './types';
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Info, Zap, Sparkles, Database, LayoutPanelLeft } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    processNewFile,
    processSourceFiles,
    clearSourceFiles,
    addMessage, 
    updateLastMessageChunk, 
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
  } = useLogStore();

  const gemini = useMemo(() => new GeminiService(), []);

  // Auto-generate suggestions when logs are parsed
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

  const handleSendMessage = useCallback(async (query: string) => {
    if (state.isProcessing || (!state.chunks.length && !state.stats)) return;

    const queryStart = performance.now();
    addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });

    const botMsgId = (Date.now() + 1).toString();
    addMessage({ id: botMsgId, role: 'assistant', content: '', timestamp: new Date(), isLoading: true });

    try {
      const streamResult = gemini.analyzeLogsStream(
        state.chunks, 
        state.searchIndex,
        state.sourceFiles,
        query, 
        state.selectedModelId, 
        state.messages
      );

      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') {
          setLastMessageSources(chunk.data);
        } else if (chunk.type === 'text') {
          updateLastMessageChunk(chunk.data);
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
      updateLastMessageError(`Diagnostic Engine Failure: ${error.message}`);
      recordQueryMetric(performance.now() - queryStart, true);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.sourceFiles, state.messages, state.selectedModelId]);

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement; desc: string }[] = [
    { id: 'ingestion', label: 'Ingestion', icon: <CloudUpload size={16} />, desc: 'Upload raw log streams' },
    { id: 'analysis', label: 'Analysis', icon: <Activity size={16} />, desc: 'AI-driven log diagnostics' },
    { id: 'code-sync', label: 'Code Sync', icon: <Code size={16} />, desc: 'Connect source context' },
    { id: 'debug', label: 'Deep Debug', icon: <ShieldAlert size={16} />, desc: 'Root cause analysis' }
  ];

  const currentStepIdx = PIPELINE_STEPS.findIndex(s => s.id === state.activeStep);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-blue-600/30 font-sans">
      {/* Dynamic Master Header */}
      <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-black text-white tracking-tighter uppercase italic">CloudLog <span className="text-blue-500">AI</span></h1>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Pipeline Active</span>
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 mx-2 hidden lg:block" />

          {/* New Interactive Pipeline Stepper */}
          <nav className="hidden lg:flex items-center gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const isActive = state.activeStep === step.id;
              const isPast = currentStepIdx > idx;
              const isAvailable = !!state.stats || idx === 0;
              return (
                <React.Fragment key={step.id}>
                  <button 
                    onClick={() => isAvailable && setActiveStep(step.id)}
                    disabled={!isAvailable}
                    className={`group relative flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-300
                      ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : isPast ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-600 cursor-not-allowed opacity-50'}
                    `}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                      {isPast ? <CheckCircle2 size={14} className="text-emerald-400" /> : React.cloneElement(step.icon as React.ReactElement<any>, { size: 14 })}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-[10px] font-black uppercase tracking-widest">{step.label}</p>
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                  </button>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ChevronRight size={14} className={`${isPast ? 'text-emerald-800' : 'text-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSettingsOpen(true)} 
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all flex items-center gap-2 group"
          >
            <Settings size={18} className="group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Orchestration</span>
          </button>
        </div>
      </header>

      {/* Main Workflow Viewport */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 md:p-10 flex flex-col min-h-0 overflow-hidden">
        
        {/* Step-specific Guidance Banner */}
        {state.stats && state.activeStep !== 'ingestion' && (
          <div className="mb-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-4">
               <div className="p-2 bg-blue-600/20 rounded-lg">
                 <Info size={16} className="text-blue-400" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Workflow Target: {PIPELINE_STEPS.find(s => s.id === state.activeStep)?.label}</h4>
                  <p className="text-xs text-slate-400 font-medium">{PIPELINE_STEPS.find(s => s.id === state.activeStep)?.desc}</p>
               </div>
             </div>
             {currentStepIdx < 3 && (
               <button 
                onClick={() => setActiveStep(PIPELINE_STEPS[currentStepIdx + 1].id)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
               >
                 Advance to Next Phase <ArrowRight size={14} />
               </button>
             )}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {/* Step 1: Ingestion */}
          {state.activeStep === 'ingestion' && (
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-700">
               <div className="text-center mb-12 space-y-4">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
                   <Zap size={14} className="text-blue-400" />
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Start Pipeline Here</span>
                 </div>
                 <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Initialize Diagnosis</h2>
                 <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">Upload your raw server logs, cloud traces, or debug outputs to begin the RAG-powered forensic analysis sequence.</p>
               </div>
               
               <div className="w-full max-w-2xl">
                 <FileUpload 
                  onFileSelect={processNewFile} 
                  isProcessing={state.isProcessing}
                  ingestionProgress={state.ingestionProgress}
                  fileName={state.stats?.fileName}
                />
               </div>

              {state.stats && (
                <div className="mt-12 flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
                   <div className="flex items-center gap-8 mb-8">
                      <DiagnosticHealthCard label="Logs Parsed" value={state.stats.totalEntries.toLocaleString()} icon={<Database size={16}/>} />
                      <DiagnosticHealthCard label="Time Range" value={state.stats.timeRange.start?.toLocaleTimeString() || "None"} icon={<Activity size={16}/>} />
                   </div>
                   <button 
                    onClick={() => setActiveStep('analysis')}
                    className="flex items-center gap-4 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Confirm & Start Analysis <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Diagnostics / Analysis */}
          {state.activeStep === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-4 xl:col-span-3 space-y-6 overflow-y-auto pr-4 scrollbar-hide pb-20 border-r border-slate-900">
                  <SectionHeader icon={<Activity size={14} className="text-blue-500" />} label="Diagnostic Telemetry" />
                  <LogTimeRange stats={state.stats} />
                  <StatsPanel stats={state.stats} />
                  <LogTimeline stats={state.stats} />
                  <div className="sticky bottom-0 pt-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <button 
                      onClick={() => setActiveStep('code-sync')}
                      className="w-full py-4 bg-slate-800/80 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      <Code size={18} /> Enhance Context
                    </button>
                  </div>
               </div>
               <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0">
                  <ChatWindow 
                    messages={state.messages} 
                    onSendMessage={handleSendMessage}
                    isProcessing={state.isProcessing || state.isGeneratingSuggestions}
                    selectedModel={state.selectedModelId}
                    onSelectModel={selectModel}
                    onOpenSettings={() => setSettingsOpen(true)}
                    suggestions={state.suggestions}
                    sourceFiles={state.sourceFiles}
                  />
               </div>
            </div>
          )}

          {/* Step 3: Code Sync */}
          {state.activeStep === 'code-sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full min-h-0 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0">
                  <CodeHub 
                    inferredFiles={state.stats?.inferredFiles || []} 
                    sourceFiles={state.sourceFiles} 
                    onUpload={processSourceFiles}
                    onClear={clearSourceFiles}
                  />
               </div>
               <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center p-10 bg-slate-900/20 border border-slate-800/50 rounded-[3rem] text-center space-y-10 shadow-inner">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />
                    <div className="relative p-10 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                       <Code size={64} className="text-blue-500" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-xl">
                      <Sparkles size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="max-w-2xl space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Bridge the Logic Gap</h2>
                    <p className="text-slate-400 leading-relaxed font-medium text-lg">
                      Log analysis is most powerful when matched with source code. 
                      By syncing your files, the AI can pinpoint the <span className="text-blue-400 font-bold underline decoration-blue-500/30">exact line</span> where a failure occurred and propose a verifiable fix.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveStep('analysis')}
                      className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700/50"
                    >
                      Return to Logs
                    </button>
                    {state.sourceFiles.length > 0 && (
                      <button 
                        onClick={() => setActiveStep('debug')}
                        className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/30 group"
                      >
                        Start Deep Debugging <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* Step 4: Deep Debug */}
          {state.activeStep === 'debug' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-700">
               <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400" />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Debug Mode: Augmented Reasoning</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Source Context: {state.sourceFiles.length} files synced
                  </div>
               </div>
               <div className="flex-1 min-h-0 bg-[#0c1220] rounded-[3rem] border border-slate-800/60 shadow-inner overflow-hidden">
                  <ChatWindow 
                    messages={state.messages} 
                    onSendMessage={handleSendMessage}
                    isProcessing={state.isProcessing || state.isGeneratingSuggestions}
                    selectedModel={state.selectedModelId}
                    onSelectModel={selectModel}
                    onOpenSettings={() => setSettingsOpen(true)}
                    suggestions={[
                      "Perform root cause analysis on the primary error spike",
                      "Which line of code is responsible for this stack trace?",
                      "Provide a secure code fix for the identified vulnerability",
                      "Explain the state of the app when this log was generated"
                    ]}
                    sourceFiles={state.sourceFiles}
                  />
               </div>
            </div>
          )}
        </div>
      </main>

      <IntelligenceHub isOpen={state.isSettingsOpen} onClose={() => setSettingsOpen(false)} selectedModelId={state.selectedModelId} onSelectModel={selectModel} onManageKeys={() => {}} onClearSession={clearSession} />
      
      {/* Global Persistence Status */}
      <footer className="bg-slate-950/80 backdrop-blur-md border-t border-slate-900/60 px-8 py-3 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Diagnostic Session Live</span>
           </div>
           {state.stats && (
             <div className="hidden sm:flex items-center gap-6">
                <StatusItem label="Index" value={`${state.stats.chunkCount} Segments`} />
                <StatusItem label="Context" value={`${state.sourceFiles.length} Nodes`} />
                {/* Use current selected model label dynamically */}
                <StatusItem label="Model" value={state.selectedModelId.split('-').slice(0, 3).join(' ')} />
             </div>
           )}
         </div>

         <div className="flex items-center gap-4">
           {state.activeStep !== 'ingestion' && (
             <button 
              onClick={() => {
                if(confirm("Wipe all session data and return to ingestion?")) clearSession();
              }}
              className="px-4 py-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-600 hover:text-red-500 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
             >
               Purge Data
             </button>
           )}
         </div>
      </footer>
    </div>
  );
};

const SectionHeader = ({ icon, label }: any) => (
  <div className="flex items-center gap-2 mb-4 px-1">
    {icon}
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</h3>
  </div>
);

const DiagnosticHealthCard = ({ label, value, icon }: any) => (
  <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl flex flex-col items-start gap-2 min-w-[160px] shadow-xl">
    <div className="text-blue-400 opacity-60">{icon}</div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</p>
    <p className="text-xl font-black text-white italic tracking-tighter">{value}</p>
  </div>
);

const StatusItem = ({ label, value }: any) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{label}:</span>
    <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-tight">{value}</span>
  </div>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all
      ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}
    `}
  >
    {icon}
    <span className="hidden xs:inline">{label}</span>
  </button>
);

export default App;
