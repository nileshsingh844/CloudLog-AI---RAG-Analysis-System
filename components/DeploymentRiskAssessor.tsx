
import React, { useState } from 'react';
import { DeploymentRisk } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Search, 
  ChevronRight, 
  Database, 
  Zap, 
  Github, 
  Code,
  FileSearch,
  CheckCircle2,
  ShieldX,
  Gauge
} from 'lucide-react';

interface DeploymentRiskAssessorProps {
  onCheckRisk: (summary: string) => void;
  currentRisk: DeploymentRisk | null;
}

export const DeploymentRiskAssessor: React.FC<DeploymentRiskAssessorProps> = ({ onCheckRisk, currentRisk }) => {
  const [summary, setSummary] = useState('');

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 shadow-xl">
            <Gauge size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Deployment Guardrail</span>
         </div>
         <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Pre-Deploy Risk Assessment</h2>
         <p className="text-slate-500 max-w-lg mx-auto italic font-medium leading-relaxed">
            Audit planned code changes, migrations, and dependencies against historical failure signatures to predict production impact.
         </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-8">
         <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
               <FileSearch size={14} className="text-blue-500" />
               Change Summary / Diff Snapshot
            </label>
            <textarea 
               value={summary}
               onChange={(e) => setSummary(e.target.value)}
               placeholder="Describe changes (e.g., 'Updating redis version, adding orders table migration...')"
               className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-slate-200 placeholder:text-slate-700 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none min-h-[160px] font-medium leading-relaxed italic"
            />
            <button 
               onClick={() => onCheckRisk(summary)}
               disabled={!summary}
               className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-40"
            >
               Run Predictive Risk Scan
               <ChevronRight size={18} />
            </button>
         </div>

         {currentRisk && (
           <div className="animate-in slide-in-from-top-4 duration-500 space-y-8 pt-8 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 bg-slate-950/50 rounded-[2.5rem] border border-slate-800 shadow-inner">
                 <div className="flex items-center gap-6">
                    <RiskGauge score={currentRisk.score} />
                    <div>
                       <h3 className={`text-xl font-black italic uppercase tracking-tighter ${
                          currentRisk.level === 'CRITICAL' ? 'text-red-500' : 
                          currentRisk.level === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'
                       }`}>
                          {currentRisk.level} Deployment Risk
                       </h3>
                       <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">Confidence Score: 89.4%</p>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all">
                       <Github size={14} /> Link PR
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                       <Search size={12} className="text-blue-500" />
                       Intelligence Findings
                    </h4>
                    <div className="space-y-3">
                       {currentRisk.findings.map((f, i) => (
                         <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-4">
                            <div className={`p-2 rounded-lg mt-1 ${
                               f.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                               {f.type === 'migration' ? <Database size={14} /> : <Code size={14} />}
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-200">{f.message}</p>
                               <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Priority: {f.severity}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                       <ShieldCheck size={12} className="text-emerald-500" />
                       Strategic Recommendation
                    </h4>
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] shadow-xl">
                       <p className="text-sm font-bold text-slate-300 italic leading-relaxed">
                         "{currentRisk.recommendation}"
                       </p>
                       <div className="mt-6 space-y-3">
                          <CheckItem label="Review migration for potential lock-wait" />
                          <CheckItem label="Verify redis pub/sub API compatibility" />
                          <CheckItem label="Run performance smoke tests on staging" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

const RiskGauge = ({ score }: { score: number }) => (
  <div className="relative w-20 h-20">
     <svg className="w-full h-full transform -rotate-90">
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900" />
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className={score > 7 ? 'text-red-500' : score > 4 ? 'text-amber-500' : 'text-emerald-500'} strokeDasharray={214} strokeDashoffset={214 - (score/10) * 214} />
     </svg>
     <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white italic">{score}</span>
        <span className="text-[8px] font-bold text-slate-500 uppercase">/10</span>
     </div>
  </div>
);

const CheckItem = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
     <div className="w-4 h-4 bg-emerald-600/20 border border-emerald-600/30 rounded flex items-center justify-center">
        <CheckCircle2 size={10} className="text-emerald-500" />
     </div>
     <span className="text-[11px] font-medium text-slate-500 italic">{label}</span>
  </div>
);
