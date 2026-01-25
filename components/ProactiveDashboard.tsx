
import React from 'react';
import { AnomalyAlert, PerformanceTrend, Severity } from '../types';
import { 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Activity, 
  LineChart, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Waves
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ProactiveDashboardProps {
  anomalies: AnomalyAlert[];
  trends: PerformanceTrend[];
}

export const ProactiveDashboard: React.FC<ProactiveDashboardProps> = ({ anomalies, trends }) => {
  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-full overflow-hidden pb-24">
      {/* Hero Header */}
      <div className="bg-[#0f172a] border border-blue-500/20 rounded-[2.5rem] p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-50" />
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
         
         <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-blue-600 rounded-[2rem] shadow-lg shadow-blue-500/20 ring-8 ring-blue-500/5">
               <Waves className="text-white w-8 h-8 animate-[wave_3s_ease-in-out_infinite]" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Predictive Sentinel</h2>
               <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                 <Sparkles size={12} className="text-blue-400" />
                 Baseline-Aware Anomaly Detection
               </p>
            </div>
         </div>

         <div className="flex gap-4 relative z-10">
            <HealthIndex score={88} />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Active Anomalies - 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <ShieldAlert size={20} className="text-red-500" />
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active System Deviations</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Compared to 30-Day Baseline</span>
           </div>

           <div className="space-y-4">
              {anomalies.map((anom) => (
                <div key={anom.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-red-500/30 transition-all group relative overflow-hidden shadow-xl">
                   <div className={`absolute top-0 left-0 w-1.5 h-full ${anom.severity === Severity.FATAL ? 'bg-red-500' : 'bg-amber-500'}`} />
                   
                   <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                               anom.severity === Severity.FATAL ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                               {anom.severity} Deviation
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{anom.type.replace('_', ' ')} Spike</span>
                         </div>
                         <p className="text-lg font-bold text-slate-200 italic leading-tight">"{anom.message}"</p>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{anom.timestamp.toLocaleTimeString()}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} /> Predicted Impact
                         </p>
                         <p className="text-xs text-slate-400 italic font-medium">{anom.predictedImpact}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={10} /> Remediation
                         </p>
                         <p className="text-xs text-slate-400 italic font-medium">{anom.suggestedAction}</p>
                      </div>
                   </div>

                   <button className="absolute right-6 bottom-6 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <ArrowRight size={16} />
                   </button>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[2.5rem]">
                   <ShieldAlert size={40} className="text-slate-800 mx-auto mb-4" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest italic">No baselines broken in current window</p>
                </div>
              )}
           </div>
        </div>

        {/* Long Term Trends - 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center gap-3 px-2">
              <LineChart size={20} className="text-blue-500" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Performance Drift (90 Days)</h4>
           </div>

           <div className="space-y-4">
              {trends.map((trend, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl group hover:border-blue-500/20 transition-all">
                   <div className="flex items-center justify-between">
                      <div>
                         <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">{trend.metric}</h5>
                         <div className="flex items-center gap-2 mt-1">
                            {trend.status === 'degrading' ? <TrendingDown size={14} className="text-red-400" /> : <TrendingUp size={14} className="text-emerald-400" />}
                            <span className={`text-[10px] font-bold uppercase ${trend.status === 'degrading' ? 'text-red-400' : 'text-emerald-400'}`}>
                               {trend.status === 'degrading' ? 'Degrading Drift' : 'Optimal Baseline'}
                            </span>
                         </div>
                      </div>
                      <div className="h-10 w-20">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend.values}>
                               <Area type="monotone" dataKey="value" stroke={trend.status === 'degrading' ? '#f87171' : '#10b981'} fill={trend.status === 'degrading' ? '#f87171' : '#10b981'} fillOpacity={0.1} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                         <Clock size={12} className="text-slate-500" />
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Trend Forecast</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium italic">"{trend.forecast}"</p>
                   </div>
                </div>
              ))}
           </div>

           <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2rem] flex items-start gap-4">
              <Zap size={18} className="text-blue-500 mt-1 shrink-0" />
              <div>
                 <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Proactive Recommendation</h5>
                 <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    "Based on gradual DB latency increase, we recommend adding a B-Tree index on `orders.customer_id` before the Q2 traffic spike."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const HealthIndex = ({ score }: { score: number }) => (
  <div className="bg-slate-950/50 border border-slate-800 px-8 py-4 rounded-3xl flex items-center gap-6 shadow-inner">
     <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90">
           <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
           <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500" strokeDasharray={126} strokeDashoffset={126 - (score/100) * 126} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-xs font-black text-white italic">{score}</span>
        </div>
     </div>
     <div>
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">System Health Index</p>
        <p className="text-xs font-black text-emerald-400 uppercase tracking-tighter italic">Optimal Threshold</p>
     </div>
  </div>
);

// Add keyframes to tailwind
const style = document.createElement('style');
style.innerHTML = `
@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
`;
document.head.appendChild(style);
