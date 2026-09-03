'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { HelpCircle, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';
export default function SupportPage(){
  const [user,setUser]=useState(null);
  const [tickets,setTickets]=useState([]);
  const [subject,setSubject]=useState('');
  const [message,setMessage]=useState('');
  const [category,setCategory]=useState('general');
  const [sending,setSending]=useState(false);
  const [msg,setMsg]=useState({type:'',text:''});
  const fetchData = async()=>{
    const [uR,tR]=await Promise.all([fetch('/api/user/me'), fetch('/api/support')]);
    if(uR.ok) setUser(await uR.json());
    if(tR.ok) setTickets((await tR.json()).tickets||[]);
  };
  useEffect(()=>{ fetchData(); },[]);
  const handleSubmit = async(e)=>{
    e.preventDefault();
    if(!subject||!message){ setMsg({type:'error',text:'Fill all fields'}); return; }
    setSending(true); setMsg({type:'',text:''});
    try{
      const r=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject,message,category})});
      const d=await r.json();
      if(r.ok){ setMsg({type:'success',text:'Ticket submitted! We will reply within 24h.'}); setSubject(''); setMessage(''); fetchData(); }
      else setMsg({type:'error',text:d.error});
    }catch{ setMsg({type:'error',text:'Network error'});} finally{ setSending(false); }
  };
  return (
    <DashboardLayout title="Support" user={user}>
      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.text}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><HelpCircle className="size-4 text-[#ef4d45]"/> Create Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                <option value="general">General</option><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="trading">Trading</option><option value="account">Account</option><option value="technical">Technical</option>
              </select>
            </div>
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief summary" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Message</label><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none resize-none" required/></div>
            <button disabled={sending} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{sending? 'Sending...' : <><Send className="size-4"/> Submit Ticket</>}</button>
          </form>
          <div className="mt-6 bg-[#010214] border border-white/5 rounded-xl p-4 text-xs text-white/50">
            <p className="font-bold text-white mb-1">Need faster help?</p><p>Email: support@emporiumcapitals.com • Live chat available 9am-6pm WAT • Avg response 2 hours</p>
          </div>
        </div>
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="size-4"/> Your Tickets</h3>
          {tickets.length ? <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {tickets.map(t=>(
              <div key={t.id} className="bg-[#010214] border border-white/5 rounded-xl p-4">
                <div className="flex justify-between items-start gap-2"><p className="text-sm font-bold text-white line-clamp-1">{t.subject}</p><span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${t.status==='open'?'bg-yellow-500/10 text-yellow-400': t.status==='resolved'?'bg-emerald-500/10 text-emerald-400':'bg-white/10 text-white/60'}`}>{t.status}</span></div>
                <p className="text-xs text-white/40 mt-1">{t.category} • <Clock className="inline size-3"/> {new Date(t.created_at).toLocaleDateString()}</p>
                <p className="text-xs text-white/60 mt-2 line-clamp-2">{t.message}</p>
              </div>
            ))}
          </div> : <div className="text-center py-10 text-white/30"><CheckCircle className="size-8 mx-auto mb-2 opacity-40"/><p className="text-sm font-bold">No tickets yet</p><p className="text-xs">Your support history will appear here</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
