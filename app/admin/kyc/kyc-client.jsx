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
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';

export default function KycClient() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [userIdFilter, setUserIdFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('user_id') || '';
    }
    return '';
  });

  const openLightbox = (src, label) => {
    setZoom(1);
    setRotation(0);
    setLightbox({ src, label, isPdf: isPdfDoc(src) });
  };

  const closeLightbox = () => {
    setLightbox(null);
    setZoom(1);
    setRotation(0);
  };

  const isPdfDoc = (url) => {
    if (!url) return false;
    return url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (userIdFilter) params.set('user_id', userIdFilter);

      const res = await fetch(`/api/admin/kyc?${params}`);
      if (!res.ok) throw new Error('Failed to fetch KYC submissions');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.submissions || [];
      setSubmissions(list);
      // If filtering by a specific user and there's 1 match, auto-open their dossier
      if (userIdFilter && list.length === 1 && !selected) {
        setSelected(list[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter, userIdFilter]);

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.id?.toString().includes(q) ||
      s.user_email?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.id_number?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q)
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
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Helper to extract docs from submission
  const getDocuments = (sub) => {
    if (!sub) return [];
    const list = [];
    const front = sub.id_front_url || sub.front_image_url;
    const back = sub.id_back_url || sub.back_image_url;
    const selfie = sub.selfie_url;
    const address = sub.proof_of_address_url;

    if (front) list.push({ key: 'front', label: `ID Front (${sub.id_type || 'Document'})`, src: front });
    if (back) list.push({ key: 'back', label: `ID Back (${sub.id_type || 'Document'})`, src: back });
    if (selfie) list.push({ key: 'selfie', label: 'Selfie Holding ID', src: selfie });
    if (address) list.push({ key: 'address', label: 'Proof of Address / Utility', src: address });
    return list;
  };

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">KYC Management & Document Review</h1>
            <p className="text-gray-400 text-sm mt-1">Review applicant identity cards, passports, selfies, and verification documents</p>
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
                <p className="text-xs text-gray-400">Approved & Verified</p>
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

        {userIdFilter && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#ef4d45]/10 border border-[#ef4d45]/30 rounded-xl text-sm">
            <div className="flex items-center gap-2 text-white">
              <Filter className="w-4 h-4 text-[#ef4d45]" />
              <span>Filtering KYC documents for User <strong>#{userIdFilter}</strong></span>
            </div>
            <button
              onClick={() => {
                setUserIdFilter('');
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location);
                  url.searchParams.delete('user_id');
                  window.history.replaceState({}, '', url);
                }
              }}
              className="text-xs text-[#ef4d45] hover:text-white underline cursor-pointer font-medium"
            >
              Clear User Filter
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, ID number, country..."
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
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Applicant</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Country</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID Type</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">ID Number</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Uploaded Docs</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Submitted</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s) => {
                      const docs = getDocuments(s);
                      return (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-gray-300 font-mono text-xs">#{s.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{s.full_name || s.user_name || '-'}</div>
                            <div className="text-xs text-gray-400">{s.user_email || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{s.country || s.nationality || '-'}</td>
                          <td className="px-4 py-3 text-gray-300 capitalize">{s.id_type?.replace('_', ' ') || '-'}</td>
                          <td className="px-4 py-3 text-gray-300 font-mono text-xs">{s.id_number || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10">
                              <FileCheck className="w-3.5 h-3.5 text-[#ef4d45]" />
                              {docs.length} Doc{docs.length !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">{statusBadge(s.status)}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.created_at || s.submitted_at)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelected(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#ef4d45]/20 text-gray-300 hover:text-[#ef4d45] border border-white/10 hover:border-[#ef4d45]/40 transition-all text-xs font-medium cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

        {/* Detailed Submission Modal with Document Viewer */}
        {selected && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-[#05081c] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#05081c] z-10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#ef4d45]/10 border border-[#ef4d45]/20 flex items-center justify-center text-[#ef4d45]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      KYC Dossier #{selected.id}
                      {statusBadge(selected.status)}
                    </h2>
                    <p className="text-xs text-gray-400">{selected.full_name} ({selected.user_email})</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Applicant Profile Information Grid */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Applicant Personal Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Full Legal Name</span>
                      <span className="text-white font-semibold text-sm">{selected.full_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Account Email</span>
                      <span className="text-white font-medium">{selected.user_email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Phone Number</span>
                      <span className="text-white font-medium">{selected.user_phone || selected.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Date of Birth</span>
                      <span className="text-white font-medium">{selected.date_of_birth || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Gender</span>
                      <span className="text-white font-medium capitalize">{selected.gender || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Country / Nationality</span>
                      <span className="text-white font-medium">{selected.country || selected.nationality || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">City & Postal Code</span>
                      <span className="text-white font-medium">{selected.city || '-'} {selected.postal_code ? `(${selected.postal_code})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">ID Document Type</span>
                      <span className="text-[#ef4d45] font-semibold uppercase">{selected.id_type?.replace('_', ' ') || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">ID Number</span>
                      <span className="text-white font-mono font-medium">{selected.id_number || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Occupation</span>
                      <span className="text-white font-medium">{selected.occupation || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Source of Funds</span>
                      <span className="text-white font-medium">{selected.source_of_funds || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Residential Address</span>
                      <span className="text-white font-medium col-span-2">{selected.address || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Document Verification Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Uploaded Identity Documents ({getDocuments(selected).length})
                    </h3>
                    <span className="text-[11px] text-gray-500">Click any document to inspect, zoom or download</span>
                  </div>

                  {getDocuments(selected).length === 0 ? (
                    <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">No document files attached with this submission.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getDocuments(selected).map((doc) => {
                        const isPdf = isPdfDoc(doc.src);
                        return (
                          <div
                            key={doc.key}
                            className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-[#ef4d45]/50 transition-all flex flex-col group"
                          >
                            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {isPdf ? <FileText className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5 text-[#ef4d45]" />}
                                {doc.label}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/10 rounded text-gray-300">
                                {isPdf ? 'PDF' : 'IMAGE'}
                              </span>
                            </div>

                            <div
                              onClick={() => openLightbox(doc.src, doc.label)}
                              className="relative cursor-pointer bg-black flex items-center justify-center h-48 overflow-hidden group"
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <FileText className="w-12 h-12 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-semibold text-gray-200">PDF Document</span>
                                  <span className="text-[10px] text-gray-400 mt-1">Click to view or download</span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={doc.src}
                                    alt={doc.label}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fb = e.currentTarget.parentElement?.querySelector('.doc-fallback');
                                      if (fb) fb.style.display = 'flex';
                                    }}
                                  />
                                  <div className="doc-fallback hidden flex-col items-center justify-center p-4 text-center">
                                    <FileText className="w-10 h-10 text-[#ef4d45] mb-2" />
                                    <span className="text-xs font-semibold text-gray-300">Document Uploaded</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5">Click to inspect or download</span>
                                  </div>
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3 py-1.5 bg-[#ef4d45] text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                                      <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="p-2.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => openLightbox(doc.src, doc.label)}
                                className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Full Size
                              </button>
                              <a
                                href={doc.src}
                                download={`kyc-${selected.id}-${doc.key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#ef4d45] hover:underline flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Audit & Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 border-t border-white/5 pt-4">
                  <div>
                    <span>Submission Date: </span>
                    <strong className="text-gray-200">{formatDate(selected.created_at || selected.submitted_at)}</strong>
                  </div>
                  <div>
                    <span>Review Date: </span>
                    <strong className="text-gray-200">{selected.reviewed_at ? formatDate(selected.reviewed_at) : 'Awaiting Review'}</strong>
                  </div>
                  {selected.rejection_reason && (
                    <div className="col-span-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300">
                      <strong>Rejection Reason: </strong> {selected.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Admin Decision Controls */}
                {selected.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Rejection Reason (required if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="State clearly what is wrong with the documents (e.g. Blurry ID photo, expired passport, name mismatch)..."
                        rows={2}
                        className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(selected.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading ? 'Processing...' : 'Approve & Verify Identity'}
                      </button>
                      <button
                        onClick={() => handleAction(selected.id, 'rejected', rejectionReason)}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        {actionLoading ? 'Processing...' : 'Reject Submission'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Lightbox with Zoom, Rotate, and Fullscreen Tools */}
        {lightbox && (
          <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col items-center justify-between p-4 sm:p-6" onClick={closeLightbox}>
            {/* Top Toolbar */}
            <div className="w-full max-w-5xl flex items-center justify-between bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl z-20" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 text-white text-sm font-semibold">
                <FileCheck className="w-4 h-4 text-[#ef4d45]" />
                <span>{lightbox.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {!lightbox.isPdf && (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                      title="Rotate"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </>
                )}

                <a
                  href={lightbox.src}
                  download="kyc-document"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#ef4d45] hover:bg-[#d03d35] text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>

                <a
                  href={lightbox.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                  title="Open in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={closeLightbox}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 ml-2"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Stage */}
            <div className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              {lightbox.isPdf ? (
                <iframe
                  src={lightbox.src}
                  title={lightbox.label}
                  className="w-full h-[78vh] rounded-xl border border-white/10 bg-white"
                />
              ) : (
                <div className="overflow-auto max-h-[80vh] flex items-center justify-center">
                  <img
                    src={lightbox.src}
                    alt={lightbox.label}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/15 bg-black shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500 z-10">Press ESC or click outside to dismiss</p>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}

