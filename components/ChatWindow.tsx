
// Fix: Added missing React import to resolve namespace and name errors.
import React, { useRef, memo, useCallback, useState, useEffect, useMemo } from 'react';
import { ChatMessage, ModelOption, CodeFile, ProcessingStats, LogChunk, LogSignature, Severity, OutputFormat, DiagnosticWorkflow } from '../types';
import { Bot, User, Loader2, Link as LinkIcon, Sparkles, Zap, ChevronDown, ArrowUp, Command, ExternalLink, Globe, Paperclip, Mic, ShieldCheck, ListChecks, Copy, Check, RefreshCw, X, AlertTriangle, ShieldAlert, Info, FileText, Search, Microscope, Fingerprint, Database, Eye, FileOutput, LayoutPanelLeft, Compass, ArrowRight, Activity, MousePointer2 } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PromptSuggestions } from './PromptSuggestions';
import { AVAILABLE_MODELS } from '../store/useLogStore';
import { CodeFlowTrace } from './CodeFlowTrace';
import { DebugInsightsPanel } from './DebugInsightsPanel';
import { AdvancedAnalysisPanel } from './AdvancedAnalysisPanel';
import { StructuredAnalysisRenderer } from './StructuredAnalysisRenderer';
import { DiagnosticRoadmap } from './DiagnosticRoadmap';

const QUICK_ACTIONS = [
  "Explain this error simply",
  "What changed recently?",
  "Most likely cause?",
  "How to prevent recurrence?"
];

interface ActionButtonProps {
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  disabled: boolean;
  colorClass?: string;
}

const ActionButton = memo(({ icon, label, onClick, disabled, colorClass = "bg-slate-900 border-slate-800 text-slate-400 hover:border-blue-500/40 hover:text-white" }: ActionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
  >
    {React.cloneElement(icon, { size: 14 })}
    {label}
  </button>
));

