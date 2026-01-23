import React from 'react';
import { Sparkles, ArrowRight, Loader2, Zap } from 'lucide-react';

interface PromptSuggestionsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ suggestions, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
          <Loader2 size={10} className="animate-spin text-blue-400 sm:w-[12px] sm:h-[12px]" />
          <span className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest">Synthesizing...</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-24 sm:w-40 bg-slate-800/30 rounded-xl border border-slate-700/30 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 py-2 sm:py-4 animate-in slide-in-from-bottom-4 duration-700 w-full max-w-3xl px-2">
      <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest px-4 py-1.5 bg-blue-500/5 rounded-full border border-blue-500/10 shadow-lg select-none shrink-0">
        <Sparkles size={10} className="text-blue-500" />
        Neural Inquiry Vectors
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s)}
            className="group flex items-center gap-3 px-4 py-2.5 sm:py-3 bg-slate-900/60 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/30 rounded-2xl text-[11px] sm:text-[13px] text-slate-400 hover:text-white transition-all shadow-xl text-left active:scale-[0.98] w-full min-w-0"
          >
            <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
               <Zap size={10} className="sm:w-3 sm:h-3" />
            </div>
            <span className="font-bold tracking-tight line-clamp-1 flex-1 min-w-0">{s}</span>
            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400 shrink-0 ml-auto hidden xs:block" />
          </button>
        ))}
      </div>
    </div>
  );
};