
import React, { useState } from 'react';
import { DiagnosticWizardPlan, WizardStep, TechLayer } from '../types';
import { 
  CheckCircle2, 
  Copy, 
  Activity, 
  Database, 
  LayoutPanelLeft, 
  Monitor, 
  Zap, 
  Info, 
  ShieldCheck, 
  Check,
  ChevronRight,
  Layers,
  // Added missing Terminal icon import
  Terminal
} from 'lucide-react';

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
    FRONTEND: <Monitor size={12} />,
    BACKEND: <Zap size={12} />,
    DATABASE: <Database size={12} />,
    INFRASTRUCTURE: <LayoutPanelLeft size={12} />,
    UNKNOWN: <Info size={12} />
  };

  return (
    <div className="my-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Wizard Header - Improved padding and layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] shrink-0">
             <Activity className="text-white w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
              {plan.wizardType}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${layerColors[plan.detectedLayer]}`}>
                {plan.detectedLayer} Layer
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {plan.steps.length} Step Protocol
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl border border-white/5 relative z-10 w-fit shrink-0">
           <ShieldCheck size={14} className="text-emerald-500" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Certified Baseline</span>
        </div>
      </div>

      {/* Main Content Grid - Fixed layout to prevent sidebars from crushing main steps */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Troubleshooting Rail - Column Span 7/12 */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Layers size={16} className="text-blue-500" />
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Execution Trace</h4>
          </div>
          
          <div className="relative space-y-6 pl-4 sm:pl-6">
            {/* Connection Line */}
            <div className="absolute left-7 sm:left-9 top-10 bottom-10 w-px bg-gradient-to-b from-blue-600/50 via-slate-800 to-slate-900" />
            
            {plan.steps.map((step, idx) => {
              const isCompleted = completedSteps.has(step.id);
              const isActive = activeStepIdx === idx;
              
              return (
                <div key={step.id} className="relative pl-12 sm:pl-16">
                  {/* Timeline Node */}
                  <button 
                    onClick={() => { setActiveStepIdx(idx); toggleStep(step.id); }}
                    className={`absolute left-0 top-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 z-20 flex items-center justify-center transition-all duration-500
                    ${isCompleted ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                      isActive ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse' : 
                      'bg-[#0d0f14] border-slate-700 hover:border-slate-500'}`}
                  >
                    {isCompleted ? <Check size={16} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
                  </button>

                  {/* Step Card - Fixed overflow and wrapping */}
                  <div className={`p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 group relative
                    ${isActive ? 'bg-slate-900 border-blue-500/30 shadow-2xl ring-1 ring-blue-500/10' : 'bg-slate-900/40 border-white/[0.03] hover:border-white/10'}`}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <h5 className={`text-sm sm:text-base font-black uppercase tracking-tight leading-snug break-words max-w-full sm:max-w-[70%] ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                        {step.label}
                      </h5>
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-white/5 bg-slate-950 flex items-center gap-2 w-fit shrink-0 ${layerColors[step.layer]}`}>
                         {layerIcons[step.layer]}
                         {step.layer}
                      </div>
                    </div>
                    
                    <p className={`text-[13px] leading-relaxed font-medium italic mb-6 break-words ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                      "{step.detail}"
                    </p>

                    {step.command && !isCompleted && (
                      <div className="relative group/cmd mt-4">
                         <div className="bg-[#050810] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 relative overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0">
                               <Terminal size={14} className="text-blue-500 shrink-0" />
                               <code className="text-[12px] font-mono text-blue-300 truncate">$ {step.command}</code>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCopy(step.command!, step.id); }}
                              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg shrink-0 border border-white/5"
                            >
                               {copiedCmdId === step.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
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

        {/* Sidebar - Column Span 5/12 */}
        <div className="xl:col-span-5 space-y-8">
          {/* Causality Sidebar */}
          <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl sticky top-24">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl shrink-0">
                   <LayoutPanelLeft size={18} className="text-emerald-400" />
                </div>
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest italic">Temporal Mapping</h4>
             </div>

             <div className="space-y-6 relative px-1">
                {plan.causalityChain.map((link, i) => (
                  <div key={i} className="flex gap-5 relative group">
                     {i < plan.causalityChain.length - 1 && (
                       <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-slate-800 group-hover:bg-blue-500/20 transition-colors" />
                     )}
                     <div className={`w-4 h-4 rounded-full border-2 border-slate-950 mt-1 shrink-0 z-10 shadow-lg
                       ${link.layer === 'FRONTEND' ? 'bg-blue-500' : 
                         link.layer === 'BACKEND' ? 'bg-emerald-500' : 
                         link.layer === 'DATABASE' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{link.layer}</span>
                           <div className="h-0.5 w-3 bg-slate-800 rounded-full" />
                           <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-tighter">{link.tech}</span>
                        </div>
                        <p className="text-[12px] font-bold text-slate-200 leading-snug break-words">{link.message}</p>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed opacity-80">Logic: {link.logicImpact}</p>
                     </div>
                  </div>
                ))}
             </div>

             {/* Fix Verification Section */}
             <div className="pt-8 border-t border-white/5 space-y-5">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Verification Matrix</h5>
                <div className="p-5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl space-y-5">
                   <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <ShieldCheck size={14} className="text-emerald-500" />
                      </div>
                      <span className="text-[11px] font-black text-emerald-400 uppercase italic tracking-wide">{plan.verification.strategy}</span>
                   </div>
                   
                   <div className="space-y-2">
                      {plan.verification.scripts.map((s, i) => (
                        <div key={i} className="bg-[#050810] p-3 rounded-xl font-mono text-[10px] text-slate-400 border border-white/5 break-all">
                          {s}
                        </div>
                      ))}
                   </div>

                   <div className="flex flex-wrap gap-2 pt-1">
                      {plan.verification.metricsToMonitor.map((m, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-white/5 rounded-lg">
                           <Activity size={10} className="text-slate-600" />
                           <span className="text-[9px] font-black text-slate-500 uppercase">{m}</span>
                        </div>
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
