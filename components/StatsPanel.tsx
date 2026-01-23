
import React, { memo } from 'react';
import { ProcessingStats, Severity } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ShieldAlert, AlertCircle, Info, Activity, FileJson, Layers, Tag, Database, Hash } from 'lucide-react';

interface StatsPanelProps {
  stats: ProcessingStats | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  [Severity.FATAL]: '#ef4444',
  [Severity.ERROR]: '#f87171',
  [Severity.WARN]: '#fbbf24',
  [Severity.INFO]: '#3b82f6',
  [Severity.DEBUG]: '#64748b',
  [Severity.UNKNOWN]: '#334155',
};

export const StatsPanel: React.FC<StatsPanelProps> = memo(({ stats }) => {
  if (!stats) return null;

  const chartData = Object.entries(stats.severities)
    .filter(([_, count]) => count > 0)
    .map(([level, count]) => ({
      name: level,
      value: count,
      fill: SEVERITY_COLORS[level] || '#ccc'
    }));

  return (
    <div className="space-y-6">
      {/* File Profile Hub */}
      {stats.fileInfo && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoItem 
            icon={<FileJson size={14} className="text-blue-400" />} 
            label="Neural Format" 
            value={stats.fileInfo.format} 
          />
          <InfoItem 
            icon={<Tag size={14} className="text-emerald-400" />} 
            label="Logical Class" 
            value={stats.fileInfo.category} 
          />
          <InfoItem 
            icon={<Layers size={14} className="text-purple-400" />} 
            label="Inference Set" 
            value={stats.fileInfo.parserUsed} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Severity Spectrum Chart */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-[24px] p-6 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-400" />
                Severity Spectrum
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Global Event Distribution</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Analysis</span>
            </div>
          </div>
          
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: 800, textTransform: 'uppercase' }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: 800 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic High-Lights */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <StatCard 
            icon={<ShieldAlert size={20} className="text-red-400" />} 
            label="Critical Faults" 
            value={stats.severities[Severity.FATAL] + stats.severities[Severity.ERROR]} 
            sub="Immediate Review Required"
            trend="High Priority"
            trendColor="text-red-400"
          />
          <StatCard 
            icon={<AlertCircle size={20} className="text-amber-400" />} 
            label="Soft Warnings" 
            value={stats.severities[Severity.WARN]} 
            sub="Anomalous Behavior Detected"
            trend="Moderate"
            trendColor="text-amber-400"
          />
          <StatCard 
            icon={<Hash size={20} className="text-blue-400" />} 
            label="Total Signal" 
            value={stats.totalEntries.toLocaleString()} 
            sub={`${stats.chunkCount} Neural Segments`}
            trend="Persistent"
            trendColor="text-blue-400"
          />
        </div>
      </div>
    </div>
  );
});

StatsPanel.displayName = 'StatsPanel';

const InfoItem = memo(({ icon, label, value }: any) => (
  <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700/50 transition-colors shadow-lg">
    <div className="p-2.5 bg-slate-800 rounded-[14px] shrink-0 border border-slate-700/30">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-[13px] font-black text-slate-100 italic tracking-tight truncate">{value}</p>
    </div>
  </div>
));

const StatCard = memo(({ icon, label, value, sub, trend, trendColor }: any) => (
  <div className="bg-slate-900/60 border border-slate-800/50 rounded-[24px] p-5 flex flex-col justify-between h-full hover:border-slate-700/50 transition-all shadow-xl group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700/30 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 ${trendColor}`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-100 tracking-tighter italic mt-1">{value}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">{sub}</p>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';
