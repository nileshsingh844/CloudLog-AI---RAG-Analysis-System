
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, ModelOption, CodeFile } from '../types';
import { Bot, User, Loader2, Link as LinkIcon, Sparkles, Zap, Cpu, ChevronDown, ArrowUp, Command } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PromptSuggestions } from './PromptSuggestions';
import { AVAILABLE_MODELS } from '../store/useLogStore';
import { CodeFlowTrace } from './CodeFlowTrace';
import { DebugInsightsPanel } from './DebugInsightsPanel';

interface MessageItemProps {
  msg: ChatMessage;
  sourceFiles: CodeFile[];
}

const MessageItem = memo(({ msg, sourceFiles }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex w-full gap-4 px-4 sm:px-6 py-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg transition-transform hover:scale-105
        ${isUser 
          ? 'bg-blue-600 border-blue-500/50 shadow-blue-900/20' 
          : 'bg-slate-800 border-slate-700/50 shadow-slate-950/40'}`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
      </div>

      {/* Content Container */}
      <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-5 py-3.5 text-sm sm:text-[15px] leading-relaxed rounded-2xl border shadow-xl transition-colors
          ${isUser 
            ? 'bg-blue-600 border-blue-500 text-white selection:bg-blue-400 rounded-tr-none' 
            : 'bg-slate-900/90 border-slate-800 text-slate-200 selection:bg-blue-500/30 rounded-tl-none'}`}>
          {msg.isLoading ? (
            <div className="flex items-center gap-3 py-1">
              <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
              </div>
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Computing...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          )}
        </div>

        {/* Structured Code Trace rendering */}
        {!isUser && msg.analysisSteps && msg.analysisSteps.length > 0 && (
          <div className="w-full mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30">
            <CodeFlowTrace steps={msg.analysisSteps} sourceFiles={sourceFiles} />
          </div>
        )}

        {/* Debugging Insights rendering */}
        {!isUser && msg.debugSolutions && msg.debugSolutions.length > 0 && (
          <div className="w-full mt-2">
            <DebugInsightsPanel solutions={msg.debugSolutions} />
          </div>
        )}

        {/* Source References */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-1">Linked Logs:</span>
            {msg.sources.map(src => (
              <div key={src} className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-lg text-[10px] text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-default group">
                <LinkIcon className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                <span className="font-bold tracking-tight">{src.includes('-') ? `SEG_${src.split('-')[1]}` : src}</span>
              </div>
            ))}
          </div>
        )}
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
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  suggestions,
  sourceFiles
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full bg-slate-900/20 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Header: Sticky to container top, ensured no overlap */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl z-[45] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-black text-slate-100 text-sm tracking-tight uppercase italic">Diagnostic Lab</h3>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Neural Link Syncing</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
              ${isHeaderMenuOpen 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
              }
            `}
          >
            {activeModel.id.includes('pro') ? <Cpu size={12} /> : <Zap size={12} />}
            <span className="hidden sm:inline">{activeModel.name}</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[60] py-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-5 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-1">Select Reasoning Node</div>
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsHeaderMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all
                    ${selectedModel === model.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-white/5 text-slate-400'}
                  `}
                >
                  {model.id.includes('pro') ? <Cpu size={14} /> : <Zap size={14} />}
                  <span className="text-xs font-bold tracking-tight">{model.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Virtuoso handles scrolling */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <div className="flex flex-col items-center justify-center flex-1 space-y-8 opacity-40 select-none">
              <div className="p-10 bg-slate-950 rounded-full border border-slate-800/50 shadow-inner">
                <Command className="w-16 h-16 text-slate-700" />
              </div>
              <div className="text-center">
                <h4 className="text-slate-200 font-black text-xl tracking-tighter italic uppercase">Engine Standby</h4>
                <p className="text-slate-500 text-[13px] mt-2 font-medium max-w-xs leading-relaxed">System ready for diagnostic query. Select a neural vector below or type a custom command.</p>
              </div>
            </div>
            
            <div className="w-full shrink-0 pb-4">
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
            itemContent={(index, msg) => <MessageItem msg={msg} sourceFiles={sourceFiles} />}
            style={{ height: '100%' }}
            className="scrollbar-hide"
          />
        )}
      </div>

      {/* Input Tray: Anchored at the bottom, responsive height */}
      <div className="p-6 bg-slate-950/40 border-t border-slate-800/40 shrink-0 z-10">
        <div className={`relative flex flex-col bg-slate-900 border rounded-3xl px-6 pt-5 pb-4 transition-all duration-300 shadow-2xl
          ${isProcessing ? 'border-blue-500/20 opacity-80' : 'border-slate-800 focus-within:border-blue-600/40 focus-within:ring-4 focus-within:ring-blue-600/5'}
        `}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Search logs or debug logic..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base text-slate-200 py-2 resize-none max-h-48 lg:max-h-60 placeholder:text-slate-600 leading-relaxed font-medium min-h-[40px] scrollbar-hide"
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isProcessing}
          />
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
               <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Link</span>
               </div>
            </div>

            <button 
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing || (inputRef.current?.value.trim() === '')}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-xl
                ${isProcessing || (inputRef.current?.value.trim() === '')
                  ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95 shadow-blue-600/20 border border-blue-400/20'
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
  );
});

ChatWindow.displayName = 'ChatWindow';
