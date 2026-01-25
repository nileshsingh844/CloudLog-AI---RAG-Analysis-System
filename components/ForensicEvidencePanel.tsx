
import React, { memo, useState, useMemo, useCallback } from 'react';
import { LogSignature, Severity, ProcessingStats, LogEntry } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Database, 
  Activity, 
  Map, 
  BarChart3, 
  Clock, 
  Hash, 
  Cpu, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  LayoutPanelLeft, 
  Globe, 
  Terminal, 
  Search, 
  Pin, 
  Copy, 
  LayoutList, 
  X, 
  Check, 
  Filter,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface ForensicEvidencePanelProps {
  stats: ProcessingStats | null;
  logs: LogEntry[];
  activeSignature: LogSignature | null;
  allSignatures: LogSignature[];
}

export const ForensicEvidencePanel: React.FC<ForensicEvidencePanelProps> = memo(({ stats, logs, activeSignature, allSignatures }) => {
  const [showGlobalStats, setShowGlobalStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [contextId, setContextId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!stats) return null;

  const isInvestigationActive = !!activeSignature;

  // Filter logs matching the active signature and search criteria
  const filteredLogs = useMemo(() => {
    if (!activeSignature) return [];
    
    // Attempt to find logs that match the signature pattern or metadata
    const matches = logs.filter(log => {
      // Basic fuzzy matching on the pattern or raw content
      const signatureMatch = log.metadata.signature === activeSignature.pattern || 
                           log.raw.toLowerCase().includes(activeSignature.pattern.toLowerCase()) ||
                           activeSignature.sample.toLowerCase().includes(log.raw.toLowerCase());
      
      if (!signatureMatch && !pinnedIds.has(log.id)) return false;

      const severityMatch = severityFilter === 'ALL' || log.severity === severityFilter;
      const searchMatch = !searchTerm || log.raw.toLowerCase().includes(searchTerm.toLowerCase());

      return severityMatch && searchMatch;
    });

    return matches;
  }, [activeSignature, logs, searchTerm, severityFilter, pinnedIds]);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const getSurroundingContext = useCallback((id: string) => {
    setContextId(id);
  }, []);

  const contextLogs = useMemo(() => {
    if (!contextId) return [];
    const idx = logs.findIndex(l => l.id === contextId);
    if (idx === -1) return [];
    return logs.slice(Math.max(0, idx - 20), Math.min(logs.length, idx + 21));
  }, [contextId, logs]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSeverityFilter('ALL');
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] border-r border-slate-900 overflow-hidden animate-in fade-in slide-in-from-left duration-700">
      
      {/* Evidence Panel Header */}
      <div className="px-6 py-6 border-b border-slate-900 bg-slate-950/30 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-lg">
              <Database size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Evidence Lock</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">Interactive Forensic Lab</p>
            </div>
          </div>
        </div>

        {/* Hidden System Overview Toggle */}
        <button 
          onClick={() => setShowGlobalStats(!showGlobalStats)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest
            ${showGlobalStats 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
        >
          <div className="flex items-center gap-2">
            <Globe size={12} />
            System Overview
          </div>
          {showGlobalStats ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showGlobalStats && (
          <div className="mt-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Global signals</p>
              <p className="text-sm font-black text-slate-200 italic">{stats.totalEntries.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Total nodes</p>
              <p className="text-sm font-black text-blue-400 italic">{stats.uniqueChunks}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!isInvestigationActive ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
             <div className="p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] relative group">
                <Activity size={48} className="text-slate-800 group-hover:text-blue-500/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Info size={20} className="text-slate-700 animate-pulse" />
                </div>
             </div>
             <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Awaiting Forensic Anchor</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                  Select a logic signature from the discovery panel to populate evidence here.
                </p>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
            {/* Context & Metadata Banner */}
            <div className="p-6 space-y-4 border-b border-slate-900">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Hash size={12} className="text-blue-400" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px] italic">
                     {activeSignature.pattern}
                   </span>
                 </div>
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                    activeSignature.severity === Severity.FATAL ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    activeSignature.severity === Severity.ERROR ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {activeSignature.severity}
                 </span>
              </div>

              {/* Filtering Lab */}
              <div className="space-y-3">
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                       <Search size={14} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search matched evidence..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                 </div>

                 <div className="flex flex-wrap gap-1.5">
                    {['ALL', Severity.FATAL, Severity.ERROR, Severity.WARN, Severity.INFO].map((sev) => (
                      <button 
                        key={sev}
                        onClick={() => setSeverityFilter(sev as any)}
                        className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all border
                          ${severityFilter === sev 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        {sev}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* Evidence Stream - Virtualized */}
            <div className="flex-1 relative">
               {filteredLogs.length > 0 ? (
                 <Virtuoso
                   data={filteredLogs}
                   itemContent={(index, log) => {
                     const isPinned = pinnedIds.has(log.id);
                     return (
                       <div className={`group border-b border-slate-900/50 p-4 transition-all hover:bg-slate-900/40 relative
                         ${isPinned ? 'bg-blue-600/5 border-l-2 border-l-blue-500' : ''}`}>
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase
                                 ${log.severity === Severity.FATAL ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                   log.severity === Severity.ERROR ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                                   'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                 {log.severity}
                               </span>
                               <span className="text-[9px] font-mono text-slate-600">
                                 {log.timestamp?.toLocaleTimeString() || 'N/A'}
                               </span>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => togglePin(log.id)}
                                 className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-slate-600 hover:text-blue-400 hover:bg-slate-800'}`}
                                 title="Pin as Evidence"
                               >
                                 <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
                               </button>
                               <button 
                                 onClick={() => handleCopy(log.raw, log.id)}
                                 className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                 title="Copy Log Line"
                               >
                                 {copyFeedback === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                               </button>
                               <button 
                                 onClick={() => getSurroundingContext(log.id)}
                                 className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                 title="Show Context"
                               >
                                 <LayoutList size={12} />
                               </button>
                            </div>
                         </div>
                         <p className="text-[11px] font-mono text-slate-400 leading-relaxed break-all select-all">
                            {log.message}
                         </p>
                       </div>
                     );
                   }}
                   style={{ height: '100%' }}
                   className="scrollbar-hide"
                 />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                       <Search size={32} className="text-slate-700" />
                    </div>
                    <div className="space-y-4 max-w-xs">
                       <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching evidence found</h5>
                       <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic leading-relaxed">
                         The current filters yielded zero results. Ingestion may still be processing or pattern matching requires broadening.
                       </p>
                       <div className="flex flex-col gap-2 pt-4">
                          <button 
                            onClick={handleClearFilters}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all"
                          >
                             <RefreshCw size={12} />
                             Broaden Search
                          </button>
                          <button 
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
                          >
                             <Zap size={12} />
                             Force Rescan
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Surrounded Context Modal */}
      {contextId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                       <LayoutList size={20} className="text-amber-400" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Surrounding Log Context</h3>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">+/- 20 Events around {contextId}</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setContextId(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-[10px] leading-relaxed scrollbar-hide bg-[#050810]">
                 {contextLogs.map((log) => (
                   <div key={log.id} className={`flex gap-4 p-1 hover:bg-white/5 rounded transition-colors ${log.id === contextId ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}>
                      <span className="w-20 text-slate-600 shrink-0 select-none">[{log.timestamp?.toLocaleTimeString() || 'N/A'}]</span>
                      <span className={`w-12 shrink-0 select-none font-bold ${
                        log.severity === Severity.FATAL ? 'text-red-500' :
                        log.severity === Severity.ERROR ? 'text-red-400' :
                        'text-slate-700'
                      }`}>{log.severity}</span>
                      <span className={`${log.id === contextId ? 'text-amber-200 font-bold' : 'text-slate-400'} whitespace-pre-wrap break-all`}>{log.raw}</span>
                   </div>
                 ))}
              </div>

              <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Raw Sequence Integrity</span>
                 </div>
                 <button 
                  onClick={() => setContextId(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                 >
                  Return to Audit
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Focused Footer */}
      <div className="p-6 border-t border-slate-900 bg-slate-950/20">
        <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
          <Clock size={14} className="text-emerald-500 shrink-0" />
          <p className="text-[9px] text-slate-500 font-bold leading-relaxed italic">
            {isInvestigationActive 
              ? `${filteredLogs.length} signal points matched. ${pinnedIds.size} lines pinned.` 
              : 'Investigation anchored to global log context.'}
          </p>
        </div>
      </div>
    </div>
  );
});

ForensicEvidencePanel.displayName = 'ForensicEvidencePanel';
