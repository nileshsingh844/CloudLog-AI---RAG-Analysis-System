
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useLogStore, AVAILABLE_MODELS } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { ChatWindow } from './components/ChatWindow';
import { StatsPanel } from './components/StatsPanel';
import { PipelineTestRunner } from './components/PipelineTestRunner';
import { GeminiService } from './services/geminiService';
import { 
  Terminal, 
  Settings, 
  PlusCircle, 
  Cpu, 
  Activity, 
  LayoutGrid, 
  Users, 
  ShieldCheck,
  RotateCcw,
  RefreshCcw,
  PanelLeft,
  PanelRight,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { IntelligenceHub } from './components/IntelligenceHub';
import { CodeHub } from './components/CodeHub';
import { SmartFeatures } from './components/SmartFeatures';
import { IndustryHub } from './components/IndustryHub';
import { ForensicEvidencePanel } from './components/ForensicEvidencePanel';
import { DiagnosticRoadmap } from './components/DiagnosticRoadmap';
import { WarRoom } from './components/WarRoom';
import { ProactiveDashboard } from './components/ProactiveDashboard';

const gemini = new GeminiService();

const RebootOverlay = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const sequence = [
    "[System] TRAP: Received SRE restart signal",
    "[Go-Sentinel] Sending SIGTERM to 4 worker nodes...",
    "[Python-RAG] Flushing local vector index (In-Memory)...",
    "[C++ Accelerator] Releasing CUDA memory buffers...",
    "[System] Purging browser LocalStorage session...",
    "[System] Finalizing forensic signal synchronization...",
    "[System] ALL SYSTEMS OFFLINE. COLD BOOT INITIATED."
  ];

  useEffect(() => {
    sequence.forEach((line, i) => {
      setTimeout(() => setLogs(prev => [...prev, line]), i * 200); 
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-8 font-mono select-none">
       <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent animate-pulse" />
       </div>
       
       <div className="w-full max-w-2xl space-y-8 relative z-10">
          <div className="flex items-center gap-4 mb-12">
             <div className="p-3 bg-red-600/20 rounded-2xl border border-red-500/40">
                <RefreshCcw className="w-8 h-8 text-red-500 animate-spin" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Engineering Node Reboot</h2>
                <p className="text-xs text-red-500/60 font-black uppercase tracking-[0.4em]">Logic Level: RECYCLING</p>
             </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 min-h-[300px] flex flex-col gap-2 overflow-hidden shadow-2xl relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-red-600/20 animate-[scan_2s_linear_infinite]" />
             {logs.map((log, i) => (
               <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-800 select-none">[{new Date().toLocaleTimeString()}]</span>
                  <span className={log.includes('OFFLINE') ? 'text-red-500 font-bold' : 'text-blue-400/80'}>{log}</span>
               </div>
             ))}
          </div>

          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-[grow_1.5s_ease-in-out_forwards]" style={{ width: '0%' }} />
          </div>
       </div>

       <style>{`
          @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(300px); } }
          @keyframes grow { from { width: 0%; } to { width: 100%; } }
       `}</style>
    </div>
  );
};

export default function App() {
  const {
    state,
    isRestarting,
    setIndustry,
    processNewFile,
    resetApp,
    addMessage,
    stopAnalysis,
    addComment,
    setInvestigationStatus,
    finishLastMessage,
    replaceLastMessageContent,
    setLastMessageStructuredReport,
    setAnalysisPhase,
    prepareAnalysis,
    setIsProcessing,
    setSelectedModelId,
    setActiveStep,
    setWorkflowStatus,
    addHypothesis,
    updateHypothesisStatus,
    addAction
  } = useLogStore();

  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const [contextDepth, setContextDepth] = useState(70);
  const [activeView, setActiveView] = useState<'chat' | 'industry' | 'proactive' | 'war-room'>('chat');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasAutoPromptedRef = useRef(false);

  // Memoize latest structured analysis for global components
  const latestAnalysis = useMemo(() => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].structuredReport) return state.messages[i].structuredReport;
    }
    return undefined;
  }, [state.messages]);

  const goHome = useCallback(() => {
    setActiveStep('ingestion');
    setActiveView('chat');
    setIsDemoMode(false);
    hasAutoPromptedRef.current = false;
  }, [setActiveStep]);

  useEffect(() => {
    if (state.stats && state.messages.length === 0 && !state.isProcessing && state.activeStep === 'analysis') {
       startDiscovery();
    }
  }, [state.stats, state.activeStep, state.messages.length, state.isProcessing]);

  const startDiscovery = async () => {
    if (!state.stats) return;
    setIsProcessing(true);
    setAnalysisPhase('DETECTING');
    setWorkflowStatus('discovery', 'active');
    setWorkflowStatus('summary', 'active');

    addMessage({
      id: `audit-${Date.now()}`,
      role: 'assistant',
      content: 'Running Global Forensic Audit...',
      timestamp: new Date(),
      isLoading: true,
      analysisPhase: 'DETECTING'
    });

    let currentSuggestions: string[] = [];
    try {
      const stream = gemini.analyzeGlobalAuditStream(state.stats, state.discoverySignatures, state.userRole, state.industry);
      for await (const chunk of stream) {
        if (chunk.type === 'text') replaceLastMessageContent(chunk.data);
        if (chunk.type === 'suggestions') {
          currentSuggestions = chunk.data;
          setSuggestions(chunk.data);
        }
      }
      setWorkflowStatus('discovery', 'completed');
      setWorkflowStatus('summary', 'completed');

      const hasCritical = state.stats.severities.FATAL > 0 || state.stats.severities.ERROR > 0;
      if (hasCritical && currentSuggestions.length > 0 && !hasAutoPromptedRef.current) {
        hasAutoPromptedRef.current = true;
        const autoQuery = currentSuggestions.find(s => s.toLowerCase().includes('critical') || s.toLowerCase().includes('fail')) || currentSuggestions[0];
        setTimeout(() => handleSendMessage(autoQuery), 100);
      }
    } catch (e) {
      replaceLastMessageContent("Forensic node online. Patterns indexed for manual inquiry.");
      setSuggestions(['Analyze Critical Failures', 'Summarize Security Risks']);
    } finally {
      finishLastMessage();
    }
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || state.isProcessing) return;
    const signal = prepareAnalysis();
    addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Initializing Forensic Engine...',
      timestamp: new Date(),
      isLoading: true,
      analysisPhase: 'PARSING'
    });
    setIsProcessing(true);
    setWorkflowStatus('rootCause', 'active');

    try {
      const stream = gemini.analyzeLogsStream(state.chunks, query, state.selectedModelId, state.stats, state.userRole, state.industry, state.discoverySignatures, signal);
      for await (const chunk of stream) {
        if (chunk.type === 'phase') {
          setAnalysisPhase(chunk.data);
        } else if (chunk.type === 'text') {
          replaceLastMessageContent(chunk.data);
        } else if (chunk.type === 'structured_report') {
          setLastMessageStructuredReport(chunk.data);
          
          // Auto-propagate finding to War Room
          const ir = chunk.data.incident_report;
          if (ir && ir.root_cause_analysis?.primary_failure) {
            addHypothesis(`CONFIRMED: ${ir.root_cause_analysis.primary_failure} - ${ir.root_cause_analysis.description}`);
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      replaceLastMessageContent("Forensic synthesis interrupted: " + e.message);
    } finally {
      finishLastMessage();
    }
  };

  const handleTryDemo = async () => {
    setIsDemoMode(true);
    hasAutoPromptedRef.current = false;
    try {
      // Use raw sample from demo log if fetch fails or use a fallback
      const demoLogs = `2026-05-20T10:00:00.001Z [FATAL] java.lang.OutOfMemoryError: GC overhead limit exceeded at com.cloudlog.orders.Processor.bufferTransaction(Processor.java:142)`;
      const blob = new Blob([demoLogs], { type: 'text/plain' });
      const file = new File([blob], 'demo.log', { type: 'text/plain' });
      processNewFile([file]);
    } catch (err) {
      console.error("Failed to load demo log:", err);
    }
  };

  if (isRestarting) return <RebootOverlay />;

  if (!state.stats || state.activeStep === 'ingestion') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-500/30 overflow-hidden relative">
        <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 sm:px-12 bg-[#020617]/50 backdrop-blur-3xl z-50 border-b border-white/[0.03]">
          <div className="flex items-center gap-4 cursor-pointer" onClick={goHome}>
             <div className="p-1.5 bg-blue-600 rounded-lg">
               <Terminal size={18} className="text-white" />
             </div>
             <h1 className="text-sm font-black tracking-tighter uppercase">CloudLog AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetApp} title="System Restart" className="p-2 text-slate-500 hover:text-red-400 transition-all"><RefreshCcw size={16} /></button>
          </div>
        </header>

        <div className="w-full max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center space-y-6">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 rounded-full border border-blue-500/20 text-blue-400">
               <ShieldCheck size={12} />
               <span className="text-[9px] font-black uppercase tracking-widest">Neural Pipeline v3.1</span>
             </div>
             <h2 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter leading-tight uppercase">
               Analyze traces <br/><span className="text-blue-600">at logic speed.</span>
             </h2>
          </div>

          <FileUpload 
            onFileSelect={processNewFile} 
            isProcessing={state.isProcessing} 
            ingestionProgress={state.ingestionProgress} 
            onTryDemo={handleTryDemo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden selection:bg-blue-500/30">
      <header className="h-14 flex items-center justify-between px-4 bg-[#020617] border-b border-white/[0.03] z-50 shrink-0">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={goHome}>
             <Terminal size={16} className="text-blue-500" />
             <span className="text-xs font-black italic uppercase tracking-tighter hidden sm:inline">CloudLog AI</span>
          </div>
          <button className="lg:hidden p-2 text-slate-400" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <nav className="hidden lg:flex items-center gap-1">
             <NavBtn active={activeView === 'chat'} onClick={() => setActiveView('chat')} label="Forensics" icon={<Cpu size={14} />} />
             <NavBtn active={activeView === 'industry'} onClick={() => setActiveView('industry')} label="Sectors" icon={<LayoutGrid size={14} />} />
             <NavBtn active={activeView === 'proactive'} onClick={() => setActiveView('proactive')} label="Sentinel" icon={<Activity size={14} />} />
             <NavBtn active={activeView === 'war-room'} onClick={() => setActiveView('war-room')} label="War Room" icon={<Users size={14} />} />
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} className={`p-2 rounded-lg transition-colors hidden xl:block ${showLeftSidebar ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:bg-white/5'}`}>
             <PanelLeft size={18} />
           </button>
           <button onClick={goHome} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
              <PlusCircle size={14} /> <span className="hidden sm:inline">New investigation</span>
           </button>
           <button onClick={() => setShowRightSidebar(!showRightSidebar)} className={`p-2 rounded-lg transition-colors hidden 2xl:block ${showRightSidebar ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:bg-white/5'}`}>
             <PanelRight size={18} />
           </button>
           <button onClick={() => setIsIntelligenceOpen(true)} className="p-2 text-slate-400 hover:text-white transition-all">
             <Settings size={18} />
           </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-950 border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0 ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}>
          <div className="h-full flex flex-col overflow-y-auto scrollbar-hide p-4 space-y-8 pb-20">
            <button onClick={resetApp} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-red-950/40 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-all group">
              <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
              Restart diagnostic node
            </button>
            <StatsPanel stats={state.stats} />
            <SmartFeatures onAction={handleSendMessage} isProcessing={state.isProcessing} hasStats={!!state.stats} />
            <CodeHub inferredFiles={state.stats?.inferredFiles || []} sourceFiles={state.sourceFiles} onUpload={() => {}} onClear={() => {}} />
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative overflow-hidden">
          {activeView === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <DiagnosticRoadmap workflow={state.workflow} />
              <div className="flex-1 min-h-0">
                 <ChatWindow messages={state.messages} onSendMessage={handleSendMessage} isProcessing={state.isProcessing} selectedModel={state.selectedModelId} suggestions={suggestions} sourceFiles={state.sourceFiles} stats={state.stats} allChunks={state.chunks} teamMembers={state.teamMembers} comments={state.comments} status={state.investigationStatus} onAddComment={addComment} onStatusChange={setInvestigationStatus} onStop={stopAnalysis} onNavigateHome={goHome} />
              </div>
            </div>
          )}
          {activeView === 'industry' && <div className="flex-1 overflow-y-auto scrollbar-hide"><IndustryHub currentIndustry={state.industry} onSelectIndustry={setIndustry} stats={state.stats} onBack={() => setActiveView('chat')} /></div>}
          {activeView === 'proactive' && <div className="flex-1 overflow-y-auto scrollbar-hide"><ProactiveDashboard anomalies={state.anomalies} trends={state.trends} onBack={() => setActiveView('chat')} /></div>}
          {activeView === 'war-room' && <div className="flex-1 overflow-y-auto scrollbar-hide"><WarRoom hypotheses={state.hypotheses} actions={state.warRoomActions} userRole={state.userRole} analysis={latestAnalysis} onAddHypothesis={addHypothesis} onUpdateStatus={updateHypothesisStatus} onAddAction={addAction} onBack={() => setActiveView('chat')} /></div>}
        </main>

        <aside className={`fixed inset-y-0 right-0 z-40 w-96 bg-slate-950/80 backdrop-blur-3xl border-l border-white/5 transition-transform duration-300 xl:relative xl:translate-x-0 ${showRightSidebar ? 'translate-x-0' : 'translate-x-full xl:hidden'}`}>
          <div className="h-full overflow-hidden flex flex-col">
             <div className="p-4 border-b border-white/5 flex items-center justify-between lg:hidden shrink-0">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidence Panel</h3>
               <button onClick={() => setShowRightSidebar(false)} className="p-1 text-slate-500 hover:text-white"><X size={16} /></button>
             </div>
             <ForensicEvidencePanel stats={state.stats} logs={state.logs} activeSignature={null} allSignatures={state.discoverySignatures} />
          </div>
        </aside>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-2xl lg:hidden animate-in fade-in duration-300">
           <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
                   <Terminal size={20} className="text-blue-500" />
                   <span className="text-sm font-black italic uppercase tracking-tighter">CloudLog AI</span>
                 </div>
                 <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
              </div>
              <nav className="flex flex-col gap-6">
                 <MobileNavBtn active={activeView === 'chat'} onClick={() => { setActiveView('chat'); setMobileMenuOpen(false); }} label="Forensics" icon={<Cpu size={20} />} />
                 <MobileNavBtn active={activeView === 'industry'} onClick={() => { setActiveView('industry'); setMobileMenuOpen(false); }} label="Sectors" icon={<LayoutGrid size={20} />} />
                 <MobileNavBtn active={activeView === 'proactive'} onClick={() => { setActiveView('proactive'); setMobileMenuOpen(false); }} label="Sentinel" icon={<Activity size={20} />} />
                 <MobileNavBtn active={activeView === 'war-room'} onClick={() => { setActiveView('war-room'); setMobileMenuOpen(false); }} label="War Room" icon={<Users size={20} />} />
              </nav>
              <div className="mt-auto pt-8 border-t border-white/5">
                 <button onClick={resetApp} className="w-full py-4 text-red-500 font-bold uppercase text-[10px] tracking-[0.2em]">Reset Diagnostic Node</button>
              </div>
           </div>
        </div>
      )}

      <IntelligenceHub isOpen={isIntelligenceOpen} onClose={() => setIsIntelligenceOpen(false)} selectedModelId={state.selectedModelId} onSelectModel={setSelectedModelId} onClearSession={resetApp} contextDepth={contextDepth} onContextDepthChange={setContextDepth} stats={state.stats} onUploadRequest={() => {}} />
      <PipelineTestRunner />
    </div>
  );
}

const NavBtn = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{icon}{label}</button>
);

const MobileNavBtn = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white bg-slate-900 border border-white/5'}`}>{icon}{label}</button>
);
