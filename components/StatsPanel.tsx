
import React, { memo } from 'react';
import { ProcessingStats, Severity } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, AlertCircle, Info, Activity } from 'lucide-react';

interface StatsPanelProps {
  stats: ProcessingStats | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  [Severity.FATAL]: '#ef4444',
  [Severity.ERROR]: '#f87171',
  [Severity.WARN]: '#fbbf24',
  [Severity.INFO]: '#60a5fa',
  [Severity.DEBUG]: '#94a3b8',
  [Severity.UNKNOWN]: '#475569',
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="sm:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-lg font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            Distribution
          </h3>
          <span className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold">Live Stats</span>
        </div>
        <div className="h-[150px] sm:h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:col-span-2 lg:col-span-1">
        <StatCard 
          icon={<ShieldAlert size={18} className="text-red-400" />} 
          label="Critical" 
          value={stats.severities[Severity.FATAL] + stats.severities[Severity.ERROR]} 
          sub="Requires Action"
        />
        <StatCard 
          icon={<AlertCircle size={18} className="text-amber-400" />} 
          label="Warnings" 
          value={stats.severities[Severity.WARN]} 
          sub="Potential Issues"
        />
        <StatCard 
          icon={<Info size={18} className="text-blue-400" />} 
          label="Events" 
          value={stats.totalEntries.toLocaleString()} 
          sub={`${stats.chunkCount} Chunks`}
        />
      </div>
    </div>
  );
});

StatsPanel.displayName = 'StatsPanel';

const StatCard = memo(({ icon, label, value, sub }: any) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 overflow-hidden">
    <div className="p-2 sm:p-3 bg-slate-900 rounded-lg shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-slate-100 truncate">{value}</p>
      <p className="text-[8px] sm:text-[10px] text-slate-500 italic mt-0.5 truncate">{sub}</p>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';
