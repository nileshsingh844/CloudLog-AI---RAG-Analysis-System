
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Loader2, Link as LinkIcon, Sparkles, AlertCircle, Zap, Cpu } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface MessageItemProps {
  msg: ChatMessage;
}

const MessageItem = memo(({ msg }: MessageItemProps) => {
  return (
    <div className={`flex gap-4 p-4 sm:p-6 pt-0 ${msg.role === 'user' ? 'justify-end' : ''}`}>
      <div className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 
          ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
          {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
        </div>
        <div className={`space-y-2 sm:space-y-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
          <div className={`rounded-2xl px-4 py-2 sm:px-5 sm:py-3 text-sm leading-relaxed shadow-sm
            ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 border border-slate-600/50 text-slate-200'}`}>
            {msg.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="animate-pulse">Analyzing...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>
          {msg.sources && msg.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {msg.sources.map(src => (
                <div key={src} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-500">
                  <LinkIcon className="w-2 h-2" />
                  <span className="truncate max-w-[80px]">SRC:{src.toUpperCase()}</span>
                </div>
              ))}
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
  onToggleModel: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onToggleModel
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isLoading && lastMsg.content.includes('Rate limited')) {
      setRetryStatus(lastMsg.content);
    } else {
      setRetryStatus(null);
    }
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (text) {
      onSendMessage(text);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onSendMessage]);

  const isPro = selectedModel.includes('pro');

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base truncate">RAG Intel</h3>
            <p className="hidden xs:block text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-widest font-bold truncate">Diagnostic Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Mode</span>
            <span className={`text-[9px] font-bold ${isPro ? 'text-blue-400' : 'text-emerald-400'}`}>
              {isPro ? 'Hyper' : 'Turbo'}
            </span>
          </div>
          <button 
            onClick={onToggleModel}
            className={`flex items-center gap-1 p-1 rounded-lg border transition-all
              ${isPro 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }
            `}
          >
            <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md ${isPro ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>
              <Cpu size={12} />
              <span className="text-[9px] font-black">PRO</span>
            </div>
            <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md ${!isPro ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>
              <Zap size={12} />
              <span className="text-[9px] font-black">FLSH</span>
            </div>
          </button>
        </div>
      </div>

      {retryStatus && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-amber-950 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-lg animate-bounce max-w-[90%] text-center">
          <AlertCircle size={12} />
          {retryStatus}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-4 opacity-40 text-center">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-slate-700" />
            <div className="max-w-xs">
              <p className="text-slate-300 font-medium text-sm">Awaiting Instructions</p>
              <p className="text-slate-500 text-xs mt-1">Ask about patterns, error signatures, or performance regressions.</p>
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            followOutput="smooth"
            itemContent={(index, msg) => <MessageItem msg={msg} />}
            style={{ height: '100%' }}
          />
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-slate-900/60 border-t border-slate-800">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-y-1 px-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Powered by <span className={isPro ? 'text-blue-400' : 'text-emerald-400'}>{isPro ? 'Pro' : 'Flash'} Engine</span>
              </span>
            </div>
            <span className="hidden xs:block text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              Context: Local RAG
            </span>
          </div>

          <div className="relative flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500/40 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about the logs..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-200 py-1 sm:py-2 resize-none max-h-32 placeholder:text-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={isProcessing}
              className={`p-1.5 sm:p-2 text-white rounded-lg transition-all disabled:opacity-30 mb-0.5
                ${isPro ? 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}
              `}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[7px] sm:text-[8px] text-slate-700 text-center uppercase tracking-[0.2em] font-black opacity-30 select-none">
            Persistence Engaged &bull; Local Semantic Buffer v2.7
          </p>
        </div>
      </form>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
