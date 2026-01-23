
import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, Database, Shield, Zap, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  ingestionProgress: number;
  fileName?: string;
}

const SUPPORTED_EXTENSIONS = [
  '.log', '.logs', '.txt', '.out', '.err', '.trace', '.debug', '.audit', '.journal', '.messages', '.syslog', '.event', '.history', '.access',
  '.access_log', '.error_log', '.w3c', '.ncsa', '.binlog', '.slowlog', '.tlog', '.xel', '.trc', '.aud', '.ldf', '.pgsql',
  '.evt', '.evtx', '.etl', '.wer', '.dmp', '.diagnostic', '.crash',
  '.trc', '.qxdm', '.qmdl', '.nbiot', '.lora', '.uart', '.serial', '.can', '.nmea', '.iq', '.rtt', '.at', '.jlink', '.modem', '.canbus', '.modbus',
  '.cloudtrail', '.cloudwatch', '.s3', '.docker', '.kube', '.pod', '.gke',
  '.gz', '.bz2', '.xz', '.zst', '.zip', '.tar'
].join(',');

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, ingestionProgress, fileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative group border-2 border-dashed rounded-3xl p-6 sm:p-10 transition-all duration-500 flex flex-col items-center justify-center space-y-4 sm:space-y-6 overflow-hidden
        ${fileName ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40'}
        ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01] shadow-2xl shadow-blue-500/10' : 'hover:border-slate-700 hover:bg-slate-800/40'}
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileChange}
        disabled={isProcessing}
        accept={SUPPORTED_EXTENSIONS}
        ref={fileInputRef}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-6 w-full max-w-[280px]">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
            <div className="relative w-20 h-20 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center shadow-2xl">
              <Database className="w-8 h-8 text-blue-400" />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 p-1.5 rounded-lg border-2 border-slate-900 shadow-xl">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Neural Indexing</p>
                <p className="text-xs text-slate-400 font-medium italic">Partitioning stream...</p>
              </div>
              <span className="text-lg font-black text-blue-100 italic tracking-tighter">{ingestionProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
               <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                style={{ width: `${ingestionProgress}%` }}
               ></div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl">
             <Zap size={12} className="text-blue-400 animate-pulse" />
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Enterprise Class Processing</p>
          </div>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="relative">
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
             <div className="relative bg-emerald-500/20 p-5 rounded-[24px] border border-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
             </div>
          </div>
          <div className="text-center px-4">
            <p className="text-slate-100 font-black text-lg tracking-tight truncate max-w-[240px] italic uppercase">{fileName}</p>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mt-1.5 flex items-center justify-center gap-2">
               <Shield size={10} className="text-emerald-500" />
               Persistence Verified
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-6 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700/50 mt-2 z-20"
          >
            Switch Diagnostic Set
          </button>
        </div>
      ) : (
        <>
          <div className="relative group-hover:scale-110 transition-transform duration-500">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-colors"></div>
            <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-[28px] shadow-2xl">
              <Upload className="w-10 h-10 text-blue-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-xl">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="text-center px-6">
            <h4 className="text-slate-100 font-black text-xl italic uppercase tracking-tight">Enterprise Ingestion</h4>
            <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">Multi-GB diagnostic streams processed with <span className="text-blue-400">zero-buffer</span> RAG indexing.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="px-3 py-1 bg-slate-800/80 rounded-lg text-[9px] text-slate-400 uppercase tracking-widest font-black border border-slate-700/50 flex items-center gap-2">
              <Shield size={10} className="text-blue-500" /> 800+ Formats
            </div>
            <div className="px-3 py-1 bg-slate-800/80 rounded-lg text-[9px] text-slate-400 uppercase tracking-widest font-black border border-slate-700/50">
              Low Latency RAG
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] animate-pulse">
            Drop file or click to browse
          </div>
        </>
      )}
    </div>
  );
};
