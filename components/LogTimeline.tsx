
import React, { memo } from 'react';
import { ProcessingStats } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

interface LogTimelineProps {
  stats: ProcessingStats | null;
}

export const LogTimeline: React.FC<LogTimelineProps> = memo(({ stats }) => {
  if (!stats || stats.timeBuckets.length === 0) return null;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Temporal Ingestion Flow
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Log Density</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Error Spikes</span>
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.timeBuckets}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatDate} 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
              labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)" 
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="errorCount" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorError)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-emerald-500" />
          <span>Duration: {stats.timeRange.start ? Math.floor((stats.timeRange.end!.getTime() - stats.timeRange.start!.getTime()) / 1000 / 60) : 0} Minutes</span>
        </div>
        <span>{stats.totalEntries.toLocaleString()} Events Resolved</span>
      </div>
    </div>
  );
});

LogTimeline.displayName = 'LogTimeline';
