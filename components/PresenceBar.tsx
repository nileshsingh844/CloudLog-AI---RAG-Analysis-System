
import React from 'react';
import { TeamMember, InvestigationStatus } from '../types';
import { Share2, Users, Radio, CheckCircle2, Archive, MessageSquare } from 'lucide-react';

interface PresenceBarProps {
  members: TeamMember[];
  status: InvestigationStatus;
  onShare: () => void;
  onStatusChange: (status: InvestigationStatus) => void;
}

export const PresenceBar: React.FC<PresenceBarProps> = ({ members, status, onShare, onStatusChange }) => {
  const statusColors = {
    DRAFT: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    ACTIVE_WAR_ROOM: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    RESOLVED: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    ARCHIVED: 'text-slate-600 bg-slate-800 border-slate-700'
  };

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-900/40 border border-white/[0.03] rounded-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 pr-6 border-r border-white/[0.05]">
        <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${statusColors[status]}`}>
          <Radio size={10} className={status === 'ACTIVE_WAR_ROOM' ? 'animate-pulse' : ''} />
          {status.replace('_', ' ')}
        </div>
      </div>

      <div className="flex -space-x-3 items-center group">
        {members.map((m) => (
          <div 
            key={m.id} 
            className={`w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center relative cursor-help transition-transform hover:scale-110 hover:z-20 ${m.avatarColor}`}
            title={`${m.name} (${m.role}) - ${m.status}`}
          >
            <span className="text-[10px] font-black text-white">{m.name.charAt(0)}</span>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#020617] 
              ${m.status === 'active' ? 'bg-emerald-500' : m.status === 'focus' ? 'bg-blue-500' : 'bg-slate-500'}`} />
          </div>
        ))}
        <button className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-white transition-all ml-3">
          <Users size={12} />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button 
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
        >
          <Share2 size={12} className="text-blue-500" />
          Share Bundle
        </button>
        
        <div className="h-6 w-px bg-white/[0.05] mx-2" />
        
        <div className="flex items-center gap-1">
          <StatusButton active={status === 'RESOLVED'} icon={<CheckCircle2 size={12}/>} onClick={() => onStatusChange('RESOLVED')} />
          <StatusButton active={status === 'ARCHIVED'} icon={<Archive size={12}/>} onClick={() => onStatusChange('ARCHIVED')} />
        </div>
      </div>
    </div>
  );
};

const StatusButton = ({ active, icon, onClick }: { active: boolean, icon: any, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
  >
    {icon}
  </button>
);
