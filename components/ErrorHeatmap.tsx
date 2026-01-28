
import React from 'react';
import { HeatmapPoint } from '../types';
import { Activity, Zap } from 'lucide-react';

interface ErrorHeatmapProps {
  data: HeatmapPoint[];
  patternCallout?: string;
}

export const ErrorHeatmap: React.FC<ErrorHeatmapProps> = ({ data, patternCallout }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getIntensityColor = (val: number) => {
    if (val === 0) return 'bg-white/[0.02]';
    if (val < 30) return 'bg-red-500/20';
    if (val < 60) return 'bg-red-500/40';
    if (val < 80) return 'bg-red-500/70';
    return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-red-500" /> Temporal Error Distribution
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-600 uppercase">Intensity Scaled</span>
        </div>
      </div>

      <div className="grid grid-cols-[30px_1fr] gap-4">
        <div className="flex flex-col justify-between py-2">
          {['00', '06', '12', '18', '23'].map(h => (
            <span key={h} className="text-[8px] font-black text-slate-700">{h}h</span>
          ))}
        </div>
        <div className="grid grid-cols-24 gap-1">
          {hours.map(h => (
            <div key={h} className="flex flex-col gap-1">
              {days.map(d => {
                const point = data.find(p => p.hour === h && p.day === d) || { intensity: 0 };
                return (
                  <div 
                    key={d} 
                    className={`h-3 rounded-sm transition-all hover:scale-150 cursor-help ${getIntensityColor(point.intensity)}`}
                    title={`${d} at ${h}:00 - Intensity: ${point.intensity}%`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-4 shadow-inner">
         <Zap size={16} className="text-red-400 mt-1 shrink-0" />
         <div className="space-y-1">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Heuristic Pattern Match</p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
              {patternCallout || "High correlation with nightly automated backup window. Suggests race condition during large disk I/O."}
            </p>
         </div>
      </div>

      <style>{`
        .grid-cols-24 { grid-template-columns: repeat(24, minmax(0, 1fr)); }
      `}</style>
    </div>
  );
};
