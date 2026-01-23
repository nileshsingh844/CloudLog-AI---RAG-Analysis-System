
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { ChatMessage, ModelOption } from '../types';
import { Bot, User, Loader2, Link as LinkIcon, Sparkles, AlertCircle, Zap, Cpu, ChevronDown, Settings as SettingsIcon, ArrowUp } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { PromptSuggestions } from './PromptSuggestions';
import { AVAILABLE_MODELS } from '../store/useLogStore';

interface MessageItemProps {
  msg: ChatMessage;
}

const MessageItem = memo(({ msg }: MessageItemProps) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 p-4 sm:p-6 pt-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
          ${isUser ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-800 border border-slate-700 shadow-black/20'}`}>
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
        </div>
        <div className={`space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col min-w-0`}>
          <div className={`rounded-2xl px-4 py-2.5 text-[13px] sm:text-[14px] leading-relaxed shadow-sm transition-all
            ${isUser 
              ? 'bg-blue-600 text-white selection:bg-blue-400 selection:text-white' 
              : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-200 selection:bg-blue-500/30'}`}>
            {msg.isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-slate-400 font-medium tracking-tight italic">Neural synthesis...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            )}
          </div>
          {msg.sources && msg.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {msg.sources.map(src => (
                <div key={src} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/60 border border-slate-700/50 rounded-md text-[9px] text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-colors cursor-default">
                  <LinkIcon className="w-2.5 h-2.5" />
                  <span className="font-bold uppercase tracking-tighter">SEG:{src.split('-')[1]}</span>
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
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isInputMenuOpen, setIsInputMenuOpen] = useState(false);

  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const shortName = activeModel.name.split(' ').pop() || activeModel.name;

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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSuggestionSelect = useCallback((text: string) => {
    onSendMessage(text);
  }, [onSendMessage]);

  return (
    <div className="flex flex-col h-full bg-[#0b0f1a]/60 border border-slate-800/40 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl relative transition-all duration-500">
      {/* Click-Away Overlay for Auto-Minimizing Menus */}
      {(isHeaderMenuOpen || isInputMenuOpen) && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
          onClick={() => {
            setIsHeaderMenuOpen(false);
            setIsInputMenuOpen(false);
          }} 
        />
      )}

      {/* High-Fidelity Responsive Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl z-[45] gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="p-2 sm:p-2.5 bg-blue-600/10 rounded-xl shrink-0 border border-blue-500/10">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-100 text-[12px] sm:text-[14px] tracking-tight truncate">Intelligence Hub</h3>
            <p className="text-[7px] sm:text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] sm:tracking-[0.25em] truncate">Secure Neural Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsHeaderMenuOpen(!isHeaderMenuOpen);
                setIsInputMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all
                ${activeModel.id.includes('pro')
                  ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }
              `}
            >
              {activeModel.id.includes('pro') ? <Cpu size={12} /> : <Zap size={12} />}
              <span className="hidden sm:inline uppercase">{activeModel.name}</span>
              <span className="sm:hidden uppercase">{shortName}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isHeaderMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 sm:w-80 bg-[#0d121f] border border-slate-800 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] z-[50] py-2 sm:py-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 sm:px-5 py-2 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-2">Engine Variants</div>
                <div className="max-h-[280px] sm:max-h-[380px] overflow-y-auto scrollbar-hide">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsHeaderMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3.5 text-left transition-all
                        ${selectedModel === model.id ? 'bg-blue-600/10' : 'hover:bg-white/5'}
                      `}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${model.id.includes('pro') ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {model.id.includes('pro') ? <Cpu size={14} /> : <Zap size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] sm:text-[13px] font-bold tracking-tight ${selectedModel === model.id ? 'text-blue-400' : 'text-slate-100'}`}>{model.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 truncate font-medium mt-0.5">{model.capabilities.join(' • ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 text-slate-500 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/40 transition-all"
          >
            <SettingsIcon size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {retryStatus && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 backdrop-blur-md text-amber-950 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce border border-amber-400/50">
          <AlertCircle size={14} />
          {retryStatus}
        </div>
      )}

      {/* Responsive Adaptive Message History */}
      <div className="flex-1 min-h-0 bg-slate-950/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 space-y-6 sm:space-y-10 overflow-y-auto">
            <div className="flex flex-col items-center space-y-4 sm:space-y-5 opacity-30 select-none">
              <div className="p-4 sm:p-6 bg-slate-900 rounded-full border border-slate-800 shadow-2xl">
                <Bot className="w-10 h-10 sm:w-14 sm:h-14 text-slate-600" />
              </div>
              <div className="max-w-[200px] sm:max-w-xs text-center">
                <p className="text-slate-200 font-bold text-[13px] sm:text-[15px] tracking-tight italic uppercase">Neural Diagnostic Ready</p>
                <p className="text-slate-500 text-[10px] sm:text-[11px] mt-2 leading-relaxed font-medium">Awaiting log signatures or investigative queries for multi-dimensional analysis.</p>
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
            followOutput="auto"
            itemContent={(index, msg) => <MessageItem msg={msg} />}
            style={{ height: '100%' }}
            className="scrollbar-hide"
          />
        )}
      </div>

      {/* High-Performance Responsive Input Area */}
      <div className="p-3 sm:p-5 lg:p-6 bg-transparent z-[45]">
        <div className={`relative flex flex-col bg-[#0c111d]/95 backdrop-blur-3xl border rounded-[24px] sm:rounded-[32px] px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 transition-all duration-500 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.85)]
          ${isProcessing ? 'border-blue-500/30' : 'border-slate-800 focus-within:border-slate-600 focus-within:shadow-blue-500/10'}
        `}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Search log history or ask questions..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] sm:text-[15px] text-slate-100 py-1.5 resize-none max-h-32 sm:max-h-48 placeholder:text-slate-700 leading-relaxed font-medium min-h-[36px] sm:min-h-[40px]"
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isProcessing}
          />
          
          <div className="flex items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/50">
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInputMenuOpen(!isInputMenuOpen);
                  setIsHeaderMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-400 hover:text-slate-100 transition-all rounded-xl hover:bg-white/5 group active:scale-95"
                disabled={isProcessing}
              >
                <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest">{shortName}</span>
                <ChevronDown size={14} className={`opacity-40 transition-transform duration-300 group-hover:opacity-100 ${isInputMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isInputMenuOpen && (
                <div className="absolute bottom-full left-0 mb-4 w-60 sm:w-72 bg-[#0d121f] border border-slate-800 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.95)] z-[60] py-2 sm:py-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                  <div className="px-4 sm:px-5 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-2">Diagnostic Models</div>
                  <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto scrollbar-hide">
                    {AVAILABLE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsInputMenuOpen(false);
                        }}
                        className={`w-full px-4 sm:px-5 py-2 sm:py-3 text-left text-[12px] sm:text-[13px] font-bold transition-all
                          ${selectedModel === model.id 
                            ? 'text-blue-400 bg-blue-600/10' 
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
                        `}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white rounded-[16px] sm:rounded-[20px] transition-all duration-500 shadow-2xl
                ${isProcessing 
                  ? 'bg-slate-800 opacity-40 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 shadow-blue-500/20 active:translate-y-0 active:scale-95'
                }
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp size={20} className="sm:w-[24px] sm:h-[24px]" strokeWidth={3.5} />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-[7px] sm:text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em] sm:tracking-[0.35em] mt-4 sm:mt-6 select-none opacity-50">
          Intelligence Node 02 • Local-First Security Active
        </p>
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
