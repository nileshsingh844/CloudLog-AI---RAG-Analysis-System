import React from 'react';
import { DiagnosticWorkflow } from '../types';
import { CheckCircle2, Circle, Loader2, Sparkles, Target, Search, Microscope, Zap, FileText } from 'lucide-react';

interface DiagnosticRoadmapProps {
  workflow: DiagnosticWorkflow;
}

export const DiagnosticRoadmap: React.FC<DiagnosticRoadmapProps> = ({ workflow }) => {
  const steps = [
    { id: 'discovery' as keyof DiagnosticWorkflow, label: 'DISCOVERY', icon: <Target size={14} /> },
    { id: 'summary' as keyof DiagnosticWorkflow, label: 'SUMMARY', icon: <Search size={14} /> },
    { id: 'rootCause' as keyof DiagnosticWorkflow, label: 'ROOT CAUSE', icon: <Microscope size={14} /> },
    { id: 'fix' as keyof DiagnosticWorkflow, label: 'FIX', icon: <Zap size={14} /> },
    { id: 'report' as keyof DiagnosticWorkflow, label: 'REPORT', icon: <FileText size={14} /> },
  ];

  return (
    <div className="flex items-center gap-6 px-8 py-4 bg-[#020617] border-b border-white/[0.03] overflow-x-auto scrollbar-hide shrink-0 z-40">
      <div className="flex items-center gap-3 mr-8 shrink-0">
        <Sparkles size={16} className="text-blue-500" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Diagnostic Roadmap</span>
      </div>

      <div className="flex items-center gap-8">
        {steps.map((step, idx) => {
          const status = workflow[step.id];
          const isLast = idx === steps.length - 1;
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div key={step.id} className="flex items-center gap-8 group shrink-0">
              <div className={`flex items-center gap-3 transition-all duration-700 ${
                isCompleted ? 'text-blue-400' : 
                isActive ? 'text-white scale-105' : 
                'text-slate-700'
              }`}>
                <div className="relative flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full border border-blue-500/50 flex items-center justify-center bg-blue-500/10">
                      <CheckCircle2 size={12} className="text-blue-400" />
                    </div>
                  ) : isActive ? (
                    <div className="relative w-5 h-5 flex items-center justify-center">
                       <Loader2 size={20} className="animate-spin text-blue-500" strokeWidth={2.5} />
                       <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center">
                       <Circle size={12} className="opacity-20" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-center min-w-[80px]">
                   <div className="flex items-center gap-2">
                     <span className={`transition-colors duration-500 ${isActive ? 'text-blue-400' : isCompleted ? 'text-blue-500' : 'text-slate-800'}`}>
                       {step.icon}
                     </span>
                     <span className={`text-[12px] font-black uppercase tracking-tighter transition-all duration-700 ${
                       isCompleted ? 'text-blue-400/80' : 
                       isActive ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 
                       'text-slate-800'
                     }`}>
                       {step.label}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`text-[9px] font-black uppercase tracking-[0.15em] mt-0.5 transition-all duration-700 ${
                       isCompleted ? 'text-blue-600 opacity-60' : 
                       isActive ? 'text-blue-500' : 
                       'text-slate-800'
                     }`}>
                       {isCompleted ? 'VERIFIED' : isActive ? 'SYNTHESIZING' : 'PENDING'}
                     </span>
                     {isActive && <div className="h-[2px] w-4 bg-blue-500/40 rounded-full overflow-hidden mt-1"><div className="h-full bg-blue-400 animate-[loading_1s_infinite]" /></div>}
                   </div>
                </div>
              </div>
              
              {!isLast && (
                <div className={`w-12 h-[1px] transition-all duration-1000 ${
                  isCompleted ? 'bg-blue-500/40' : 
                  isActive ? 'bg-gradient-to-r from-blue-500/40 to-slate-900' :
                  'bg-slate-900'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <style>{` @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } `}</style>
    </div>
  );
};