
import React, { memo } from 'react';
import { ProcessingStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface LogDistributionChartProps {
  stats: ProcessingStats | null;
}

export const LogDistributionChart: React.FC<LogDistributionChartProps> = memo(({ stats }) => {
  if (!stats || stats.timeBuckets.length === 0) return null;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Temporal Signal Density
          </h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic">Temporal Distribution Over Sampling Window</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-black text-blue-400 uppercase">Volume</span>
          </div>
          <div className="px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] font-black text-red-400 uppercase">Faults</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.timeBuckets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatDate} 
              stroke="#475569" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: 700 }}
              minTickGap={20}
            />
            <YAxis 
              stroke="#475569" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: 700 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #334155', 
                borderRadius: '12px', 
                fontSize: '10px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              labelFormatter={(label) => <span className="text-slate-400 font-bold uppercase tracking-tight">Window: {new Date(label).toLocaleTimeString()}</span>}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
              isAnimationActive={true}
            >
              {stats.timeBuckets.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.errorCount > 0 ? '#3b82f6' : '#1e40af'} 
                  fillOpacity={0.6 + (Math.min(1, entry.count / (stats.totalEntries / stats.timeBuckets.length)) * 0.4)}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="errorCount" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/60">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Peak Frequency</span>
            <span className="text-sm font-black text-slate-200 italic">{Math.max(...stats.timeBuckets.map(b => b.count))} <span className="text-[10px] text-slate-500 uppercase not-italic font-bold">Ev/Sec</span></span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Temporal Spread</span>
            <span className="text-sm font-black text-slate-200 italic">{stats.timeBuckets.length} <span className="text-[10px] text-slate-500 uppercase not-italic font-bold">Logical Slots</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 shadow-lg">
           <TrendingUp size={12} className="text-emerald-500" />
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Stream Continuity Nominal</span>
        </div>
      </div>
    </div>
  );
});

LogDistributionChart.displayName = 'LogDistributionChart';
