
import React from 'react';
import { DiagnosticWorkflow } from '../types';
import { CheckCircle2, Circle, Loader2, Sparkles, Target, Search, Microscope, Zap, FileText } from 'lucide-react';

interface DiagnosticRoadmapProps {
  workflow: DiagnosticWorkflow;
}

export const DiagnosticRoadmap: React.FC<DiagnosticRoadmapProps> = ({ workflow }) => {
  const steps = [
    { id: 'discovery' as keyof DiagnosticWorkflow, label: 'Discovery', icon: <Target size={12} /> },
    { id: 'summary' as keyof DiagnosticWorkflow, label: 'Summary', icon: <Search size={12} /> },
    { id: 'rootCause' as keyof DiagnosticWorkflow, label: 'Root Cause', icon: <Microscope size={12} /> },
    { id: 'fix' as keyof DiagnosticWorkflow, label: 'Fix', icon: <Zap size={12} /> },
    { id: 'report' as keyof DiagnosticWorkflow, label: 'Report', icon: <FileText size={12} /> },
  ];

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-[#0d0f14] border-b border-slate-900/50 overflow-x-auto scrollbar-hide shrink-0">
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <Sparkles size={14} className="text-blue-500" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Roadmap</span>
      </div>

      <div className="flex items-center gap-6">
        {steps.map((step, idx) => {
          const status = workflow[step.id];
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center gap-3 group shrink-0">
              <div className={`flex items-center gap-2 transition-all duration-500 ${
                status === 'completed' ? 'text-emerald-400' : 
                status === 'active' ? 'text-blue-400 scale-110' : 
                'text-slate-600'
              }`}>
                <div className="relative">
                  {status === 'completed' ? (
                    <CheckCircle2 size={16} fill="currentColor" fillOpacity={0.1} />
                  ) : status === 'active' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Circle size={16} />
                  )}
                  {status === 'active' && (
                    <div className="absolute inset-0 bg-blue-500/20 blur-sm rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="flex flex-col">
                   <div className="flex items-center gap-1.5">
                     {step.icon}
                     <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                       status === 'completed' ? 'text-slate-300' : 
                       status === 'active' ? 'text-white' : 
                       'text-slate-600'
                     }`}>
                       {step.label}
                     </span>
                   </div>
                   <span className="text-[8px] font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">
                     {status === 'completed' ? 'Done' : status === 'active' ? 'Synthesizing' : 'Pending'}
                   </span>
                </div>
              </div>
              
              {!isLast && (
                <div className={`w-8 h-px transition-all duration-1000 ${
                  status === 'completed' ? 'bg-emerald-500/40' : 'bg-slate-800'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
