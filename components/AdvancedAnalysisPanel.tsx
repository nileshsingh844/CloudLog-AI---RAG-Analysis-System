
import React from 'react';
import { AdvancedAnalysis, Severity } from '../types';
import { Activity, ShieldAlert, Zap, Link, Binary, Cpu, LayoutPanelLeft, ArrowUpRight, TrendingUp, AlertTriangle, Monitor, Package, Globe } from 'lucide-react';

interface AdvancedAnalysisPanelProps {
  data: AdvancedAnalysis;
}

export const AdvancedAnalysisPanel: React.FC<AdvancedAnalysisPanelProps> = ({ data }) => {
  return (
    <div className="space-y-8 my-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Pattern Detection Hub */}
      <section>
        <div className="flex items-center gap-3 mb-5 px-2">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Binary size={16} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Recurring Pattern Intelligence</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Semantic Signature Grouping</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.patterns.map((pattern, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 hover:border-blue-500/30 transition-all group shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${pattern.severity === Severity.ERROR ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`} />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">SIG_{pattern.signature.substring(0, 8)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-[11px] font-black text-slate-100 italic">{pattern.count}x</span>
                  </div>
                  {pattern.trend === 'increasing' && <TrendingUp size={14} className="text-red-400" />}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2 italic mb-3 group-hover:text-slate-300 transition-colors">
                "{pattern.example}"
              </p>
              <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 group-hover:bg-blue-400 transition-all" style={{ width: `${Math.min(100, (pattern.count / 100) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Environment & Dependencies Hub */}
      {(data.environmentProfile || (data.dependencyAnomalies && data.dependencyAnomalies.length > 0)) && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Environment Profile */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5 px-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Monitor size={16} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Environment Fingerprint</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Automated Context Detection</p>
              </div>
            </div>
            {data.environmentProfile && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <EnvItem label="Runtime" value={data.environmentProfile.runtime} />
                  <EnvItem label="Environment" value={data.environmentProfile.env} />
                  <EnvItem label="Region" value={data.environmentProfile.region} />
                  <EnvItem label="OS" value={data.environmentProfile.os} />
                </div>
                {data.environmentProfile.detectedAnomalies && data.environmentProfile.detectedAnomalies.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Environment Anomalies</p>
                    {data.environmentProfile.detectedAnomalies.map((anom, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-amber-400 italic">
                        <AlertTriangle size={12} /> {anom}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dependency Anomalies */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5 px-2">
              <div className="p-2 bg-amber-600/20 rounded-lg">
                <Package size={16} className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Dependency Anomaly Scan</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Version Conflict Inference</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.dependencyAnomalies && data.dependencyAnomalies.map((dep, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-start gap-4 hover:border-amber-500/30 transition-all">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Package size={14} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-200 uppercase">{dep.library}</span>
                      <span className="text-[10px] font-bold text-slate-500">v{dep.currentVersion}</span>
                    </div>
                    <p className="text-[11px] text-amber-400/80 italic mb-2">"{dep.suspectedIssue}"</p>
                    {dep.remediation && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                        <ArrowUpRight size={10} /> {dep.remediation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Correlation & Bottleneck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="p-2 bg-emerald-600/20 rounded-lg">
              <Link size={16} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Causal Correlation Engine</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Temporal Logic Linkage</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.correlations.map((cor, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-800/40 transition-all shadow-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cor.sourceEvent}</span>
                    <ArrowUpRight size={12} className="text-blue-500 shrink-0" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{cor.triggeredEvent}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate italic">"{cor.causalLink}"</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-[10px] font-black text-blue-400 italic">+{cor.timeDeltaMs}ms</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase">{(cor.confidence * 100).toFixed(0)}% Conf</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Zap size={16} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Performance Regressions</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Latency Hotspot Detection</p>
            </div>
          </div>
          <div className="space-y-4">
            {data.bottlenecks.map((bot, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-100 italic tracking-tight">{bot.operation}</span>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                    ${bot.impact === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {bot.impact} IMPACT
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[20px] font-black text-white italic tracking-tighter">{bot.p95LatencyMs}ms</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">P95 System Latency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-400">{bot.count} Calls</p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Metric Sample</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Security & Memory Infrastructure Scan */}
      <section className="pt-4 border-t border-slate-800/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <ShieldAlert size={16} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Forensic Security Scan</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vulnerability & Anomaly Flags</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.securityInsights.map((insight, idx) => (
                <div key={idx} className="bg-slate-950/40 border-l-4 border-l-red-500 border border-slate-800 p-5 rounded-2xl group transition-all hover:bg-slate-900/60 shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[11px] font-black text-red-400 uppercase tracking-widest italic">{insight.type}</h5>
                    <AlertTriangle size={14} className="text-red-600 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-3">"{insight.description}"</p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Proposed Hardening</p>
                    <p className="text-[10px] text-emerald-400 font-bold italic leading-relaxed">{insight.remediation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Cpu size={16} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-widest">Memory & GC Telemetry</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Heap Leak Inference</p>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] shadow-inner flex flex-col h-full min-h-[200px]">
              <ul className="space-y-4 flex-1">
                {data.memoryInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-4 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 group-hover:scale-150 transition-transform" />
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic group-hover:text-slate-200 transition-colors">"{insight}"</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Runtime Stability</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase italic">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const EnvItem = ({ label, value }: { label: string; value?: string }) => (
  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-300 italic">{value || 'Unknown'}</p>
  </div>
);
