
import React, { memo } from 'react';
import { ProcessingStats, Severity } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ShieldAlert, AlertCircle, Info, Activity, FileJson, Layers, Tag, Database, Hash, Sparkles } from 'lucide-react';

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

  // @google/genai coding guidelines: Casting Object.entries to fix 'unknown' type inference on numeric values
  const chartData = (Object.entries(stats.severities) as [string, number][])
    .filter(([_, count]) => count > 0)
    .map(([level, count]) => ({
      name: level,
      value: count,
      fill: SEVERITY_COLORS[level] || '#ccc'
    }));

  return (
    <div className="space-y-6">
      {/* File Profile Hub - Adaptive Grid */}
      {stats.fileInfo && (
        <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-3">
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

      <div className="flex flex-col gap-4">
        {/* Severity Spectrum Chart Container */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-5 sm:p-6 overflow-hidden shadow-xl">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-400" />
                Severity Spectrum
              </h3>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
               <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Deduplicated Stream</span>
            </div>
          </div>
          
          <div className="h-[180px] xs:h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: 800, textTransform: 'uppercase' }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={8} 
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
                    fontSize: '10px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic High-Lights - Adaptive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            icon={<ShieldAlert size={18} className="text-red-400" />} 
            label="Critical Faults" 
            value={stats.severities[Severity.FATAL] + stats.severities[Severity.ERROR]} 
            sub="Immediate Action"
            trendColor="text-red-400"
          />
          <StatCard 
            icon={<AlertCircle size={18} className="text-amber-400" />} 
            label="Unique Signals" 
            value={stats.uniqueEntries} 
            sub={`Collapsed from ${stats.totalEntries}`}
            trendColor="text-amber-400"
          />
          <StatCard 
            icon={<Hash size={18} className="text-blue-400" />} 
            label="Logic Nodes" 
            value={stats.uniqueChunks} 
            sub={`Unique RAG segments`}
            trendColor="text-blue-400"
            className="xs:col-span-2 lg:col-span-1"
          />
        </div>
      </div>
    </div>
  );
});

StatsPanel.displayName = 'StatsPanel';

const InfoItem = memo(({ icon, label, value }: any) => (
  <div className="bg-slate-900/40 border border-slate-800/40 p-3.5 rounded-2xl flex items-center gap-3.5 hover:border-slate-700/40 transition-colors shadow-lg">
    <div className="p-2 bg-slate-800/60 rounded-xl shrink-0 border border-slate-700/20">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-slate-100 italic tracking-tight truncate">{value}</p>
    </div>
  </div>
));

const StatCard = memo(({ icon, label, value, sub, trendColor, className }: any) => (
  <div className={`bg-slate-900/40 border border-slate-800/40 rounded-[2rem] p-4 flex flex-col justify-between hover:border-slate-700/40 transition-all shadow-xl group ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/20 group-hover:scale-105 transition-transform">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black ${trendColor} tracking-tighter italic mt-1`}>{value}</p>
      <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase truncate">{sub}</p>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';
