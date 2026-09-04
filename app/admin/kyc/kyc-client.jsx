'use client';

import { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  AlertTriangle,
  User,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';
import { useAdminResource } from '@/lib/hooks/useAdminResource';

export default function KycClient() {
  const [filter, setFilter] = useState('all');
  const endpoint = filter !== 'all' ? `/api/admin/kyc?status=${filter}` : '/api/admin/kyc';
  const { data: kycData, loading, error, refetch: fetchSubmissions } = useAdminResource(endpoint);
  const submissions = Array.isArray(kycData) ? kycData : kycData?.submissions || [];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.id?.toString().includes(q) ||
      s.user_email?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.id_number?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = {
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  const handleAction = async (id, action, reason = '') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, rejection_reason: reason }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} submission`);
      setSelected(null);
      setRejectionReason('');
      fetchSubmissions();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">KYC Management</h1>
            <p className="text-gray-400 text-sm mt-1">Review and manage identity verification submissions</p>
          </div>
          <button onClick={fetchSubmissions} className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-400">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                <p className="text-xs text-gray-400">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-xs text-gray-400">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID, email, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#05081c] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
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
            <button onClick={fetchSubmissions} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30">
              Retry
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-12 text-center">
            <FileCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No KYC submissions found</p>
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
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Full Name</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID Type</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID Number</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Submitted</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Reviewed</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">#{s.id}</td>
                        <td className="px-4 py-3 text-gray-300">{s.user_email || '-'}</td>
                        <td className="px-4 py-3 text-white">{s.full_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-300">{s.id_type || '-'}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">{s.id_number || '-'}</td>
                        <td className="px-4 py-3">{statusBadge(s.status)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.created_at || s.submitted_at)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.reviewed_at)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(s)} className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ef4d45]/10 text-gray-400 hover:text-[#ef4d45] transition-colors">
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

        {selected && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-[#05081c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">KYC Submission Details</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Submission ID</label>
                    <p className="text-white font-mono">#{selected.id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Status</label>
                    {statusBadge(selected.status)}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">User Email</label>
                    <p className="text-white">{selected.user_email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                    <p className="text-white">{selected.full_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Date of Birth</label>
                    <p className="text-white">{selected.date_of_birth || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nationality</label>
                    <p className="text-white">{selected.nationality || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ID Type</label>
                    <p className="text-white">{selected.id_type || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ID Number</label>
                    <p className="text-white font-mono">{selected.id_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Address</label>
                    <p className="text-white">{selected.address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Submitted</label>
                    <p className="text-white">{formatDate(selected.created_at || selected.submitted_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Reviewed</label>
                    <p className="text-white">{formatDate(selected.reviewed_at)}</p>
                  </div>
                  {selected.rejection_reason && (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">Rejection Reason</label>
                      <p className="text-red-400">{selected.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {(selected.front_image_url || selected.back_image_url || selected.selfie_url) && (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Document Images</label>
                    <div className="grid grid-cols-2 gap-3">
                      {selected.front_image_url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Front</p>
                          <img src={selected.front_image_url} alt="Front ID" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                        </div>
                      )}
                      {selected.back_image_url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Back</p>
                          <img src={selected.back_image_url} alt="Back ID" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                        </div>
                      )}
                      {selected.selfie_url && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Selfie</p>
                          <img src={selected.selfie_url} alt="Selfie" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Rejection Reason (optional)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason if rejecting..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(selected.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(selected.id, 'rejected', rejectionReason)}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
