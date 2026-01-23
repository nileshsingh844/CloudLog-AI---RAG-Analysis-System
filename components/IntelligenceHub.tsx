
import React, { memo } from 'react';
import { ModelOption, LLMProvider } from '../types';
import { X, Cpu, Zap, Settings, Shield, Info, ExternalLink, Key } from 'lucide-react';
import { AVAILABLE_MODELS } from '../store/useLogStore';

interface IntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onManageKeys: () => void;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = memo(({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  onManageKeys
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
          {/* Key Management Section */}
          <section>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Key size={12} className="text-blue-500" />
              Identity Management
            </h3>
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">Google Gemini Secure Auth</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] xs:max-w-none">Authorization persistent through authorized provider.</p>
              </div>
              <button 
                onClick={onManageKeys}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <Key size={12} />
                Manage Key
              </button>
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
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none z-[110] bottom-[105%] left-1/2 -translate-x-1/2 w-[240px] bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Profile</span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                              {model.description}
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {model.capabilities.map(cap => (
                                <span key={cap} className="px-1.5 py-0.5 bg-blue-500/10 text-[8px] font-bold text-blue-400 rounded-md border border-blue-500/30 uppercase tracking-tighter">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-slate-700"></div>
                        </div>

                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>
                            {model.capabilities.includes('logic') ? <Cpu size={12} /> : <Zap size={12} />}
                          </div>
                          <div className="flex gap-1">
                            {model.capabilities.slice(0, 3).map((_, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-700'}`}></div>
                            ))}
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
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hidden xs:flex text-[9px] font-bold text-slate-600 hover:text-blue-400 items-center gap-1 truncate">
               <span className="sm:hidden lg:inline">Billing Info</span> <ExternalLink size={10} />
             </a>
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
