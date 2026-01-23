
import React from 'react';
import { AdvancedAnalysis, Severity } from '../types';
import { Activity, ShieldAlert, Zap, Link, Binary, Cpu, LayoutPanelLeft, ArrowUpRight, TrendingUp, AlertTriangle, Monitor, Package, Globe } from 'lucide-react';

interface AdvancedAnalysisPanelProps {
  data: AdvancedAnalysis;
}

export const AdvancedAnalysisPanel: React.FC<AdvancedAnalysisPanelProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Pattern Detection Hub */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Binary size={12} className="text-blue-500" />
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Neural Signature Match</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.patterns.map((pattern, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 transition-all hover:bg-slate-800/40 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${pattern.severity === Severity.ERROR ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <span className="text-[10px] font-bold text-slate-400">SIG_{pattern.signature.substring(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">{pattern.count}x</span>
                  {pattern.trend === 'increasing' && <TrendingUp size={12} className="text-red-500" />}
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono italic line-clamp-2 leading-relaxed mb-3">
                "{pattern.example}"
              </p>
              <div className="h-0.5 w-full bg-slate-800 rounded-full">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (pattern.count / 10) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Correlation & Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Link size={12} className="text-emerald-500" />
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Causal Linkage</h4>
          </div>
          <div className="space-y-2">
            {data.correlations.map((cor, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{cor.sourceEvent}</span>
                    <ArrowUpRight size={10} className="text-blue-500 shrink-0" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase">{cor.triggeredEvent}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate italic">"{cor.causalLink}"</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-[10px] font-black text-blue-400">+{cor.timeDeltaMs}ms</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap size={12} className="text-amber-500" />
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Performance Hotspots</h4>
          </div>
          <div className="space-y-2">
            {data.bottlenecks.map((bot, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 truncate">{bot.operation}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${bot.impact === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {bot.impact}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-white italic tracking-tighter">{bot.p95LatencyMs}ms</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">P95 Latency</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Infra Scan */}
      <section className="pt-4 border-t border-slate-800/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <ShieldAlert size={12} className="text-red-500" />
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Vulnerability scan</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.securityInsights.map((insight, idx) => (
                <div key={idx} className="bg-red-500/5 border-l-2 border-l-red-500 border border-slate-800 rounded-xl p-3">
                  <h5 className="text-[10px] font-black text-red-400 uppercase mb-1">{insight.type}</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic mb-2">"{insight.description}"</p>
                  <div className="text-[9px] text-emerald-500 font-bold bg-slate-900 p-1.5 rounded">
                    Fix: {insight.remediation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Cpu size={12} className="text-purple-500" />
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Memory Context</h4>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <ul className="space-y-3">
                {data.memoryInsights.map((insight, idx) => (
                  <li key={idx} className="flex gap-2 group">
                    <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">"{insight}"</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
