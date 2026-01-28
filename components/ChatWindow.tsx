import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, CodeFile, ProcessingStats, LogChunk, TeamMember, ForensicComment, InvestigationStatus } from '../types';
import { Bot, User, Loader2, ArrowUp, Command, Plus, Sparkles, ChevronLeft } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { StructuredAnalysisRenderer } from './StructuredAnalysisRenderer';
import { PresenceBar } from './PresenceBar';
import { ForensicAnnotations } from './ForensicAnnotations';
import { ProcessingSummary } from './ProcessingSummary';

const AUTOCOMPLETE_TEMPLATES = [
  "Find root cause of failure",
  "Summarize system performance",
  "Identify memory anomalies",
  "Generate remediation patch",
  "Trace temporal causality"
];

const ANALYSIS_PHASES = {
  UPLOADING: "Inference Acceleration: SIMD (C++)",
  PARSING: "Vector Search: Ranking (Python)",
  DETECTING: "LLM + RAG Logic: Synthesis (Python)",
  SOLVING: "API Layer: Streaming Forensic (TS/Go)",
  GENERATING: "Sentinel Node: Integrity (Go)"
};

interface MessageItemProps {
  msg: ChatMessage;
  allChunks: LogChunk[];
  sourceFiles: CodeFile[];
  comments: ForensicComment[];
  onAddComment: (targetId: string, content: string) => void;
  onSuggestionClick: (text: string) => void;
  suggestions: string[];
  stats: ProcessingStats | null;
  index: number;
}

