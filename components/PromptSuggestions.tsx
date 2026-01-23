
import React from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface PromptSuggestionsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ suggestions, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">
          <Loader2 size={12} className="animate-spin" />
          Analyzing Context & Generating Discovery Paths...
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 w-40 bg-slate-800/50 rounded-full border border-slate-700/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
        <Sparkles size={10} className="text-blue-400" />
        Intelligent Discovery Prompts
      </div>
      <div className="flex flex-wrap justify-center gap-2 px-4 max-w-2xl">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s)}
            className="group flex items-center gap-3 px-4 py-2.5 bg-slate-800/40 hover:bg-blue-600/15 border border-slate-700 hover:border-blue-500/40 rounded-2xl text-xs text-slate-300 hover:text-blue-100 transition-all shadow-lg hover:shadow-blue-500/5 text-left"
          >
            <span className="line-clamp-1">{s}</span>
            <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
