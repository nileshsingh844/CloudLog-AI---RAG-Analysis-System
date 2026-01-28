
import React from 'react';
import { DiffChunk } from '../types';
import { Minus, Plus, FileCode, AlertCircle } from 'lucide-react';

interface DiffViewerProps {
  chunk?: DiffChunk;
  filePath: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ chunk, filePath }) => {
  if (!chunk) {
    return (
      <div className="rounded-[2rem] border border-white/[0.05] bg-[#050810] p-10 flex flex-col items-center justify-center gap-4 opacity-50">
        <AlertCircle size={32} className="text-slate-700" />
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diff Fragment Unavailable</p>
          <p className="text-[9px] text-slate-600 font-bold mt-1 italic">The forensic engine could not synthesize a precise code delta for this fix.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/[0.05] bg-[#050810] overflow-hidden shadow-2xl">
      <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode size={14} className="text-blue-500" />
          <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{(filePath || 'patch.diff').split(/[/\\]/).pop()}</span>
        </div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">@@ L{chunk.startLine || 0} @@</span>
      </div>

      <div className="p-0 font-mono text-[13px] leading-relaxed">
        <div className="bg-red-500/10 border-l-4 border-red-500/50 py-3 px-6 flex gap-4">
           <Minus size={14} className="text-red-500 mt-1 shrink-0" />
           <div className="text-red-200/80 whitespace-pre italic line-through decoration-red-500/30">
             {chunk.original || 'No base content'}
           </div>
        </div>
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500/50 py-3 px-6 flex gap-4">
           <Plus size={14} className="text-emerald-500 mt-1 shrink-0" />
           <div className="text-emerald-200 font-medium whitespace-pre">
             {chunk.suggested || 'No proposed content'}
           </div>
        </div>
      </div>
    </div>
  );
};
