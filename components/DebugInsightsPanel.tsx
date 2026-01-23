
import React, { useState } from 'react';
import { DebugSolution, CodeFix } from '../types';
import { ShieldCheck, Zap, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileCode, Lightbulb, Split, ArrowRight } from 'lucide-react';

interface DebugInsightsPanelProps {
  solutions: DebugSolution[];
}

export const DebugInsightsPanel: React.FC<DebugInsightsPanelProps> = ({ solutions }) => {
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);

  if (!solutions || solutions.length === 0) return null;

  const activeSolution = solutions[activeSolutionIdx];

  return (
    <div className="space-y-6 my-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Zap size={16} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Diagnostic Remediation Engine</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pattern-Matched Fix Proposals</p>
          </div>
        </div>
        
        {/* Solution Toggle */}
        <div className="flex gap-2">
          {solutions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSolutionIdx(idx)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                ${activeSolutionIdx === idx 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/30' 
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              Path {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Solution Strategy Header */}
        <div className="px-6 py-5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategy:</span>
              <span className="text-sm font-black text-blue-400 italic tracking-tight">{activeSolution.strategy}</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${activeSolution.confidence * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500">{(activeSolution.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-500 uppercase">Operational Match</span>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Root Cause Analysis */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <AlertCircle size={14} className="text-red-400" /> Root Cause Breakdown
            </div>
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50 text-[13px] text-slate-300 leading-relaxed font-medium italic border-l-4 border-l-red-500/50">
              "{activeSolution.rootCause}"
            </div>
          </div>

          {/* Fix Suggestions with Diff View */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <Split size={14} className="text-blue-400" /> Proposed Code Diff
            </div>
            
            {activeSolution.fixes.map((fix, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileCode size={14} className="text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">{fix.filePath}</span>
                  <div className="px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    {fix.title}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Original Code */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">Current Implementation</p>
                    <div className="bg-[#0c0f17] rounded-2xl p-4 border border-slate-800 font-mono text-[11px] leading-relaxed overflow-hidden shadow-inner">
                      {fix.originalCode.split('\n').map((line, i) => (
                        <div key={i} className="flex bg-red-500/5 border-l-2 border-red-500/30 -mx-4 px-4">
                          <span className="text-red-500/40 mr-3 shrink-0">-</span>
                          <span className="text-slate-500 line-through decoration-red-500/20">{line || ' '}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Code */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2">Proposed Revision</p>
                    <div className="bg-[#0c0f17] rounded-2xl p-4 border border-slate-800 font-mono text-[11px] leading-relaxed overflow-hidden shadow-inner">
                      {fix.suggestedCode.split('\n').map((line, i) => (
                        <div key={i} className="flex bg-emerald-500/5 border-l-2 border-emerald-500/30 -mx-4 px-4">
                          <span className="text-emerald-500 mr-3 shrink-0">+</span>
                          <span className="text-emerald-300 font-medium">{line || ' '}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Lightbulb size={12} /> Rationale
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {fix.explanation}
                  </p>
                  {fix.bestPractice && (
                    <div className="mt-3 pt-3 border-t border-blue-500/10 flex items-start gap-3">
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">Industry Standard Alignment</span>
                        <p className="text-[11px] text-slate-500 font-medium italic">"{fix.bestPractice}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Best Practices Check */}
          <div className="pt-4 border-t border-slate-800/60">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              <ShieldCheck size={14} className="text-emerald-400" /> Best Practice Guardrails
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSolution.bestPractices.map((bp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-slate-950/40 rounded-xl border border-slate-800/40 group hover:border-emerald-500/30 transition-all">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-bold tracking-tight">{bp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
