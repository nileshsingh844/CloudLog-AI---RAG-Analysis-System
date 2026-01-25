
import React from 'react';
import { CodeFlowStep, CodeFile } from '../types';
import { ChevronDown, ChevronRight, FileCode, Play, Terminal, Variable, MoveRight, ArrowDownRight, ExternalLink, Hash, Link as LinkIcon } from 'lucide-react';
import { useLogStore } from '../store/useLogStore';

interface CodeFlowTraceProps {
  steps: CodeFlowStep[];
  sourceFiles: CodeFile[];
}

export const CodeFlowTrace: React.FC<CodeFlowTraceProps> = ({ steps, sourceFiles }) => {
  const { setSelectedLocation } = useLogStore();

  return (
    <div className="space-y-0 my-8">
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Play size={16} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-[0.15em]">Neural Control Flow</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Multi-Node Execution Chain</p>
          </div>
        </div>
        
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
          <Hash size={10} className="text-slate-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{steps.length} Logics Segments</span>
        </div>
      </div>
      
      <div className="relative pl-12 pr-2">
        {/* Main Vertical Trunk Rail */}
        <div className="absolute left-[25px] top-6 bottom-6 w-[2px] bg-slate-800/40" />
        
        {/* Animated Flow Gradient Overlay (The "Electricity" Pulse) */}
        <div className="absolute left-[25px] top-6 bottom-6 w-[2px] overflow-hidden rounded-full pointer-events-none">
           <div className="w-full h-24 bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-[flow-pulse_3s_linear_infinite]" 
                style={{ top: '-100px', position: 'absolute' }} />
        </div>

        {steps.map((step, idx) => {
          const prevStep = idx > 0 ? steps[idx - 1] : null;
          const isNewFile = prevStep ? prevStep.file !== step.file : true;
          const isLast = idx === steps.length - 1;
          
          const file = sourceFiles.find(f => f.path.endsWith(step.file) || step.file.endsWith(f.path));
          const CONTEXT_WINDOW = 6;
          const snippet = file ? file.content.split('\n').slice(
            Math.max(0, step.line - CONTEXT_WINDOW - 1), 
            step.line + CONTEXT_WINDOW
          ) : null;
          
          const snippetStartLine = Math.max(1, step.line - CONTEXT_WINDOW);

          return (
            <div key={idx} className="relative pb-14 last:pb-0 group">
              
              {/* Connector Bridge for File Transitions */}
              {idx > 0 && (
                <div className="absolute left-[-25px] top-[-56px] w-[25px] h-[56px] pointer-events-none">
                  {isNewFile ? (
                    <svg className="w-full h-full text-blue-500/30" viewBox="0 0 25 56" fill="none">
                      <path d="M25 0V15C25 25 10 25 10 35V56" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                      <circle cx="25" cy="0" r="3" fill="currentColor" />
                    </svg>
                  ) : (
                    <div className="h-full w-px bg-blue-500/20 ml-[25px]" />
                  )}
                </div>
              )}

              {/* Status/Step Node Marker */}
              <div className={`absolute -left-[36px] top-1 w-10 h-10 rounded-2xl bg-[#0d0f14] border-2 z-20 shadow-2xl transition-all duration-500 group-hover:scale-110 flex items-center justify-center
                ${isLast ? 'border-red-500/80 shadow-red-500/20' : 'border-slate-800 group-hover:border-blue-500'}`}>
                <span className={`text-[10px] font-black italic ${isLast ? 'text-red-500' : 'text-slate-500 group-hover:text-blue-400'}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {isLast && (
                  <div className="absolute -inset-1.5 bg-red-500/10 rounded-2xl animate-ping opacity-30" />
                )}
              </div>
              
              <div 
                onClick={() => setSelectedLocation({ filePath: step.file, line: step.line })}
                className={`bg-slate-900/30 border rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-xl cursor-pointer relative
                ${isLast ? 'border-red-500/30 bg-red-950/5' : 'border-slate-800/80 hover:border-blue-500/40'}
                animate-in slide-in-from-left-6 duration-700 group-hover:shadow-blue-500/5`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                
                {/* Internal Flow Connector Shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header: File & Method Identity */}
                <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 transition-colors
                  ${isLast ? 'bg-red-950/10 border-red-900/20' : 'bg-slate-900/60 border-slate-800/80 group-hover:bg-slate-800/40'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-xl border transition-colors
                      ${isLast ? 'bg-red-900/20 border-red-500/20' : 'bg-slate-950 border-slate-800 group-hover:border-blue-500/20'}`}>
                      <FileCode size={14} className={isLast ? 'text-red-400' : 'text-blue-400'} />
                    </div>
                    <div className="truncate flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="text-[11px] font-black text-slate-100 tracking-tight truncate">{step.file.split(/[/\\]/).pop()}</span>
                         {isNewFile && <LinkIcon size={10} className="text-blue-500/60" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">Line {step.line}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{step.method || 'Anonymous Context'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isNewFile && idx > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/5 border border-blue-500/10 rounded-lg animate-pulse">
                      <MoveRight size={10} className="text-blue-400" />
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Cross-File Jump</span>
                    </div>
                  )}
                </div>
                
                {/* Content: Logical Step Description & Snippet */}
                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                     <div className={`mt-1.5 shrink-0 ${isLast ? 'text-red-500' : 'text-blue-500'}`}>
                        <ArrowDownRight size={16} />
                     </div>
                     <p className={`text-[13px] leading-relaxed font-semibold italic ${isLast ? 'text-red-200' : 'text-slate-300'}`}>
                       "{step.description}"
                     </p>
                  </div>
                  
                  {/* Semantic Context Snippet with Code Connectors */}
                  {snippet ? (
                    <div className="relative group/code rounded-2xl overflow-hidden border border-slate-800/80 bg-[#020408] shadow-inner">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800/50">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Diagnostic Logic Window</span>
                        <ExternalLink size={10} className="text-slate-700 group-hover/code:text-blue-400 transition-colors" />
                      </div>
                      <div className="p-4 font-mono text-[11px] leading-relaxed scrollbar-hide">
                        {snippet.map((line, i) => {
                          const lineNum = snippetStartLine + i;
                          const isTarget = lineNum === step.line;
                          return (
                            <div key={i} className={`flex transition-colors relative ${isTarget ? 'bg-blue-600/10 -mx-4 px-4 border-l-2 border-blue-500' : 'opacity-30 hover:opacity-80 hover:bg-white/5'}`}>
                              <span className={`w-12 text-right pr-4 shrink-0 select-none font-bold ${isTarget ? 'text-blue-400' : 'text-slate-700'}`}>
                                {lineNum}
                              </span>
                              <span className={`whitespace-pre ${isTarget ? 'text-blue-100 font-medium' : 'text-slate-500'}`}>
                                {line || ' '}
                              </span>
                              {isTarget && (
                                <div className="absolute right-4 top-0 h-full flex items-center">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-tighter">Event Point</span>
                                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                       <Terminal size={24} className="text-slate-700" />
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Source Mapping Unavailable</p>
                    </div>
                  )}
                  
                  {/* Variable State Snapshot */}
                  {step.variableState && Object.keys(step.variableState).length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Variable size={12} className="text-blue-500" />
                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inferred Runtime State</h5>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {Object.entries(step.variableState).map(([name, val], i) => (
                          <div key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 shadow-lg group/var hover:border-blue-500/30 transition-all">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover/var:text-blue-200">{name}</span>
                            <div className="h-3 w-px bg-slate-800" />
                            <span className="text-[11px] text-emerald-400 font-mono font-bold">{String(val)}</span>
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
      
      <style>{`
        @keyframes flow-pulse {
          0% { transform: translateY(0); }
          100% { transform: translateY(1000px); }
        }
      `}</style>
    </div>
  );
};
