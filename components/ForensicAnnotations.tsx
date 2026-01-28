
import React, { useState } from 'react';
import { ForensicComment, UserRole } from '../types';
import { MessageSquare, Send, Clock, User, ShieldCheck } from 'lucide-react';

interface ForensicAnnotationsProps {
  targetId: string;
  comments: ForensicComment[];
  onAddComment: (content: string) => void;
}

export const ForensicAnnotations: React.FC<ForensicAnnotationsProps> = ({ targetId, comments, onAddComment }) => {
  const [input, setInput] = useState('');
  const targetComments = comments.filter(c => c.targetId === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddComment(input);
      setInput('');
    }
  };

  return (
    <div className="space-y-10 py-6 border-t border-white/[0.03] mt-10">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
               <MessageSquare size={16} className="text-blue-400" />
            </div>
            <div>
               <h5 className="text-[12px] font-black text-slate-100 uppercase tracking-widest italic">Engineering Discussion</h5>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Capture Institutional Logic for this Node</p>
            </div>
         </div>
         {targetComments.length > 0 && (
           <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
             {targetComments.length} Records
           </span>
         )}
      </div>

      {targetComments.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 pl-2">
          <div className="space-y-8">
            {targetComments.map((comment) => (
              <div key={comment.id} className="flex gap-6 group transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.08] bg-slate-900 text-slate-500 group-hover:border-blue-500/30 transition-all shadow-lg`}>
                  <User size={18} />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">{comment.author}</span>
                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">@{comment.role}</span>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase ml-auto">
                       <Clock size={10} />
                       {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.03] rounded-2xl group-hover:border-blue-500/20 transition-all">
                    <p className="text-[15px] text-slate-400 leading-relaxed italic group-hover:text-slate-200 transition-colors">
                      "{comment.content}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
        <div className="relative flex items-center gap-4 bg-[#0d111c]/60 border border-white/[0.1] rounded-[2.5rem] px-8 py-5 group-focus-within:border-blue-500/40 transition-all shadow-2xl backdrop-blur-xl">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add logical context or remediation notes..."
            className="bg-transparent border-none focus:ring-0 flex-1 text-[16px] text-slate-300 placeholder:text-slate-800 font-medium italic"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-slate-800 hover:bg-blue-600 text-slate-500 hover:text-white rounded-[1.25rem] transition-all disabled:opacity-20 active:scale-95 shadow-xl border border-white/5"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 px-6">
           <ShieldCheck size={10} className="text-emerald-500/60" />
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Logic notes are persisted in local session state</p>
        </div>
      </form>
    </div>
  );
};
