
import React, { memo } from 'react';
import { ProcessingStats, Severity } from '../types';
import { Hash, ShieldAlert, Cpu, Clock, Activity, Target } from 'lucide-react';

interface ProcessingSummaryProps {
  stats: ProcessingStats;
}

export const ProcessingSummary: React.FC<ProcessingSummaryProps> = memo(({ stats }) => {
  const errorCount = (stats.severities[Severity.ERROR] || 0) + (stats.severities[Severity.FATAL] || 0);
  const warnCount = stats.severities[Severity.WARN] || 0;
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000 mb-8">
      <div className="flex items-center gap-2 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Forensic Audit</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock 
          icon={<Hash size={16} className="text-blue-400" />} 
          label="Logs" 
          value={stats.totalEntries.toLocaleString()} 
          sub="Total signals"
        />
        <StatBlock 
          icon={<ShieldAlert size={16} className="text-red-400" />} 
          label="Faults" 
          value={errorCount.toLocaleString()} 
          sub={`${warnCount} warnings`}
          isAlert={errorCount > 0}
        />
        <StatBlock 
          icon={<Cpu size={16} className="text-emerald-400" />} 
          label="Clusters" 
          value={stats.uniqueEntries.toLocaleString()} 
          sub="Logic signatures"
        />
        <StatBlock 
          icon={<Target size={16} className="text-purple-400" />} 
          label="RAG Set" 
          value={formatSize(stats.fileSize)} 
          sub="Ingested size"
        />
      </div>

      <div className="px-4 py-2 bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={12} className="text-slate-600" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingestion Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-blue-500" />
          <span className="text-[9px] font-bold text-slate-600 italic">Optimized heap occupancy</span>
        </div>
      </div>
    </div>
  );
});

const StatBlock = ({ icon, label, value, sub, isAlert }: any) => (
  <div className={`p-5 rounded-2xl border transition-all duration-300 group
    ${isAlert ? 'bg-red-500/[0.02] border-red-500/10' : 'bg-slate-900/40 border-white/[0.03]'}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg border ${isAlert ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-950 border-white/5'}`}>
        {icon}
      </div>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-xl font-black italic tracking-tighter ${isAlert ? 'text-red-400' : 'text-white'}`}>
      {value}
    </p>
    <p className="text-[9px] font-bold text-slate-600 mt-0.5 uppercase truncate">{sub}</p>
  </div>
);

ProcessingSummary.displayName = 'ProcessingSummary';