const MessageItem = memo(({ msg, allChunks, comments, onAddComment, onSuggestionClick, suggestions, stats, index }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  const isFirstBotMessage = msg.role === 'assistant' && index === 1;

  // Modern reading width: max-w-3xl (approx 768px) is ideal for readable log analysis
  return (
    <div className={`w-full py-8 sm:py-12 transition-colors ${isUser ? '' : 'bg-slate-900/10'}`}>
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-6 sm:gap-8 px-6">
        <div className="shrink-0 hidden sm:block">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-700 shadow-md
            ${isUser ? 'bg-slate-800 border border-white/5 text-slate-500' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] sm:text-[16px] leading-[1.8] text-slate-200/95 font-medium selection:bg-blue-500/40">
            {msg.isLoading ? (
              <div className="flex flex-col gap-4 py-2 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">
                    {msg.analysisPhase ? ANALYSIS_PHASES[msg.analysisPhase] : 'Initializing...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 max-w-[200px]">
                  {Object.keys(ANALYSIS_PHASES).map((phase, i) => {
                    const currentIdx = msg.analysisPhase ? Object.keys(ANALYSIS_PHASES).indexOf(msg.analysisPhase) : -1;
                    return (
                      <div 
                        key={phase}
                        className={`h-0.5 flex-1 rounded-full transition-all duration-700 ${currentIdx >= i ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} 
                      />
                    );
                  })}
                </div>
              </div>
            ) : msg.structuredReport ? (
              <StructuredAnalysisRenderer report={msg.structuredReport} allChunks={allChunks} />
            ) : (
              <div className="space-y-6">
                {isFirstBotMessage && stats && <ProcessingSummary stats={stats} />}
                
                <div className="whitespace-pre-wrap opacity-90">{msg.content || "End of logic trace."}</div>
                
                {isFirstBotMessage && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-700 pt-2">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSuggestionClick(s)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm hover:scale-105 active:scale-95
                          ${s.includes('🔴') ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' :
                            s.includes('🟡') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {!msg.isLoading && (!isFirstBotMessage || (isFirstBotMessage && (msg.content || "").length > 0)) && (
            <div className="mt-8">
               <ForensicAnnotations 
                 targetId={msg.id} 
                 comments={comments} 
                 onAddComment={(content) => onAddComment(msg.id, content)} 
               />
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
  suggestions: string[];
  sourceFiles: CodeFile[];
  stats: ProcessingStats | null;
  allChunks: LogChunk[];
  teamMembers: TeamMember[];
  comments: ForensicComment[];
  status: InvestigationStatus;
  onAddComment: (targetId: string, content: string) => void;
  onStatusChange: (status: InvestigationStatus) => void;
  onStop: () => void;
  onNavigateHome: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  suggestions,
  sourceFiles,
  allChunks,
  teamMembers,
  comments,
  status,
  onAddComment,
  onStatusChange,
  onStop,
  onNavigateHome,
  stats
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback((textOrEvent?: any) => {
    const textValue = typeof textOrEvent === 'string' ? textOrEvent : '';
    const finalQuery = (textValue || inputValue).trim();
    
    if (finalQuery && !isProcessing) {
      onSendMessage(finalQuery);
      setInputValue('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  }, [onSendMessage, isProcessing, inputValue]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#020617] overflow-hidden">
      
      {/* Dynamic Context Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-[#020617]/80 backdrop-blur-xl shrink-0 border-b border-white/[0.03] z-40">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Forensic Workspace</span>
        </div>
        
        <PresenceBar 
          members={teamMembers} 
          status={status} 
          onShare={() => {}} 
          onStatusChange={onStatusChange} 
        />
      </header>

      {/* Message Stream */}
      <div className="flex-1 min-h-0 relative">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          followOutput="auto"
          itemContent={(index, msg) => (
            <MessageItem 
              index={index}
              msg={msg} 
              allChunks={allChunks} 
              sourceFiles={sourceFiles} 
              comments={comments} 
              onAddComment={onAddComment}
              onSuggestionClick={handleSubmit}
              suggestions={suggestions}
              stats={stats}
            />
          )}
          style={{ height: '100%' }}
          className="scrollbar-hide"
        />
      </div>

      {/* Input Stage */}
      <div className="shrink-0 z-40 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent pt-4 pb-4 sm:pb-8">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          
          {!isProcessing && messages.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
               {AUTOCOMPLETE_TEMPLATES.slice(0, 3).map((s, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleSubmit(s)}
                   className="px-3 py-1.5 bg-slate-900 border border-white/[0.05] hover:border-blue-500/30 rounded-lg text-[9px] font-bold text-slate-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 group"
                 >
                   <Plus size={12} className="text-slate-700 group-hover:text-blue-400" />
                   {s}
                 </button>
               ))}
            </div>
          )}

          {/* Claude/ChatGPT style Floating Bar */}
          <div className="relative">
            <div className={`relative bg-slate-900 border border-white/[0.08] rounded-2xl transition-all duration-500 shadow-2xl focus-within:border-blue-500/30 focus-within:ring-2 focus-within:ring-blue-500/5 ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}>
              
              <div className="flex items-end px-3 py-3">
                 <div className="flex items-center gap-1 pb-1">
                    <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Command palette">
                       <Command size={18} />
                    </button>
                 </div>

                 <textarea
                   ref={inputRef}
                   rows={1}
                   value={inputValue}
                   placeholder="Ask forensic inquiry..."
                   className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-100 py-2.5 px-3 resize-none max-h-[200px] placeholder:text-slate-800 leading-relaxed font-medium scrollbar-hide"
                   onChange={handleTextareaChange}
                   onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                 />

                 <div className="flex items-center gap-2 pb-1 pr-1">
                    {isProcessing ? (
                      <button 
                        type="button"
                        onClick={onStop}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-xl transition-all active:scale-95"
                      >
                        <div className="w-3 h-3 bg-white rounded-sm" />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={!inputValue.trim()}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300
                          ${!inputValue.trim() ? 'bg-slate-800 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg scale-105 active:scale-95'}
                        `}
                      >
                        <ArrowUp size={18} className="stroke-[3]" />
                      </button>
                    )}
                 </div>
              </div>
            </div>
            <div className="mt-2 text-center opacity-30 select-none">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">AI can make errors. Verify high-fidelity patches.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
