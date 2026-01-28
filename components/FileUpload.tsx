import React, { useRef, useState, useEffect } from 'react';
import { Upload, CheckCircle, Cpu, Loader2, PlayCircle, ClipboardList, FileText, Zap, Terminal, Plus, FileJson, ArrowRight, ClipboardCheck } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<TabType>('paste');
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
    if (!pasteContent.trim() || isProcessing) return;
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    const file = new File([blob], `pasted-trace-${new Date().getTime()}.log`, { type: 'text/plain' });
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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Precision Tab Bar */}
      <div className="flex items-center justify-center p-1.5 bg-[#0a0f1d] border border-white/[0.05] rounded-2xl w-fit mx-auto shadow-2xl backdrop-blur-3xl shrink-0">
         {(['upload', 'paste', 'live'] as TabType[]).map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3
               ${activeTab === tab 
                 ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)]' 
                 : 'text-slate-500 hover:text-slate-300'}`}
           >
             {tab === 'upload' && <Upload size={14} />}
             {tab === 'paste' && <ClipboardList size={14} />}
             {tab === 'live' && <Zap size={14} />}
             {tab}
           </button>
         ))}
      </div>

      {/* Ingestion Canvas */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative group rounded-[3.5rem] p-6 sm:p-12 transition-all duration-700 flex flex-col items-center justify-center min-h-[500px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]
          ${localState === 'success' || localState === 'ready' ? 'bg-emerald-500/[0.02] border-emerald-500/30' : 'bg-[#040815] border border-white/[0.03] backdrop-blur-3xl'}
          ${localState === 'hover' ? 'border-blue-600 bg-blue-600/[0.02] scale-[1.01] shadow-[0_0_80px_-20px_rgba(59,130,246,0.2)]' : ''}
          ${localState === 'uploading' || localState === 'processing' ? 'bg-black/40' : ''}
        `}
      >
        {(localState === 'uploading' || localState === 'processing') ? (
          <div className="flex flex-col items-center space-y-12 w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10 py-10">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-slate-900 rounded-3xl border border-white/10 flex items-center justify-center shadow-3xl">
                 <Loader2 className="w-12 h-12 text-blue-500 animate-spin" strokeWidth={3} />
              </div>
            </div>
            
            <div className="w-full space-y-8 text-center">
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                  {localState === 'uploading' ? 'Streaming Signal...' : 'Logical Synthesis...'}
                </h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">In-Memory Neural Mapping</p>
              </div>
              
              <div className="space-y-4">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0 border border-white/5">
                   <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(37,99,235,1)]" 
                    style={{ width: `${ingestionProgress}%` }}
                   ></div>
                </div>
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{ingestionProgress}% LOADED</span>
                   <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">RAG BUFFER ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        ) : (localState === 'success' || localState === 'ready') ? (
          <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-700 relative z-10">
            <div className="bg-emerald-500/10 p-10 rounded-[2.5rem] border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              <CheckCircle className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <h4 className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em]">Signal Established</h4>
              </div>
              <p className="text-white font-black text-4xl tracking-tighter truncate max-w-md italic uppercase">Trace Ingested</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col h-full relative z-10">
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center space-y-12 py-10 animate-in fade-in duration-500">
                <div className="relative group/icon cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full transition-all group-hover:scale-150"></div>
                  <div className="relative bg-[#0d121f] border border-white/10 p-12 rounded-[3rem] shadow-2xl transition-all group-hover:-translate-y-2 group-hover:border-blue-500/30">
                    <Upload className="w-16 h-16 text-white/20 transition-all group-hover:text-blue-500" />
                  </div>
                </div>
                
                <div className="space-y-4 text-center">
                  <h4 className="text-white font-black text-4xl italic uppercase tracking-tighter leading-tight">
                    Analyze distributed <br/><span className="text-blue-600">log nodes.</span>
                  </h4>
                  <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto italic">
                    Drag massive system dumps or clusters logs (.log, .json, .txt)
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="px-16 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 group/btn"
                   >
                     Browse Repository
                     <ArrowRight size={16} className="inline ml-3 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                   <input type="file" className="hidden" onChange={handleFileChange} multiple ref={fileInputRef} />
                   <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Up to 5GB Streaming RAG</span>
                </div>
              </div>
            )}

            {activeTab === 'paste' && (
              <div className="flex flex-col h-full w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative group/paste flex-1">
                   <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2rem] opacity-0 group-focus-within/paste:opacity-100 transition-opacity" />
                   <div className="relative h-full flex flex-col">
                     <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-x border-t border-white/[0.05] rounded-t-[2.5rem]">
                        <div className="flex items-center gap-3">
                           <Terminal size={14} className="text-blue-400" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Log Stream Buffer</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 italic">Deduplication: ACTIVE</span>
                     </div>
                     <textarea
                       value={pasteContent}
                       onChange={(e) => setPasteContent(e.target.value)}
                       placeholder="Paste output here..."
                       className="w-full flex-1 bg-[#02040a] border border-white/[0.05] rounded-b-[2.5rem] p-8 text-sm font-mono text-slate-300 placeholder:text-slate-800 focus:border-blue-500/30 focus:ring-0 outline-none resize-none transition-all scrollbar-hide min-h-[300px]"
                     />
                   </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <button 
                    onClick={handlePasteSubmit}
                    disabled={!pasteContent.trim() || isProcessing}
                    className="w-full py-6 bg-[#1e293b] hover:bg-blue-600 disabled:opacity-20 text-blue-400 hover:text-white rounded-[1.75rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] border border-white/[0.05] flex items-center justify-center gap-4 group"
                  >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ClipboardCheck size={20} className="opacity-60 group-hover:opacity-100 transition-opacity" />}
                    {isProcessing ? 'SYNTHESIZING...' : 'ANALYZE PASTED TRACE'}
                  </button>
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic">Forensic Integrity Verification: ENABLED</p>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="flex flex-col items-center py-20 space-y-10 animate-in fade-in duration-500">
                 <div className="p-10 bg-slate-900 rounded-[3rem] border border-white/5 flex items-center justify-center shadow-inner relative group">
                   <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
                   <Zap size={48} className="text-amber-500 animate-pulse relative z-10" />
                 </div>
                 <div className="space-y-4 text-center">
                   <h4 className="text-white font-black text-4xl italic uppercase tracking-tighter leading-none">Live Sentinel</h4>
                   <p className="text-slate-500 text-sm font-medium italic">Streaming directly from cluster endpoints</p>
                 </div>
                 <div className="bg-slate-950 border border-white/5 px-8 py-5 rounded-2xl font-mono text-[11px] text-blue-400/80 shadow-2xl">
                   <span className="text-slate-700">$</span> cloudlog live --stream=app-cluster <span className="animate-pulse">_</span>
                 </div>
                 <button className="px-16 py-4 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/5 transition-all">
                   Integration Pending
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auxiliary Actions */}
      {!isProcessing && localState !== 'success' && localState !== 'ready' && (
        <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 pb-10">
           <button 
            onClick={onTryDemo}
            className="flex items-center gap-3 px-8 py-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.06] hover:border-blue-500/30 transition-all group active:scale-95 shadow-xl"
           >
             <PlayCircle size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-[0.2em]">Try CloudLog Demo</span>
           </button>
        </div>
      )}
    </div>
  );
};
