'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  ArrowLeftRight,
  Briefcase,
  CreditCard,
  FileCheck,
  Wallet,
  Headphones,
  Mail,
  Settings,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Home,
  Shield,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Deposits', href: '/admin/deposits', icon: ArrowDownToLine },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpFromLine },
  { label: 'Trades', href: '/admin/trades', icon: TrendingUp },
  { label: 'Swaps', href: '/admin/swaps', icon: ArrowLeftRight },
  { label: 'Investments', href: '/admin/investments', icon: Briefcase },
  { label: 'Plans', href: '/admin/plans', icon: CreditCard },
  { label: 'KYC', href: '/admin/kyc', icon: FileCheck },
  { label: 'Wallets', href: '/admin/wallets', icon: Wallet },
  { label: 'Support', href: '/admin/support', icon: Headphones },
  { label: 'Email', href: '/admin/email', icon: Mail },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Logs', href: '/admin/logs', icon: FileText },
];

export default function AdminLayoutClient({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => setAdminName(data.name || data.email || 'Admin'))
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1),
      href: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }));
  };

  return (
    <div className="min-h-screen bg-[#010214]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#05081c] border-r border-[#1a1f3d] z-50 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-[#1a1f3d] ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-[#ef4d45]" />
              <span className="text-lg font-bold text-white">Admin</span>
            </div>
          )}
          {collapsed && <Shield className="w-7 h-7 text-[#ef4d45]" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        <nav className="py-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-128px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ef4d45]/10 text-[#ef4d45]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-[#1a1f3d] ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 h-16 bg-[#05081c]/80 backdrop-blur-xl border-b border-[#1a1f3d] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className="flex items-center gap-1 text-sm">
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              {getBreadcrumbs().slice(1).map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  {crumb.isLast ? (
                    <span className="text-white font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-gray-400 hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{adminName}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#ef4d45]/20 flex items-center justify-center">
              <span className="text-sm font-bold text-[#ef4d45]">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
