
import React, { useEffect, useRef, useState } from 'react';
import { CodeFile, Severity } from '../types';
import { FileCode, AlertCircle, ShieldAlert, Info, Zap, ChevronUp, ChevronDown, ListFilter } from 'lucide-react';

interface CodeViewerProps {
  file: CodeFile;
  selectedLine?: number | null;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file, selectedLine }) => {
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeErrorIdx, setActiveErrorIdx] = useState(0);

  useEffect(() => {
    if (selectedLine && lineRefs.current[selectedLine]) {
      lineRefs.current[selectedLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedLine, file.path]);

  const scrollToLine = (line: number) => {
    if (lineRefs.current[line]) {
      lineRefs.current[line]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const lines = file.content.split('\n');
  const errorMarkers = React.useMemo(() => 
    [...(file.markers || [])].sort((a, b) => a.line - b.line),
    [file.markers]
  );

  return (
    <div className="flex flex-col h-full bg-[#050810] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Viewer Header */}
      <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 truncate">
          <div className="p-1.5 bg-blue-600/10 rounded-lg border border-blue-500/20">
            <FileCode size={14} className="text-blue-400" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-black text-slate-100 tracking-tight truncate uppercase italic">{file.path.split(/[/\\]/).pop()}</h3>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{file.path}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {errorMarkers.length > 0 && (
            <div className="flex items-center bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden shadow-lg shadow-red-950/20">
              <div className="px-3 py-1 flex items-center gap-2 border-r border-red-500/20">
                <ShieldAlert size={12} className="text-red-400" />
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{errorMarkers.length} Errors</span>
              </div>
              <div className="flex">
                <button 
                  onClick={() => {
                    const nextIdx = (activeErrorIdx - 1 + errorMarkers.length) % errorMarkers.length;
                    setActiveErrorIdx(nextIdx);
                    scrollToLine(errorMarkers[nextIdx].line);
                  }}
                  className="p-1.5 hover:bg-red-500/20 transition-colors text-red-400"
                >
                  <ChevronUp size={14} />
                </button>
                <button 
                  onClick={() => {
                    const nextIdx = (activeErrorIdx + 1) % errorMarkers.length;
                    setActiveErrorIdx(nextIdx);
                    scrollToLine(errorMarkers[nextIdx].line);
                  }}
                  className="p-1.5 hover:bg-red-500/20 transition-colors text-red-400 border-l border-red-500/20"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          )}
          <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">{file.language}</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Error Gutter Navigation (Left-side Minimap Radar) */}
        {errorMarkers.length > 0 && (
          <div className="w-1.5 bg-slate-900 border-r border-slate-800 shrink-0 relative group">
            {errorMarkers.map((m, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setActiveErrorIdx(idx);
                  scrollToLine(m.line);
                }}
                className={`absolute w-full h-1 bg-red-500 cursor-pointer hover:scale-x-[3] transition-transform z-20 shadow-[0_0_5px_rgba(239,68,68,0.5)] ${activeErrorIdx === idx ? 'scale-x-[4] ring-1 ring-white' : ''}`}
                style={{ top: `${((m.line - 1) / lines.length) * 100}%` }}
                title={`Line ${m.line}: ${m.message}`}
              />
            ))}
          </div>
        )}

        {/* Code Content */}
        <div ref={containerRef} className="flex-1 overflow-auto scrollbar-hide font-mono text-[12px] leading-relaxed p-4 bg-[#050810]">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isSelected = selectedLine === lineNum;
            const marker = errorMarkers.find(m => m.line === lineNum);

            return (
              <div 
                key={i} 
                ref={el => { lineRefs.current[lineNum] = el; }}
                className={`flex group relative min-h-[1.5rem] transition-colors
                  ${isSelected 
                    ? 'bg-blue-600/20 -mx-4 px-4 border-l-2 border-blue-500 shadow-[inset_15px_0_20px_-10px_rgba(59,130,246,0.3)]' 
                    : marker 
                    ? 'bg-red-500/15 -mx-4 px-4 border-l-2 border-red-600 shadow-[inset_15px_0_20px_-10px_rgba(239,68,68,0.2)]' 
                    : 'hover:bg-slate-800/30'}
                `}
              >
                <div className={`w-12 text-right pr-4 shrink-0 select-none border-r border-slate-800/50 mr-4 font-bold transition-colors
                  ${isSelected ? 'text-blue-400' : marker ? 'text-red-500' : 'text-slate-700'}
                `}>
                  {lineNum}
                </div>
                <div className={`whitespace-pre transition-colors ${isSelected ? 'text-blue-100 font-medium' : marker ? 'text-red-100' : 'text-slate-400'}`}>
                  {line || ' '}
                </div>

                {marker && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                    <div className="bg-red-950 border border-red-500/50 px-3 py-1.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 animate-in zoom-in-95 duration-200">
                      <div className="p-1 bg-red-500/20 rounded-lg">
                        <Zap size={10} className="text-red-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-red-500 tracking-widest">{marker.severity} SIGNAL</span>
                        <span className="text-[10px] font-bold text-slate-200">{marker.message.substring(0, 60)}{marker.message.length > 60 ? '...' : ''}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
