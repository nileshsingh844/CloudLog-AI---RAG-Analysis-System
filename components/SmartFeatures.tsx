
import React from 'react';
import { FlaskConical, Zap, ShieldAlert, BarChart3, Binary, ListFilter, Cpu, Bug } from 'lucide-react';

interface SmartFeaturesProps {
  onAction: (prompt: string) => void;
  isProcessing: boolean;
  hasStats: boolean;
}

export const SmartFeatures: React.FC<SmartFeaturesProps> = ({ onAction, isProcessing, hasStats }) => {
  const features = [
    {
      id: 'test-gen',
      title: 'Test Case Generation',
      icon: <FlaskConical className="text-amber-400" size={14} />,
      prompt: 'Based on the identified forensic signatures in the logs and the provided source code context, generate high-fidelity unit tests to reproduce these failures. Include clear verification steps to confirm the bug is resolved.',
      desc: 'Reproduce & verify bug resolutions.'
    },
    {
      id: 'logic-audit',
      title: 'Deep Logic Audit',
      icon: <Binary className="text-blue-400" size={14} />,
      prompt: 'Perform an exhaustive logical audit of the execution flow represented by the error stack traces. Cross-reference all synced code files to find race conditions, memory leaks, or logical edge cases.',
      desc: 'Causality & concurrency analysis.'
    },
    {
      id: 'security-forensics',
      title: 'Security Forensics',
      icon: <ShieldAlert className="text-red-400" size={14} />,
      prompt: 'Review the log patterns for security-sensitive events. Audit synced source code for potential vulnerabilities like unsafe sanitization, XSS vectors, or SQL injection patterns that match these log events.',
      desc: 'Flag PII leaks and exploit attempts.'
    }
  ];

  if (!hasStats) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-2 px-1">
        <Cpu size={14} className="text-blue-500" />
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Intelligence Suite</h3>
      </div>
      
      <div className="space-y-2">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onAction(feature.prompt)}
            disabled={isProcessing}
            className="w-full group relative flex flex-col p-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl hover:bg-slate-800/60 hover:border-blue-500/30 transition-all text-left overflow-hidden active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 group-hover:bg-slate-800 group-hover:border-blue-500/20 transition-all">
                {feature.icon}
              </div>
              <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                {feature.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium italic group-hover:text-slate-400 transition-colors">
              {feature.desc}
            </p>
            
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Zap size={12} className="text-blue-500 animate-pulse" />
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
        <p className="text-[9px] text-slate-600 font-bold leading-relaxed italic">
          AI Diagnostic Vectors utilize RAG-linked source context for high-fidelity reasoning.
        </p>
      </div>
    </div>
  );
};
