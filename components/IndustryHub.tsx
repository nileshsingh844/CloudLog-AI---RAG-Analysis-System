import React from 'react';
import { Industry, ProcessingStats } from '../types';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Layers, 
  Gamepad2, 
  HeartPulse, 
  Globe, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Search,
  Activity,
  Package,
  ChevronLeft
} from 'lucide-react';

interface IndustryHubProps {
  currentIndustry: Industry;
  onSelectIndustry: (ind: Industry) => void;
  stats: ProcessingStats | null;
  onBack: () => void;
}

export const IndustryHub: React.FC<IndustryHubProps> = ({ currentIndustry, onSelectIndustry, stats, onBack }) => {
  const industries: { id: Industry; label: string; icon: any; color: string; desc: string; focus: string[] }[] = [
    { id: 'ECOMMERCE', label: 'E-Commerce', icon: <ShoppingBag />, color: 'blue', desc: 'Transaction flow & payment integrity specialist.', focus: ['Checkout Latency', 'Gateway Sync', 'SKU Conflicts'] },
    { id: 'FINTECH', label: 'FinTech', icon: <ShieldCheck />, color: 'emerald', desc: 'PCI-DSS & Audit trail reconciliation engine.', focus: ['Fraud Patterns', 'Ledger Integrity', 'KYC Flow'] },
    { id: 'SAAS', label: 'SaaS Suite', icon: <Layers />, color: 'purple', desc: 'Multi-tenant isolation & resource quota sentinel.', focus: ['Tenant Leakage', 'Quota Alerts', 'Per-Org Perf'] },
    { id: 'GAMING', label: 'Gaming Ops', icon: <Gamepad2 />, color: 'orange', desc: 'Real-time sync & player experience guardian.', focus: ['Matchmaking Jitter', 'Packet Loss', 'Server Tick'] },
    { id: 'HEALTHCARE', label: 'Healthcare', icon: <HeartPulse />, color: 'red', desc: 'HIPAA compliant PHI access & HL7 auditor.', focus: ['HL7 Failures', 'PHI Access Logs', 'Device Downtime'] },
    { id: 'GENERAL', label: 'Universal', icon: <Globe />, color: 'slate', desc: 'General-purpose forensic logic engine.', focus: ['Standard Traces', 'Infra Health', 'Logic Loops'] }
  ];

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-32">
      <div className="flex justify-start">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <ChevronLeft size={14} />
          Back to Forensics
        </button>
      </div>
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 shadow-xl">
           <Search size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">Industry Intelligence Layer</span>
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Expert Domain Synthesis</h2>
        <p className="text-slate-500 max-w-2xl mx-auto italic font-medium leading-relaxed">
           Switch between industry modules to activate specialized forensic logic and domain-aware anomaly detection patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {industries.map((ind) => (
           <button
             key={ind.id}
             onClick={() => onSelectIndustry(ind.id)}
             className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 text-left group overflow-hidden
               ${currentIndustry === ind.id 
                 ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl ring-2 ring-blue-500/20' 
                 : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'}`}
           >
             {currentIndustry === ind.id && (
               <div className="absolute top-6 right-6 p-1 bg-blue-500 rounded-full">
                  <CheckCircle2 size={16} className="text-white" />
               </div>
             )}

             <div className={`p-4 rounded-3xl mb-6 inline-flex shadow-lg transition-transform group-hover:scale-110 duration-500
               ${currentIndustry === ind.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                {React.cloneElement(ind.icon, { size: 24 })}
             </div>

             <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">{ind.label}</h4>
             <p className="text-xs text-slate-500 font-medium italic mb-6 leading-relaxed">{ind.desc}</p>

             <div className="space-y-2 mt-auto">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Core Audit Targets</p>
                <div className="flex flex-wrap gap-1.5">
                   {ind.focus.map((f, i) => (
                     <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">
                       {f}
                     </span>
                   ))}
                </div>
             </div>
           </button>
         ))}
      </div>

      {stats && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 mt-12 shadow-2xl relative overflow-hidden">
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full" />
           
           <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-6 flex-1">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl">
                       <BarChart3 className="text-white w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase italic">Active Log Profile</h3>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Signature Overlap Result</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <Metric label="Industry Confidence" value="94.2%" sub="Pattern Matching" />
                    <Metric label="Format Class" value={stats.fileInfo?.format || 'N/A'} sub="Neural Detection" />
                 </div>

                 <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                    <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                       "Automatically matched current log stream to <span className="text-blue-400 font-bold">{stats.industryMatch || 'General'}</span> domain logic. Specialized parsers are now normalizing transaction-level metadata for forensic review."
                    </p>
                 </div>
              </div>

              <div className="w-full md:w-1/3 bg-slate-950/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-800 pb-4">Specialized Controls</h5>
                 <div className="space-y-3">
                    <SpecializedToggle label="Compliance Audit Mode" active />
                    <SpecializedToggle label="PII Data Redaction" active />
                    <SpecializedToggle label="Deep Schema Extraction" />
                    <SpecializedToggle label="Historical Variance Sync" />
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, sub }: any) => (
  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
     <p className="text-[9px] font-black text-slate-600 uppercase mb-1">{label}</p>
     <p className="text-xl font-black text-white italic">{value}</p>
     <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest">{sub}</p>
  </div>
);

const SpecializedToggle = ({ label, active }: any) => (
  <div className="flex items-center justify-between group cursor-pointer">
     <span className={`text-[10px] font-bold ${active ? 'text-slate-200' : 'text-slate-600'} transition-colors`}>{label}</span>
     <div className={`w-8 h-4 rounded-full border border-slate-700 p-0.5 transition-all ${active ? 'bg-blue-600 border-blue-500' : 'bg-slate-900'}`}>
        <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-lg transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
     </div>
  </div>
);