
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
  Code
} from 'lucide-react';
import { useLogStore } from '../store/useLogStore';

interface StructuredAnalysisRendererProps {
  report: StructuredAnalysis;
  allChunks: LogChunk[];
}

export const StructuredAnalysisRenderer: React.FC<StructuredAnalysisRendererProps> = ({ report }) => {
  const { state } = useLogStore();
  const [copiedPatch, setCopiedPatch] = useState(false);

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

  const primaryFailure = ir.root_cause_analysis?.primary_failure || "Unknown System Fault";
  const affectedComponents = ir.affected_components || [];
  const timestampStr = ir.timestamp ? new Date(ir.timestamp).toLocaleString() : "N/A";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.05] pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full border border-white/5 font-black text-[10px] uppercase tracking-widest ${severityBg} ${severityColor}`}>
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
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
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
        <div className="flex flex-col items-end gap-2 shrink-0">
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Incident Status</span>
           <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} />
              {ir.status || 'REPORTED'}
           </div>
        </div>
      </div>

      {/* 2. Root Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center gap-3">
              <Target size={18} className="text-red-500" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Reconstruction</h3>
           </div>
           
           <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Error Signature</span>
                 <p className="text-sm font-mono text-red-400 bg-red-950/20 p-3 rounded-xl border border-red-900/30 font-bold break-all">
                    {ir.root_cause_analysis?.error_signature || "No recognizable signature detected."}
                 </p>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                       <Bug size={16} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Failure Mechanism</p>
                       <p className="text-sm font-black text-slate-200 italic">{ir.root_cause_analysis?.mechanism || "Internal System Error"}</p>
                    </div>
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium italic indent-4">
                    "{ir.root_cause_analysis?.description || "Description unavailable for this failure node."}"
                 </p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center gap-3">
              <Activity size={18} className="text-blue-500" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Remediation Priority</h3>
           </div>
           
           <div className="bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-inner">
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Immediate Protocol</p>
                 <p className="text-lg font-black text-white italic uppercase">{ir.remediation_plan?.immediate_action || "Manual Review"}</p>
              </div>
              <ul className="space-y-4">
                 {(ir.remediation_plan?.steps || []).map((step, i) => (
                   <li key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all shrink-0">
                         {i + 1}
                      </div>
                      <p className="text-[12px] text-slate-400 font-medium italic group-hover:text-slate-200 transition-colors">
                        {step}
                      </p>
                   </li>
                 ))}
                 {(!ir.remediation_plan?.steps || ir.remediation_plan.steps.length === 0) && (
                    <p className="text-[10px] text-slate-600 italic">No automated steps synthesized.</p>
                 )}
              </ul>
           </div>
        </div>
      </div>

      {/* 3. Forensic Timeline */}
      <div className="space-y-6">
         <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Causality Sequence</h3>
         </div>

         <div className="relative pl-8 pr-4 py-4">
            <div className="absolute left-[39px] top-0 bottom-0 w-px bg-slate-800" />
            
            <div className="space-y-12">
               {(ir.forensic_timeline || []).map((event, i) => (
                 <div key={i} className="relative pl-12 group">
                    <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#020617] z-10 transition-all duration-500 
                       ${event.status === 'HEALTHY' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                         (event.event?.includes('Crash') || event.event?.includes('Termination')) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 p-6 bg-slate-900/30 border border-slate-800 rounded-[2rem] group-hover:border-white/10 transition-all shadow-lg">
                       <div className="space-y-2">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-slate-600 font-mono tracking-tighter uppercase">{event.time || 'T+0'}</span>
                             {event.component && (
                               <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">{event.component}</span>
                             )}
                          </div>
                          <p className="text-sm font-black text-slate-200 italic uppercase tracking-tight">{event.event || 'System Event'}</p>
                          {event.correlation && (
                             <p className="text-[11px] text-slate-500 leading-relaxed italic border-l border-slate-800 pl-4 mt-2">
                               {event.correlation}
                             </p>
                          )}
                          {event.details && (
                             <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 font-mono text-[10px] text-slate-400 mt-2">
                                {event.details}
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
               {(!ir.forensic_timeline || ir.forensic_timeline.length === 0) && (
                  <p className="text-[11px] text-slate-600 italic">Timeline trace unavailable.</p>
               )}
            </div>
         </div>
      </div>

      {/* 4. High Fidelity Patch */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Zap size={18} className="text-amber-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">High-Fidelity Patch</h3>
            </div>
            <button 
              onClick={handleCopyPatch}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all shadow-xl"
            >
               {copiedPatch ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
               {copiedPatch ? 'Copied' : 'Export Patch'}
            </button>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-[#050810] border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="px-8 py-4 border-b border-white/[0.03] bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Code size={14} className="text-blue-400" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic: JVM Configuration</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-700 uppercase italic">Adaptive-Runtime</span>
               </div>
               <div className="p-8 font-mono text-[12px] text-blue-300/80 space-y-2">
                  {(ir.high_fidelity_patch?.configuration_changes?.jvm_args || []).length > 0 ? (
                    ir.high_fidelity_patch.configuration_changes.jvm_args.map((arg, i) => (
                      <div key={i} className="flex gap-4">
                         <span className="text-slate-800 select-none">{String(i+1).padStart(2, '0')}</span>
                         <span className="text-emerald-500/80">+</span>
                         <span className="break-all">{arg}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-700 italic">No JVM modifications proposed.</p>
                  )}
               </div>
            </div>

            <div className="bg-[#050810] border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
               <div className="px-8 py-4 border-b border-white/[0.03] bg-slate-900/40 flex items-center gap-3">
                  <Server size={14} className="text-purple-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kubernetes Resource Manifest</span>
               </div>
               <div className="p-8 flex-1 flex flex-col justify-center">
                  {ir.high_fidelity_patch?.configuration_changes?.kubernetes_resources ? (
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Node Limits</p>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">CPU</span>
                                <span className="text-xs font-black text-white">{ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.limits?.cpu || 'N/A'}</span>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Memory</span>
                                <span className="text-xs font-black text-white">{ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.limits?.memory || 'N/A'}</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Guaranteed Requests</p>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">CPU</span>
                                <span className="text-xs font-black text-blue-400">{ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.requests?.cpu || 'N/A'}</span>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Memory</span>
                                <span className="text-xs font-black text-blue-400">{ir.high_fidelity_patch.configuration_changes.kubernetes_resources?.requests?.memory || 'N/A'}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center opacity-30">
                       <p className="text-[10px] font-black text-slate-500 uppercase">No K8s Changes Proposed</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Resiliency Strategy */}
         <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] space-y-6 shadow-xl group hover:border-blue-500/40 transition-all">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Network className="text-white w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{ir.high_fidelity_patch?.resiliency_pattern?.strategy || "Standard Resiliency"}</h4>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Strategic Logic Injection</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Injection Target</span>
                  <div className="flex items-center gap-2 p-3 bg-slate-950 border border-white/5 rounded-xl">
                     <Box size={14} className="text-slate-600" />
                     <span className="text-[11px] font-bold text-slate-200">{ir.high_fidelity_patch?.resiliency_pattern?.target || "Global Scope"}</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engineering Rationale</span>
                  <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                     "{ir.high_fidelity_patch?.resiliency_pattern?.rationale || "Improve fault tolerance through standardized error handling patterns."}"
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
