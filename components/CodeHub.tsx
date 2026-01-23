
import React, { useRef, useState, useCallback } from 'react';
import { Code, FileArchive, FolderOpen, Search, ShieldCheck, ChevronRight, Trash2, Github, GitBranch, AlertCircle, Library, Globe, FileCode, CheckCircle2, Loader2, Link } from 'lucide-react';
import { CodeFile } from '../types';

interface CodeHubProps {
  inferredFiles: string[];
  sourceFiles: CodeFile[];
  onUpload: (files: File[]) => void;
  onClear: () => void;
}

export const CodeHub: React.FC<CodeHubProps> = ({ inferredFiles, sourceFiles, onUpload, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [gitStatus, setGitStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [fetchingFile, setFetchingFile] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<CodeFile | null>(null);

  const isLibraryPath = (path: string): boolean => {
    const libMarkers = ['node_modules', 'site-packages', 'dist-packages', 'vendor', 'lib/', 'usr/lib', 'jdk', 'jre', '.m2', 'maven', 'Internal.Packages'];
    return libMarkers.some(m => path.toLowerCase().includes(m.toLowerCase()));
  };

  const handleGitConnect = () => {
    if (!repoUrl) return;
    // Basic validation for common git hosts to ensure we can attempt a raw fetch
    const isGithub = repoUrl.includes('github.com');
    const isGitlab = repoUrl.includes('gitlab.com');
    
    if (isGithub || isGitlab) {
      setGitStatus('connected');
    } else {
      setGitStatus('error');
    }
  };

  const fetchFromGit = useCallback(async (path: string) => {
    if (gitStatus !== 'connected') return;
    
    setFetchingFile(path);
    try {
      // Logic to convert standard repo URL to raw content URL
      let rawUrl = repoUrl.trim().replace(/\/$/, '');
      
      if (rawUrl.includes('github.com')) {
        // github.com/user/repo -> raw.githubusercontent.com/user/repo/main/path
        rawUrl = rawUrl.replace('github.com', 'raw.githubusercontent.com');
        // Handle case where branch isn't in URL
        if (!rawUrl.includes('/main/') && !rawUrl.includes('/master/')) {
          rawUrl = `${rawUrl}/main/${path}`;
        } else {
          rawUrl = `${rawUrl}/${path}`;
        }
      } else if (rawUrl.includes('gitlab.com')) {
        // gitlab.com/user/repo -> gitlab.com/user/repo/-/raw/main/path
        if (!rawUrl.includes('/-/raw/')) {
          rawUrl = `${rawUrl}/-/raw/main/${path}`;
        } else {
          rawUrl = `${rawUrl}/${path}`;
        }
      }

      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error("File not found or private repository");
      
      const content = await response.text();
      // Create a mock File object to pass to the existing onUpload handler
      const mockFile = new File([content], path, { type: 'text/plain' });
      onUpload([mockFile]);
    } catch (e) {
      console.error("Git fetch error:", e);
      alert(`Automated fetch failed for: ${path}\n\nTechnical details: Ensure the repository is public and the path is relative to the root. Or manually upload the ZIP/Directory.`);
    } finally {
      setFetchingFile(null);
    }
  }, [repoUrl, gitStatus, onUpload]);

  // Preview Mode
  if (selectedPreview) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelectedPreview(null)} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-xl">
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <div className="flex-1 px-4 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{selectedPreview.path}</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedPreview.language} • {(selectedPreview.size / 1024).toFixed(1)}KB</p>
          </div>
          <button onClick={() => { onClear(); setSelectedPreview(null); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="flex-1 bg-slate-950 rounded-2xl p-4 overflow-auto border border-slate-800 font-mono text-[11px] leading-relaxed scrollbar-hide">
          {selectedPreview.content.split('\n').map((line, i) => (
            <div key={i} className="flex group">
              <span className="w-10 text-slate-700 select-none text-right pr-4 shrink-0 border-r border-slate-800 mr-4">{i + 1}</span>
              <span className="text-slate-300 whitespace-pre">{line || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl">
            <Code className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Code Hub</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Semantic Context Sync</p>
          </div>
        </div>
        {sourceFiles.length > 0 && (
          <button onClick={onClear} className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-800/50 rounded-lg">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Manual Upload Tools */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/30 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
        >
          <FileArchive className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Upload ZIP</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".zip" 
            onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} 
          />
        </button>
        <button 
          onClick={() => dirInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/30 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all group"
        >
          <FolderOpen className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Directory</span>
          <input 
            type="file" 
            ref={dirInputRef} 
            className="hidden" 
            multiple 
            // @ts-ignore
            webkitdirectory="true" 
            onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))} 
          />
        </button>
      </div>

      {/* Git Integration Section */}
      <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Github size={12} className="text-slate-500" />
            Git Repository
          </h3>
          {gitStatus === 'connected' && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-emerald-500 uppercase">Live</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="github.com/org/repo" 
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setGitStatus('idle'); }}
              className={`w-full bg-slate-900 border rounded-xl px-4 py-2 text-xs text-slate-300 placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all
                ${gitStatus === 'connected' ? 'border-emerald-500/40' : 'border-slate-800'}
                ${gitStatus === 'error' ? 'border-red-500/40' : ''}
              `}
            />
          </div>
          <button 
            onClick={handleGitConnect}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${gitStatus === 'connected' 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}
            `}
          >
            {gitStatus === 'connected' ? 'Connected' : 'Connect'}
          </button>
        </div>
        {gitStatus === 'error' && <p className="text-[9px] text-red-400 font-bold">Invalid repository URL. Use github.com or gitlab.com.</p>}
      </div>

      {/* Inferred Diagnostic Files */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {inferredFiles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Search size={12} className="text-blue-400" />
                Detected in Logs
              </h3>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{inferredFiles.length} Path(s)</span>
            </div>
            
            <div className="space-y-2">
              {inferredFiles.map((file, i) => {
                const isUploaded = sourceFiles.some(sf => sf.path.endsWith(file) || file.endsWith(sf.path));
                const isLib = isLibraryPath(file);
                const isFetching = fetchingFile === file;

                return (
                  <div key={i} className={`flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800 group hover:border-slate-700 transition-all ${isLib ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {isLib ? (
                        <Library size={12} className="text-slate-600 shrink-0" />
                      ) : (
                        <Globe size={12} className="text-blue-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-300 truncate block">{file}</span>
                        {isLib && <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">External Dependency</span>}
                      </div>
                    </div>
                    
                    {isUploaded ? (
                      <ShieldCheck size={16} className="text-emerald-500" />
                    ) : (gitStatus === 'connected' && !isLib) ? (
                      <button 
                        onClick={() => fetchFromGit(file)}
                        disabled={isFetching}
                        className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20"
                      >
                        {isFetching ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
                        Fetch
                      </button>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-400 transition-colors"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {sourceFiles.length > 0 && (
          <section className="pt-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
              <Code size={12} className="text-emerald-400" />
              Active Code Context ({sourceFiles.length})
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {sourceFiles.slice(0, 20).map((file, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedPreview(file)}
                  className="flex items-center justify-between p-3 bg-slate-800/10 rounded-xl border border-slate-800/50 hover:border-emerald-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileCode size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] text-slate-300 truncate font-bold">{file.path}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
              {sourceFiles.length > 20 && (
                <p className="text-[9px] text-slate-600 text-center uppercase font-black py-2 tracking-widest">+{sourceFiles.length - 20} Additional Reference Files</p>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/60 flex items-start gap-3">
        <AlertCircle size={14} className="text-slate-600 mt-0.5 shrink-0" />
        <p className="text-[9px] text-slate-500 leading-relaxed italic">
          Git integration attempts to resolve source code automatically for inferred file paths. Ensure the connected repo matches the project structure of the logs.
        </p>
      </div>
    </div>
  );
};
