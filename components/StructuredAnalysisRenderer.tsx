
import React, { useState, useMemo } from 'react';
import { StructuredAnalysis, Severity, LogChunk } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Terminal, 
  FileCode, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon, 
  Cpu, 
  Activity, 
  Zap,
  LayoutList,
  History,
  Wrench,
  Search,
  ArrowRight,
  Eye,
  X,
  Copy,
  ExternalLink,
  Database,
  Book,
  Check,
  Share2
} from 'lucide-react';
import { generateJiraUrl, formatRunbook, downloadBlob } from '../utils/exportUtils';

interface StructuredAnalysisRendererProps {
  report: StructuredAnalysis;
  allChunks: LogChunk[];
}

export const StructuredAnalysisRenderer: React.FC<StructuredAnalysisRendererProps> = ({ report, allChunks }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const totalOccurrences = useMemo(() => 
    report.error_patterns.reduce((sum, p) => sum + p.occurrences, 0),
    [report.error_patterns]
  );

  const severityIcon = 
    report.severity === 'CRITICAL' ? <ShieldAlert size={20} className="text-red-500" /> :
    report.severity === 'WARNING' ? <AlertTriangle size={20} className="text-amber-500" /> :
    <Info size={20} className="text-blue-500" />;

  const resolvedChunks = useMemo(() => {
    if (!selectedChunkId) return null;
    return allChunks.find(c => c.id === selectedChunkId);
  }, [selectedChunkId, allChunks]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(report.executive_summary);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleExportJson = () => {
    downloadBlob(JSON.stringify(report, null, 2), `diagnostic_report_${Date.now()}.json`, 'application/json');
  };

  const handleCopyRunbook = () => {
    navigator.clipboard.writeText(formatRunbook(report));
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleOpenJira = () => {
    window.open(generateJiraUrl(report), '_blank');
  };

  const WorkItemHub = () => (
    <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 mt-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
           <Share2 size={12} className="text-blue-500" />
           Work Item Orchestrator
         </h5>
         <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Post-Diagnostic Actions</div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button 
          onClick={handleCopySummary}
          className="flex flex-col items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all group"
        >
          {copyStatus === 'copied' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400 group-hover:text-blue-400" />}
          <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-slate-200">Copy Summary</span>
        </button>
        
        <button 
          onClick={handleOpenJira}
          className="flex flex-col items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all group"
        >
          <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-slate-200">Jira Ticket</span>
        </button>

        <button 
          onClick={handleExportJson}
          className="flex flex-col items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all group"
        >
          <Database size={14} className="text-slate-400 group-hover:text-blue-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-slate-200">Export JSON</span>
        </button>

        <button 
          onClick={handleCopyRunbook}
          className="flex flex-col items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all group"
        >
          <Book size={14} className="text-slate-400 group-hover:text-blue-400" />
          <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-slate-200">Create Runbook</span>
        </button>
      </div>
    </div>
  );

  if (viewMode === 'summary') {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-2xl animate-in fade-in duration-500 relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1 h-full ${report.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              {severityIcon}
            </div>
            <div>
              <h3 className="text-lg font-black text-white italic tracking-tight uppercase flex items-center gap-2">
                {report.severity}: System Fault Detected
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Forensic Signature Analysis Active
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
             <div className="px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-col items-center min-w-[80px]">
               <span className="text-sm font-black text-slate-100">{totalOccurrences}</span>
               <span className="text-[8px] font-black text-slate-600 uppercase">Occurrences</span>
             </div>
             <div className="px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-col items-center min-w-[80px]">
               <span className="text-sm font-black text-slate-100">{report.inferred_files.length}</span>
               <span className="text-[8px] font-black text-slate-600 uppercase">File Nodes</span>
             </div>
          </div>
        </div>

        <div className="mt-8 mb-8 bg-slate-950/30 p-5 rounded-2xl border border-slate-800/50 italic text-sm text-slate-300 font-medium leading-relaxed">
          "{report.executive_summary}"
        </div>

        <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-800/40">
           <button 
            onClick={() => setViewMode('detailed')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
           >
             <LayoutList size={14} />
             View Details
           </button>
           <button 
            onClick={handleOpenJira}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700/50"
           >
             <ExternalLink size={14} />
             Create Jira
           </button>
           <button 
            onClick={handleCopyRunbook}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
           >
             <Book size={14} />
             Runbook
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700 max-w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewMode('summary')}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${report.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`} />
            <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Detailed Forensic Audit</h4>
          </div>
        </div>
      </div>

      <section className="bg-slate-900/20 border border-slate-800/60 rounded-[2.5rem] p-6 space-y-6 shadow-inner">
        <div className="flex items-center gap-3 px-2">
          <Activity size={16} className="text-blue-400" />
          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Causality Vectors ({report.error_patterns.length})</h5>
        </div>

        <div className="space-y-4">
          {report.error_patterns.map((pattern, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 group hover:border-slate-700 transition-all shadow-xl">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="min-w-0 flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="px-2 py-1 bg-red-500/10 rounded border border-red-500/20 text-[9px] font-black text-red-400 font-mono">
                         {pattern.error_code}
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Pattern Identified</span>
                   </div>
                   <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                     "{pattern.description}"
                   </p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                   <div className="text-2xl font-black text-blue-400 tracking-tighter italic">{pattern.occurrences}x</div>
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Recurrence</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {pattern.impacted_systems.map((sys, j) => (
                  <div key={j} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 group/sys hover:border-blue-500/30 transition-all">
                     <Zap size={10} className="text-slate-600 group-hover/sys:text-blue-400" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sys}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} />
                      Logical Sources
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{pattern.chunks.length} Node(s)</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {pattern.chunks.map((cid, k) => (
                     <button 
                      key={k}
                      onClick={() => setSelectedChunkId(cid)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2
                        ${selectedChunkId === cid 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                     >
                       <LinkIcon size={10} />
                       #{cid}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/20 border border-slate-800/60 rounded-[2.5rem] p-6 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Cpu size={16} className="text-emerald-400" />
          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Engineering Trace Points</h5>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {report.inferred_files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <FileCode size={16} className="text-emerald-400" />
                </div>
                <div className="truncate">
                  <h6 className="text-[11px] font-black text-slate-100 truncate">{file.path.split(/[/\\]/).pop()}</h6>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{file.path}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                 <div className="text-[10px] font-black text-emerald-400 italic">{(file.confidence * 100).toFixed(0)}% MATCH</div>
                 <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Lines: {file.line_numbers.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] p-8 shadow-xl">
            <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
               <Search size={14} /> Root Hypothesis
            </h5>
            <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
              "{report.root_cause_hypothesis}"
            </p>
         </div>
         <div className="bg-emerald-600/5 border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-xl">
            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
               <CheckCircle2 size={14} /> Remediation Steps
            </h5>
            <div className="space-y-4">
              {report.suggested_actions.map((act, i) => (
                <div key={i} className="flex gap-4 group/act">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover/act:scale-150 transition-transform" />
                   <p className="text-xs text-slate-400 font-medium leading-relaxed">{act}</p>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* Instant Action Hub */}
      <WorkItemHub />

      <div className="flex justify-center pt-8">
         <button 
          onClick={() => setViewMode('summary')}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all shadow-xl"
         >
           Collapse Report
         </button>
      </div>

      {selectedChunkId && resolvedChunks && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                       <Terminal size={20} className="text-blue-400" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-white italic tracking-tight uppercase">Logical Node Explorer</h3>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Node Instance #{selectedChunkId}</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedChunkId(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-auto p-8 font-mono text-[11px] leading-relaxed scrollbar-hide text-slate-400">
                 <div className="flex items-center gap-4 mb-6 p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                    <Eye size={14} className="text-blue-500" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing unique forensic signature match</p>
                 </div>
                 <div className="whitespace-pre-wrap break-words p-6 bg-slate-950/50 rounded-3xl border border-slate-800 shadow-inner">
                    {resolvedChunks.content}
                 </div>
              </div>

              <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Isolated Forensic View</span>
                 </div>
                 <button 
                  onClick={() => setSelectedChunkId(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                 >
                  Back to Audit
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
