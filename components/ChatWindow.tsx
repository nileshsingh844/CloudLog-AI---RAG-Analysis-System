
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, ModelOption, CodeFile, ProcessingStats, LogChunk } from '../types';
import { Bot, User, Loader2, Link as LinkIcon, Sparkles, Zap, ChevronDown, ArrowUp, Command, ExternalLink, Globe, Paperclip, Mic, ShieldCheck, ListChecks } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PromptSuggestions } from './PromptSuggestions';
import { AVAILABLE_MODELS } from '../store/useLogStore';
import { CodeFlowTrace } from './CodeFlowTrace';
import { DebugInsightsPanel } from './DebugInsightsPanel';
import { AdvancedAnalysisPanel } from './AdvancedAnalysisPanel';
import { StructuredAnalysisRenderer } from './StructuredAnalysisRenderer';

interface MessageItemProps {
  msg: ChatMessage;
  sourceFiles: CodeFile[];
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  allChunks: LogChunk[];
}

const MessageItem = memo(({ msg, sourceFiles, stats, messages, allChunks }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  
  return (
    <div className={`w-full py-6 md:py-10 ${isUser ? '' : 'bg-[#0f1117]/30'}`}>
      <div className="max-w-3xl lg:max-w-4xl mx-auto flex gap-4 md:gap-8 px-4 sm:px-6">
        {/* Profile Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-all
            ${isUser 
              ? 'bg-slate-700 border-slate-600 text-slate-100' 
              : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'}`}>
            {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 flex flex-col space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100">
              {isUser ? 'You' : 'CloudLog AI'}
            </span>
            {!isUser && msg.modelId && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-400">
                {msg.modelId.includes('pro') ? 'PRO' : 'FLASH'}
              </span>
            )}
          </div>

          <div className="text-[16px] leading-relaxed text-slate-200 antialiased selection:bg-blue-500/30">
            {msg.isLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>
            ) : msg.structuredReport ? (
              <div className="mb-4">
                 <StructuredAnalysisRenderer report={msg.structuredReport} allChunks={allChunks} />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            )}
          </div>

          {/* Intelligence v2.0: Fix Validation Panel */}
          {!isUser && msg.fixValidation && (
            <div className="bg-emerald-600/5 border border-emerald-500/20 rounded-[2rem] p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="text-emerald-400" size={16} />
                     <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Remediation Validation</h5>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-slate-600 uppercase">System Confidence</p>
                     <p className="text-sm font-black text-emerald-400">{(msg.fixValidation.confidence * 100).toFixed(0)}%</p>
                  </div>
               </div>
               <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    {msg.fixValidation.impactSimulation}
                  </p>
               </div>
               {msg.fixValidation.similarResolvedIssues.length > 0 && (
                 <div className="pt-2">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <ListChecks size={12} /> Related Knowledge Node
                    </p>
                    <div className="space-y-1.5">
                      {msg.fixValidation.similarResolvedIssues.map((issue, i) => (
                        <div key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-blue-500" />
                           {issue}
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* Contextual Logic Panels (Analysis, Trace, Debug) */}
          {!isUser && !msg.isLoading && (
            <div className="space-y-8 mt-2">
              {msg.advancedAnalysis && <AdvancedAnalysisPanel data={msg.advancedAnalysis} />}

              {msg.analysisSteps && msg.analysisSteps.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-[#020617]/50 overflow-hidden">
                  <CodeFlowTrace steps={msg.analysisSteps} sourceFiles={sourceFiles} />
                </div>
              )}

              {msg.debugSolutions && msg.debugSolutions.length > 0 && (
                <DebugInsightsPanel solutions={msg.debugSolutions} stats={stats} messages={messages} sourceFiles={sourceFiles} />
              )}

              {/* Grounding & Citations Footer */}
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/40">
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-600/10 transition-all text-[11px] text-slate-400 hover:text-blue-300"
                      >
                        <Globe size={12} />
                        <span className="font-semibold truncate max-w-[200px]">{link.title}</span>
                        <ExternalLink size={10} className="opacity-40" />
                      </a>
                    ))}
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-center mr-1">Context Citations:</span>
                    {msg.sources.map(src => (
                      <div key={src} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
                        <LinkIcon className="w-3 h-3 text-slate-600" />
                        <span>{src}</span>
                      </div>
                    ))}
                  </div>
                )}
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
  onOpenSettings: () => void;
  suggestions: string[];
  sourceFiles: CodeFile[];
  stats: ProcessingStats | null;
  allChunks: LogChunk[];
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  suggestions,
  sourceFiles,
  stats,
  allChunks
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
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

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] relative overflow-hidden">
      {/* Top Bar Navigation */}
      <header className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between bg-[#0d0f14]/80 backdrop-blur-xl z-20 sticky top-0 shrink-0">
        <div className="relative">
          <button 
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <span className="text-slate-100">{activeModel.name}</span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-1">Select Engine</div>
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsHeaderMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                    ${selectedModel === model.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-white/5 text-slate-400'}
                  `}
                >
                  {model.capabilities.includes('search') ? <Globe size={14} /> : <Zap size={14} />}
                  <div>
                    <div className="text-sm font-bold">{model.name}</div>
                    <div className="text-[10px] opacity-60 font-medium">{model.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/40 rounded-full border border-slate-700/40">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Node v6.0</span>
           </div>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="flex flex-col items-center justify-center flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Multi-Node Analysis Activated</h2>
                <p className="text-slate-500 text-sm font-medium">Auditing cross-log correlations and logic chains.</p>
              </div>
            </div>
            
            <div className="w-full max-w-2xl shrink-0 pb-20">
               <PromptSuggestions 
                suggestions={suggestions} 
                onSelect={(s) => onSendMessage(s)} 
                isLoading={isProcessing} 
              />
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            followOutput="auto"
            itemContent={(index, msg) => (
              <MessageItem 
                msg={msg} 
                sourceFiles={sourceFiles} 
                stats={stats} 
                messages={messages} 
                allChunks={allChunks}
              />
            )}
            style={{ height: '100%' }}
            className="scrollbar-hide"
          />
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="w-full shrink-0 pt-2 pb-6 px-4 sm:px-6 relative">
        <div className="absolute inset-x-0 bottom-full h-24 bg-gradient-to-t from-[#0d0f14] to-transparent pointer-events-none" />

        <div className="max-w-3xl mx-auto relative group">
          <div className={`relative flex flex-col bg-[#1e2029] border border-slate-700/50 rounded-2xl transition-all duration-300 shadow-2xl focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500/20
            ${isProcessing ? 'opacity-80' : ''}
          `}>
            <div className="flex flex-col px-4 pt-3 pb-2">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Message CloudLog AI..."
                className="w-full bg-transparent border-none focus:ring-0 text-[16px] text-slate-100 py-2.5 resize-none max-h-52 placeholder:text-slate-500 leading-normal font-medium scrollbar-hide"
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isProcessing}
              />

              <div className="flex items-center justify-between mt-2 mb-1">
                <div className="flex items-center gap-2">
                   <div className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Temporal Hub Ready</span>
                   </div>
                   <button className="p-2 text-slate-500 hover:text-slate-200 transition-colors">
                     <Paperclip size={18} />
                   </button>
                </div>

                <button 
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isProcessing || (inputRef.current?.value.trim() === '')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
                    ${isProcessing || (inputRef.current?.value.trim() === '')
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-40' 
                      : 'bg-white text-black hover:bg-slate-200 shadow-xl'
                    }
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp size={20} className="stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
