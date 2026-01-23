
import React from 'react';
import { FlaskConical, Play, Zap, ShieldAlert, BarChart3, Terminal, ClipboardCheck } from 'lucide-react';

interface TestCenterProps {
  onSimulateLargeFile: () => void;
  onRunPrompt: (prompt: string) => void;
  onRunRegressive: () => void;
  isProcessing: boolean;
}

export const TestCenter: React.FC<TestCenterProps> = ({ onSimulateLargeFile, onRunPrompt, onRunRegressive, isProcessing }) => {
  const scenarios = [
    {
      id: 'root-cause',
      title: 'Root Cause Analysis',
      icon: <Terminal className="text-blue-400" size={14} />,
      prompt: 'Perform a full root cause analysis on the cascading failures between 10:00 and 10:15. Identify which microservice failed first and why.',
      desc: 'Tests temporal logic & cross-chunk reasoning.'
    },
    {
      id: 'security',
      title: 'Security Audit',
      icon: <ShieldAlert className="text-red-400" size={14} />,
      prompt: 'Scan the access logs for SQL injection attempts or unauthorized admin access. List all offending IP addresses and timestamps.',
      desc: 'Tests pattern recognition & security context.'
    },
    {
      id: 'performance',
      title: 'Latency Regression',
      icon: <BarChart3 className="text-emerald-400" size={14} />,
      prompt: 'Are there any recurring performance regressions in the database layer? Compare query latencies across the entire log file.',
      desc: 'Tests multi-chunk aggregation & math reasoning.'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-xl">
          <FlaskConical className="text-purple-400 w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Diagnostic Test Center</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Validation Suite v2.7</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">System Validation</h3>
          <button 
            onClick={onSimulateLargeFile}
            disabled={isProcessing}
            className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="text-white w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-200">Simulate 5GB Stream</p>
                <p className="text-[10px] text-slate-500">Virtual Ingestion Test</p>
              </div>
            </div>
            <Play className="text-slate-600 group-hover:text-blue-400 transition-colors" size={16} />
          </button>

          <button 
            onClick={onRunRegressive}
            disabled={isProcessing}
            className="w-full p-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded-xl transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="text-white w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-purple-200">Regressive Suite</p>
                <p className="text-[10px] text-purple-500/70">Full Engineering Benchmarking</p>
              </div>
            </div>
            <Play className="text-purple-600 group-hover:text-purple-400 transition-colors" size={16} />
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Enterprise Scenarios</h3>
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => onRunPrompt(s.prompt)}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{s.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
            </button>
          ))}
        </section>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
          <p className="text-[9px] text-blue-400 font-medium leading-relaxed italic">
            "Testing reveals the presence of bugs, not their absence. Use Pro models for high-reasoning scenarios."
          </p>
        </div>
      </div>
    </div>
  );
};
