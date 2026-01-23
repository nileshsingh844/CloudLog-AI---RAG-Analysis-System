
import React, { useRef } from 'react';
import { Upload, CheckCircle, Database, Shield } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  ingestionProgress: number;
  fileName?: string;
}

// Grouped critical extensions for better readability and maintenance
const SUPPORTED_EXTENSIONS = [
  // General & System
  '.log', '.logs', '.txt', '.out', '.err', '.trace', '.debug', '.audit', '.journal', '.messages', '.syslog', '.event', '.history', '.access',
  // Web & DB
  '.access_log', '.error_log', '.w3c', '.ncsa', '.binlog', '.slowlog', '.tlog', '.xel', '.trc', '.aud', '.ldf', '.pgsql',
  // Windows/OS
  '.evt', '.evtx', '.etl', '.wer', '.dmp', '.diagnostic', '.crash',
  // IoT & Embedded (Critical per document)
  '.trc', '.qxdm', '.qmdl', '.nbiot', '.lora', '.uart', '.serial', '.can', '.nmea', '.iq', '.rtt', '.at', '.jlink', '.modem', '.canbus', '.modbus',
  // Cloud & Containers
  '.cloudtrail', '.cloudwatch', '.s3', '.docker', '.kube', '.pod', '.gke',
  // Compression
  '.gz', '.bz2', '.xz', '.zst', '.zip', '.tar'
].join(',');

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, ingestionProgress, fileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-xl p-4 sm:p-8 transition-all duration-300 flex flex-col items-center justify-center space-y-3 sm:space-y-4
        ${fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-blue-500/50 bg-slate-800/50'}
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        disabled={isProcessing}
        accept={SUPPORTED_EXTENSIONS}
        ref={fileInputRef}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-3 sm:space-y-4 w-full px-2 sm:px-6">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
              style={{ animationDuration: '0.8s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              <span>Ingestion Active</span>
              <span>{ingestionProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
               <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${ingestionProgress}%` }}
               ></div>
            </div>
          </div>
          <p className="text-blue-400/80 text-[10px] sm:text-xs font-medium animate-pulse text-center">Processing Multi-GB Enterprise Stream...</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <div className="bg-emerald-500/20 p-3 sm:p-4 rounded-full">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
          </div>
          <div className="text-center px-2">
            <p className="text-slate-200 font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs">{fileName}</p>
            <p className="text-slate-400 text-[10px] sm:text-sm">Indexed & Persistent locally</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-[10px] sm:text-xs text-blue-400 hover:underline"
          >
            Load Different File
          </button>
        </div>
      ) : (
        <>
          <div className="bg-blue-500/10 p-3 sm:p-4 rounded-full group-hover:bg-blue-500/20 transition-colors">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
          <div className="text-center px-2">
            <p className="text-slate-200 font-medium text-base sm:text-lg">Upload Enterprise Logs</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Multi-GB Scale Supported</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-700 rounded text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Shield size={8} /> 800+ Formats
            </span>
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-700 rounded text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">IoT/Embedded</span>
          </div>
        </>
      )}
    </div>
  );
};
