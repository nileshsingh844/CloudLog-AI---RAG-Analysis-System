
// @google/genai guidelines followed: models used are gemini-3-flash-preview and gemini-3-pro-preview.
import React, { useMemo, useCallback, useEffect } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { StatsPanel } from './components/StatsPanel';
import { ChatWindow } from './components/ChatWindow';
import { LogTimeline } from './components/LogTimeline';
import { LogTimeRange } from './components/LogTimeRange';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { IntelligenceHub } from './components/IntelligenceHub';
import { TestCenter } from './components/TestCenter';
import { TestReportModal } from './components/TestReportModal';
import { RegressiveReportModal } from './components/RegressiveReportModal';
import { GeminiService } from './services/geminiService';
import { Terminal, Database, Activity, Settings, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    processNewFile, 
    simulateStressTest,
    runRegressiveSuite,
    clearTestReport,
    clearRegressiveReport,
    addMessage, 
    updateLastMessageChunk, 
    setLastMessageSources, 
    finishLastMessage, 
    updateLastMessageError, 
    recordQueryMetric,
    setViewMode,
    selectModel,
    setSettingsOpen,
    openKeyManager,
    setSuggestions,
    setGeneratingSuggestions
  } = useLogStore();

  const gemini = useMemo(() => {
    return new GeminiService();
  }, []);

  // Intelligent Prompt Generation Trigger
  useEffect(() => {
    if (state.stats && state.chunks.length > 0 && state.suggestions.length === 0 && !state.isProcessing && !state.isGeneratingSuggestions) {
      setGeneratingSuggestions(true);
      gemini.getDiscoveryPrompts(state.stats, state.chunks)
        .then((s) => {
          setSuggestions(s);
          setGeneratingSuggestions(false);
        })
        .catch(() => {
          setGeneratingSuggestions(false);
        });
    }
  }, [state.stats, state.chunks, state.isProcessing, state.isGeneratingSuggestions, gemini, setSuggestions, setGeneratingSuggestions, state.suggestions.length]);

  const handleSendMessage = useCallback(async (query: string) => {
    if (state.isProcessing || (!state.chunks.length && !state.stats)) return;

    const queryStart = performance.now();
    const currentHistory = [...state.messages];

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    });

    const botMsgId = (Date.now() + 1).toString();
    addMessage({
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    });

    let isRateLimited = false;

    try {
      const streamResult = gemini.analyzeLogsStream(
        state.chunks, 
        state.searchIndex,
        query, 
        state.selectedModelId, 
        currentHistory
      );

      for await (const chunk of streamResult) {
        if (chunk.type === 'sources') {
          setLastMessageSources(chunk.data as string[]);
        } else if (chunk.type === 'text') {
          updateLastMessageChunk(chunk.data as string);
        } else if (chunk.type === 'status') {
          updateLastMessageError(chunk.data as string);
          if (chunk.data.includes('Rate limited')) isRateLimited = true;
        }
      }

      finishLastMessage();
      recordQueryMetric(performance.now() - queryStart, false, isRateLimited);
    } catch (error: any) {
      updateLastMessageError(`Critical System Failure: ${error.message}`);
      recordQueryMetric(performance.now() - queryStart, true, false);
    }
  }, [gemini, state.isProcessing, state.chunks, state.searchIndex, state.messages, state.selectedModelId, addMessage, updateLastMessageChunk, setLastMessageSources, finishLastMessage, updateLastMessageError, recordQueryMetric, state.stats]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="w-8 h-8 sm:w-10 h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Terminal className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">CloudLog <span className="text-blue-500">AI</span></h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Diagnostic Persistence: Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5 sm:p-1 border border-slate-700">
            <button 
              onClick={() => setViewMode('diagnostic')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase transition-all
                ${state.viewMode === 'diagnostic' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
              `}
            >
              <Activity size={10} className="sm:w-[12px] sm:h-[12px]" />
              <span className="hidden xs:inline">Diagnostic</span>
              <span className="xs:hidden">Diag</span>
            </button>
            <button 
              onClick={() => setViewMode('operator')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase transition-all
                ${state.viewMode === 'operator' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
              `}
            >
              <LayoutDashboard size={10} className="sm:w-[12px] sm:h-[12px]" />
              <span className="hidden xs:inline">Operator</span>
              <span className="xs:hidden">Ops</span>
            </button>
          </div>

          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all flex items-center gap-2 sm:px-3"
          >
            <Settings size={14} />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Hub</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {state.viewMode === 'operator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <MonitoringDashboard metrics={state.metrics} isProcessing={state.isProcessing} />
            </div>
            <div className="lg:col-span-4">
              <TestCenter 
                onSimulateLargeFile={simulateStressTest}
                onRunPrompt={handleSendMessage}
                onRunRegressive={runRegressiveSuite}
                isProcessing={state.isProcessing}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6">
              <section>
                <h2 className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 sm:mb-4">Ingestion Engine</h2>
                <FileUpload 
                  onFileSelect={processNewFile} 
                  isProcessing={state.isProcessing}
                  ingestionProgress={state.ingestionProgress}
                  fileName={state.stats?.fileName}
                />
              </section>

              <section className="space-y-4 sm:space-y-6">
                 <h2 className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Diagnostic Telemetry</h2>
                 {state.stats ? (
                   <div className="space-y-4 sm:space-y-6">
                     <LogTimeRange stats={state.stats} />
                     <StatsPanel stats={state.stats} />
                     <LogTimeline stats={state.stats} />
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center p-6 sm:p-12 border-2 border-slate-800 rounded-xl sm:rounded-2xl bg-slate-800/20 text-center opacity-40">
                     <Database className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                     <p className="text-slate-400 font-medium text-sm sm:text-base">No Session Active</p>
                   </div>
                 )}
              </section>
            </div>

            <div className="lg:col-span-7 xl:col-span-8 h-[500px] sm:h-[600px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
               <ChatWindow 
                  messages={state.messages} 
                  onSendMessage={handleSendMessage}
                  isProcessing={state.isProcessing || state.isGeneratingSuggestions}
                  selectedModel={state.selectedModelId}
                  onSelectModel={selectModel}
                  onOpenSettings={() => setSettingsOpen(true)}
                  suggestions={state.suggestions}
               />
            </div>
          </div>
        )}
      </main>

      {state.testReport && (
        <TestReportModal 
          report={state.testReport} 
          onClose={clearTestReport} 
        />
      )}

      {state.regressiveReport && (
        <RegressiveReportModal 
          report={state.regressiveReport}
          onClose={clearRegressiveReport}
          isProcessing={state.isProcessing}
        />
      )}

      <IntelligenceHub 
        isOpen={state.isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedModelId={state.selectedModelId}
        onSelectModel={selectModel}
        onManageKeys={openKeyManager}
      />

      <footer className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
         <div className="flex gap-4 sm:gap-8 items-center">
           <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest">v2.7.0-MULTI</span>
           <span className="hidden md:inline text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Local-First Persistence</span>
           <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest">Dynamic Key: Ready</span>
         </div>
         <div className="text-[7px] sm:text-[9px] font-bold uppercase tracking-widest opacity-50 ml-4">
           Edge Compute Verified
         </div>
      </footer>
    </div>
  );
};

export default App;
