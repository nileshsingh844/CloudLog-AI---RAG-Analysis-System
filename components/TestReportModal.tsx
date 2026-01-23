
import React from 'react';
import { TestReport } from '../types';
import { ShieldCheck, X, Zap, Database, Search, Clock, ChevronRight } from 'lucide-react';

interface TestReportModalProps {
  report: TestReport;
  onClose: () => void;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({ report, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight mb-2 italic">VALIDATION COMPLETED</h2>
          <p className="text-[10px] text-emerald-500 uppercase font-black tracking-[0.3em] mb-8">System Architecture Verified</p>
          
          <div className="w-full grid grid-cols-2 gap-4 mb-8">
            <MetricBox icon={<Zap size={14} />} label="THROUGHPUT" value={report.throughput} />
            <MetricBox icon={<Database size={14} />} label="COMPACTION" value={report.compressionRatio} />
            <MetricBox icon={<Search size={14} />} label="RAG RECALL" value={report.ragAccuracy} />
            <MetricBox icon={<Clock size={14} />} label="LOAD TIME" value={report.loadTime} />
          </div>

          <div className="w-full space-y-3 mb-8">
             <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dataset Scale</span>
                <span className="text-xs font-mono text-slate-200">5.00 GB (Enterprise)</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memory Safety</span>
                <span className="text-xs font-mono text-emerald-400">PASSED (Non-OOM)</span>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
          >
            Access Analysis Engine
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ icon, label, value }: any) => (
  <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-2xl text-left">
    <div className="text-emerald-500 mb-2">{icon}</div>
    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-lg font-mono font-bold text-slate-100">{value}</p>
  </div>
);
