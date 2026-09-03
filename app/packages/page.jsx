'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Check, Loader2, Wallet } from 'lucide-react';

export default function PackagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [uRes, pRes] = await Promise.all([fetch('/api/user/me'), fetch('/api/investment-plans')]);
      if (uRes.status === 401) { router.push('/login'); return; }
      if (uRes.ok) setUser(await uRes.json());
      if (pRes.ok) setPlans((await pRes.json()).plans || []);
      setLoading(false);
    })();
  }, [router]);

  const handleReinvest = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!selected || !amt) { setMsg({ type: 'error', text: 'Select plan and amount' }); return; }
    if (amt > Number(user?.balance || 0)) { setMsg({ type: 'error', text: 'Insufficient balance - deposit first' }); return; }
    if (amt < selected.min_investment || amt > selected.max_investment) { setMsg({ type: 'error', text: `Amount must be $${selected.min_investment} - $${selected.max_investment}` }); return; }
    setProcessing(true); setMsg({ type: '', text: '' });
    try {
      const r = await fetch('/api/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt, paymentMethod: 'balance', planId: selected.id }) });
      const d = await r.json();
      if (r.ok) {
        setMsg({ type: 'success', text: 'Investment started! Profits will accrue and show in Profit History.' });
        setAmount(''); setSelected(null);
        const ur = await fetch('/api/user/me'); if (ur.ok) setUser(await ur.json());
      } else setMsg({ type: 'error', text: d.error || 'Failed' });
    } catch { setMsg({ type: 'error', text: 'Network error' }); } finally { setProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <DashboardLayout title="Re-Invest" user={user}>
      <div className="bg-gradient-to-r from-[#ef4d45]/10 to-[#8c0030]/10 border border-[#ef4d45]/20 rounded-2xl p-5 flex justify-between items-center">
        <div className="flex items-center gap-4"><div className="p-3 bg-[#ef4d45]/10 rounded-xl"><Wallet className="size-6 text-[#ef4d45]" /></div><div><p className="text-[11px] uppercase font-black text-white/50">Available Balance</p><p className="text-2xl font-black text-white">${Number(user?.balance||0).toFixed(2)}</p></div></div>
        <span className="hidden sm:block text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold">● Reinvest Ready</span>
      </div>

      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.text}</div>}

      <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Investment Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} onClick={()=>setSelected(p)} className={`p-5 rounded-2xl border-2 cursor-pointer relative ${selected?.id===p.id?'border-[#ef4d45] bg-gradient-to-br from-[#ef4d45]/20 to-[#8c0030]/20':'border-white/5 bg-[#010214] hover:border-white/10'}`}>
              {selected?.id===p.id && <div className="absolute top-2 right-2 size-6 rounded-full bg-[#ef4d45] flex items-center justify-center"><Check className="size-4 text-white" /></div>}
              <div className="flex justify-between mb-3"><h3 className="font-black text-white">{p.name}</h3><span className="text-[#ef4d45] font-black text-xl">{p.percentage}%</span></div>
              <div className="space-y-2 text-xs text-white/60"><div className="flex justify-between"><span>Duration</span><span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">{p.duration}</span></div><div className="flex justify-between"><span>Min</span><span className="text-white font-bold">${Number(p.min_investment).toLocaleString()}</span></div><div className="flex justify-between"><span>Max</span><span className="text-white font-bold">${Number(p.max_investment).toLocaleString()}</span></div></div>
              {p.featured && <span className="absolute -top-2 left-4 text-[10px] font-black bg-[#ef4d45] text-white px-2 py-0.5 rounded-full">POPULAR</span>}
            </div>
          ))}
        </div>

        {selected && (
          <form onSubmit={handleReinvest} className="mt-6 bg-[#010214] border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Reinvest from Balance • {selected.name}</h3>
            {Number(user?.balance||0) < selected.min_investment && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs font-bold text-amber-200 flex items-center gap-2">
                <Wallet className="size-4 shrink-0"/> Insufficient balance — you have ${Number(user?.balance||0).toFixed(2)}, need at least ${selected.min_investment.toLocaleString()} for {selected.name}. Deposit first.
              </div>
            )}
            <div><label className="text-[11px] font-bold text-white/50 uppercase">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={e=>setAmount(e.target.value)}
                min={selected.min_investment}
                max={selected.max_investment}
                step="0.01"
                placeholder={`$${selected.min_investment.toLocaleString()} - $${selected.max_investment.toLocaleString()}`}
                className="mt-1 w-full bg-[#05081c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#ef4d45] disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={Number(user?.balance||0) < selected.min_investment}
              />
              <p className="text-[11px] text-white/30 mt-1">Available: ${Number(user?.balance||0).toFixed(2)} • Plan range: ${selected.min_investment.toLocaleString()} – ${selected.max_investment.toLocaleString()}</p>
            </div>
            {amount && !isNaN(parseFloat(amount)) && (
              <div className="bg-gradient-to-r from-[#ef4d45]/10 to-[#8c0030]/10 border border-[#ef4d45]/20 rounded-xl p-4 flex justify-between">
                <div><span className="text-xs text-white/50">Expected Profit</span><p className="text-2xl font-black text-[#ef4d45]">${(parseFloat(amount)*selected.percentage/100).toFixed(2)}</p></div>
                <div className="text-right"><span className="text-xs text-white/50">ROI</span><p className="text-lg font-bold text-white">{selected.percentage}%</p></div>
              </div>
            )}
            <button disabled={processing || Number(user?.balance||0) < selected.min_investment} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{processing ? <><Loader2 className="size-5 animate-spin" />Processing...</> : Number(user?.balance||0) < selected.min_investment ? 'Insufficient Balance — Deposit First' : 'Start Investment'}</button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
