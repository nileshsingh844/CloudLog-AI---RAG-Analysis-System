import React, { memo } from 'react';
import { ModelOption, LLMProvider } from '../types';
import { X, Cpu, Zap, Settings, Shield, Info, Trash2 } from 'lucide-react';
import { AVAILABLE_MODELS } from '../store/useLogStore';

interface IntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onClearSession: () => void;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = memo(({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  onClearSession
}) => {
  if (!isOpen) return null;

  const providers: LLMProvider[] = ['google-gemini', 'openai', 'anthropic', 'mistral'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-xl">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Hub Settings</h2>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-black">AI Orchestration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8 scrollbar-hide">
          {/* Identity and Management UI removed as per Gemini API guidelines */}
          <section className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Trash2 size={12} className="text-red-500" />
                Session Sanitation
              </h3>
              <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 flex flex-col items-start gap-4 h-full">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">Clear Persistence</p>
                  <p className="text-[10px] text-slate-500 mt-1">Wipe local diagnostic history and conversation buffers.</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Sanitize all session data? This cannot be undone.")) {
                      onClearSession();
                      onClose();
                    }
                  }}
                  className="w-full mt-auto px-4 py-2 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={12} />
                  Clear Session
                </button>
              </div>
            </div>
          </section>

          {/* Provider Selection */}
          <section className="space-y-6">
            {providers.map(provider => (
              <div key={provider} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{provider.replace('-', ' ')}</h4>
                  {provider !== 'google-gemini' && (
                    <span className="text-[8px] font-bold text-slate-600 px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 flex items-center gap-1">
                      <Shield size={10} /> RESTRICTED
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_MODELS.filter(m => m.provider === provider).map(model => {
                    const isSelected = selectedModelId === model.id;
                    const isDisabled = model.status === 'requires-config';

                    return (
                      <button
                        key={model.id}
                        onClick={() => !isDisabled && onSelectModel(model.id)}
                        disabled={isDisabled}
                        className={`group relative text-left p-3 sm:p-4 rounded-2xl border transition-all duration-300
                          ${isSelected 
                            ? 'bg-blue-600/10 border-blue-600' 
                            : isDisabled
                            ? 'bg-slate-900/30 border-slate-800 opacity-40'
                            : 'bg-slate-800/20 border-slate-800 hover:border-slate-600'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>
                            {model.capabilities.includes('logic') ? <Cpu size={12} /> : <Zap size={12} />}
                          </div>
                        </div>
                        <h5 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                          {model.name}
                        </h5>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {model.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
             <div className="flex items-center gap-1.5 shrink-0">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[9px] font-bold text-slate-600 uppercase">Synced</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] sm:text-xs font-bold transition-all shrink-0"
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  );
});

IntelligenceHub.displayName = 'IntelligenceHub';