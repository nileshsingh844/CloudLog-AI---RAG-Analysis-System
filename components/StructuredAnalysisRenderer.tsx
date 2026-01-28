import React, { useState } from 'react';
import { StructuredAnalysis, LogChunk } from '../types';
import { 
  Zap, 
  Copy,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Network,
  Bug,
  Check,
  Target,
  Box,
  Server,
  Activity,
  ChevronRight,
  ShieldCheck,
  Code,
  Terminal,
  Search,
  Cpu,
  MonitorCheck
} from 'lucide-react';
import { useLogStore } from '../store/useLogStore';
import { DiagnosticWizard } from './DiagnosticWizard';

interface StructuredAnalysisRendererProps {
  report: StructuredAnalysis;
  allChunks: LogChunk[];
}

export const StructuredAnalysisRenderer: React.FC<StructuredAnalysisRendererProps> = ({ report }) => {
  const { state } = useLogStore();
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  const ir = report?.incident_report;
  if (!ir) return (
    <div className="p-8 border border-dashed border-slate-800 rounded-3xl text-center opacity-50">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Awaiting Valid Forensic Bundle</p>
    </div>
  );

  const isCritical = ir.severity === 'CRITICAL';
  const severityColor = isCritical ? 'text-red-500' : ir.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-500';
  const severityBg = isCritical ? 'bg-red-500/10' : ir.severity === 'WARNING' ? 'bg-amber-500/10' : 'bg-blue-500/10';

  const handleCopyPatch = () => {
    const patchText = JSON.stringify(ir.high_fidelity_patch, null, 2);
    navigator.clipboard.writeText(patchText);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleCopyEvidence = () => {
    if (ir.root_cause_analysis?.evidence_sample) {
      navigator.clipboard.writeText(ir.root_cause_analysis.evidence_sample);
      setCopiedEvidence(true);
      setTimeout(() => setCopiedEvidence(false), 2000);
    }
  };

  const primaryFailure = ir.root_cause_analysis?.primary_failure || "Unknown System Fault";
  const affectedComponents = ir.affected_components || [];
  const timestampStr = ir.timestamp ? new Date(ir.timestamp).toLocaleString() : "N/A";

  const wizardPlan = {
    wizardType: "Adaptive Remediation Plan",
    detectedLayer: "BACKEND" as any,
    steps: (ir.remediation_plan?.steps || []).map((s, i) => ({
      id: `step-${i}`,
      label: s.split(':')[0] || `Action ${i+1}`,
      detail: s.split(':')[1] || s,
      layer: "BACKEND" as any
    })),
    causalityChain: (ir.forensic_timeline || []).slice(0, 4).map(e => ({
      layer: "BACKEND" as any,
      tech: e.component || "System",
      message: e.event,
      logicImpact: e.correlation || "Dependency disruption"
    })),
    verification: {
      strategy: "Automated Health Probe",
      scripts: ["curl -X GET /health/live"],
      metricsToMonitor: ["p99 latency", "error rate"]
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12 w-full overflow-hidden">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/[0.05] pb-10">
        <div className="space-y-5 max-w-4xl min-w-0">
          <div className="flex flex-wrap items-center gap-3">
             <div className={`px-3 py-1 rounded-full border border-white/5 font-black text-[10px] uppercase tracking-widest ${severityBg} ${severityColor} shadow-lg`}>
                {ir.severity || 'UNKNOWN'} INCIDENT
             </div>
             <div className="px-3 py-1 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                ID: {ir.id || 'N/A'}
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <Clock size={12} />
                {timestampStr}
             </div>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-tight break-words">
             {primaryFailure}
          </h2>
          <div className="flex flex-wrap gap-2">
            {affectedComponents.map((comp, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                {comp}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Incident Lifecycle</span>
           <div className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
              <ShieldCheck size={16} className="animate-pulse" />
              {ir.status || 'REPORTED'}
           </div>
        </div>
      </div>

      {/* 2. Root Cause Breakdown */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 px-1">
            <Target size={20} className="text-red-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Forensic Reconstruction</h3>
         </div>
         
         <div className="bg-slate-900/60 border border-white/[0.05] rounded-[2.5rem] p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
               <Bug size={180} />
            </div>

            <div className="space-y-2 relative z-10">
               <span className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] px-1">Logic Signature</span>
               <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 sm:p-5">
                  <p className="text-xs sm:text-sm font-mono text-red-400 font-bold break-all leading-relaxed">
                    {ir.root_cause_analysis?.error_signature || "No recognizable signature detected."}
                  </p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
               <div className="md:col-span-12 space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                       <Bug size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Causal Mechanism</p>
                       <p className="text-lg font-black text-slate-100 italic">{ir.root_cause_analysis?.mechanism || "Internal System Error"}</p>
                       <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-medium italic mt-4 border-l-2 border-slate-800 pl-6 py-1">
                          "{ir.root_cause_analysis?.description || "Description unavailable for this failure node."}"
                       </p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Forensic Evidence Proof Line */}
            {ir.root_cause_analysis?.evidence_sample && (
              <div className="mt-10 pt-10 border-t border-white/[0.03] space-y-5 relative z-10">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <Terminal size={16} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Forensic Proof: Real Trace Log</span>
                    </div>
                    <button 
                      onClick={handleCopyEvidence}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 hover:border-emerald-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                       {copiedEvidence ? <Check size={12} className="text-emerald-500" /> : <Search size={12} />}
                       {copiedEvidence ? 'Proof Copied' : 'Search Source'}
                    </button>
                 </div>
                 <div className="bg-[#050810] border border-white/[0.05] rounded-[1.5rem] p-6 font-mono text-[12px] text-emerald-500/80 leading-relaxed italic break-all shadow-inner border-l-4 border-l-emerald-600/40">
                    {ir.root_cause_analysis.evidence_sample}
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* 3. Diagnostic Wizard Plan */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 px-1">
            <Activity size={20} className="text-emerald-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Autonomous Remediation Path</h3>
         </div>
         <DiagnosticWizard plan={wizardPlan} />
      </div>

      {/* 4. High Fidelity Patch */}
      <div className="space-y-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
            <div className="flex items-center gap-3">
               <Zap size={20} className="text-amber-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">High-Fidelity Patch Set</h3>
            </div>
            <button 
              onClick={handleCopyPatch}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all shadow-2xl active:scale-95 group"
            >
               {copiedPatch ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="group-hover:text-blue-400 transition-colors" />}
               {copiedPatch ? 'Patch Copied' : 'Export Full Patch'}
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logic Block */}
            <div className="bg-[#050810] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col group/patch">
               <div className="px-8 py-5 border-b border-white/[0.03] bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Code size={16} className="text-blue-400" />
                     <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest">Logic: Runtime Configuration</span>
                  </div>
                  <div className="px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest shadow-lg shadow-blue-500/5">
                    Adaptive
                  </div>
               </div>
               
               <div className="relative p-8 font-mono text-[13px] text-blue-300/80 space-y-4 overflow-y-auto max-h-[400px] scrollbar-hide min-h-[300px] flex flex-col">
                  {/* Grid overlay for a more 'tech' feel */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:20px_20px]" />
                  
                  {(ir.high_fidelity_patch?.configuration_changes?.jvm_args || []).length > 0 ? (
                    ir.high_fidelity_patch.configuration_changes.jvm_args.map((arg, i) => (
                      <div key={i} className="flex gap-5 group/line z-10">
                         <span className="text-slate-800 select-none font-bold shrink-0">{String(i+1).padStart(2, '0')}</span>
                         <span className="text-emerald-500/80 shrink-0">+</span>
                         <span className="break-words group-hover/line:text-white transition-colors">{arg}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-40 group-hover/patch:opacity-60 transition-opacity z-10">
                       <Cpu size={32} className="text-slate-700 animate-pulse" />
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-100">Neural Baseline Verified</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">No modifications proposed for current context</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* K8s Block */}
            <div className="bg-[#050810] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col group/infra">
               <div className="px-8 py-5 border-b border-white/[0.03] bg-slate-900/40 flex items-center gap-3">
                  <Server size={16} className="text-purple-400" />
                  <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest">Infra: Kubernetes Resource Manifest</span>
               </div>
               
               <div className="relative p-10 flex-1 flex flex-col justify-center min-h-[300px]">
                  {/* Scanline effect for empty infra */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-[scan_4s_linear_infinite]" />
                  
                  {ir.high_fidelity_patch?.configuration_changes?.kubernetes_resources ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 z-10">
                       <div className="space-y-5">
                          <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Resource Hard Limits</p>
                          <div className="space-y-3">
                             <ResourceCard label="CPU Node" value={ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.limits?.cpu} unit="cores" />
                             <ResourceCard label="Memory" value={ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.limits?.memory} unit="Gi" />
                          </div>
                       </div>
                       <div className="space-y-5">
                          <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Quality of Service</p>
                          <div className="space-y-3">
                             <ResourceCard label="CPU Request" value={ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.requests?.cpu} color="blue" />
                             <ResourceCard label="Mem Request" value={ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.requests?.memory} color="blue" />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-5 opacity-40 group-hover/infra:opacity-60 transition-opacity z-10">
                       <div className="p-5 bg-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
                          <MonitorCheck size={40} className="text-slate-700" />
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-100">Baseline Synchronized</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Resource constraints matching operational targets</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
      <style>{`
         @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      `}</style>
    </div>
  );
};

const ResourceCard = ({ label, value, unit, color = 'emerald' }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-white/[0.03] rounded-2xl shadow-xl group hover:border-white/10 transition-all">
     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
     <div className="flex items-baseline gap-1">
        <span className={`text-lg font-black italic tracking-tighter ${color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{value || 'N/A'}</span>
        {unit && <span className="text-[8px] font-bold text-slate-600 uppercase">{unit}</span>}
     </div>
  </div>
);
