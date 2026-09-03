'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, Check, AlertCircle, Loader2, ArrowRight, SkipForward } from 'lucide-react';

export default function OnboardingClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [form, setForm] = useState({ username:'', phone:'', name:'' });

  useEffect(()=>{
    (async()=>{
      try {
        const r = await fetch('/api/auth/onboarding');
        if (r.status===401) { router.push('/login'); return; }
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setUser(d.user);
        setForm({ username: d.user.username||'', phone: d.user.phone||'', name: d.user.name||'' });
        if (!d.needsOnboarding) {
          // Already completed, go to dashboard
          router.push('/dashboard');
        }
      } catch (e) {
        setMsg({ type:'error', text: e.message });
      } finally { setLoading(false); }
    })();
  },[router]);

  const handleSubmit = async(e)=>{
    e.preventDefault();
    if (!form.username || !form.phone) { setMsg({type:'error', text:'Username and phone are required'}); return; }
    setSaving(true); setMsg({type:'',text:''});
    try {
      const r = await fetch('/api/auth/onboarding', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: form.username, phone: form.phone, name: form.name })});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsg({type:'success', text:'Profile completed! Redirecting...'});
      setTimeout(()=> router.push('/dashboard'), 800);
    } catch (e) { setMsg({type:'error', text: e.message}); } finally { setSaving(false); }
  };

  const handleSkip = async()=>{
    setSkipping(true); setMsg({type:'',text:''});
    try {
      const r = await fetch('/api/auth/onboarding', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'skip' })});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push('/dashboard');
    } catch (e) { setMsg({type:'error', text: e.message}); } finally { setSkipping(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <main className="min-h-screen bg-bg-base flex flex-col md:flex-row">
      <section className="hidden md:flex flex-col justify-between w-[48%] bg-[#010214] p-12 lg:p-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 size-96 bg-[#ef4d45]/10 rounded-full blur-3xl"/>
        <Link href="/"><img src="/assets/logo.png" alt="logo" className="h-10 w-auto relative z-10"/></Link>
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-4xl font-black text-white leading-tight">Almost <span className="bg-gradient-to-r from-[#ef4d45] to-[#ff8a5b] bg-clip-text text-transparent">there!</span></h2>
          <p className="text-sm text-white/60">Complete your profile to unlock deposits, trading and withdrawals. You can skip and complete later in Profile → Edit.</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <img src={user?.avatar_url || '/assets/icon.png'} alt="avatar" className="size-12 rounded-full object-cover bg-white/10"/>
            <div><p className="text-white font-bold text-sm">{user?.name}</p><p className="text-white/50 text-xs">{user?.email}</p></div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/20">© 2026 Emporium Capitals</p>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-16 bg-bg-base">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-text-main">Complete your profile</h1>
            <p className="text-sm text-text-muted">We pulled your Google name & email. Just confirm a username and phone. <span className="font-bold text-[#ef4d45]">You can skip.</span></p>
          </div>

          {msg.text && <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.type==='success'?<Check className="size-4"/>:<AlertCircle className="size-4"/>}{msg.text}</div>}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <Mail className="size-4 text-white/40"/><div><p className="text-xs text-white/40 uppercase font-bold">Google Email (verified)</p><p className="text-sm font-bold text-text-main">{user?.email}</p></div>
            <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">Verified</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs font-bold text-text-muted flex items-center gap-1"><User className="size-3.5"/> Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Jane Doe" className="mt-1 w-full bg-[#0a1824] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-[#ef4d45]"/></div>
            <div><label className="text-xs font-bold text-text-muted flex items-center gap-1"><User className="size-3.5"/> Username *</label><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="janedoe" required className="mt-1 w-full bg-[#0a1824] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-[#ef4d45]"/></div>
            <div><label className="text-xs font-bold text-text-muted flex items-center gap-1"><Phone className="size-3.5"/> Phone *</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+234..." required className="mt-1 w-full bg-[#0a1824] border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-[#ef4d45]"/></div>

            <button disabled={saving} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <><Loader2 className="size-4 animate-spin"/> Saving...</> : <>Complete & Continue <ArrowRight className="size-4"/></>}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1"/><span className="text-xs text-white/30">or</span><div className="h-px bg-white/10 flex-1"/>
          </div>

          <button onClick={handleSkip} disabled={skipping} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-main py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {skipping ? <><Loader2 className="size-4 animate-spin"/> Skipping...</> : <><SkipForward className="size-4"/> Skip for now</>}
          </button>
          <p className="text-center text-xs text-white/30">You can complete later in <Link href="/profile" className="text-[#ef4d45] hover:underline">Profile</Link>. Skipping still creates your account.</p>
        </div>
      </section>
    </main>
  );
}
