
import React, { useRef, useState, useEffect } from 'react';
import { Upload, CheckCircle, Cpu, Loader2, PlayCircle, ClipboardList, FileText, Zap, Terminal, Plus, FileJson, ArrowRight } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isProcessing: boolean;
  ingestionProgress: number;
  fileName?: string;
  processedFiles?: string[];
  onTryDemo?: () => void;
}

type TabType = 'upload' | 'paste' | 'live';
type UploadState = 'idle' | 'hover' | 'uploading' | 'processing' | 'success' | 'ready';

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, ingestionProgress, fileName, onTryDemo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [localState, setLocalState] = useState<UploadState>('idle');
  const [pasteContent, setPasteContent] = useState('');

  useEffect(() => {
    if (isProcessing) {
      if (ingestionProgress < 100) setLocalState('uploading');
      else setLocalState('processing');
    } else if (fileName) {
      setLocalState('success');
      const t = setTimeout(() => setLocalState('ready'), 800);
      return () => clearTimeout(t);
    } else {
      setLocalState('idle');
    }
  }, [isProcessing, fileName, ingestionProgress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) onFileSelect(Array.from(files));
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    const file = new File([blob], 'pasted-logs.txt', { type: 'text/plain' });
    onFileSelect([file]);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setLocalState('hover'); };
  const onDragLeave = () => setLocalState('idle');
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFileSelect(Array.from(files));
    else setLocalState('idle');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Professional Tabs */}
      <div className="flex items-center justify-center p-1.5 bg-slate-900 border border-white/[0.05] rounded-2xl w-fit mx-auto shadow-2xl backdrop-blur-3xl shrink-0">
         {(['upload', 'paste', 'live'] as TabType[]).map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3
               ${activeTab === tab 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                 : 'text-slate-500 hover:text-slate-300'}`}
           >
             {tab === 'upload' && <Upload size={14} />}
             {tab === 'paste' && <ClipboardList size={14} />}
             {tab === 'live' && <Zap size={14} />}
             {tab}
           </button>
         ))}
      </div>

      {/* Primary Hero Ingestion Card - Controlled Height for Zoom Support */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative group border-2 border-dashed rounded-[3rem] p-8 sm:p-14 lg:p-20 transition-all duration-700 flex flex-col items-center justify-center space-y-8 overflow-y-auto max-h-[65vh] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] scrollbar-hide
          ${localState === 'success' || localState === 'ready' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/[0.05] bg-slate-900/40 backdrop-blur-3xl'}
          ${localState === 'hover' ? 'border-blue-600 bg-blue-600/[0.05] scale-[1.01] shadow-[0_0_80px_-20px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/20' : ''}
          ${localState === 'uploading' || localState === 'processing' ? 'border-blue-600/40 bg-slate-950' : 'hover:border-white/10'}
        `}
      >
        {/* Glow Effects */}
        <div className={`absolute -top-24 -left-24 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full transition-opacity duration-700 ${localState === 'hover' ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/5 blur-[120px] rounded-full transition-opacity duration-700 ${localState === 'hover' ? 'opacity-100' : 'opacity-0'}`} />

        {(localState === 'uploading' || localState === 'processing') ? (
          <div className="flex flex-col items-center space-y-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-500 relative z-10 py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[40px] rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 bg-slate-900 rounded-[2rem] border border-white/10 flex items-center justify-center shadow-3xl">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            </div>
            
            <div className="w-full space-y-6 text-center">
              <h4 className="text-2xl font-black text-white italic tracking-tight">
                {localState === 'uploading' ? 'Streaming Signal...' : 'Mapping Logic Nodes...'}
              </h4>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                 <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(37,99,235,0.8)]" 
                  style={{ width: `${ingestionProgress}%` }}
                 ></div>
              </div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">{ingestionProgress}% Complete</p>
            </div>
          </div>
        ) : (localState === 'success' || localState === 'ready') ? (
          <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-700 relative z-10 py-10">
            <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">Signal Node Established</h4>
              <p className="text-white font-black text-4xl tracking-tighter truncate max-w-md italic uppercase">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center space-y-8 relative z-10">
            {activeTab === 'upload' && (
              <div className="space-y-10 w-full animate-in fade-in duration-500 py-4">
                <div className="relative inline-block group/icon">
                  <div className={`absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full transition-all duration-700 ${localState === 'hover' ? 'scale-150 bg-blue-600/20' : ''}`}></div>
                  <div className={`relative bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl transition-all duration-700 ${localState === 'hover' ? 'scale-110 -translate-y-2 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : ''}`}>
                    <Upload className={`w-12 h-12 text-white/20 transition-all duration-700 ${localState === 'hover' ? 'text-blue-500 scale-110 rotate-3' : 'group-hover/icon:text-blue-500'}`} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className={`text-white font-black text-3xl italic uppercase tracking-tighter leading-tight transition-all duration-700 ${localState === 'hover' ? 'scale-105 brightness-125' : ''}`}>
                    {localState === 'hover' ? 'Drop logs anywhere' : 'Select diagnostic files'}
                  </h4>
                  <p className="text-slate-500 text-[15px] font-medium max-w-xs mx-auto leading-relaxed">
                    Distributed logs, traces, or massive system dumps (.log, .json, .txt)
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.25rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-[0_15px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 group/btn"
                   >
                     Browse Local Files
                     <ArrowRight size={14} className="inline ml-3 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                   <input 
                      type="file" 
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                      accept=".log,.logs,.txt,.json,.syslog"
                      multiple
                      ref={fileInputRef}
                    />
                   <div className="flex items-center gap-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                     <span>Support up to 5GB+</span>
                     <div className="w-1 h-1 bg-slate-800 rounded-full" />
                     <span>Streaming RAG Ingestion</span>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'paste' && (
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 py-4 px-4">
                <div className="relative group/paste">
                   <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2rem] opacity-0 group-focus-within/paste:opacity-100 transition-opacity" />
                   <textarea
                     value={pasteContent}
                     onChange={(e) => setPasteContent(e.target.value)}
                     placeholder="Paste raw log output here..."
                     className="w-full h-64 bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 text-sm font-mono text-slate-300 placeholder:text-slate-800 focus:border-blue-500/30 focus:ring-0 outline-none resize-none transition-all scrollbar-hide"
                   />
                </div>
                <button 
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="px-14 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-[1.25rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
                >
                  Analyze Pasted Trace
                </button>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="w-full flex flex-col items-center py-10 space-y-8 animate-in fade-in duration-500">
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center">
                   <Zap size={32} className="text-amber-500 animate-pulse" />
                 </div>
                 <div className="space-y-2">
                   <h4 className="text-white font-black text-2xl italic uppercase tracking-tight">Live Sentinel Stream</h4>
                   <p className="text-slate-500 text-sm font-medium italic">Sync directly from CLI or Kubernetes cluster</p>
                 </div>
                 <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl font-mono text-[11px] text-blue-400/80">
                   $ cloudlog live --stream=app-cluster
                 </div>
                 <button className="px-12 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                   Coming Soon
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Chips - Minimalist Styling */}
      {!isProcessing && localState !== 'success' && localState !== 'ready' && (
        <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 pb-4">
           <button 
            onClick={onTryDemo}
            className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-blue-500/20 transition-all group active:scale-95"
           >
             <PlayCircle size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Try Demo Log</span>
           </button>
           <button 
             onClick={() => setActiveTab('paste')}
             className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all group active:scale-95"
           >
             <ClipboardList size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Paste Logs</span>
           </button>
           <button 
             onClick={() => setActiveTab('live')}
             className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-amber-500/20 transition-all group active:scale-95"
           >
             <Zap size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Live Feed</span>
           </button>
        </div>
      )}
    </div>
  );
};