const EvidenceBaseline = memo(({ sourceIds, allChunks, confidence }: { sourceIds: string[], allChunks: LogChunk[], confidence?: number }) => {
  if (!sourceIds || sourceIds.length === 0) return null;

  const referencedChunks = sourceIds.map(id => allChunks.find(c => c.id === id)).filter(Boolean) as LogChunk[];
  if (referencedChunks.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-slate-900/50 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Fingerprint size={16} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Evidence Grounding Baseline</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Direct log nodes cited in response</p>
          </div>
        </div>
        
        {confidence !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Inference Trust</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${confidence > 80 ? 'bg-emerald-500' : confidence > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${confidence}%` }} 
                />
              </div>
              <span className="text-xs font-black text-white italic">{confidence}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {referencedChunks.slice(0, 5).map((chunk, idx) => (
          <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 group hover:border-blue-500/30 transition-all relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye size={12} className="text-blue-400" />
             </div>
             <div className="flex items-center gap-3 mb-2">
                <div className="px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20 text-[8px] font-black text-blue-400 font-mono">
                  EVENT_ID: {chunk.id}
                </div>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                  {chunk.timeRange.start?.toLocaleTimeString() || 'N/A'}
                </span>
             </div>
             <div className="text-[11px] font-mono text-slate-400 line-clamp-2 leading-relaxed break-all">
                {chunk.content.substring(0, 200)}...
             </div>
          </div>
        ))}
        {referencedChunks.length > 5 && (
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center mt-2 italic">
            + {referencedChunks.length - 5} more evidence points analyzed
          </p>
        )}
      </div>
    </div>
  );
});

EvidenceBaseline.displayName = 'EvidenceBaseline';

interface MessageItemProps {
  msg: ChatMessage;
  sourceFiles: CodeFile[];
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  allChunks: LogChunk[];
  onSendMessage: (text: string) => void;
}

const MessageItem = memo(({ msg, sourceFiles, stats, messages, allChunks, onSendMessage }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const isError = msg.content.includes('Fault') || msg.content.includes('Error') || msg.content.includes('failure');

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`w-full py-10 transition-colors ${isUser ? '' : 'bg-slate-900/10 border-y border-slate-900/5'}`}>
      <div className="max-w-3xl mx-auto flex gap-6 md:gap-8 px-4 sm:px-6 relative group">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg transition-all duration-500
            ${isUser 
              ? 'bg-slate-800 border-slate-700 text-slate-300' 
              : isError 
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'}`}>
            {isUser ? <User className="w-5 h-5" /> : isError ? <AlertTriangle className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black text-slate-100 uppercase tracking-widest">
                {isUser ? 'Operator' : 'CloudLog Intelligence'}
              </span>
              {!isUser && msg.modelId && (
                <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400 uppercase tracking-tighter">
                  {msg.modelId.includes('pro') ? 'PRO ENGINE' : 'FLASH ENGINE'}
                </span>
              )}
            </div>
          </div>

          <div className="text-[16px] leading-[1.75] text-slate-200/90 antialiased font-medium selection:bg-blue-500/30">
            {msg.isLoading ? (
              <div className="flex flex-col gap-4 py-3">
                <div className="flex gap-2 items-center">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                   <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-2 animate-pulse">
                     {msg.content || "Analyzing Log Streams..."}
                   </span>
                </div>
              </div>
            ) : isError ? (
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] space-y-4">
                 <p className="text-red-400 font-bold italic">"{msg.content}"</p>
                 <button 
                  onClick={() => onSendMessage("Retry previous diagnostic audit")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                   <RefreshCw size={14} />
                   Retry Forensic Audit
                 </button>
              </div>
            ) : msg.structuredReport ? (
              <div className="mb-6">
                 <StructuredAnalysisRenderer report={msg.structuredReport} allChunks={allChunks} />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            )}
          </div>

          {!isUser && !msg.isLoading && !isError && (
            <div className="space-y-8 mt-6">
              {msg.advancedAnalysis && <AdvancedAnalysisPanel data={msg.advancedAnalysis} />}
              {msg.analysisSteps && msg.analysisSteps.length > 0 && <CodeFlowTrace steps={msg.analysisSteps} sourceFiles={sourceFiles} />}
              {msg.debugSolutions && msg.debugSolutions.length > 0 && <DebugInsightsPanel solutions={msg.debugSolutions} stats={stats} messages={messages} sourceFiles={sourceFiles} />}

              {/* Evidence Baseline - Grounding Display */}
              <EvidenceBaseline 
                sourceIds={msg.sources || []} 
                allChunks={allChunks} 
                confidence={msg.structuredReport?.confidence_score || msg.confidence_score} 
              />

              <div className="flex flex-col gap-4 pt-6 border-t border-slate-900/50">
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-600/10 transition-all text-[11px] text-slate-400 hover:text-blue-300">
                        <Globe size={12} className="text-blue-500" />
                        <span className="font-bold truncate max-w-[150px]">{link.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isUser && !msg.isLoading && !isError && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
            <div className="pt-8 mt-4 animate-in fade-in slide-in-from-bottom-3 duration-1000">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-blue-500/60" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Suggested Next Steps</span>
               </div>
               <div className="flex flex-wrap gap-3">
                  {msg.followUpSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(suggestion)}
                      className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl text-[13px] font-bold text-slate-400 hover:text-slate-100 transition-all shadow-xl flex items-center gap-3 group"
                    >
                      {suggestion}
                      <ArrowUp size={12} className="opacity-0 group-hover:opacity-100 transition-all rotate-90" />
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  selectedModel: string;
  onSelectModel: (id: string) => void;
  outputFormat: OutputFormat;
  onSelectOutputFormat: (format: OutputFormat) => void;
  workflow: DiagnosticWorkflow;
  onOpenSettings: () => void;
  suggestions: string[];
  sourceFiles: CodeFile[];
  stats: ProcessingStats | null;
  allChunks: LogChunk[];
  activeInvestigationId: string | null;
  signatures: LogSignature[];
  onClearInvestigation: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onSelectModel,
  outputFormat,
  onSelectOutputFormat,
  workflow,
  onOpenSettings,
  suggestions,
  sourceFiles,
  stats,
  allChunks,
  activeInvestigationId,
  signatures,
  onClearInvestigation
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);

  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];
  
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputRef.current?.value.trim();
    if (text && !isProcessing) {
      onSendMessage(text);
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }
    }
  }, [onSendMessage, isProcessing]);

  const handleTextareaChange = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 250)}px`;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  const handleAction = (label: string) => {
    const prompt = `${label} for the current investigation in ${outputFormat} format.`;
    onSendMessage(prompt);
  };

  // Logic for "Next Best Action"
  const recommendation = useMemo(() => {
    if (!activeInvestigationId) return null;
    
    const hasSummary = messages.some(m => m.role === 'assistant' && (m.content.toLowerCase().includes('summary') || m.structuredReport));
    const hasRootCause = messages.some(m => m.role === 'assistant' && m.content.toLowerCase().includes('root cause'));
    const hasMitigation = messages.some(m => m.role === 'assistant' && (m.content.toLowerCase().includes('remediation') || m.debugSolutions));

    if (!hasSummary) {
      return {
        label: "Summarize incident signals",
        path: "Summarize",
        actions: [
          { label: "Summarize", prompt: "Summarize incident signals" },
          { label: "Compare Clusters", prompt: "Compare similar log clusters" }
        ]
      };
    }
    if (!hasRootCause) {
      return {
        label: "Root Cause analysis",
        path: "Root Cause",
        actions: [
          { label: "Run Root Cause", prompt: "Deep root cause analysis" },
          { label: "Temporal Chain", prompt: "Build temporal causality chain" }
        ]
      };
    }
    return {
      label: "Mitigation & Prevention",
      path: "Remediation",
      actions: [
        { label: "Generate Mitigation Steps", prompt: "Generate mitigation and prevention steps" },
        { label: "Build Patch", prompt: "Generate high-fidelity code fix suggestion" }
      ]
    };
  }, [activeInvestigationId, messages]);

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] relative border-l border-slate-900/50">
      {/* Action Hub - Primary Forensic Controls */}
      <div className="px-6 py-4 flex flex-col gap-4 bg-[#0d0f14]/80 backdrop-blur-xl z-50 sticky top-0 border-b border-slate-900/50 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActionButton icon={<Search />} label="Summarize" onClick={() => handleAction("Summarize incident signals")} disabled={isProcessing} colorClass="bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white" />
            <ActionButton icon={<Microscope />} label="Root Cause" onClick={() => handleAction("Deep root cause analysis")} disabled={isProcessing} />
            <ActionButton icon={<Zap />} label="Suggested Fix" onClick={() => handleAction("High-fidelity code fix suggestion")} disabled={isProcessing} />
            <ActionButton icon={<FileText />} label="Generate Report" onClick={() => handleAction("Stakeholder incident report")} disabled={isProcessing} />
          </div>

          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="relative">
              <button 
                onClick={() => { setIsHeaderMenuOpen(!isHeaderMenuOpen); setIsFormatMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800"
              >
                <Zap size={13} className="text-blue-500" />
                <span>{activeModel.name}</span>
                <ChevronDown size={12} className={`text-slate-600 transition-transform ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isHeaderMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 border-b border-slate-800 pb-2">Forensic Engine</div>
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { onSelectModel(model.id); setIsHeaderMenuOpen(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${selectedModel === model.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-white/5 text-slate-500'}`}
                    >
                      <div className={`p-2 rounded-lg border ${selectedModel === model.id ? 'bg-blue-600/20 border-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
                        {model.capabilities.includes('search') ? <Globe size={12} /> : <Zap size={12} />}
                      </div>
                      <div>
                        <div className="text-xs font-black">{model.name}</div>
                        <div className="text-[8px] font-bold opacity-60 uppercase tracking-tighter truncate max-w-[140px]">{model.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Output Format Selector */}
            <div className="relative">
              <button 
                onClick={() => { setIsFormatMenuOpen(!isFormatMenuOpen); setIsHeaderMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-slate-800"
              >
                <LayoutPanelLeft size={13} className="text-emerald-500" />
                <span className="capitalize">{outputFormat} Format</span>
                <ChevronDown size={12} className={`text-slate-600 transition-transform ${isFormatMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFormatMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 border-b border-slate-800 pb-2">Synthesis Mode</div>
                  {[
                    { id: 'short', label: 'Short / TLDR', desc: 'Brief executive summary' },
                    { id: 'detailed', label: 'Detailed Root-Cause', desc: 'Full forensic trace' },
                    { id: 'ticket', label: 'Incident Ticket', desc: 'Ready for Jira/GitHub' }
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => { onSelectOutputFormat(format.id as OutputFormat); setIsFormatMenuOpen(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${outputFormat === format.id ? 'bg-emerald-600/10 text-emerald-400' : 'hover:bg-white/5 text-slate-500'}`}
                    >
                      <div className={`p-2 rounded-lg border ${outputFormat === format.id ? 'bg-emerald-600/20 border-emerald-500/40' : 'bg-slate-800 border-slate-700'}`}>
                        <FileText size={12} />
                      </div>
                      <div>
                        <div className="text-xs font-black">{format.label}</div>
                        <div className="text-[8px] font-bold opacity-60 uppercase tracking-tighter truncate max-w-[120px]">{format.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guided Workflow Progress */}
      <DiagnosticRoadmap workflow={workflow} />

      {/* Main Conversation Canvas */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        {!activeInvestigationId && messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-700">
             <div className="max-w-md space-y-8">
                <div className="relative mx-auto w-32 h-32">
                   <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full animate-pulse" />
                   <div className="relative w-full h-full bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                      <MousePointer2 className="w-12 h-12 text-blue-400 animate-bounce" />
                   </div>
                </div>
                
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Pick a signature to investigate</h3>
                   <p className="text-slate-500 font-medium text-lg leading-relaxed">
                     The Discovery engine has identified high-entropy patterns in your logs. Select one from the <span className="text-blue-400 font-bold">Discovery Panel</span> on the right to start an audit.
                   </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                   <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Info size={18} className="text-blue-400" />
                   </div>
                   <p className="text-[11px] text-slate-400 text-left leading-relaxed italic">
                     Focusing on a specific signature allows the AI to perform deep-link logic correlation across your multi-node stream.
                   </p>
                </div>
             </div>
          </div>
        ) : (
          <>
            {/* Next Best Action Suggestion Area */}
            {recommendation && messages.length > 0 && !isProcessing && (
               <div className="px-6 py-4 animate-in slide-in-from-top-2 duration-500 shrink-0">
                  <div className="bg-gradient-to-r from-blue-600/10 to-emerald-600/10 border border-blue-500/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-blue-900/5">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/5">
                           <Compass className="text-white w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                             Recommended next: <span className="text-white bg-blue-600/20 px-2 py-0.5 rounded italic">{recommendation.path}</span>
                           </h4>
                           <p className="text-sm font-bold text-slate-300 italic">Proceed with {recommendation.label} to unlock the full forensic chain.</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        {recommendation.actions.map((act, i) => (
                           <button 
                             key={i}
                             onClick={() => onSendMessage(act.prompt)}
                             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group ${
                               i === 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                             }`}
                           >
                             {act.label}
                             <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            <div className="flex-1 relative min-h-0">
              <Virtuoso
                ref={virtuosoRef}
                data={messages}
                followOutput="auto"
                itemContent={(index, msg) => (
                  <MessageItem msg={msg} sourceFiles={sourceFiles} stats={stats} messages={messages} allChunks={allChunks} onSendMessage={onSendMessage} />
                )}
                style={{ height: '100%' }}
                className="scrollbar-hide"
              />
            </div>
          </>
        )}
      </div>

      {/* Modern Input Area */}
      <div className="w-full shrink-0 pt-4 pb-8 px-6 relative">
        <div className="absolute inset-x-0 bottom-full h-24 bg-gradient-to-t from-[#0d0f14] to-transparent pointer-events-none" />

        <div className="max-w-3xl mx-auto relative group">
          <div className={`relative flex flex-col bg-[#14161f] border border-slate-800 rounded-[2rem] transition-all duration-500 shadow-2xl focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5 ${isProcessing ? 'opacity-80' : ''}`}>
            <div className="flex flex-col px-6 pt-4 pb-2">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ask follow-up diagnostic questions..."
                className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-slate-100 py-2 resize-none max-h-[200px] placeholder:text-slate-600 leading-relaxed font-medium scrollbar-hide"
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isProcessing}
              />

              <div className="flex items-center justify-between mt-2 mb-2">
                <div className="flex items-center gap-2">
                   <button className="p-2 text-slate-600 hover:text-slate-300 transition-all hover:bg-slate-800 rounded-lg">
                     <Paperclip size={18} />
                   </button>
                   <div className="h-4 w-px bg-slate-800 mx-1" />
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Neural Context Active</span>
                </div>

                <button 
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isProcessing || (inputRef.current?.value.trim() === '')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500
                    ${isProcessing || (inputRef.current?.value.trim() === '')
                      ? 'bg-slate-800 text-slate-600' 
                      : 'bg-white text-slate-950 hover:bg-blue-400 hover:text-white shadow-2xl scale-105 active:scale-95'
                    }
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp size={20} className="stroke-[3]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-2 mt-4 px-2">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(action)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-full text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
