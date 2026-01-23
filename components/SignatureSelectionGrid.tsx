
import React from 'react';
import { LogSignature, Severity } from '../types';
import { ShieldAlert, AlertTriangle, Info, Zap, CheckSquare, Square, Search, Activity, Cpu } from 'lucide-react';

interface SignatureSelectionGridProps {
  signatures: LogSignature[];
  selectedSignatures: string[];
  onToggle: (id: string) => void;
  onDeepDive: () => void;
  isLoading: boolean;
}

export const SignatureSelectionGrid: React.FC<SignatureSelectionGridProps> = ({ 
  signatures, 
  selectedSignatures, 
  onToggle, 
  onDeepDive,
  isLoading
}) => {
  if (signatures.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Search size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Discovery Signatures</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select patterns for Targeted Deep Dive</p>
          </div>
        </div>
        
        <button 
          onClick={onDeepDive}
          disabled={selectedSignatures.length === 0 || isLoading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl
            ${selectedSignatures.length > 0 
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
        >
          {isLoading ? (
            <Activity className="animate-spin" size={14} />
          ) : (
            <Zap size={14} />
          )}
          Targeted Forensic Dive ({selectedSignatures.length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900/40 border border-slate-800 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatures.map((sig) => {
            const isSelected = selectedSignatures.includes(sig.id);
            const severityIcon = 
              sig.severity === Severity.FATAL ? <ShieldAlert size={14} className="text-red-500" /> :
              sig.severity === Severity.ERROR ? <AlertTriangle size={14} className="text-red-400" /> :
              <Info size={14} className="text-blue-400" />;

            return (
              <div 
                key={sig.id}
                onClick={() => onToggle(sig.id)}
                className={`relative group flex flex-col p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer overflow-hidden
                  ${isSelected 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-xl'}`}
              >
                <div className="absolute top-6 right-6">
                  {isSelected ? (
                    <CheckSquare size={18} className="text-blue-500" />
                  ) : (
                    <Square size={18} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-800`}>
                    {severityIcon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 font-mono">{sig.pattern}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{sig.count} Occurrences</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium italic mb-4 line-clamp-2">
                  "{sig.description}"
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                  {sig.impacted_systems.slice(0, 2).map((sys, idx) => (
                    <div key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-widest">
                       {sys}
                    </div>
                  ))}
                  {sig.impacted_systems.length > 2 && (
                    <span className="text-[8px] text-slate-700 font-bold">+{sig.impacted_systems.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="p-4 bg-emerald-600/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
        <Cpu size={14} className="text-emerald-500" />
        <p className="text-[10px] text-slate-500 font-medium italic">
          Pattern Extraction Stage (v5.0) completed in <span className="text-emerald-400 font-black tracking-widest italic">4.2s</span>. Multi-node forensic context ready.
        </p>
      </div>
    </div>
  );
};
