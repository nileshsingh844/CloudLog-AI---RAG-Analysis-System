
import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, Database, Shield, Zap, FileText, Loader2, Cpu } from 'lucide-react';

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
      className={`relative group border-2 border-dashed rounded-[3rem] p-8 sm:p-14 transition-all duration-700 flex flex-col items-center justify-center space-y-6 sm:space-y-8 overflow-hidden
        ${fileName ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40 shadow-inner'}
        ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-2xl shadow-blue-500/20' : 'hover:border-slate-700 hover:bg-slate-800/40'}
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
        <div className="flex flex-col items-center space-y-8 w-full max-w-[340px] animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-slate-900 rounded-3xl border border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
               <Cpu className="w-10 h-10 text-blue-400" />
               <div className="absolute inset-0 border-2 border-blue-500/20 animate-pulse rounded-3xl" />
            </div>
          </div>
          
          <div className="w-full space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Indexing RAG Node</p>
                <p className="text-xs text-slate-500 font-bold italic">Analyzing logical patterns...</p>
              </div>
              <span className="text-2xl font-black text-blue-100 italic tracking-tighter">{ingestionProgress}%</span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800/50">
               <div 
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
                style={{ width: `${ingestionProgress}%` }}
               ></div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-xl">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Optimized Contextual Processing</p>
          </div>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-700">
          <div className="relative">
             <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
             <div className="relative bg-emerald-500/10 p-7 rounded-[2rem] border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
             </div>
          </div>
          <div className="text-center px-6">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">Diagnostic Ready</h4>
            <p className="text-slate-100 font-black text-2xl tracking-tight truncate max-w-[320px] italic uppercase">{fileName}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
               <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">Persistence Cache Active</div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-8 py-3 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700/50 mt-4 z-20 shadow-xl"
          >
            Switch Log Stream
          </button>
        </div>
      ) : (
        <>
          <div className="relative group-hover:scale-110 transition-transform duration-700">
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full group-hover:bg-blue-600/40 transition-colors"></div>
            <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <Upload className="w-12 h-12 text-blue-500" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-blue-600 p-2.5 rounded-2xl border-4 border-slate-900 shadow-2xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-center px-10 space-y-3">
            <h4 className="text-slate-100 font-black text-2xl italic uppercase tracking-tighter">Enterprise Feed</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">Seamlessly ingest massive diagnostic streams into our neural RAG engine with <span className="text-blue-500 font-bold">zero latency</span> overhead.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Pill icon={<Shield size={12} className="text-blue-500" />} label="800+ Dialects" />
            <Pill icon={<Database size={12} className="text-blue-500" />} label="S3 / Cloud Logs" />
          </div>
          <div className="mt-4 text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] animate-pulse">
            Drop file or click to sync
          </div>
        </>
      )}
    </div>
  );
};

const Pill = ({ icon, label }: any) => (
  <div className="px-4 py-1.5 bg-slate-800/50 rounded-xl text-[10px] text-slate-400 uppercase tracking-widest font-black border border-slate-700/50 flex items-center gap-2.5 shadow-lg">
    {icon} {label}
  </div>
);
