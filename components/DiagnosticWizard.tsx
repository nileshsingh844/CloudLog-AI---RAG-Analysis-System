
import React, { useState } from 'react';
import { DiagnosticWizardPlan, WizardStep, TechLayer } from '../types';
import { CheckCircle2, Circle, Copy, Terminal, ChevronRight, Zap, Info, ShieldCheck, Activity, Database, LayoutPanelLeft, Monitor, Layers, Check } from 'lucide-react';

interface DiagnosticWizardProps {
  plan: DiagnosticWizardPlan;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({ plan }) => {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    const next = new Set(completedSteps);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedSteps(next);
  };

  const handleCopy = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmdId(id);
    setTimeout(() => setCopiedCmdId(null), 2000);
  };

  const layerColors: Record<TechLayer, string> = {
    FRONTEND: 'text-blue-400',
    BACKEND: 'text-emerald-400',
    DATABASE: 'text-purple-400',
    INFRASTRUCTURE: 'text-amber-400',
    UNKNOWN: 'text-slate-400'
  };

  const layerIcons: Record<TechLayer, React.ReactElement> = {
    FRONTEND: <Monitor size={14} />,
    BACKEND: <Zap size={14} />,
    DATABASE: <Database size={14} />,
    INFRASTRUCTURE: <LayoutPanelLeft size={14} />,
    UNKNOWN: <Info size={14} />
  };

  return (
    <div className="my-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] rounded-full" />
        
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
             <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">{plan.wizardType}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${layerColors[plan.detectedLayer]}`}>
                Focus: {plan.detectedLayer} Layer
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {plan.steps.length} Engineering Cycles
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl border border-slate-800">
           <ShieldCheck size={14} className="text-emerald-500" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseline: Adaptive Forensic Trace</span>
        </div>
      </div>

      {/* Main Path & Causality Chain Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Troubleshooting Rail (Steps) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 px-2 mb-4">
            <Layers size={14} className="text-blue-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adaptive Path Execution</h4>
          </div>
          
          <div className="space-y-4 relative">
            <div className="absolute left-7 top-10 bottom-10 w-px bg-slate-800" />
            
            {plan.steps.map((step, idx) => {
              const isCompleted = completedSteps.has(step.id);
              const isActive = activeStepIdx === idx;
              
              return (
                <div key={step.id} className="relative pl-14 transition-all duration-500">
                  <button 
                    onClick={() => { setActiveStepIdx(idx); toggleStep(step.id); }}
                    className={`absolute left-4 top-2 w-6 h-6 rounded-full border-2 z-20 flex items-center justify-center transition-all duration-500
                    ${isCompleted ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 
                      isActive ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20 animate-pulse' : 
                      'bg-[#0d0f14] border-slate-700'}`}
                  >
                    {isCompleted ? <Check size={14} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                  </button>

                  <div className={`p-6 rounded-3xl border transition-all duration-500 group
                    ${isActive ? 'bg-slate-900 border-blue-500/40 shadow-xl' : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className={`text-[13px] font-black uppercase tracking-tight ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                        {step.label}
                      </h5>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border border-slate-800 bg-slate-950 flex items-center gap-1.5 ${layerColors[step.layer]}`}>
                         {layerIcons[step.layer]}
                         {step.layer}
                      </div>
                    </div>
                    
                    <p className={`text-[12px] leading-relaxed font-medium italic mb-4 ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                      "{step.detail}"
                    </p>

                    {step.command && !isCompleted && (
                      <div className="relative group/cmd">
                         <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-xl opacity-0 group-hover/cmd:opacity-100 transition-opacity" />
                         <div className="bg-[#050810] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 relative">
                            <code className="text-[11px] font-mono text-blue-300 truncate max-w-[80%]">$ {step.command}</code>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCopy(step.command!, step.id); }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg shrink-0"
                            >
                               {copiedCmdId === step.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Causality Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl sticky top-24">
             <div className="flex items-center gap-3 px-1">
                <LayoutPanelLeft size={16} className="text-emerald-400" />
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Causality Flow Reconstruction</h4>
             </div>

             <div className="space-y-4">
                {plan.causalityChain.map((link, i) => (
                  <div key={i} className="flex gap-4 relative group">
                     {i < plan.causalityChain.length - 1 && (
                       <div className="absolute left-[7px] top-6 bottom-[-20px] w-px bg-slate-800 group-hover:bg-blue-500/30 transition-colors" />
                     )}
                     <div className={`w-4 h-4 rounded-full border-2 border-slate-900 mt-1 shrink-0 z-10
                       ${link.layer === 'FRONTEND' ? 'bg-blue-500' : 
                         link.layer === 'BACKEND' ? 'bg-emerald-500' : 
                         link.layer === 'DATABASE' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                     <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[9px] font-black text-slate-600 uppercase">{link.layer}</span>
                           <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-tighter">{link.tech}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-300 leading-snug">{link.message}</p>
                        <p className="text-[9px] text-slate-500 italic mt-1 leading-relaxed">Impact: {link.logicImpact}</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="pt-6 border-t border-slate-800/60">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fix Verification Protocol</h5>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-black text-emerald-400 uppercase italic">{plan.verification.strategy}</span>
                   </div>
                   <div className="space-y-2">
                      {plan.verification.scripts.map((s, i) => (
                        <div key={i} className="bg-slate-950 p-2 rounded-lg font-mono text-[9px] text-slate-400 border border-slate-800">
                          {s}
                        </div>
                      ))}
                   </div>
                   <div className="flex flex-wrap gap-2 pt-2">
                      {plan.verification.metricsToMonitor.map((m, i) => (
                        <span key={i} className="text-[8px] font-black bg-slate-900 px-2 py-0.5 rounded text-slate-500 uppercase">{m}</span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
