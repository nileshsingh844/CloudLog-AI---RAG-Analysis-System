
import React, { memo } from 'react';
import { ModelOption, LLMProvider, ProcessingStats } from '../types';
import { X, Cpu, Zap, Settings, Shield, Info, Trash2, Sliders, Layers, Files, Search, AlertCircle, FileCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { AVAILABLE_MODELS } from '../store/useLogStore';

interface IntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onClearSession: () => void;
  contextDepth: number;
  onContextDepthChange: (depth: number) => void;
  stats: ProcessingStats | null;
  onUploadRequest: () => void;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = memo(({
  isOpen,
  onClose,
  selectedModelId,
  onSelectModel,
  onClearSession,
  contextDepth,
  onContextDepthChange,
  stats,
  onUploadRequest
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-xl">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Engineering Control Hub</h2>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-black">Intelligence v2.0</p>
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
        <div className="p-4 sm:p-8 overflow-y-auto space-y-10 scrollbar-hide flex-1">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Configuration */}
            <div className="lg:col-span-5 space-y-10">
              {/* RAG Optimization Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Sliders size={12} className="text-blue-500" />
                  RAG Optimization
                </h3>
                <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-slate-200">Context Depth</span>
                    </div>
                    <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">{contextDepth}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={contextDepth} 
                    onChange={(e) => onContextDepthChange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Affects multi-log reasoning depth.
                  </p>
                </div>
              </section>

              {/* Provider Selection */}
              <section className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={12} className="text-purple-500" />
                  Inference Engines
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_MODELS.map(model => {
                    const isSelected = selectedModelId === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => onSelectModel(model.id)}
                        className={`group relative text-left p-4 rounded-2xl border transition-all duration-300
                          ${isSelected 
                            ? 'bg-blue-600/10 border-blue-600' 
                            : 'bg-slate-800/20 border-slate-800 hover:border-slate-600'
                          }
                        `}
                      >
                        <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                          {model.name}
                        </h5>
                        <p className="text-[9px] text-slate-500 mt-1 leading-relaxed line-clamp-1">
                          {model.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <button 
                onClick={() => {
                  if (confirm("Sanitize all session data?")) onClearSession();
                }}
                className="w-full py-3 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Trash2 size={12} />
                Clear Session
              </button>
            </div>

            {/* Right: Intelligence Insights */}
            <div className="lg:col-span-7 space-y-10">
              {/* File Reference Map */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Search size={12} className="text-emerald-500" />
                    Automatic File Mapping
                  </h3>
                  {stats && (
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      {(stats.referencedFiles || []).filter(f => !f.uploaded).length} Missing Points
                    </span>
                  )}
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                  {!stats ? (
                    <div className="py-10 text-center opacity-30">
                       <AlertCircle className="mx-auto mb-3" />
                       <p className="text-xs uppercase font-bold tracking-widest">Ingest Logs to Map Files</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                       {/* FIX: Use optional chaining and default array to prevent mapping issues */}
                       {(stats.referencedFiles || []).map((rf, i) => (
                         <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl group">
                            <div className="flex items-center gap-3 min-w-0">
                               <div className={`p-1.5 rounded-lg ${rf.uploaded ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                  {rf.uploaded ? <CheckCircle2 size={14} className="text-emerald-400" /> : <FileCode size={14} className="text-red-400" />}
                               </div>
                               <div className="truncate">
                                  <p className={`text-[11px] font-bold truncate ${rf.uploaded ? 'text-slate-200' : 'text-slate-400'}`}>{rf.path.split(/[/\\]/).pop()}</p>
                                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{rf.mentions} Citations • Max: {rf.severityMax}</p>
                               </div>
                            </div>
                            {!rf.uploaded && (
                              <button 
                                onClick={onUploadRequest}
                                className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded text-[8px] font-black uppercase tracking-widest border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                              >
                                Upload
                              </button>
                            )}
                         </div>
                       ))}
                    </div>
                  )}
                  {stats && (stats.referencedFiles || []).length > 0 && (
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                       <p className="text-[9px] text-blue-400 font-medium italic leading-relaxed text-center">
                         Upload missing code files to bridge log trace points to high-fidelity logic analysis.
                       </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Cross-Log Correlation */}
              <section className="space-y-4">
                 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Files size={12} className="text-blue-500" />
                    Cross-Log Correlation Hub
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Involved Nodes</p>
                       <p className="text-2xl font-black text-white italic">{stats?.processedFiles?.length || 0}</p>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Overlap</p>
                       <p className="text-2xl font-black text-blue-400 italic">{stats?.crossLogPatterns || 0}</p>
                    </div>
                 </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Synced</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20"
          >
            Apply Optimization
          </button>
        </div>
      </div>
    </div>
  );
});

IntelligenceHub.displayName = 'IntelligenceHub';
