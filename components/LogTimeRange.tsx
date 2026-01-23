
import React, { memo } from 'react';
import { ProcessingStats } from '../types';
import { Clock, Calendar, ArrowRight, Timer } from 'lucide-react';

interface LogTimeRangeProps {
  stats: ProcessingStats | null;
}

export const LogTimeRange: React.FC<LogTimeRangeProps> = memo(({ stats }) => {
  if (!stats || !stats.timeRange.start || !stats.timeRange.end) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center opacity-40">
        <Clock className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest text-center">No Timestamp Data Detected</p>
      </div>
    );
  }

  const { start, end } = stats.timeRange;
  const durationMs = end.getTime() - start.getTime();
  const durationSec = Math.floor(durationMs / 1000);
  const durationMin = Math.floor(durationSec / 60);
  const durationHr = Math.floor(durationMin / 60);

  const formatDuration = () => {
    if (durationHr > 0) return `${durationHr}h ${durationMin % 60}m`;
    if (durationMin > 0) return `${durationMin}m ${durationSec % 60}s`;
    return `${durationSec}s`;
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-5 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Temporal Envelope</h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
          <Timer size={10} className="text-blue-400" />
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-300">{formatDuration()}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 space-y-0.5 sm:space-y-1">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">Start</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xs sm:text-sm font-bold text-slate-100">{formatTime(start)}</p>
            <p className="text-[8px] sm:text-[10px] text-slate-500">{formatDate(start)}</p>
          </div>
        </div>
        <ArrowRight className="hidden sm:block w-4 h-4 text-slate-700 shrink-0" />
        <div className="flex-1 space-y-0.5 sm:space-y-1 sm:text-right">
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">End</p>
          <div className="flex sm:flex-row-reverse items-baseline gap-2">
            <p className="text-xs sm:text-sm font-bold text-slate-100">{formatTime(end)}</p>
            <p className="text-[8px] sm:text-[10px] text-slate-500">{formatDate(end)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 w-full bg-slate-900 rounded-full overflow-hidden flex gap-px p-0.5">
        {stats.timeBuckets.map((bucket, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 rounded-sm transition-opacity duration-500 ${bucket.errorCount > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ opacity: Math.max(0.1, (bucket.count / (stats.totalEntries / stats.timeBuckets.length || 1))) }}
          />
        ))}
      </div>
    </div>
  );
});

LogTimeRange.displayName = 'LogTimeRange';
