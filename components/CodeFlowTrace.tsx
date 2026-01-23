
import React from 'react';
import { CodeFlowStep, CodeFile } from '../types';
import { ChevronDown, ChevronRight, FileCode, Play, Terminal, Variable, MoveRight, ArrowDownRight, ExternalLink } from 'lucide-react';

interface CodeFlowTraceProps {
  steps: CodeFlowStep[];
  sourceFiles: CodeFile[];
}

export const CodeFlowTrace: React.FC<CodeFlowTraceProps> = ({ steps, sourceFiles }) => {
  return (
    <div className="space-y-6 my-8">
      <div className="flex items-center gap-3 px-2 mb-4">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <Play size={16} className="text-emerald-400" />
        </div>
        <div>
          <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Augmented Execution Trace</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Multi-file Caller-Callee Propagation</p>
        </div>
      </div>
      
      <div className="relative pl-6 space-y-0">
        {/* Main flow line */}
        <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500 via-slate-800 to-blue-500 opacity-40" />
        
        {steps.map((step, idx) => {
          const prevStep = idx > 0 ? steps[idx - 1] : null;
          const isNewFile = prevStep ? prevStep.file !== step.file : true;
          
          const file = sourceFiles.find(f => f.path.endsWith(step.file) || step.file.endsWith(f.path));
          
          // Windowing logic: Show 10 lines before and after for deep context
          const CONTEXT_WINDOW = 10;
          const snippet = file ? file.content.split('\n').slice(
            Math.max(0, step.line - CONTEXT_WINDOW - 1), 
            step.line + CONTEXT_WINDOW
          ) : null;
          
          const snippetStartLine = Math.max(1, step.line - CONTEXT_WINDOW);

          return (
            <div key={idx} className="relative pb-10 last:pb-0 group">
              {/* Connection bridge for file jumps */}
              {idx > 0 && isNewFile && (
                <div className="flex items-center gap-3 mb-6 ml-[-4px] animate-in fade-in slide-in-from-left-2 duration-700">
                  <div className="w-9 h-px bg-blue-500/30" />
                  <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center gap-2 shadow-lg shadow-blue-500/5">
                    <ArrowDownRight size={12} className="text-blue-400" />
                    <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">
                      Context Switch: {prevStep?.method} → {step.method}
                    </span>
                  </div>
                </div>
              )}

              {/* Step Node Marker */}
              <div className={`absolute -left-[3px] top-2 w-4 h-4 rounded-full bg-slate-950 border-2 z-10 shadow-lg transition-transform group-hover:scale-125
                ${idx === steps.length - 1 ? 'border-red-500 ring-4 ring-red-500/20' : 'border-blue-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-[3px] ${idx === steps.length - 1 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
              </div>
              
              <div className={`ml-8 bg-slate-900/40 border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-2xl
                ${idx === steps.length - 1 ? 'border-red-500/30' : 'border-slate-800 hover:border-blue-500/30'}
                animate-in slide-in-from-left-6 duration-700`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Header Information */}
                <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700/50">
                      <FileCode size={12} className="text-blue-400 shrink-0" />
                    </div>
                    <div className="truncate">
                      <span className="text-[11px] font-black text-slate-100 tracking-tight">{step.file}</span>
                      <span className="mx-2 text-slate-700">:</span>
                      <span className="text-[11px] font-black text-blue-400">Line {step.line}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-800 mx-1" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0 shadow-inner">
                      {step.method}
                    </span>
                  </div>
                  {idx === steps.length - 1 && (
                    <div className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[8px] font-black text-red-400 uppercase tracking-widest">
                      Crash Vector
                    </div>
                  )}
                </div>
                
                {/* Step Logic Description */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                     <p className="text-[13px] text-slate-300 font-medium leading-relaxed italic">
                       "{step.description}"
                     </p>
                  </div>
                  
                  {/* Code Snippet with 10-line Window */}
                  {snippet ? (
                    <div className="relative group/code">
                      <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800">10-Line Diagnostic Window</span>
                      </div>
                      <div className="bg-[#050810] rounded-2xl p-4 border border-slate-800/80 font-mono text-[11px] leading-relaxed overflow-hidden shadow-inner">
                        {snippet.map((line, i) => {
                          const lineNum = snippetStartLine + i;
                          const isTarget = lineNum === step.line;
                          return (
                            <div key={i} className={`flex transition-colors ${isTarget ? 'bg-blue-600/10 -mx-4 px-4 border-l-2 border-blue-500 shadow-[inset_10px_0_15px_-10px_rgba(59,130,246,0.3)]' : 'hover:bg-white/5'}`}>
                              <span className={`w-10 text-right pr-4 shrink-0 select-none font-bold ${isTarget ? 'text-blue-400' : 'text-slate-700'}`}>
                                {lineNum}
                              </span>
                              <span className={`whitespace-pre ${isTarget ? 'text-blue-100 font-medium' : 'text-slate-500'}`}>
                                {line || ' '}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                       <ShieldAlert size={16} className="text-slate-700" />
                       <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Source context not available in current sync node</p>
                    </div>
                  )}
                  
                  {/* Variable State Inference */}
                  {step.variableState && Object.keys(step.variableState).length > 0 && (
                    <div className="pt-2">
                      <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Variable size={12} className="text-purple-500" /> Inferred Variable Snapshot
                      </h5>
                      <div className="flex flex-wrap gap-2.5">
                        {Object.entries(step.variableState).map(([name, val], i) => (
                          <div key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 shadow-md group/var hover:border-purple-500/30 transition-all">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight group-hover/var:text-slate-300">{name}</span>
                            <div className="h-3 w-px bg-slate-800" />
                            <span className="text-[11px] text-emerald-400 font-mono font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ShieldAlert = ({ size, className }: any) => (
  <svg 
    width={size || 16} 
    height={size || 16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);
