
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, ModelOption } from '../types';
import { Send, Bot, User, Loader2, Link as LinkIcon, Sparkles, AlertCircle, Zap, Cpu, ChevronDown, Settings as SettingsIcon, ArrowUp } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PromptSuggestions } from './PromptSuggestions';
import { AVAILABLE_MODELS } from '../store/useLogStore';

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
  onSelectModel: (id: string) => void;
  onOpenSettings: () => void;
  suggestions: string[];
}

export const ChatWindow: React.FC<ChatWindowProps> = memo(({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  suggestions
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.isLoading && lastMsg.content.includes('Rate limited')) {
      setRetryStatus(lastMsg.content);
    } else {
      setRetryStatus(null);
    }
  }, [messages]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputRef.current?.value.trim();
    if (text) {
      onSendMessage(text);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onSendMessage]);

  const handleSuggestionSelect = useCallback((text: string) => {
    onSendMessage(text);
  }, [onSendMessage]);

  const isPro = activeModel.id.includes('pro');
  const shortName = activeModel.name.includes('Flash') ? 'Flash' : activeModel.name.includes('Pro') ? 'Pro' : 'Lite';

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base truncate">RAG Intel</h3>
            <p className="hidden xs:block text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-widest font-bold truncate">Diagnostic Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Header Pill Toggle - As shown in Pic 1 */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all
                ${isPro 
                  ? 'bg-blue-900/40 border-blue-500/30 text-blue-400 hover:bg-blue-900/60' 
                  : 'bg-[#064e3b]/40 border-[#10b981]/30 text-[#10b981] hover:bg-[#064e3b]/60'
                }
              `}
            >
              {isPro ? <Cpu size={14} className="text-blue-400" /> : <Zap size={14} className="text-[#10b981]" />}
              <span className="text-[11px] font-black uppercase tracking-widest">{shortName.toUpperCase()}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 opacity-60 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-1.5 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-slate-800 mb-1">
                    Select Neural Engine
                  </div>
                  {AVAILABLE_MODELS.map((model) => {
                    const isSelected = model.id === selectedModel;
                    const mIsPro = model.id.includes('pro');
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800
                          ${isSelected ? 'bg-slate-800/50' : ''}
                        `}
                      >
                        <div className={`p-1.5 rounded-lg ${mIsPro ? 'bg-blue-600/20 text-blue-400' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
                          {mIsPro ? <Cpu size={12} /> : <Zap size={12} />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{model.name}</p>
                          <p className="text-[9px] text-slate-600 truncate">{model.capabilities.join(' • ')}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
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
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 text-center">
            <div className="flex flex-col items-center space-y-4 opacity-40">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-slate-700" />
              <div className="max-w-xs">
                <p className="text-slate-300 font-medium text-sm">Awaiting Instructions</p>
                <p className="text-slate-500 text-xs mt-1">Ask about patterns, error signatures, or performance regressions.</p>
              </div>
            </div>
            
            <PromptSuggestions 
              suggestions={suggestions} 
              onSelect={handleSuggestionSelect} 
              isLoading={isProcessing} 
            />
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

      {/* Input Area - Restored & Matching Pic 2/3 */}
      <div className="bg-transparent p-4">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative flex flex-col bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl px-4 pt-4 pb-3 focus-within:border-slate-500/40 transition-all shadow-xl">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about the logs..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-200 py-1.5 resize-none max-h-32 placeholder:text-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/30">
              {/* Footer Model Selector - As shown in Pic 2/3 */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-1 py-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span className="text-[14px] font-medium tracking-tight">{shortName}</span>
                  <ChevronDown size={14} className="opacity-40" />
                </button>
              </div>

              {/* Send Button - Brown/Rust Square as shown in Pic 2/3 */}
              <button 
                type="submit"
                disabled={isProcessing}
                className={`w-11 h-11 flex items-center justify-center text-white rounded-[14px] transition-all disabled:opacity-30
                  ${isPro ? 'bg-blue-600/90 shadow-blue-500/20' : 'bg-[#8c5241] shadow-[#8c5241]/20'}
                `}
              >
                <ArrowUp size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
