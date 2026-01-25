
import React, { useState } from 'react';
import { 
  Terminal, 
  Github, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Globe, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Package, 
  Link, 
  Boxes, 
  Workflow, 
  PlayCircle,
  Maximize2,
  Minimize2,
  // Added missing CheckCircle2 import
  CheckCircle2
} from 'lucide-react';

export const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cli' | 'cicd' | 'ide'>('cli');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState<string[]>(['$ cloudlog analyze --help']);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput) return;
    
    const output = [...cliOutput, `$ ${cliInput}`];
    if (cliInput.includes('analyze')) {
      output.push('Detected: Node.js (Express) + PostgreSQL');
      output.push('Found: 4 API errors, 1 slow query');
      output.push('Run "cloudlog detail" for deep forensic analysis.');
    } else if (cliInput.includes('watch')) {
      output.push('Sentinel active. Tailing /var/log/app.log...');
      output.push('[10:24:01] INFO: Request handled in 45ms');
    } else {
      output.push(`Command not found: ${cliInput.split(' ')[0]}`);
    }
    
    setCliOutput(output);
    setCliInput('');
  };

  const SNIPPETS = {
    github: `name: Analyze Test Logs
uses: cloudlog-ai/analyze@v2
with:
  logs: |
    ./backend/test.log
    ./frontend/cypress.log
  fail-on: critical
  auto-comment: true`,
    gitlab: `analyze-logs:
  stage: test
  script:
    - cloudlog ci-analyze --all-logs
  artifacts:
    reports:
      cloudlog: report.json`,
    jenkins: `stage('Log Analysis') {
    steps {
        cloudlog analyze: 'build/*.log',
                failOn: 'critical',
                notify: 'slack'
    }
}`
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400">
           <Boxes size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">Ubiquitous Control Plane</span>
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Omnichannel Accessibility</h2>
        <p className="text-slate-500 max-w-2xl mx-auto italic font-medium leading-relaxed">
           Sync CloudLog AI directly into your terminal, CI/CD pipelines, and local IDE. Forensic intelligence everywhere you write code.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-center p-1.5 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm mx-auto shadow-2xl">
         {[
           { id: 'cli', label: 'CLI Tool', icon: <Terminal size={14} /> },
           { id: 'cicd', label: 'CI/CD Ops', icon: <Workflow size={14} /> },
           { id: 'ide', label: 'IDE Sync', icon: <Code2 size={14} /> }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
               ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             {tab.icon}
             {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-10">
        
        {/* CLI Section */}
        {activeTab === 'cli' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-7 bg-[#050810] border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col h-[500px] shadow-2xl">
                <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                   </div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Local Node Simulator</span>
                </div>
                <div className="flex-1 p-8 font-mono text-[13px] text-emerald-500/80 overflow-y-auto space-y-2 scrollbar-hide">
                   {cliOutput.map((line, i) => (
                     <div key={i} className={line.startsWith('$') ? 'text-blue-400' : ''}>{line}</div>
                   ))}
                </div>
                <form onSubmit={handleCliSubmit} className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
                   <span className="text-blue-400 font-bold ml-4">$</span>
                   <input 
                     type="text" 
                     value={cliInput}
                     onChange={(e) => setCliInput(e.target.value)}
                     placeholder="Try 'cloudlog analyze'..."
                     className="bg-transparent border-none focus:ring-0 flex-1 text-sm text-slate-100 font-mono outline-none"
                   />
                </form>
             </div>

             <div className="lg:col-span-5 space-y-6">
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-6 shadow-xl">
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Universal Binary</h3>
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                     Our Go-based binary runs on macOS, Linux, and Windows. It provides local-first RAG indexing with zero data egress for sensitive logs.
                   </p>
                   <div className="space-y-4">
                      <InstallCommand label="macOS / Linux" cmd="curl -fsSL https://cloudlog.ai/install.sh | sh" id="cmd-1" onCopy={handleCopy} copied={copiedId === 'cmd-1'} />
                      <InstallCommand label="Windows (Powershell)" cmd="iwr https://cloudlog.ai/install.ps1 | iex" id="cmd-2" onCopy={handleCopy} copied={copiedId === 'cmd-2'} />
                   </div>
                   <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-600 uppercase">Current Version</span>
                         <span className="text-xs font-bold text-blue-400">v15.2.0 (Stable)</span>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                         <Download size={14} /> Full Manual
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* CI/CD Section */}
        {activeTab === 'cicd' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <CiCard 
               title="GitHub Actions" 
               icon={<Github />} 
               snippet={SNIPPETS.github} 
               desc="Automatic forensic PR comments on test failure."
               onCopy={handleCopy}
               copied={copiedId === 'git-h'}
               id="git-h"
             />
             <CiCard 
               title="GitLab CI" 
               icon={<Globe />} 
               snippet={SNIPPETS.gitlab} 
               desc="Artifact-ready JSON reports for every pipeline run."
               onCopy={handleCopy}
               copied={copiedId === 'git-l'}
               id="git-l"
             />
             <CiCard 
               title="Jenkins" 
               icon={<Package />} 
               snippet={SNIPPETS.jenkins} 
               desc="Groovy-native integration for legacy enterprise stacks."
               onCopy={handleCopy}
               copied={copiedId === 'jenk'}
               id="jenk"
             />
          </div>
        )}

        {/* IDE Section */}
        {activeTab === 'ide' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
              <IdeCard 
                name="VS Code Extension" 
                tech="TypeScript / Multi-Language" 
                features={['Inline Trace Highlighting', 'One-Click Refactor', 'Local Log Tailing']}
                img="https://raw.githubusercontent.com/microsoft/vscode-icons/master/icons/light/vscode.svg"
              />
              <IdeCard 
                name="JetBrains Suite" 
                tech="IntelliJ / PyCharm / GoLand" 
                active
                features={['Debugger Tool Window Integration', 'Cross-Project Knowledge Lookup', 'Remote Server Explorer']}
                img="https://resources.jetbrains.com/storage/products/intellij-idea/img/meta/intellij-idea_logo_300x300.png"
              />
           </div>
        )}
      </div>

      {/* Trust Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] mt-10">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-500/20">
               <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <div>
               <h4 className="text-lg font-black text-white italic uppercase">Enterprise-Grade Security</h4>
               <p className="text-[11px] text-slate-500 font-medium italic">Local RAG indexing means logs never leave your infrastructure. Only anonymized forensic patterns reach the AI cluster.</p>
            </div>
         </div>
         <button className="flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-blue-50 shadow-xl">
            Request Security Whitepaper
            <Zap size={14} />
         </button>
      </div>
    </div>
  );
};

const InstallCommand = ({ label, cmd, id, onCopy, copied }: any) => (
  <div className="space-y-2">
     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">{label}</span>
     <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 group">
        <code className="text-[11px] font-mono text-slate-400 truncate">$ {cmd}</code>
        <button onClick={() => onCopy(cmd, id)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0">
           {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
     </div>
  </div>
);

const CiCard = ({ title, icon, snippet, desc, onCopy, copied, id }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl flex flex-col group hover:border-blue-500/30 transition-all">
     <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-800 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
        <div>
           <h4 className="text-lg font-black text-white italic uppercase">{title}</h4>
           <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Automation Engine</p>
        </div>
     </div>
     <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">{desc}</p>
     <div className="flex-1 bg-slate-950 rounded-2xl p-5 font-mono text-[10px] text-slate-400 overflow-hidden relative group/snip">
        <pre className="whitespace-pre-wrap">{snippet}</pre>
        <button onClick={() => onCopy(snippet, id)} className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 rounded-xl opacity-0 group-hover/snip:opacity-100 transition-all shadow-xl">
           {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
     </div>
  </div>
);

const IdeCard = ({ name, features, img, tech, active }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex gap-8 items-start shadow-xl group hover:border-blue-500/30 transition-all relative overflow-hidden">
     {active && <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">Certified</div>}
     <img src={img} alt={name} className="w-16 h-16 object-contain shrink-0 group-hover:scale-110 transition-transform duration-500" />
     <div className="space-y-4">
        <div>
           <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{name}</h4>
           <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-2">{tech}</p>
        </div>
        <div className="space-y-2">
           {features.map((f: string, i: number) => (
             <div key={i} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500/60" />
                <span className="text-[11px] font-medium text-slate-400 italic">{f}</span>
             </div>
           ))}
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
           <Download size={14} /> Install Marketplace
        </button>
     </div>
  </div>
);
