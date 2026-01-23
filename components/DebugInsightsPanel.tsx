
import React, { useState } from 'react';
import { DebugSolution, CodeFix, ChatMessage, ProcessingStats, CodeFile, UnitTest } from '../types';
import { ShieldCheck, Zap, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, FileCode, Lightbulb, Split, ArrowRight, FileOutput, ListOrdered, TestTube, ShieldCheck as ShieldIcon, Copy, Check } from 'lucide-react';
import { ExportCenter } from './ExportCenter';

interface DebugInsightsPanelProps {
  solutions: DebugSolution[];
  stats: ProcessingStats | null;
  messages: ChatMessage[];
  sourceFiles: CodeFile[];
}

export const DebugInsightsPanel: React.FC<DebugInsightsPanelProps> = ({ solutions, stats, messages, sourceFiles }) => {
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedTestIdx, setCopiedTestIdx] = useState<number | null>(null);

  if (!solutions || solutions.length === 0) return null;

  const activeSolution = solutions[activeSolutionIdx];

  const handleCopyTest = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedTestIdx(idx);
    setTimeout(() => setCopiedTestIdx(null), 2000);
  };

  const exportData = {
    stats,
    messages,
    solutions,
    sourceFiles,
    timestamp: new Date().toLocaleString()
  };

  return (
    <div className="space-y-4 my-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-blue-500" />
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Proposed Remediation</h4>
        </div>
        
        <div className="flex gap-2">
          {solutions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSolutionIdx(idx)}
              className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all
                ${activeSolutionIdx === idx 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              Fix {idx + 1}
            </button>
          ))}
          <button 
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <FileOutput size={14} />
          </button>
        </div>
      </div>

      {isExportOpen && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <ExportCenter data={exportData} activeSolution={activeSolution} />
        </div>
      )}

      <div className="bg-slate-900/30 rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Root Cause Diagnosis</span>
            <p className="text-[13px] text-slate-300 font-medium italic border-l-2 border-blue-500 pl-4">
              "{activeSolution.rootCause}"
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[9px] font-black text-emerald-500 uppercase">System Confidence</span>
             <span className="text-xl font-black text-white italic">{(activeSolution.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Fix Suggestions */}
        <div className="space-y-4">
          {activeSolution.fixes.map((fix, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCode size={12} className="text-blue-400" />
                <span className="text-[11px] font-black text-slate-300">{fix.filePath}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-[#050810] rounded-xl p-3 border border-slate-800/60 font-mono text-[11px] overflow-hidden">
                  <p className="text-[8px] font-bold text-red-500 uppercase mb-2 opacity-50">Current</p>
                  {fix.originalCode.split('\n').map((line, i) => (
                    <div key={i} className="flex opacity-50"><span className="mr-2 text-red-900">-</span>{line || ' '}</div>
                  ))}
                </div>
                <div className="bg-[#050810] rounded-xl p-3 border border-emerald-500/20 font-mono text-[11px] overflow-hidden">
                  <p className="text-[8px] font-bold text-emerald-500 uppercase mb-2">Suggested</p>
                  {fix.suggestedCode.split('\n').map((line, i) => (
                    <div key={i} className="flex"><span className="mr-2 text-emerald-900">+</span>{line || ' '}</div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic bg-slate-950/50 p-3 rounded-lg">
                <Lightbulb size={10} className="inline mr-1 text-amber-500" /> {fix.explanation}
              </p>
            </div>
          ))}
        </div>

        {/* Unit Test Generation */}
        {activeSolution.unitTests && activeSolution.unitTests.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800/60">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generated Validation Test</h5>
            {activeSolution.unitTests.map((test, i) => (
              <div key={i} className="relative group">
                <div className="bg-[#050810] rounded-xl p-4 border border-slate-800/60 font-mono text-[11px] text-blue-300/80 overflow-x-auto whitespace-pre">
                  {test.code}
                </div>
                <button 
                  onClick={() => handleCopyTest(test.code, i)}
                  className="absolute top-3 right-3 p-2 bg-slate-900 rounded-lg text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                >
                  {copiedTestIdx === i ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
