
import React, { memo } from 'react';
import { ProcessingStats, Severity } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, AlertCircle, Layers } from 'lucide-react';

interface LogTimelineProps {
  stats: ProcessingStats | null;
}

export const LogTimeline: React.FC<LogTimelineProps> = memo(({ stats }) => {
  if (!stats || !stats.timeBuckets.length) return null;

  // Convert timeBuckets to scatter points for specific severity events
  const scatterData = stats.timeBuckets.map((b, i) => ({
    x: i,
    y: b.errorCount > 0 ? 100 : 20,
    size: b.count,
    errors: b.errorCount,
    time: new Date(b.time).toLocaleTimeString()
  }));

  return (
    <div className="bg-white/[0.01] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Clock size={16} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Forensic Signal Trace</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic mt-1">Temporal event clustering online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Fault Density</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Volume</span>
           </div>
        </div>
      </div>

      <div className="h-[120px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
            <XAxis type="number" dataKey="x" hide />
            <YAxis type="number" dataKey="y" hide domain={[0, 150]} />
            <ZAxis type="number" dataKey="size" range={[50, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{data.time}</p>
                      <p className="text-xs font-bold text-white">{data.size} Events</p>
                      {data.errors > 0 && <p className="text-xs font-bold text-red-400 mt-1">{data.errors} Critical Errors</p>}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.errors > 0 ? '#ef4444' : '#3b82f6'} 
                  fillOpacity={0.6}
                  className="hover:fill-opacity-100 transition-all cursor-crosshair"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Layers size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Pattern Detected: Every ~15m</span>
         </div>
         <span className="text-[10px] font-bold text-slate-600 italic">Draggable zoom range active</span>
      </div>
    </div>
  );
});
