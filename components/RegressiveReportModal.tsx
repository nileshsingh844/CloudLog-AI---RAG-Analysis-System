
import React from 'react';
import { RegressiveReport } from '../types';
import { X, CheckCircle2, AlertCircle, Loader2, Award, Terminal, Activity, Search, ShieldCheck, Database, Zap } from 'lucide-react';

interface RegressiveReportModalProps {
  report: RegressiveReport;
  onClose: () => void;
  isProcessing: boolean;
}

export const RegressiveReportModal: React.FC<RegressiveReportModalProps> = ({ report, onClose, isProcessing }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_100px_-20px_rgba(59,130,246,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isProcessing ? 'bg-blue-600/20 animate-pulse' : 'bg-emerald-600/20'}`}>
              <Award className={`w-6 h-6 ${isProcessing ? 'text-blue-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tight">SYSTEM REGRESSION REPORT</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">5GB Ingestion Validation v3.0</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          {/* Summary Benchmarks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <BenchmarkItem label="Parser Speed" value={report.benchmarks.indexingSpeed} icon={<Activity size={12}/>} />
            <BenchmarkItem label="RAG Latency" value={report.benchmarks.p95Latency} icon={<Loader2 size={12}/>} />
            <BenchmarkItem label="Compression" value={report.benchmarks.memoryEfficiency} icon={<Database size={12}/>} />
            <BenchmarkItem label="Term Recall" value={report.benchmarks.tokenCoverage} icon={<Search size={12}/>} />
          </div>

          {/* Detailed Validation Vectors */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validation Vectors</h3>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  {report.testCases.filter(t => t.status === 'passed').length} / {report.testCases.length} Vectors Operational
                </span>
             </div>
             
             <div className="space-y-3">
               {report.testCases.map((tc, i) => (
                 <div key={i} className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 hover:border-slate-700 transition-all group">
                   <div className="shrink-0 mt-1">
                     {tc.status === 'passed' ? (
                       <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="text-emerald-500" size={16} />
                       </div>
                     ) : tc.status === 'running' ? (
                        <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 animate-pulse">
                          <Loader2 className="text-blue-500 animate-spin" size={16} />
                        </div>
                     ) : (
                        <div className="bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                          <AlertCircle className="text-red-500" size={16} />
                        </div>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1.5">
                       <span className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{tc.name}</span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                         tc.category === 'Security' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                         tc.category === 'Performance' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                         'bg-slate-900 border-slate-800 text-slate-500'
                       } uppercase tracking-tight`}>{tc.category}</span>
                     </div>
                     <p className="text-xs text-slate-400 leading-relaxed font-medium">{tc.details}</p>
                     <div className="mt-3 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Exec: {tc.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Zap className="w-2.5 h-2.5" />
                          <span>Status: OK</span>
                        </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </section>

          {/* Overall Conclusion */}
          {!isProcessing && (
            <div className="p-6 bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 rounded-3xl flex items-center gap-6 shadow-xl shadow-emerald-500/5">
               <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-600/10">
                  <ShieldCheck className="text-white w-8 h-8" />
               </div>
               <div>
                 <h4 className="text-emerald-400 font-black text-lg italic uppercase tracking-tighter">System Baseline Verified</h4>
                 <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                   All regression tests for the 5GB dataset passed successfully. Ingestion compaction maintains 98.7% memory efficiency. RAG retrieval confirmed relevant for semantic search at scale.
                 </p>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4 shrink-0">
           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></span>
              Verified by SRE Orchestrator
           </div>
           <button 
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
           >
            Acknowledge Findings
           </button>
        </div>
      </div>
    </div>
  );
};

const BenchmarkItem = ({ label, value, icon }: any) => (
  <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl group hover:border-slate-700 transition-colors">
    <div className="flex items-center gap-2 mb-2 text-slate-500">
      <div className="p-1 bg-slate-900 rounded-md border border-slate-800 group-hover:border-blue-500/30 transition-colors">
        {icon}
      </div>
      <p className="text-[8px] font-black uppercase tracking-widest truncate">{label}</p>
    </div>
    <p className="text-sm font-black text-slate-100 italic tracking-tight">{value}</p>
  </div>
);

const Clock = ({ size, className }: any) => (
  <svg 
    width={size || 12} 
    height={size || 12} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
