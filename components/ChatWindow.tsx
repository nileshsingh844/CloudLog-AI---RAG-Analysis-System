import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, CodeFile, ProcessingStats, LogChunk, TeamMember, ForensicComment, InvestigationStatus } from '../types';
import { Bot, User, Loader2, ArrowUp, Command, Plus, Sparkles, ChevronLeft, Terminal, Shield } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { StructuredAnalysisRenderer } from './StructuredAnalysisRenderer';
import { PresenceBar } from './PresenceBar';
import { ProcessingSummary } from './ProcessingSummary';

const AUTOCOMPLETE_TEMPLATES = [
  "Identify memory anomalies",
  "Generate remediation patch",
  "Trace temporal causality",
  "Audit security risks"
];

const ANALYSIS_PHASES = {
  UPLOADING: "Inference Acceleration (C++)",
  PARSING: "Vector Search Re-Ranking (Python)",
  DETECTING: "LLM + RAG Synthesis (Python)",
  SOLVING: "Streaming Forensic Pass (Go/TS)",
  GENERATING: "Sentinel Integrity Check (Go)"
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

  return (
    <div className={`w-full py-6 sm:py-10 border-b border-white/[0.02] ${isUser ? '' : 'bg-slate-900/10'}`}>
      <div className="max-w-4xl mx-auto flex gap-4 sm:gap-6 px-6">
        <div className="shrink-0 pt-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg
            ${isUser ? 'bg-slate-800 border border-white/10 text-slate-400' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] leading-relaxed text-slate-300 font-medium">
            {msg.isLoading ? (
              <div className="flex flex-col gap-4 py-1 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-sm rounded-full" />
                  </div>
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] animate-pulse">
                    {msg.analysisPhase ? ANALYSIS_PHASES[msg.analysisPhase] : 'Initializing Node...'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 max-w-[240px]">
                  {Object.keys(ANALYSIS_PHASES).map((phase, i) => {
                    const currentIdx = msg.analysisPhase ? Object.keys(ANALYSIS_PHASES).indexOf(msg.analysisPhase) : -1;
                    return (
                      <div 
                        key={phase}
                        className={`h-0.5 flex-1 rounded-full transition-all duration-700 ${currentIdx >= i ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-800'}`} 
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
                
                <div className="whitespace-pre-wrap leading-relaxed opacity-95">
                  {msg.content || "Neural stream stabilized. Awaiting signal."}
                </div>
                
                {isFirstBotMessage && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSuggestionClick(s)}
                        className="px-4 py-2 bg-slate-900 border border-white/[0.05] hover:border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-2 group"
                      >
                        <Terminal size={10} className="text-slate-600 group-hover:text-blue-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#020617] overflow-hidden">
      
      {/* Workspace Controls Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-[#020617]/90 backdrop-blur-xl shrink-0 border-b border-white/[0.03] z-50">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Forensic Workspace</span>
        </div>
        
        <PresenceBar 
          members={teamMembers} 
          status={status} 
          onShare={() => {}} 
          onStatusChange={onStatusChange} 
        />
      </header>

      {/* Primary Message Feed */}
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
          increaseViewportBy={300}
        />
      </div>

      {/* Interactive Input Node */}
      <div className="shrink-0 z-40 bg-[#020617] border-t border-white/[0.03] pt-4 pb-4 sm:pb-8">
        <div className="max-w-4xl mx-auto px-6 space-y-4">
          
          {/* Quick-Action Chips */}
          {!isProcessing && messages.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
               {AUTOCOMPLETE_TEMPLATES.map((s, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleSubmit(s)}
                   className="px-3 py-1.5 bg-slate-900 border border-white/[0.05] hover:border-blue-500/30 rounded-lg text-[9px] font-black text-slate-500 hover:text-blue-400 transition-all active:scale-95 flex items-center gap-2 group"
                 >
                   <Plus size={12} className="text-slate-700 group-hover:text-blue-500" />
                   {s}
                 </button>
               ))}
            </div>
          )}

          {/* Unified Input Control */}
          <div className="relative group">
            <div className={`relative bg-slate-900/60 border border-white/[0.08] rounded-2xl transition-all duration-300 shadow-2xl focus-within:border-blue-500/40 focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-blue-500/5 ${isProcessing ? 'opacity-80' : ''}`}>
              
              <div className="flex items-end px-3 py-3">
                 <div className="flex items-center gap-1 pb-1">
                    <button className="p-2.5 text-slate-600 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all" title="Attach context">
                       <Command size={18} />
                    </button>
                 </div>

                 <textarea
                   ref={inputRef}
                   rows={1}
                   value={inputValue}
                   placeholder={isProcessing ? "Synthesizing deep forensic report..." : "Ask forensic engine to trace causality..."}
                   disabled={isProcessing}
                   className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-100 py-2.5 px-3 resize-none max-h-[160px] placeholder:text-slate-700 leading-relaxed font-medium scrollbar-hide disabled:cursor-not-allowed"
                   onChange={handleTextareaChange}
                   onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                 />

                 <div className="flex items-center gap-2 pb-1 pr-1">
                    {isProcessing ? (
                      <button 
                        type="button"
                        onClick={onStop}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-xl transition-all active:scale-95 group"
                        title="Abort forensic cycle"
                      >
                        <div className="w-3.5 h-3.5 bg-white rounded-[2px] group-hover:scale-90 transition-transform" />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={!inputValue.trim()}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300
                          ${!inputValue.trim() ? 'bg-slate-800 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-90'}
                        `}
                      >
                        <ArrowUp size={20} strokeWidth={3} />
                      </button>
                    )}
                 </div>
              </div>
            </div>
            
            {/* Meta Indicator */}
            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-4 opacity-30 select-none">
               <div className="flex items-center gap-1.5">
                  <Shield size={8} className="text-emerald-500" />
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Compliance Active</span>
               </div>
               <div className="w-1 h-1 bg-slate-800 rounded-full" />
               <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Verify High-Fidelity Patches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';