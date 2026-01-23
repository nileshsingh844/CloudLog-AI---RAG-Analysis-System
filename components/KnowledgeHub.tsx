
import React, { useRef } from 'react';
import { Book, FileText, Upload, Trash2, ShieldCheck, Zap, Info, FileStack } from 'lucide-react';
import { KnowledgeFile } from '../types';

interface KnowledgeHubProps {
  knowledgeFiles: KnowledgeFile[];
  onUpload: (files: File[]) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ knowledgeFiles, onUpload, onClear, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) onUpload(Array.from(files));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600/10 rounded-xl">
            <Book className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Knowledge Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Runbooks & Internal Docs</p>
          </div>
        </div>
        {knowledgeFiles.length > 0 && (
          <button onClick={onClear} className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-800/50 rounded-lg">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="bg-slate-950/40 p-5 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-4 group hover:border-emerald-500/50 transition-all">
        <div className="p-4 bg-slate-900 rounded-full border border-slate-800 group-hover:scale-110 transition-transform shadow-xl">
           <FileStack className="text-emerald-500 w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-200">Enrich RAG Context</p>
          <p className="text-[10px] text-slate-500 font-medium max-w-[200px]">Upload internal project documentation, troubleshooting guides, or operational runbooks.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
        >
          {isProcessing ? 'Indexing...' : 'Upload Runbook'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".txt,.md,.pdf" 
          onChange={handleFileChange} 
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {knowledgeFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
            <Info size={24} className="mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No local context linked</p>
          </div>
        ) : (
          knowledgeFiles.map((file) => (
            <div key={file.id} className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 truncate">
                <FileText size={14} className="text-emerald-500 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] font-bold text-slate-300 truncate">{file.name}</p>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{file.type}</p>
                </div>
              </div>
              <ShieldCheck size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/60 flex items-start gap-3">
        <Zap size={14} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-[9px] text-slate-500 leading-relaxed italic">
          Knowledge base files are indexed locally and provided as context to Gemini for pinpointing company-specific failure patterns.
        </p>
      </div>
    </div>
  );
};
