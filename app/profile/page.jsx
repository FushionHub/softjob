'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { User as UserIcon, Mail, Phone, Calendar, Edit, Save, ShieldCheck, ShieldAlert, ShieldX, Loader2, Key, Copy, Check, MapPin, Globe, Building, Briefcase, CreditCard, Wallet, Camera, Upload, AlertTriangle, Lock } from 'lucide-react';

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function ProfilePage(){
  const [user,setUser]=useState(null);
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState({type:'',text:''});
  const [form,setForm]=useState({});
  const [pwd,setPwd]=useState({current:'', next:'', confirm:''});
  const [copied,setCopied]=useState(false);
  const [avatarPreview,setAvatarPreview]=useState('');
  const [avatarFile,setAvatarFile]=useState(null);
  const [kyc,setKyc]=useState(null);
  const [kycLoading,setKycLoading]=useState(false);
  const [kycForm,setKycForm]=useState({
    full_name:'', date_of_birth:'', gender:'male', country:'', city:'', address:'', postal_code:'',
    id_type:'passport', id_number:'', id_front_url:'', id_back_url:'', selfie_url:'', proof_of_address_url:'',
    occupation:'', source_of_funds:'trading'
  });
  const fileRef = useRef(null);

  const fetchAll = async()=>{
    const [uR, kR] = await Promise.all([fetch('/api/user/me'), fetch('/api/kyc/status')]);
    if(uR.ok) {
      const u = await uR.json();
      setUser(u);
      setAvatarPreview(u.avatar_url||'');
      setForm({
        name:u.name||'', username:u.username||'', phone:u.phone||'',
        country:u.country||'', city:u.city||'', address:u.address||'', postal_code:u.postal_code||'',
        date_of_birth: u.date_of_birth ? u.date_of_birth.slice(0,10) : '',
        gender:u.gender||'male', occupation:u.occupation||'', source_of_funds:u.source_of_funds||'trading',
        wallet_address:u.wallet_address||'', avatar_url:u.avatar_url||''
      });
      setKycForm(f=> ({
        ...f,
        full_name: u.name||f.full_name,
        date_of_birth: u.date_of_birth ? u.date_of_birth.slice(0,10) : f.date_of_birth,
        gender: u.gender||f.gender,
        country: u.country||f.country,
        city: u.city||f.city,
        address: u.address||f.address,
        postal_code: u.postal_code||f.postal_code,
        occupation: u.occupation||f.occupation,
        source_of_funds: u.source_of_funds||f.source_of_funds,
      }));
    }
    if(kR.ok) {
      const kd = await kR.json();
      const prevStatus = kyc?.status;
      setKyc(kd.submission || null);
      if (kd.submission) {
        setUser(prev=> prev ? {...prev, kyc_verified: kd.user?.kyc_verified || prev.kyc_verified, kyc_status: kd.submission.status } : prev);
        // realtime toast when status changes
        if (prevStatus && prevStatus !== kd.submission.status) {
          if (kd.submission.status === 'approved') setMsg({type:'success', text:'KYC verified in real-time! ✓ Emails sent to you and admin. Profile is now locked.'});
          else if (kd.submission.status === 'rejected') setMsg({type:'error', text:`KYC rejected: ${kd.submission.rejection_reason || ''} — you can resubmit.`});
        }
      } else if (kd.user) {
        setUser(prev=> prev ? {...prev, kyc_verified: kd.user.kyc_verified, kyc_status: kd.user.kyc_status } : prev);
      }
    }
  };
  useEffect(()=>{ fetchAll(); },[]);
  // Realtime polling for KYC — every 3s when pending, or 15s otherwise
  useEffect(()=>{
    const status = kyc?.status || user?.kyc_status;
    const interval = status === 'pending' ? 3000 : 15000;
    const id = setInterval(fetchAll, interval);
    return ()=> clearInterval(id);
  }, [kyc?.status, user?.kyc_status]);

  const isLocked = user?.kyc_verified && user?.kyc_lock;
  const kycEnabled = user?.kyc_enabled !== false;

  const startEdit=()=>{
    if(isLocked){ setMsg({type:'error', text:'Profile editing is locked after KYC verification. Contact support to make changes. (Toggle via KYC_LOCK_EDIT_AFTER_VERIFIED in .env)'}); return; }
    setEditing(true); setMsg({type:'',text:''});
  };

  const handleAvatarChange = async(e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    if(f.size>5*1024*1024){ setMsg({type:'error', text:'Avatar max 5MB'}); return; }
    setAvatarFile(f);
    setAvatarPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  };

  const uploadAvatar = async()=>{
    if(!avatarFile) return null;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    const r = await fetch('/api/user/avatar', { method:'POST', body: fd });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||'Avatar upload failed');
    return d.avatar_url;
  };

  const saveProfile = async(e)=>{
    e.preventDefault();
    if(isLocked) return;
    setLoading(true); setMsg({type:'',text:''});
    try{
      let avatarUrl = form.avatar_url;
      if(avatarFile) avatarUrl = await uploadAvatar();
      const payload = { ...form, avatar_url: avatarUrl };
      const r=await fetch('/api/user/me',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const d=await r.json();
      if(r.ok){ setUser(d); setEditing(false); setAvatarFile(null); setMsg({type:'success',text:'Profile updated successfully'}); }
      else setMsg({type:'error',text:d.error});
    }catch(err){ setMsg({type:'error',text:err.message||'Network error'});} finally{ setLoading(false);}
  };

  const changePassword = async(e)=>{
    e.preventDefault();
    if(pwd.next !== pwd.confirm){ setMsg({type:'error',text:'Passwords do not match'}); return; }
    if(pwd.next.length<6){ setMsg({type:'error',text:'Password too short'}); return; }
    setLoading(true);
    try{
      const r=await fetch('/api/user/update',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:pwd.current, newPassword:pwd.next})});
      const d=await r.json();
      if(r.ok){ setMsg({type:'success',text:'Password changed'}); setPwd({current:'',next:'',confirm:''}); }
      else setMsg({type:'error',text:d.error});
    }catch{ setMsg({type:'error',text:'Network error'});} finally{ setLoading(false);}
  };

  const handleKycUpload = async(field, file)=>{
    if(!file) return;
    if(file.size>5*1024*1024){ setMsg({type:'error',text:`${field} max 5MB`}); return; }
    const dataUrl = await fileToDataUrl(file);
    setKycForm(prev=> ({...prev, [field]: dataUrl}));
  };

  const submitKyc = async(e)=>{
    e.preventDefault();
    if(isLocked) { setMsg({type:'error',text:'Already verified — cannot resubmit'}); return; }
    setKycLoading(true); setMsg({type:'',text:''});
    try{
      const r = await fetch('/api/kyc/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(kycForm) });
      const d = await r.json();
      if(r.ok){ setMsg({type:'success', text: d.message || 'KYC submitted — emails sent to you and admin. Under review (24h).'}); fetchAll(); }
      else setMsg({type:'error', text: d.error});
    }catch{ setMsg({type:'error',text:'Network error'});} finally{ setKycLoading(false); }
  };

  if(!user) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;

  const copyLink=()=>{
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link=`${base}/register?ref=${user.referral_code||user.username}`;
    navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const kycStatus = kyc?.status || user.kyc_status || 'none';
  const kycBadge = kycStatus==='approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : kycStatus==='pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : kycStatus==='rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/40 border-white/10';

  return (
    <DashboardLayout title="Profile" user={user}>
      {msg.text && <div className={`p-3 rounded-xl text-xs font-bold border flex items-start gap-2 ${msg.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-red-500/10 border-red-500/20 text-red-200'}`}>{msg.type==='success'?<Check className="size-4"/>:<AlertTriangle className="size-4"/>}<span>{msg.text}</span></div>}

      {/* Header with avatar — mobile compact */}
      <div className="bg-[#05081c] border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group shrink-0">
              <div className="size-16 sm:size-24 rounded-full bg-gradient-to-br from-[#ef4d45] to-[#8c0030] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shrink-0 overflow-hidden border-2 border-white/10">
                {avatarPreview ? <img src={avatarPreview} alt="avatar" className="size-full object-cover"/> : (user.name?.[0]?.toUpperCase()||'U')}
              </div>
              {editing && !isLocked && (
                <button onClick={()=>fileRef.current?.click()} className="absolute -bottom-1 -right-1 size-8 rounded-full bg-[#ef4d45] border-2 border-[#05081c] flex items-center justify-center text-white shadow-lg hover:bg-[#d03d35]">
                  <Camera className="size-4"/>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange}/>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-black text-white flex flex-wrap items-center gap-2">{user.name} {user.kyc_verified && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"><ShieldCheck className="size-3"/>KYC ✓</span>}</h2>
              <p className="text-xs sm:text-sm text-white/50 truncate">@{user.username} • {user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={`text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full border ${kycBadge}`}>{kycStatus.toUpperCase()}</span>
                {isLocked && <span className="text-[10px] sm:text-[11px] bg-white/5 border border-white/10 text-white/50 px-2 py-1 rounded-full flex items-center gap-1"><Lock className="size-3"/> Edit locked</span>}
                <span className="text-[11px] sm:text-xs bg-white/5 border border-white/10 text-white/50 px-2 py-1 rounded-full">Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 bg-[#010214] border border-white/5 rounded-full px-2.5 sm:px-3 py-1.5 w-fit max-w-full"><span className="text-[11px] text-white/40 hidden sm:inline">Referral:</span><span className="text-xs font-mono font-bold text-white truncate">{user.referral_code||user.username}</span><button onClick={copyLink} className="ml-1 sm:ml-2 p-1 bg-white/5 rounded-full border border-white/10 shrink-0">{copied?<Check className="size-3 text-emerald-400"/>:<Copy className="size-3 text-white/60"/>}</button></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!editing ? <button onClick={startEdit} disabled={isLocked} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black ${isLocked?'bg-white/5 text-white/30 cursor-not-allowed border border-white/5':'bg-[#ef4d45] hover:bg-[#d03d35] text-white'}`}><Edit className="size-4"/>{isLocked?'Locked (KYC)':'Edit Profile'}</button> : null}
            {kycEnabled && <div className="text-[11px] text-white/30 text-right">KYC: {kycStatus} {isLocked ? '• Toggle in .env KYC_LOCK_EDIT_AFTER_VERIFIED' : ''}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Personal info - spans 2 */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><UserIcon className="size-4 text-white/40"/> Personal Information {isLocked && <span className="ml-auto text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded-full flex items-center gap-1"><Lock className="size-3"/> Locked after KYC — .env KYC_LOCK_EDIT_AFTER_VERIFIED</span>}</h3>
            {editing ? (
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Full Name *</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#ef4d45]" required/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Username *</label><input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#ef4d45]" required/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Email (read-only)</label><input value={user.email} disabled className="mt-1 w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 outline-none cursor-not-allowed"/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Phone *</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="+1..." className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm({...form, date_of_birth:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Gender</label><select value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Country</label><input value={form.country} onChange={e=>setForm({...form, country:e.target.value})} placeholder="Nigeria" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">City</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} placeholder="Lagos" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                </div>
                <div><label className="text-[11px] font-bold text-white/50 uppercase">Address</label><input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} placeholder="Street, area" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Postal Code</label><input value={form.postal_code} onChange={e=>setForm({...form, postal_code:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Wallet Payout Address</label><input value={form.wallet_address} onChange={e=>setForm({...form, wallet_address:e.target.value})} placeholder="bc1... / 0x... (for withdrawals)" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-xs"/></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Occupation</label><select value={form.occupation} onChange={e=>setForm({...form, occupation:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="">Select</option><option>Trader</option><option>Investor</option><option>Engineer</option><option>Entrepreneur</option><option>Student</option><option>Other</option></select></div>
                  <div><label className="text-[11px] font-bold text-white/50 uppercase">Source of Funds</label><select value={form.source_of_funds} onChange={e=>setForm({...form, source_of_funds:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="trading">Trading</option><option value="salary">Salary</option><option value="business">Business</option><option value="savings">Savings</option><option value="crypto">Crypto</option></select></div>
                </div>
                {avatarFile && <p className="text-xs text-emerald-400 flex items-center gap-1"><Upload className="size-3"/> New avatar selected: {avatarFile.name} — will upload on Save</p>}
                <div className="flex gap-3 pt-2"><button disabled={loading} className="flex-1 bg-[#ef4d45] text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{loading?<Loader2 className="size-4 animate-spin"/>:<Save className="size-4"/>} Save All Changes</button><button type="button" onClick={()=>{setEditing(false); setAvatarFile(null); setAvatarPreview(user.avatar_url||'');}} className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5">Cancel</button></div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  [UserIcon, 'Full Name', user.name],
                  [Mail, 'Email', user.email],
                  [Phone, 'Phone', user.phone||'Not set'],
                  [Calendar, 'DOB', user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not set'],
                  [UserIcon, 'Gender', user.gender||'Not set'],
                  [Globe, 'Country', user.country||'Not set'],
                  [MapPin, 'City', user.city||'Not set'],
                  [Building, 'Address', user.address||'Not set'],
                  [CreditCard, 'Postal', user.postal_code||'Not set'],
                  [Briefcase, 'Occupation', user.occupation||'Not set'],
                  [Wallet, 'Payout Wallet', user.wallet_address||'Not set'],
                  [ShieldCheck, 'KYC', user.kyc_verified ? 'Verified ✓' : (kycStatus==='pending'?'Pending':kycStatus==='rejected'?'Rejected':'Not started')],
                ].map(([Icon,label,val])=> (
                  <div key={label} className="flex items-center gap-3 bg-[#010214] border border-white/5 rounded-xl p-3">
                    <Icon className="size-4 text-white/30 shrink-0"/>
                    <div className="min-w-0"><p className="text-[11px] text-white/40 uppercase font-bold truncate">{label}</p><p className="text-white font-bold text-xs truncate">{val}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KYC Section */}
          {kycEnabled && (
            <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                {kycStatus==='approved' ? <ShieldCheck className="size-4 text-emerald-400"/> : kycStatus==='pending' ? <ShieldAlert className="size-4 text-amber-400"/> : kycStatus==='rejected' ? <ShieldX className="size-4 text-red-400"/> : <ShieldCheck className="size-4 text-white/40"/>}
                KYC Verification {kycStatus!=='none' && <span className={`ml-auto text-xs px-3 py-1 rounded-full border ${kycBadge}`}>{kycStatus.toUpperCase()}</span>}
              </h3>

              {kycStatus==='approved' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm">
                  <p className="font-black text-emerald-400 flex items-center gap-2"><ShieldCheck className="size-4"/> Verified — Full access unlocked</p>
                  <p className="text-white/60 text-xs mt-1">Your identity is verified. Withdrawals, trading and reinvest are fully unlocked. Profile editing is now locked for security — contact support to update. Toggle via <code className="bg-white/10 px-1 rounded">KYC_LOCK_EDIT_AFTER_VERIFIED=false</code> in .env</p>
                  <p className="text-xs text-white/40 mt-2">Verified at: {kyc?.reviewed_at ? new Date(kyc.reviewed_at).toLocaleString() : '—'}</p>
                </div>
              ) : kycStatus==='pending' ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="font-black text-amber-400 flex items-center gap-2"><Loader2 className="size-4 animate-spin"/> Under Review — Realtime</p>
                  <p className="text-xs text-white/60 mt-1">Submitted {kyc?.submitted_at ? new Date(kyc.submitted_at).toLocaleString() : ''}. <b className="text-amber-300">Realtime:</b> polling every 3s — auto-verified in ~15s if <code className="bg-white/10 px-1 rounded">KYC_AUTO_APPROVE=true</code> (emails sent instantly to you + admin), otherwise admin reviews. You will be emailed on approval/rejection.</p>
                  <p className="text-xs text-white/40 mt-2">Docs: ID {kyc?.id_type} • {kyc?.country} — verification working realtime.</p>
                  <p className="text-[11px] text-amber-300/70 mt-1">Keep this page open — status flips to <b>Verified ✓</b> automatically without refresh.</p>
                </div>
              ) : (
                <>
                  {kycStatus==='rejected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs">
                      <p className="font-black text-red-400 flex items-center gap-2"><ShieldX className="size-4"/> Rejected</p>
                      <p className="text-white/60 mt-1">Reason: {kyc?.rejection_reason || 'Please resubmit clearer documents'}</p>
                      <p className="text-white/40 mt-1">You can resubmit below — previous data is prefilled.</p>
                    </div>
                  )}
                  <form onSubmit={submitKyc} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Full Legal Name *</label><input value={kycForm.full_name} onChange={e=>setKycForm({...kycForm, full_name:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Date of Birth *</label><input type="date" value={kycForm.date_of_birth} onChange={e=>setKycForm({...kycForm, date_of_birth:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Gender *</label><select value={kycForm.gender} onChange={e=>setKycForm({...kycForm, gender:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Country *</label><input value={kycForm.country} onChange={e=>setKycForm({...kycForm, country:e.target.value})} placeholder="Nigeria" className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">City *</label><input value={kycForm.city} onChange={e=>setKycForm({...kycForm, city:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Address *</label><input value={kycForm.address} onChange={e=>setKycForm({...kycForm, address:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Postal Code</label><input value={kycForm.postal_code} onChange={e=>setKycForm({...kycForm, postal_code:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">ID Type *</label><select value={kycForm.id_type} onChange={e=>setKycForm({...kycForm, id_type:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_license">Driver's License</option><option value="voters_card">Voter's Card</option></select></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">ID Number *</label><input value={kycForm.id_number} onChange={e=>setKycForm({...kycForm, id_number:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono" required/></div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Occupation</label><input value={kycForm.occupation} onChange={e=>setKycForm({...kycForm, occupation:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"/></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">ID Front Photo * (file or URL)</label><input type="file" accept="image/*" onChange={e=>handleKycUpload('id_front_url', e.target.files[0])} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-2 text-white text-xs file:mr-3 file:bg-[#ef4d45] file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs"/>{kycForm.id_front_url && <p className="text-[11px] text-emerald-400 mt-1 truncate">✓ Ready — {kycForm.id_front_url.slice(0,30)}...</p>}</div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">ID Back (if 2-sided)</label><input type="file" accept="image/*" onChange={e=>handleKycUpload('id_back_url', e.target.files[0])} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-2 text-white text-xs file:mr-3 file:bg-white/10 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs"/>{kycForm.id_back_url && <p className="text-[11px] text-emerald-400 mt-1">✓ Ready</p>}</div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Selfie Holding ID *</label><input type="file" accept="image/*" onChange={e=>handleKycUpload('selfie_url', e.target.files[0])} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-2 text-white text-xs file:mr-3 file:bg-[#ef4d45] file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs" required/>{kycForm.selfie_url && <p className="text-[11px] text-emerald-400 mt-1">✓ Ready</p>}</div>
                      <div><label className="text-[11px] font-bold text-white/50 uppercase">Proof of Address (utility/bank)</label><input type="file" accept="image/*,application/pdf" onChange={e=>handleKycUpload('proof_of_address_url', e.target.files[0])} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-2 text-white text-xs file:mr-3 file:bg-white/10 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs"/>{kycForm.proof_of_address_url && <p className="text-[11px] text-emerald-400 mt-1">✓ Ready</p>}</div>
                    </div>

                    <div className="bg-[#0a0e2a] border border-white/10 rounded-xl p-3 flex gap-2 text-xs text-white/60">
                      <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5"/>
                      <p>Real-time KYC: submitting emails you and admin instantly (dual email). Admin reviews via <code className="bg-white/10 px-1 rounded">/api/kyc/review</code> → you get verified/rejected email + notification. Toggle with <code className="bg-white/10 px-1 rounded">KYC_ENABLED</code> and lock with <code className="bg-white/10 px-1 rounded">KYC_LOCK_EDIT_AFTER_VERIFIED</code> in .env</p>
                    </div>

                    <button disabled={kycLoading} className="w-full bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">{kycLoading?<Loader2 className="size-4 animate-spin"/>:<Upload className="size-4"/>} {kycStatus==='rejected' ? 'Resubmit KYC' : 'Submit KYC for Review'}</button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column: password + summary */}
        <div className="space-y-6">
          <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Key className="size-4 text-white/40"/> Change Password</h3>
            <form onSubmit={changePassword} className="space-y-4">
              <div><label className="text-[11px] font-bold text-white/50 uppercase">Current Password</label><input type="password" value={pwd.current} onChange={e=>setPwd({...pwd, current:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
              <div><label className="text-[11px] font-bold text-white/50 uppercase">New Password</label><input type="password" value={pwd.next} onChange={e=>setPwd({...pwd, next:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
              <div><label className="text-[11px] font-bold text-white/50 uppercase">Confirm New Password</label><input type="password" value={pwd.confirm} onChange={e=>setPwd({...pwd, confirm:e.target.value})} className="mt-1 w-full bg-[#010214] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" required/></div>
              <button disabled={loading} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">{loading?<Loader2 className="size-4 animate-spin"/>:null} Update Password</button>
            </form>
          </div>

          <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
            <p className="text-xs font-black text-white uppercase tracking-wider">Balance Summary</p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="bg-[#010214] border border-white/5 rounded-xl p-3"><p className="text-white/40">Balance</p><p className="text-white font-black">${Number(user.balance||0).toFixed(2)}</p></div>
              <div className="bg-[#010214] border border-white/5 rounded-xl p-3"><p className="text-white/40">Profit</p><p className="text-emerald-400 font-black">${Number(user.total_profit||0).toFixed(2)}</p></div>
              <div className="bg-[#010214] border border-white/5 rounded-xl p-3"><p className="text-white/40">Bonus</p><p className="text-purple-400 font-black">${Number(user.total_bonus||0).toFixed(2)}</p></div>
              <div className="bg-[#010214] border border-white/5 rounded-xl p-3"><p className="text-white/40">Deposits</p><p className="text-white font-black">${Number(user.total_deposit||0).toFixed(2)}</p></div>
            </div>
            <div className="mt-4 bg-[#0a0e2a] border border-white/10 rounded-xl p-3 text-[11px] text-white/40">
              <p className="font-bold text-white flex items-center gap-1"><ShieldCheck className="size-3"/> Why KYC?</p>
              <p className="mt-1">Real crypto platform compliance: verify identity, prevent fraud, unlock unlimited withdrawals. Real-time email to you + admin on submit/verify/reject. Docs stored securely, auto-notify.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
