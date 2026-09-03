'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowDownCircle, RefreshCw, Bot, Wallet, ArrowUpCircle,
  History, Users, Bell, Settings, User as UserIcon, LogOut, HelpCircle,
  ArrowLeftRight, TrendingUp, Sun, Moon, Menu, X, Search
} from 'lucide-react';
import GoogleTranslate from '@/components/google-translate';
import { useTheme } from '@/components/theme-provider';

const NAV_GROUPS = [
  {
    label: 'Home',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/deposit', label: 'Deposit', icon: ArrowDownCircle },
      { href: '/packages', label: 'Re-Invest', icon: RefreshCw },
      { href: '/swap', label: 'Swap', icon: ArrowLeftRight },
      { href: '/trading', label: 'Live Trading', icon: Bot },
      { href: '/wallet-connect', label: 'Wallet Connect', icon: Wallet },
      { href: '/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
    ]
  },
  {
    label: 'Logs',
    items: [
      { href: '/investment-history', label: 'Investment History', icon: History },
      { href: '/profit-history', label: 'Profit History', icon: TrendingUp },
      { href: '/transactions', label: 'Transactions', icon: History },
    ]
  },
  {
    label: 'Account',
    items: [
      { href: '/referrals', label: 'Referrals', icon: Users },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/support', label: 'Support', icon: HelpCircle },
      { href: '/profile', label: 'Profile', icon: UserIcon },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function DashboardLayout({ children, title, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications?unread=true')
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setUnreadCount(d.count || 0))
      .catch(() => {});
    const id = setInterval(() => {
      fetch('/api/notifications?unread=true')
        .then(r => r.ok ? r.json() : { count: 0 })
        .then(d => setUnreadCount(d.count || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-[#010214] flex text-white font-sans selection:bg-[#ef4d45]/20">
      {/* Sidebar — mobile: full width on very small, otherwise 64 */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[280px] sm:w-64 bg-[#05081c]/95 border-r border-white/5 p-4 sm:p-6 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}>
        <div className="space-y-6 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Emporium" className="h-9 w-auto object-contain" />
            </Link>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-white/60 hover:text-white"><X className="size-5" /></button>
          </div>

          <nav className="space-y-6">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="space-y-2">
                <span className="text-[10px] font-black text-white/30 tracking-widest uppercase block pl-3">{group.label}</span>
                <div className="space-y-1">
                  {group.items.map(it => {
                    const Active = isActive(it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        onClick={() => setMobileOpen(false)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${Active ? 'bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white shadow-md shadow-[#ef4d45]/15' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                        <it.icon className="size-4 shrink-0" />
                        <span>{it.label}</span>
                        {it.href === '/notifications' && unreadCount > 0 && (
                          <span className="ml-auto bg-[#ef4d45] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/5 pt-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-left min-w-0">
            <div className="size-9 rounded-full bg-gradient-to-tr from-[#ef4d45] to-[#8c0030] text-white font-bold flex items-center justify-center text-sm shrink-0 uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate max-w-[110px]">{user?.username || 'User'}</span>
              <span className="text-[10px] text-white/50 truncate max-w-[110px]">{user?.email || ''}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <header className="h-14 sm:h-16 px-3 sm:px-4 md:px-8 border-b border-white/5 bg-[#010214]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-lg shrink-0">
              <Menu className="size-5" />
            </button>
            <h1 className="text-sm sm:text-base md:text-lg font-black text-white truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <button onClick={toggleTheme} className="hidden sm:flex size-8 sm:size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:border-[#ef4d45] transition-all cursor-pointer shrink-0">
              {theme === 'dark' ? <Sun className="size-3.5 sm:size-4" /> : <Moon className="size-3.5 sm:size-4" />}
            </button>
            <div className="hidden sm:block">
              <GoogleTranslate />
            </div>
            <div className="sm:hidden scale-90 origin-right">
              <GoogleTranslate />
            </div>
            <Link href="/notifications" className="relative p-1.5 sm:p-2 rounded-full border border-white/10 bg-white/5 hover:border-[#ef4d45] transition-all text-white shrink-0">
              <Bell className="size-3.5 sm:size-4" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 size-2 sm:size-2.5 rounded-full bg-[#ef4d45] border-2 border-[#010214]"></span>}
            </Link>
            <Link href="/profile" className="size-7 sm:size-8 rounded-full bg-white/10 flex items-center justify-center border border-white/15 overflow-hidden shrink-0">
              {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" className="size-full object-cover" /> : <UserIcon className="size-3.5 sm:size-4 text-white/70" />}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
