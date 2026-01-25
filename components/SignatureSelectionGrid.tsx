
import React from 'react';
import { LogSignature, Severity } from '../types';
import { ShieldAlert, AlertTriangle, Info, Zap, CheckCircle2, Square, Search, Activity, Cpu, Loader2, RefreshCw, Bug } from 'lucide-react';

interface SignatureSelectionGridProps {
  signatures: LogSignature[];
  selectedSignatures: string[];
  onToggle: (id: string) => void;
  onDeepDive: () => void;
  onRetryDiscovery?: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const SignatureSelectionGrid: React.FC<SignatureSelectionGridProps> = ({ 
  signatures, 
  selectedSignatures, 
  onToggle, 
  onDeepDive,
  onRetryDiscovery,
  isLoading,
  error
}) => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            {isLoading ? <Loader2 className="w-[18px] h-[18px] text-blue-400 animate-spin" /> : <Search size={18} className="text-blue-400" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Logic Discovery</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {isLoading ? "Synthesizing patterns..." : error ? "Engine Offline" : `${signatures.length} Patterns Found`}
            </p>
          </div>
        </div>
        
        {signatures.length > 0 && (
          <button 
            onClick={onDeepDive}
            disabled={selectedSignatures.length === 0 || isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl w-full
              ${selectedSignatures.length > 0 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-[0.98]' 
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800 animate-pulse'}`}
          >
            {isLoading ? <Activity className="animate-spin" size={14} /> : <Zap size={14} />}
            {selectedSignatures.length > 0 ? "Deep Dive Investigation" : "Select a Pattern to Start"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900/40 border border-slate-800 rounded-[2rem] animate-pulse flex flex-col p-5 space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-slate-800 rounded-lg" />
                  <div className="h-2 w-24 bg-slate-800 rounded" />
               </div>
               <div className="h-3 w-full bg-slate-800 rounded" />
               <div className="h-3 w-2/3 bg-slate-800 rounded" />
            </div>
          ))
        ) : error ? (
          <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] space-y-6 flex flex-col items-center text-center animate-in shake duration-500">
             <div className="p-4 bg-red-600/10 rounded-2xl">
                <Bug size={32} className="text-red-500" />
             </div>
             <div className="space-y-2">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest italic">Discovery Engine Fault</h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{error}</p>
             </div>
             <button 
              onClick={onRetryDiscovery}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
             >
               <RefreshCw size={12} />
               Retry Discovery
             </button>
          </div>
        ) : signatures.length > 0 ? (
          signatures.map((sig) => {
            const isSelected = selectedSignatures.includes(sig.id);
            const severityIcon = 
              sig.severity === Severity.FATAL ? <ShieldAlert size={14} className="text-red-500" /> :
              sig.severity === Severity.ERROR ? <AlertTriangle size={14} className="text-red-400" /> :
              <Info size={14} className="text-blue-400" />;

            return (
              <div 
                key={sig.id}
                onClick={() => onToggle(sig.id)}
                className={`relative group flex flex-col p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden
                  ${isSelected 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-xl'}`}
              >
                <div className="absolute top-5 right-5">
                  {isSelected ? <CheckCircle2 size={16} className="text-blue-500" /> : <div className="w-4 h-4 border border-slate-700 rounded-full" />}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {severityIcon}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-[11px] font-black font-mono truncate pr-6 ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>{sig.pattern}</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{sig.count} Occurrences</p>
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed font-medium italic line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                  "{sig.description}"
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[2.5rem]">
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">No signatures discovered</p>
             <button 
              onClick={onRetryDiscovery}
              className="mt-6 flex items-center gap-2 px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all mx-auto"
             >
                <RefreshCw size={12} />
                Force Scan
             </button>
          </div>
        )}
      </div>
      
      {!isLoading && signatures.length > 0 && (
        <div className="p-4 bg-emerald-600/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
          <Cpu size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 font-medium italic leading-relaxed">
            Select a specific signature node to focus the forensic engine's reasoning scope.
          </p>
        </div>
      )}
    </div>
  );
};
