
import React, { useState } from 'react';
import { Hypothesis, WarRoomAction, UserRole, StructuredAnalysis } from '../types';
import { Users, Lightbulb, CheckSquare, TrendingUp, AlertCircle, Plus, Send, ShieldCheck, XCircle, Search, Target, Users2 } from 'lucide-react';

interface WarRoomProps {
  hypotheses: Hypothesis[];
  actions: WarRoomAction[];
  userRole: UserRole;
  analysis?: StructuredAnalysis;
  onAddHypothesis: (theory: string) => void;
  onUpdateStatus: (id: string, status: Hypothesis['status']) => void;
  onAddAction: (label: string, assignee: UserRole) => void;
}

export const WarRoom: React.FC<WarRoomProps> = ({ hypotheses, actions, userRole, analysis, onAddHypothesis, onUpdateStatus, onAddAction }) => {
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newActionLabel, setNewActionLabel] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState<UserRole>('BACKEND');

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-[2.5rem] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/5">
               <Users2 className="text-white w-8 h-8" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Active War Room</h2>
               <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">Incident Coordination Center</p>
            </div>
         </div>
         
         <div className="flex gap-4">
            <div className="bg-slate-950/50 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col items-center">
               {/* Fixed property access: StructuredAnalysis contains incident_report */}
               <span className="text-xl font-black text-white italic">{analysis?.incident_report?.user_impact_percent || 0}%</span>
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">User Impact</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 px-6 py-3 rounded-2xl flex flex-col items-center">
               <span className="text-xl font-black text-blue-400 italic">{hypotheses.length}</span>
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Theories</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Hypothesis Board */}
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <Lightbulb size={16} className="text-amber-400" />
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hypothesis Board</h4>
              </div>
              <span className="text-[9px] font-bold text-slate-600 italic">Institutional Logic Memory</span>
           </div>

           <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 space-y-6">
              <div className="space-y-4">
                 {hypotheses.map((hyp) => (
                   <div key={hyp.id} className="bg-[#0d0f14] border border-slate-800 p-5 rounded-3xl group hover:border-blue-500/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                         <div className="space-y-2">
                            <div className="flex items-center gap-2">
                               <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                                  hyp.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                  hyp.status === 'ruled_out' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                               }`}>
                                  {hyp.status}
                               </span>
                               <span className="text-[9px] font-bold text-slate-600 uppercase">Proposed by {hyp.author}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-200 italic leading-relaxed">"{hyp.theory}"</p>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onUpdateStatus(hyp.id, 'confirmed')} className="p-1.5 hover:text-emerald-400 transition-colors"><ShieldCheck size={16}/></button>
                            <button onClick={() => onUpdateStatus(hyp.id, 'ruled_out')} className="p-1.5 hover:text-red-400 transition-colors"><XCircle size={16}/></button>
                         </div>
                      </div>
                   </div>
                 ))}
                 {hypotheses.length === 0 && <p className="text-center py-10 text-[11px] text-slate-600 font-bold uppercase italic">Awaiting first diagnostic theory...</p>}
              </div>

              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                 <input 
                  type="text" 
                  placeholder="Propose a new theory..." 
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 flex-1 text-xs text-slate-300 placeholder:text-slate-700"
                 />
                 <button 
                  onClick={() => { if(newHypothesis) { onAddHypothesis(newHypothesis); setNewHypothesis(''); } }}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg"
                 >
                    <Plus size={16} />
                 </button>
              </div>
           </div>
        </div>

        {/* Action Board */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center gap-2 px-2">
              <CheckSquare size={16} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cross-Team Tasks</h4>
           </div>

           <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
              <div className="space-y-3">
                 {actions.map((act) => (
                   <div key={act.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-slate-700" />
                         <span className="text-[11px] font-bold text-slate-300">{act.label}</span>
                      </div>
                      <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                         @{act.assignee}
                      </span>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                 <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Assign Remediation</h5>
                 <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Task description..." 
                      value={newActionLabel}
                      onChange={(e) => setNewActionLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[11px] text-slate-300 outline-none"
                    />
                    <div className="flex gap-2">
                       <select 
                        value={newActionAssignee}
                        onChange={(e) => setNewActionAssignee(e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-500 focus:ring-0 outline-none flex-1"
                       >
                          <option value="BACKEND">Backend Team</option>
                          <option value="DEVOPS">DevOps Team</option>
                          <option value="FRONTEND">Frontend Team</option>
                       </select>
                       <button 
                        onClick={() => { if(newActionLabel) { onAddAction(newActionLabel, newActionAssignee); setNewActionLabel(''); } }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                       >
                          Assign
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-start gap-4 shadow-inner">
              <Search size={18} className="text-emerald-500 mt-1 shrink-0" />
              <div>
                 <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Neural Matching: Project X</h5>
                 <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    "Identified a 92% structural match with a Redis incident solved by @devops 3 months ago. The solution was: VPC Upgrade."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
