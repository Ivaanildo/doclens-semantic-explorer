
import React from 'react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ conversations, currentId, onSelectConversation, onNewConversation, onDeleteConversation, onUploadFile, fileName }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-50/30">
       <div className="p-6 space-y-6">
           <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                <div><h1 className="text-slate-900 font-black text-xl tracking-tighter leading-none">DOCLENS</h1><p className="text-[9px] text-blue-600 font-bold uppercase tracking-[0.2em] mt-1">Intelligence v3</p></div>
           </div>

           <button onClick={onNewConversation} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center space-x-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg><span>New Lens</span>
           </button>

           <label className="block w-full cursor-pointer group">
              <input type="file" accept="application/pdf" className="hidden" onChange={onUploadFile} />
              <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${fileName ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <div className="flex items-center justify-center space-x-2"><svg className={`w-4 h-4 ${fileName ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" /></svg><span className={`text-[10px] font-bold uppercase tracking-wide truncate max-w-[140px] ${fileName ? 'text-blue-700' : 'text-slate-500'}`}>{fileName || "Deploy PDF"}</span></div>
              </div>
          </label>
       </div>

       <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
            <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between"><span>Knowledge Workspace</span><span className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">{conversations.length}</span></div>
            {conversations.map((c) => (
                <div key={c.id} onClick={() => onSelectConversation(c.id)} className={`group relative flex items-center px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${currentId === c.id ? 'bg-white shadow-lg border border-slate-100' : 'hover:bg-slate-100/50'}`}>
                    <div className={`mr-4 shrink-0 transition-colors ${currentId === c.id ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                    <div className="flex-1 min-w-0 pr-6"><div className={`text-[11px] font-bold truncate transition-colors ${currentId === c.id ? 'text-slate-900' : 'text-slate-500'}`}>{c.title}</div><div className="text-[9px] text-slate-400 font-semibold mt-1 uppercase tracking-tight">{new Date(c.updatedAt).toLocaleDateString()} • {c.messages.length} notes</div></div>
                    <button onClick={(e) => onDeleteConversation(e, c.id)} className="absolute right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    {currentId === c.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/50"></div>}
                </div>
            ))}
       </div>
       
       <div className="p-6 border-t border-slate-100 bg-white/50"><div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div><div className="flex-1 min-w-0"><p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Researcher</p><p className="text-[9px] text-slate-400 font-bold truncate uppercase tracking-tight">Status: Active</p></div><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div></div></div>
    </div>
  );
};

export default Sidebar;
