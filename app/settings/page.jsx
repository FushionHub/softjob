'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Bell, ShieldCheck, Globe, Mail, CreditCard, User as UserIcon, Key, TrendingUp } from 'lucide-react';
import GoogleTranslate from '@/components/google-translate';
import Link from 'next/link';
export default function SettingsPage(){
  const [user,setUser]=useState(null);
  const [notif,setNotif]=useState(true);
  const [emailUpd,setEmailUpd]=useState(true);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const r=await fetch('/api/user/me'); if(r.ok) setUser(await r.json()); setLoading(false);
  })();},[]);
  if(loading) return <div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <DashboardLayout title="Settings" user={user}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Account</h3>
          <div className="space-y-3">
            <Link href="/profile" className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl hover:border-white/10"><div className="flex gap-3 items-center"><UserIcon className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Profile</p><p className="text-xs text-white/40">Update name, username, phone, password</p></div></div><span className="text-white/20">→</span></Link>
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><Mail className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">{user.email}</p><p className="text-xs text-white/40">Email address</p></div></div><span className={`text-xs font-bold px-2 py-1 rounded-full ${user.email_verified?'bg-emerald-500/10 text-emerald-400':'bg-yellow-500/10 text-yellow-400'}`}>{user.email_verified?'Verified':'Pending'}</span></div>
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><Key className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Password</p><p className="text-xs text-white/40">Change via Profile page</p></div></div><Link href="/profile" className="text-xs font-bold text-[#ef4d45] hover:underline">Manage</Link></div>
          </div>
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Globe className="size-4 text-white/40"/> Language & Currency</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><Globe className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Language</p><p className="text-xs text-white/40">Choose display language</p></div></div><GoogleTranslate/></div>
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><TrendingUp className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Currency</p><p className="text-xs text-white/40">USD ($)</p></div></div><span className="text-xs font-bold text-white/40">USD Default</span></div>
          </div>
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Security</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><ShieldCheck className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Two-Factor Auth</p><p className="text-xs text-white/40">Coming soon via Authenticator app</p></div></div><span className="text-xs font-bold bg-white/5 text-white/40 px-2 py-1 rounded-full">Soon</span></div>
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><Bell className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Login Alerts</p><p className="text-xs text-white/40">Get notified on new sign-ins</p></div></div>
              <button onClick={()=>setNotif(!notif)} className={`w-12 h-6 rounded-full transition-colors ${notif?'bg-[#ef4d45]':'bg-white/10'} relative`}><span className={`absolute top-0.5 size-5 bg-white rounded-full transition-all ${notif?'left-6':'left-0.5'}`}/></button>
            </div>
          </div>
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Notifications</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><Mail className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Email Updates</p><p className="text-xs text-white/40">News & product updates</p></div></div>
              <button onClick={()=>setEmailUpd(!emailUpd)} className={`w-12 h-6 rounded-full transition-colors ${emailUpd?'bg-[#ef4d45]':'bg-white/10'} relative`}><span className={`absolute top-0.5 size-5 bg-white rounded-full transition-all ${emailUpd?'left-6':'left-0.5'}`}/></button>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#010214] border border-white/5 rounded-xl"><div className="flex gap-3 items-center"><CreditCard className="size-5 text-white/40"/><div><p className="text-sm font-bold text-white">Transaction Alerts</p><p className="text-xs text-white/40">Deposits, withdrawals, swaps</p></div></div><span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">Active • Real-time</span></div>
          </div>
        </div>

        <div className="bg-[#05081c] border border-red-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-wider mb-3">Danger Zone</h3>
          <div className="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/10 rounded-xl"><div><p className="text-sm font-bold text-white">Delete Account</p><p className="text-xs text-white/40">Permanently delete data - requires support contact</p></div><a href="/support" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black">Contact Support</a></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
