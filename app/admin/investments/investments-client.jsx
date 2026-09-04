'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';
import { useAdminResource } from '@/lib/hooks/useAdminResource';

export default function InvestmentsClient() {
  const [filter, setFilter] = useState('all');
  const endpoint = filter !== 'all' ? `/api/admin/investments?status=${filter}` : '/api/admin/investments';
  const { data: invData, loading, error, refetch: fetchInvestments } = useAdminResource(endpoint);
  const investments = Array.isArray(invData) ? invData : invData?.investments || [];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editValue, setEditValue] = useState({ profit: '', status: '', extend_days: '' });
  const perPage = 10;

  const filtered = investments.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.id?.toString().includes(q) ||
      inv.user_email?.toLowerCase().includes(q) ||
      inv.plan_name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = {
    total: investments.length,
    active: investments.filter((i) => i.status === 'active').length,
    completed: investments.filter((i) => i.status === 'completed').length,
    cancelled: investments.filter((i) => i.status === 'cancelled').length,
    totalAmount: investments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0),
    totalProfit: investments.reduce((s, i) => s + (parseFloat(i.profit) || 0), 0),
  };

  const handleUpdateProfit = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profit: parseFloat(editValue.profit) }),
      });
      if (!res.ok) throw new Error('Failed to update profit');
      setEditModal(null);
      fetchInvestments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to change status');
      setEditModal(null);
      fetchInvestments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/investments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_days: parseInt(editValue.extend_days) }),
      });
      if (!res.ok) throw new Error('Failed to extend duration');
      setEditModal(null);
      fetchInvestments();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatCurrency = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Investment Management</h1>
            <p className="text-gray-400 text-sm mt-1">Manage all user investments</p>
          </div>
          <button onClick={fetchInvestments} className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: Briefcase, color: 'text-white' },
            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-blue-400' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-400' },
            { label: 'Total Invested', value: formatCurrency(stats.totalAmount), icon: DollarSign, color: 'text-[#ef4d45]' },
            { label: 'Total Profit', value: formatCurrency(stats.totalProfit), icon: ArrowUpRight, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID, email, plan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#05081c] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === s
                    ? 'bg-[#ef4d45] text-white'
                    : 'bg-[#05081c] border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchInvestments} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30">
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No investments found</p>
          </div>
        ) : (
          <>
            <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Profit</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Start</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">End</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((inv) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">#{inv.id}</td>
                        <td className="px-4 py-3 text-gray-300">{inv.user_email || '-'}</td>
                        <td className="px-4 py-3 text-white">{inv.plan_name || '-'}</td>
                        <td className="px-4 py-3 text-white font-medium">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3 text-green-400">{formatCurrency(inv.profit)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(inv.start_date || inv.created_at)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(inv.end_date)}</td>
                        <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelected(inv);
                              setEditModal('actions');
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ef4d45]/10 text-gray-400 hover:text-[#ef4d45] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-[#05081c] border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-[#05081c] border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {editModal === 'actions' && selected && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
            <div className="bg-[#05081c] border border-white/10 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Investment #{selected.id}</h2>
                <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-400">User</label>
                    <p className="text-white">{selected.user_email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Plan</label>
                    <p className="text-white">{selected.plan_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Amount</label>
                    <p className="text-white">{formatCurrency(selected.amount)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Current Profit</label>
                    <p className="text-green-400">{formatCurrency(selected.profit)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Update Profit ($)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editValue.profit}
                        onChange={(e) => setEditValue({ ...editValue, profit: e.target.value })}
                        placeholder="New profit amount"
                        className="flex-1 px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                      />
                      <button
                        onClick={() => handleUpdateProfit(selected.id)}
                        disabled={actionLoading || !editValue.profit}
                        className="px-4 py-2.5 bg-[#ef4d45] rounded-lg text-white text-sm font-medium hover:bg-[#ef4d45]/80 disabled:opacity-50"
                      >
                        {actionLoading ? '...' : 'Update'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Extend Duration (days)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editValue.extend_days}
                        onChange={(e) => setEditValue({ ...editValue, extend_days: e.target.value })}
                        placeholder="Days to extend"
                        className="flex-1 px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                      />
                      <button
                        onClick={() => handleExtend(selected.id)}
                        disabled={actionLoading || !editValue.extend_days}
                        className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-500/30 disabled:opacity-50"
                      >
                        {actionLoading ? '...' : 'Extend'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Change Status</label>
                    <div className="flex gap-2">
                      {['active', 'completed', 'cancelled'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleChangeStatus(selected.id, s)}
                          disabled={actionLoading || selected.status === s}
                          className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                            selected.status === s
                              ? 'bg-[#ef4d45] text-white border-[#ef4d45]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
