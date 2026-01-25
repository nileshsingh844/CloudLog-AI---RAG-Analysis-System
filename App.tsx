
// @google/genai guidelines followed: Industry-specific expert logic enabled.
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useLogStore } from './store/useLogStore';
import { FileUpload } from './components/FileUpload';
import { ChatWindow } from './components/ChatWindow';
import { IntelligenceHub } from './components/IntelligenceHub';
import { WarRoom } from './components/WarRoom';
import { ProactiveDashboard } from './components/ProactiveDashboard';
import { DeploymentRiskAssessor } from './components/DeploymentRiskAssessor';
import { IntegrationHub } from './components/IntegrationHub';
import { IndustryHub } from './components/IndustryHub';
import { GeminiService } from './services/geminiService';
import { PipelineStep, Severity, UserRole, Industry } from './types';
import { Terminal, Activity, Settings, Code, CloudUpload, ShieldAlert, ArrowRight, ChevronRight, Zap, AlertTriangle, Loader2, Users2, Library, Search, MessageSquare, Waves, ShieldCheck, Boxes, Globe } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    setUserRole,
    setIndustry,
    setActiveStep,
    addHypothesis,
    updateHypothesisStatus,
    addAction,
    processNewFile,
    runDeploymentRiskCheck,
    setSettingsOpen,
    toggleSignatureSelection,
    addMessage, 
    replaceLastMessageContent,
    setLastMessageStructuredReport,
    finishLastMessage 
  } = useLogStore();

  const gemini = useMemo(() => new GeminiService(), []);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleSendMessage = useCallback(async (query: string) => {
    if (!state.stats) return;
    addMessage({ id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() });
    
    const botMsgId = (Date.now() + 1).toString();
    addMessage({ id: botMsgId, role: 'assistant', content: '...', timestamp: new Date(), isLoading: true, modelId: state.selectedModelId });

    try {
      const stream = gemini.analyzeLogsStream(
        state.chunks, 
        state.searchIndex,
        state.sourceFiles,
        state.knowledgeFiles,
        query, 
        state.selectedModelId, 
        state.messages,
        [],
        state.stats,
        state.userRole,
        state.industry
      );

      for await (const chunk of stream) {
        if (chunk.type === 'text') replaceLastMessageContent(chunk.data);
        else if (chunk.type === 'structured_report') setLastMessageStructuredReport(chunk.data);
      }
      finishLastMessage();
    } catch (e: any) {
      replaceLastMessageContent(`Fault: ${e.message}`);
      finishLastMessage();
    }
  }, [gemini, state, addMessage, replaceLastMessageContent, setLastMessageStructuredReport, finishLastMessage]);

  const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ReactElement }[] = [
    { id: 'ingestion', label: '1: Ingestion', icon: <CloudUpload size={14} /> },
    { id: 'industry', label: '2: Domain', icon: <Globe size={14} /> },
    { id: 'analysis', label: '3: Diagnosis', icon: <Activity size={14} /> },
    { id: 'proactive', label: '4: Sentinel', icon: <Waves size={14} /> },
    { id: 'integrations', label: '5: Everywhere', icon: <Boxes size={14} /> }
  ];

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
            {PIPELINE_STEPS.map((step) => (
              <button 
                key={step.id} 
                onClick={() => setActiveStep(step.id)} 
                disabled={!state.stats && step.id !== 'ingestion' && step.id !== 'integrations' && step.id !== 'industry'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all disabled:opacity-30 ${state.activeStep === step.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {step.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{step.label.split(': ')[1]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <button 
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-[10px] font-black text-slate-300 hover:text-white transition-all"
              >
                <Users2 size={14} className="text-blue-400" />
                {state.userRole}
              </button>
              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[70] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                   {['BACKEND', 'DEVOPS', 'FRONTEND', 'PRODUCT_MANAGER'].map(role => (
                     <button key={role} onClick={() => { setUserRole(role as UserRole); setIsRoleMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase transition-all ${state.userRole === role ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500 hover:bg-white/5'}`}>
                        {role}
                     </button>
                   ))}
                </div>
              )}
           </div>

           <button onClick={() => setSettingsOpen(true)} className="p-2.5 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700 hover:text-white transition-all">
             <Settings size={18} />
           </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col min-h-0 overflow-hidden">
        {state.activeStep === 'ingestion' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12">
             <div className="text-center space-y-4">
               <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">Forensic Entry</h2>
               <p className="text-slate-500 max-w-lg mx-auto italic">Ingest distributed log streams to activate expert domain synthesis.</p>
             </div>
             <div className="w-full max-w-2xl"><FileUpload onFileSelect={processNewFile} isProcessing={state.isProcessing} ingestionProgress={state.ingestionProgress} /></div>
          </div>
        )}

        {state.activeStep === 'industry' && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
             <IndustryHub currentIndustry={state.industry} onSelectIndustry={setIndustry} stats={state.stats} />
          </div>
        )}

        {state.activeStep === 'analysis' && (
          <div className="flex-1 flex flex-col min-h-0">
             <ChatWindow 
              messages={state.messages} 
              onSendMessage={handleSendMessage} 
              isProcessing={state.isProcessing} 
              selectedModel={state.selectedModelId} 
              onSelectModel={() => {}} 
              outputFormat={state.outputFormat}
              onSelectOutputFormat={() => {}}
              workflow={state.workflow}
              onOpenSettings={() => {}}
              suggestions={[]}
              sourceFiles={state.sourceFiles}
              stats={state.stats}
              allChunks={state.chunks}
              activeInvestigationId={state.activeInvestigationId}
              signatures={[]}
              onClearInvestigation={() => {}}
             />
          </div>
        )}

        {state.activeStep === 'proactive' && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
             <ProactiveDashboard anomalies={state.anomalies} trends={state.trends} />
             <div className="border-t border-slate-900/50 pt-10 pb-20">
               <DeploymentRiskAssessor onCheckRisk={runDeploymentRiskCheck} currentRisk={state.currentDeploymentRisk} />
             </div>
          </div>
        )}

        {state.activeStep === 'integrations' && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
             <IntegrationHub />
          </div>
        )}
      </main>

      <footer className="bg-[#0d0f14] border-t border-slate-900 px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{state.industry} MODULE ACTIVE</span>
         </div>
         <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1 text-blue-400"><Waves size={10}/> Sentinel: Active</span>
            <span className="flex items-center gap-1"><Boxes size={10}/> Channels: Ready</span>
         </div>
      </footer>
    </div>
  );
};

export default App;
