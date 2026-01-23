
import React from 'react';
import { Download, Share2, Github, ExternalLink, FileText, Clipboard, Check, Code, FileOutput } from 'lucide-react';
import { ExportData, DebugSolution } from '../types';
import { generateHtmlReport, downloadBlob, generatePatchFile, generateMarkdownIssue } from '../utils/exportUtils';

interface ExportCenterProps {
  data: ExportData;
  activeSolution?: DebugSolution;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ data, activeSolution }) => {
  const [copied, setCopied] = React.useState(false);

  const handleDownloadReport = () => {
    const html = generateHtmlReport(data);
    downloadBlob(html, `CloudLog_Report_${new Date().getTime()}.html`, 'text/html');
  };

  const handleDownloadPatch = () => {
    if (!activeSolution) return;
    const patch = generatePatchFile(activeSolution.fixes);
    downloadBlob(patch, `fix_${activeSolution.id}.patch`, 'text/plain');
  };

  const handleCopyIssue = () => {
    if (!activeSolution) return;
    const md = generateMarkdownIssue(activeSolution, data.stats);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGithubIssue = () => {
    if (!activeSolution) return;
    const title = encodeURIComponent(`[CloudLog AI] Fix: ${activeSolution.strategy}`);
    const body = encodeURIComponent(generateMarkdownIssue(activeSolution, data.stats));
    window.open(`https://github.com/issues/new?title=${title}&body=${body}`, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600/10 rounded-xl">
          <FileOutput className="text-blue-400 w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Export & Sync</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Forensic Dissemination</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Report */}
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all group"
        >
          <div className="p-3 bg-blue-600/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
            <FileText size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Full Forensic Report</p>
            <p className="text-[10px] text-slate-500 font-medium">Export as Offline HTML</p>
          </div>
        </button>

        {/* Patch File */}
        <button 
          onClick={handleDownloadPatch}
          disabled={!activeSolution}
          className={`flex items-center gap-4 p-4 border rounded-2xl transition-all group
            ${activeSolution 
              ? 'bg-emerald-600/5 border-emerald-500/20 hover:bg-emerald-600/10' 
              : 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'}`}
        >
          <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
            <Code size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-200 uppercase tracking-tight">Generate Patch</p>
            <p className="text-[10px] text-slate-500 font-medium">Download .patch file</p>
          </div>
        </button>
      </div>

      {/* External Sync Hub */}
      <div className="pt-4 border-t border-slate-800/60">
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">External Synchronizers</h3>
        <div className="space-y-3">
          <button 
            onClick={handleCopyIssue}
            disabled={!activeSolution}
            className="w-full flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Clipboard size={14} className="text-slate-500 group-hover:text-blue-400" />
              <span className="text-[11px] font-bold text-slate-400">Copy for JIRA / Wiki</span>
            </div>
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-slate-600" />}
          </button>

          <button 
            onClick={openGithubIssue}
            disabled={!activeSolution}
            className="w-full flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Github size={14} className="text-slate-500 group-hover:text-white" />
              <span className="text-[11px] font-bold text-slate-400">Create GitHub Issue</span>
            </div>
            <ExternalLink size={14} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
        <p className="text-[9px] text-blue-400 font-medium italic leading-relaxed">
          Sync nodes ensure high-fidelity context preservation when moving from diagnostic Lab to Engineering workspace.
        </p>
      </div>
    </div>
  );
};
