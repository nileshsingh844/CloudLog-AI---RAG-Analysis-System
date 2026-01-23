
import React, { memo } from 'react';
import { SystemMetrics } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Gauge, Server, AlertCircle, Clock, Database, BarChart3 } from 'lucide-react';

interface MonitoringDashboardProps {
  metrics: SystemMetrics;
  isProcessing: boolean;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = memo(({ metrics, isProcessing }) => {
  const latencyData = metrics.queryLatency.map((val, i) => ({ index: i, value: val }));

  return (
    <div className="space-y-6 p-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile icon={<Activity size={16} className="text-blue-400" />} label="Req Rate" value={metrics.totalQueries} sub="Total queries" />
        <MetricTile 
          icon={<AlertCircle size={16} className="text-red-400" />} 
          label="Errors" 
          value={metrics.errorCount} 
          sub="Failed ops" 
          status={metrics.errorCount > 5 ? 'critical' : metrics.errorCount > 0 ? 'warning' : 'healthy'}
        />
        <MetricTile icon={<Clock size={16} className="text-emerald-400" />} label="P95 Latency" value={`${Math.max(0, ...metrics.queryLatency, 0).toFixed(0)}ms`} sub="Last window" />
        <MetricTile icon={<Database size={16} className="text-purple-400" />} label="Estimated Heap" value={`${metrics.memoryUsage}MB`} sub="Memory footprint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Gauge size={14} className="text-blue-500" />
            Query Latency Trend (ms)
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis hide />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} className="text-emerald-500" />
            Saturation & Signal
          </h3>
          <div className="space-y-4">
            <Signal label="Indexing Overhead" val={metrics.indexingLatency} max={10000} unit="ms" />
            <Signal label="Ingestion Active" val={isProcessing ? 100 : 0} max={100} unit="%" color="bg-blue-500" />
            <Signal label="API Resilience" val={metrics.rateLimitHits} max={10} unit="hits" inverse />
          </div>
        </div>
      </div>
    </div>
  );
});

const MetricTile = ({ icon, label, value, sub, status = 'healthy' }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
    <div className="flex items-center justify-between mb-3">
      <div className="p-1.5 bg-slate-800 rounded-lg">{icon}</div>
      <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}></div>
    </div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
    <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
    <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
  </div>
);

const Signal = ({ label, val, max, unit, inverse, color = 'bg-emerald-500' }: any) => {
  const p = Math.min(100, (val / max) * 100);
  const barColor = inverse ? (p > 50 ? 'bg-red-500' : 'bg-blue-500') : color;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <span>{label}</span>
        <span>{val}{unit}</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${p}%` }}></div>
      </div>
    </div>
  );
};
