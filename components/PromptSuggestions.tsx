
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
      <div className="flex flex-col items-center gap-3 sm:gap-4 py-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/5 rounded-full border border-blue-500/10">
          <Loader2 size={12} className="animate-spin text-blue-400 sm:w-[14px] sm:h-[14px]" />
          <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Synthesizing Discovery Paths...</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-lg">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 sm:h-10 w-32 sm:w-44 bg-slate-800/30 rounded-xl sm:rounded-2xl border border-slate-700/30 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5 py-4 sm:py-6 animate-in slide-in-from-bottom-4 duration-700 w-full max-w-2xl px-2">
      <div className="flex items-center gap-2 sm:gap-2.5 text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/5 rounded-full border border-blue-500/10 shadow-lg shadow-blue-500/5 select-none">
        <Sparkles size={10} className="text-blue-400 sm:w-[12px] sm:h-[12px]" />
        Neural Inquiry Vectors
      </div>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s)}
            className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3.5 bg-slate-900/40 hover:bg-blue-600/10 border border-slate-800 hover:border-blue-500/30 rounded-xl sm:rounded-[20px] text-[11px] sm:text-[13px] text-slate-400 hover:text-blue-100 transition-all shadow-xl hover:shadow-blue-500/5 text-left active:scale-[0.98] w-full sm:w-auto sm:max-w-xs md:max-w-sm"
          >
            <div className="p-1 sm:p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
               <Zap size={10} />
            </div>
            <span className="font-bold tracking-tight line-clamp-1 flex-1">{s}</span>
            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400 shrink-0 ml-auto hidden xs:block" />
          </button>
        ))}
      </div>
    </div>
  );
};
