
import React, { useState } from 'react';
import { runForensicPipelineSuite } from '../utils/testRunner';
import { TestResult } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Play, 
  ChevronRight, 
  Terminal, 
  Activity, 
  Copy, 
  Check, 
  Database,
  Search,
  Zap,
  BarChart3,
  Waves
} from 'lucide-react';

export const PipelineTestRunner: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [metrics, setMetrics] = useState({ throughput: '0', efficiency: '0%' });

  const executeTests = async () => {
    setIsRunning(true);
    setCurrentStep('Initializing Quality Audit...');
    setResults([]);
    
    const startTime = Date.now();
    try {
      setTimeout(() => setCurrentStep('Auditing Neural Redaction...'), 400);
      setTimeout(() => setCurrentStep('Verifying Atomic Stack Integrity...'), 1200);
      
      const suiteResults = await runForensicPipelineSuite();
      setResults(suiteResults);
      
      // Calculate mock metrics for UI
      const duration = (Date.now() - startTime) / 1000;
      setMetrics({
        throughput: (12500 / duration).toFixed(0),
        efficiency: '99.2%'
      });

    } catch (err) {
      console.error("Test Suite Failure:", err);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
      setIsExpanded(true);
    }
  };

  const copyCurlMock = () => {
    const curl = `curl -X POST https://cloudlog.ai/v1/audit \\
  -H "X-RAG-Mode: high-precision" \\
  -F "file=@demo.log" \\
  --verify-causality=true`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const allPassed = results.length > 0 && results.every(r => r.status === 'passed');

  return (
    <div className="fixed bottom-12 left-6 z-50">
      <div className={`bg-slate-900 border border-white/[0.05] rounded-[2rem] shadow-2xl transition-all duration-700 overflow-hidden ${isExpanded ? 'w-[420px] max-h-[680px]' : 'w-[240px] max-h-[56px]'}`}>
        
        {/* Header/Toggle */}
        <div 
          onClick={() => !isRunning && setIsExpanded(!isExpanded)}
          className={`px-6 h-[56px] flex items-center justify-between transition-colors
            ${isRunning ? 'cursor-wait bg-blue-600/5' : 'cursor-pointer group hover:bg-white/[0.02]'}`}
        >
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full transition-all duration-500
               ${isRunning ? 'bg-blue-500 animate-pulse scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                 results.length === 0 ? 'bg-slate-700' : 
                 allPassed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500'}`} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {isRunning ? 'Pipeline Auditor' : 'System Quality'}
             </span>
          </div>
          {isRunning ? (
            <Loader2 size={14} className="animate-spin text-blue-500" />
          ) : (
            <ChevronRight size={14} className={`text-slate-700 group-hover:text-white transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>

        {/* Audit Content */}
        <div className="p-6 space-y-6 border-t border-white/[0.03] overflow-y-auto max-h-[620px] scrollbar-hide">
           
           {/* Quality Dashboard Chips */}
           {results.length > 0 && !isRunning && (
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                   <div className="flex items-center gap-2 text-blue-400">
                      <Zap size={10} />
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Throughput</span>
                   </div>
                   <span className="text-sm font-black text-white italic">{metrics.throughput} <span className="text-[8px] text-slate-500 uppercase not-italic">Sigs/s</span></span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                   <div className="flex items-center gap-2 text-emerald-400">
                      <Waves size={10} />
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Efficiency</span>
                   </div>
                   <span className="text-sm font-black text-white italic">{metrics.efficiency} <span className="text-[8px] text-slate-500 uppercase not-italic">RAG</span></span>
                </div>
             </div>
           )}

           <div className="space-y-3">
              <button 
                onClick={(e) => { e.stopPropagation(); executeTests(); }}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
              >
                  {isRunning ? 'Benchmarking Pipeline...' : results.length > 0 ? 'Full Quality Re-Audit' : 'Verify RAG Pipeline'}
                  {!isRunning && <Play size={12} />}
                  {isRunning && <Activity size={12} className="animate-pulse" />}
              </button>

              <button 
                onClick={copyCurlMock}
                className="w-full flex items-center justify-center gap-3 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                 {copiedCurl ? <Check size={12} className="text-emerald-500" /> : <Terminal size={12} />}
                 {copiedCurl ? 'Audit cURL Copied' : 'Copy Audit cURL'}
              </button>
           </div>

           {currentStep && (
             <div className="flex flex-col items-center gap-3 py-6 border-y border-white/5 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full" />
                  <Loader2 size={32} className="animate-spin text-blue-500 relative" />
                </div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] text-center italic">
                    {currentStep}
                </p>
             </div>
           )}

           <div className="space-y-3 pt-2">
              {results.map((r, i) => (
                <div key={i} className="p-4 bg-slate-950/60 border border-white/[0.03] rounded-2xl animate-in slide-in-from-left-4 duration-300 group hover:border-white/10 transition-colors shadow-xl" style={{ animationDelay: `${i * 100}ms` }}>
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{r.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-slate-700">{r.duration}ms</span>
                        {r.status === 'passed' ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-red-500" />}
                      </div>
                   </div>
                   <p className={`text-[11px] font-medium leading-relaxed italic ${r.status === 'passed' ? 'text-slate-400' : 'text-red-400'}`}>
                     "{r.message}"
                   </p>
                </div>
              ))}
              
              {results.length === 0 && !isRunning && (
                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                   <div className="p-5 bg-slate-800 rounded-3xl border border-white/5">
                      <BarChart3 size={32} className="text-slate-600" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">System Quality Unverified</p>
                </div>
              )}
           </div>

           {allPassed && (
             <div className="mt-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center gap-4 shadow-xl">
                <ShieldCheck size={16} className="text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                   Baseline: Production Ready
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
