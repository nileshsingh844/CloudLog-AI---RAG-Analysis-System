
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, ModelOption, CodeFile, ProcessingStats, LogChunk } from '../types';
import { Bot, User, Loader2, Link as LinkIcon, Sparkles, Zap, ChevronDown, ArrowUp, Command, ExternalLink, Globe, Paperclip, Mic, ShieldCheck, ListChecks, Copy, Check, RefreshCw } from 'lucide-react';
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
  onSendMessage: (text: string) => void;
}

const MessageItem = memo(({ msg, sourceFiles, stats, messages, allChunks, onSendMessage }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`w-full py-10 transition-colors ${isUser ? '' : 'bg-slate-900/10 border-y border-slate-900/5'}`}>
      <div className="max-w-3xl mx-auto flex gap-6 md:gap-8 px-4 sm:px-6 relative group">
        {/* Profile Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg transition-all duration-500
            ${isUser 
              ? 'bg-slate-800 border-slate-700 text-slate-300' 
              : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20'}`}>
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
          </div>
        </div>

        {/* Message Content */}
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
            {!isUser && !msg.isLoading && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition-all"
                  title="Copy content"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>

          <div className="text-[16px] leading-[1.75] text-slate-200/90 antialiased font-medium selection:bg-blue-500/30">
            {msg.isLoading ? (
              <div className="flex flex-col gap-4 py-3">
                <div className="flex gap-2 items-center">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                   <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-2">Consulting Logical Chunks...</span>
                </div>
              </div>
            ) : msg.structuredReport ? (
              <div className="mb-6">
                 <StructuredAnalysisRenderer report={msg.structuredReport} allChunks={allChunks} />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            )}
          </div>

          {/* Logic & Forensic Panels */}
          {!isUser && !msg.isLoading && (
            <div className="space-y-8 mt-6">
              {msg.advancedAnalysis && <AdvancedAnalysisPanel data={msg.advancedAnalysis} />}
              {msg.analysisSteps && msg.analysisSteps.length > 0 && <CodeFlowTrace steps={msg.analysisSteps} sourceFiles={sourceFiles} />}
              {msg.debugSolutions && msg.debugSolutions.length > 0 && <DebugInsightsPanel solutions={msg.debugSolutions} stats={stats} messages={messages} sourceFiles={sourceFiles} />}

              {/* Citations Footer */}
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
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest self-center mr-1">Sources:</span>
                    {msg.sources.map(src => (
                      <div key={src} className="px-2 py-0.5 bg-slate-900/50 border border-slate-800 rounded-lg text-[9px] text-slate-500 font-mono">
                        #{src}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Follow-up Suggestions (Next Steps Engine) */}
          {!isUser && !msg.isLoading && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
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

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] relative">
      {/* Dynamic Navigation Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-[#0d0f14]/80 backdrop-blur-xl z-50 sticky top-0 border-b border-slate-900/50">
        <div className="relative">
          <button 
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-[14px] font-black text-slate-300 hover:text-white hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800"
          >
            <Zap size={15} className="text-blue-500" />
            <span>{activeModel.name}</span>
            <ChevronDown size={14} className={`text-slate-600 transition-transform ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute left-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Select Logic Engine</div>
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onSelectModel(model.id); setIsHeaderMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${selectedModel === model.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-white/5 text-slate-500'}`}
                >
                  <div className={`p-2 rounded-lg border ${selectedModel === model.id ? 'bg-blue-600/20 border-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
                    {model.capabilities.includes('search') ? <Globe size={13} /> : <Zap size={13} />}
                  </div>
                  <div>
                    <div className="text-sm font-black">{model.name}</div>
                    <div className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{model.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden xs:flex items-center gap-4 px-4 py-1.5 bg-slate-900/50 rounded-full border border-slate-800 shadow-inner">
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Hub V6.0 Stable</span>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <div className="flex-1 min-h-0 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-12">
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl scale-110">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Diagnostic Hub</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Bridging cross-log correlations and neural logic chains.</p>
              </div>
            </div>
            
            <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-1000 delay-300">
               <PromptSuggestions suggestions={suggestions} onSelect={(s) => onSendMessage(s)} isLoading={isProcessing} />
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Floating Modern Input Area */}
      <div className="w-full shrink-0 pt-4 pb-12 px-4 sm:px-6 relative">
        <div className="absolute inset-x-0 bottom-full h-32 bg-gradient-to-t from-[#0d0f14] to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto relative group">
          <div className={`relative flex flex-col bg-[#14161f] border border-slate-800 rounded-[2.5rem] transition-all duration-500 shadow-2xl focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5 group-hover:border-slate-700 ${isProcessing ? 'opacity-80' : ''}`}>
            <div className="flex flex-col px-6 pt-5 pb-3">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Message CloudLog AI..."
                className="w-full bg-transparent border-none focus:ring-0 text-[17px] text-slate-100 py-3 resize-none max-h-[300px] placeholder:text-slate-600 leading-relaxed font-medium scrollbar-hide"
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                disabled={isProcessing}
              />

              <div className="flex items-center justify-between mt-4 mb-2">
                <div className="flex items-center gap-2">
                   <button className="p-2.5 text-slate-600 hover:text-slate-300 transition-all hover:bg-slate-800 rounded-xl">
                     <Paperclip size={20} />
                   </button>
                   <button className="p-2.5 text-slate-600 hover:text-slate-300 transition-all hover:bg-slate-800 rounded-xl">
                     <Mic size={20} />
                   </button>
                   <div className="h-4 w-px bg-slate-800 mx-2" />
                   <div className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Neural Context Active</span>
                   </div>
                </div>

                <button 
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isProcessing || (inputRef.current?.value.trim() === '')}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500
                    ${isProcessing || (inputRef.current?.value.trim() === '')
                      ? 'bg-slate-800 text-slate-600' 
                      : 'bg-white text-slate-950 hover:bg-blue-400 hover:text-white shadow-2xl scale-105 active:scale-95'
                    }
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp size={24} className="stroke-[3]" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
             <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={11} /> CloudLog AI may produce inaccuracies. Cross-reference results in the Lab.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
