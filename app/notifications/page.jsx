'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Bell, CheckCheck, Trash2, AlertCircle, Gift, TrendingUp, Wallet } from 'lucide-react';
export default function NotificationsPage(){
  const [user,setUser]=useState(null);
  const [notes,setNotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const fetchAll = async()=>{
    const [uR,nR]=await Promise.all([fetch('/api/user/me'), fetch('/api/notifications')]);
    if(uR.ok) setUser(await uR.json());
    if(nR.ok) setNotes((await nR.json()).notifications||[]);
    setLoading(false);
  };
  useEffect(()=>{ fetchAll(); const id=setInterval(fetchAll,10000); return()=>clearInterval(id); },[]);
  const markAll = async()=>{ await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'markAllRead'})}); fetchAll(); };
  const markOne = async(id)=>{ await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'markRead',id})}); fetchAll(); };
  const delOne = async(id)=>{ await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id})}); fetchAll(); };
  const iconFor = (type)=>{
    if(type==='success') return <Gift className="size-4 text-emerald-400"/>;
    if(type==='warning') return <AlertCircle className="size-4 text-yellow-400"/>;
    if(type==='profit') return <TrendingUp className="size-4 text-green-400"/>;
    if(type==='deposit') return <Wallet className="size-4 text-blue-400"/>;
    return <Bell className="size-4 text-white/60"/>;
  };
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  const unread = notes.filter(n=>!n.is_read).length;
  return (
    <DashboardLayout title={`Notifications ${unread?`(${unread})`:''}`} user={user}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
        <p className="text-xs text-white/40 leading-relaxed">{notes.length} total • {unread} unread • <span className="hidden sm:inline">Real-time polling every 10s</span><span className="sm:hidden">Live</span></p>
        {unread>0 && <button onClick={markAll} className="self-start sm:self-auto text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shrink-0"><CheckCheck className="size-3.5"/>Mark all read</button>}
      </div>
      <div className="bg-[#05081c] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6">
        {notes.length ? <div className="space-y-2">
          {notes.map(n=>(
            <div key={n.id} className={`border rounded-xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 ${n.is_read?'bg-[#010214] border-white/5 opacity-70':'bg-white/[0.03] border-[#ef4d45]/20'}`}>
              <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2"><p className="text-sm font-bold text-white leading-tight">{n.title}</p><span className="text-[10px] sm:text-[11px] text-white/30 shrink-0 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()} <span className="hidden sm:inline">{new Date(n.created_at).toLocaleTimeString()}</span></span></div>
                <p className="text-xs text-white/60 mt-1 leading-relaxed break-words">{n.message}</p>
                <div className="flex flex-wrap gap-2 sm:gap-2 mt-2">
                  {!n.is_read && <button onClick={()=>markOne(n.id)} className="text-[11px] font-bold text-[#ef4d45] hover:underline">Mark read</button>}
                  <button onClick={()=>delOne(n.id)} className="text-[11px] font-bold text-white/40 hover:text-red-400 flex items-center gap-1"><Trash2 className="size-3"/>Delete</button>
                  {n.link && <a href={n.link} className="text-[11px] font-bold text-blue-400 hover:underline">View</a>}
                </div>
              </div>
              {!n.is_read && <span className="size-2 rounded-full bg-[#ef4d45] mt-1 sm:mt-2 shrink-0"/>}
            </div>
          ))}
        </div> : <div className="text-center py-12 text-white/30"><Bell className="size-8 mx-auto mb-2 opacity-40"/><p className="text-sm font-bold">No notifications</p><p className="text-xs">Deposits, profits, referrals & support updates appear here</p></div>}
      </div>
    </DashboardLayout>
  );
}
