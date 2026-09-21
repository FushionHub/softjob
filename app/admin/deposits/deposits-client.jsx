'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Download,
  Image as ImageIcon,
  FileCheck,
  FileText,
  Loader2,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#05081c] border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-xs text-white/50">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  )
}

function ProofModal({ deposit, onClose, onConfirm, onReject }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [approving, setApproving] = useState(false);

  if (!deposit) return null;
  const isPdf = deposit.proof_url?.toLowerCase().endsWith('.pdf') || deposit.proof_url?.startsWith('data:application/pdf');

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onConfirm(deposit.id);
      onClose();
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#ef4d45]" />
              Deposit Proof of Payment
            </h3>
            <p className="text-xs text-white/50">
              Ref: {deposit.reference} • ${Number(deposit.amount).toFixed(2)} ({deposit.method || deposit.payment || 'crypto'})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">User</span>
              <span className="font-semibold text-white truncate block">{deposit.userName || deposit.userEmail || `User #${deposit.userId || deposit.user_id}`}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Amount</span>
              <span className="font-black text-emerald-400 text-sm">${Number(deposit.amount).toFixed(2)}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Status</span>
              <span className="font-bold text-yellow-400 uppercase text-[11px]">{deposit.status}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Date</span>
              <span className="text-white/80">{new Date(deposit.createdAt || deposit.date || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          {deposit.tx_hash && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Transaction Hash (TxID)</span>
              <span className="font-mono text-white select-all break-all">{deposit.tx_hash}</span>
            </div>
          )}

          {deposit.notes && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Notes</span>
              <p className="text-white/80">{deposit.notes}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/70">Receipt Document / Screenshot</span>
              <div className="flex items-center gap-1">
                {!isPdf && (
                  <>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-[11px] text-white/40 px-1">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60" title="Rotate"><RotateCw className="w-4 h-4" /></button>
                  </>
                )}
                {deposit.proof_url && (
                  <a href={deposit.proof_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 ml-1" title="Open Full Size"><ExternalLink className="w-4 h-4" /></a>
                )}
              </div>
            </div>

            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4 flex items-center justify-center min-h-[220px] max-h-[400px] overflow-auto">
              {isPdf ? (
                <div className="text-center py-6 space-y-3">
                  <FileText className="w-14 h-14 text-red-400 mx-auto" />
                  <p className="text-sm font-bold text-white">PDF Receipt Document</p>
                  <a
                    href={deposit.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4d45] hover:bg-[#ff5a4a] text-white text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download / View PDF
                  </a>
                </div>
              ) : deposit.proof_url ? (
                <img
                  src={deposit.proof_url}
                  alt="Proof of payment"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  className="max-w-full max-h-[350px] object-contain rounded-lg shadow-md"
                />
              ) : (
                <p className="text-xs text-white/40">No receipt file uploaded</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold transition-colors">
            Close
          </button>
          <div className="flex items-center gap-2">
            {deposit.status === 'pending' && (
              <>
                <button
                  onClick={() => { onClose(); onReject(deposit); }}
                  className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject Deposit
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve & Credit Balance
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ deposit, onClose, onConfirm }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/deposits/${deposit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', note }),
      })
      onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f2e] border border-white/10 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Reject Deposit</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-white/60">Are you sure you want to reject deposit #{String(deposit.id).slice(0, 8)}?</p>
        <textarea
          placeholder="Rejection note (optional, will be sent to user)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ef4d45]/50 h-20 resize-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm">Cancel</button>
          <button onClick={handleReject} disabled={loading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
            {loading ? 'Rejecting...' : 'Reject Deposit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DepositsClient() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [activeProof, setActiveProof] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchDeposits()
  }, [])

  async function fetchDeposits() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/deposits')
      const data = await res.json()
      setDeposits(data?.deposits || data?.data || [])
    } catch {
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }

  const isApproved = (s) => s === 'confirmed' || s === 'approved' || s === 'completed'
  const isPending = (s) => s === 'pending'
  const isRejected = (s) => s === 'rejected'

  const filtered = filter === 'all'
    ? deposits
    : filter === 'approved' || filter === 'confirmed'
    ? deposits.filter(d => isApproved(d.status))
    : deposits.filter(d => d.status === filter)

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => isPending(d.status)).length,
    confirmed: deposits.filter(d => isApproved(d.status)).length,
    totalAmount: deposits.filter(d => isApproved(d.status)).reduce((s, d) => s + (Number(d.amount) || 0), 0),
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)

  const statusStyle = (s) => {
    if (isApproved(s)) return 'bg-green-500/20 text-green-400 border border-green-500/30'
    if (isPending(s)) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    if (isRejected(s)) return 'bg-red-500/20 text-red-400 border border-red-500/30'
    return 'bg-white/10 text-white/60'
  }

  const handleConfirm = async (id) => {
    setProcessingId(id)
    try {
      await fetch(`/api/admin/deposits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      await fetchDeposits()
    } catch (err) {
      console.error('Approve deposit error:', err)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit Management</h1>
          <p className="text-xs text-white/50 mt-1">Review user crypto deposits, inspect uploaded proofs of payment, and approve balances</p>
        </div>
        <button
          onClick={fetchDeposits}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
        >
          Refresh Deposits
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Deposits" value={stats.total} color="bg-[#ef4d45]/20" />
        <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="bg-yellow-500/20" />
        <StatCard icon={CheckCircle} label="Approved & Credited" value={stats.confirmed} color="bg-green-500/20" />
        <StatCard icon={TrendingUp} label="Total Volume" value={formatCurrency(stats.totalAmount)} color="bg-blue-500/20" />
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'confirmed', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-[#ef4d45] text-white shadow-md' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {f === 'confirmed' ? 'Approved' : f}
          </button>
        ))}
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/50 font-medium py-3 px-4">Ref</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">User</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Amount</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Method / Coin</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Proof</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Status</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Date</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">No deposits found</td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white/70 font-mono text-xs truncate max-w-[120px]">{d.reference || String(d.id).slice(0, 8)}</td>
                    <td className="py-3 px-4 text-white">
                      <div className="font-semibold">{d.userName || d.userEmail || d.userId}</div>
                      {d.tx_hash && <div className="text-[10px] text-white/40 font-mono truncate max-w-[140px]">Tx: {d.tx_hash}</div>}
                    </td>
                    <td className="py-3 px-4 text-white font-bold">{formatCurrency(d.amount)}</td>
                    <td className="py-3 px-4 text-white/70">{d.method || d.payment || 'Crypto'}</td>
                    <td className="py-3 px-4">
                      {d.proof_url ? (
                        <button
                          onClick={() => setActiveProof(d)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ef4d45]/15 hover:bg-[#ef4d45]/25 border border-[#ef4d45]/30 text-[#ff8a5b] text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Proof
                        </button>
                      ) : (
                        <span className="text-xs text-white/30">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(d.status)}`}>
                        {isApproved(d.status) ? 'Approved' : d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{new Date(d.createdAt || d.date || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {isPending(d.status) ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleConfirm(d.id)}
                            disabled={processingId === d.id}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve & Credit Balance"
                          >
                            {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setRejectTarget(d)}
                            disabled={processingId === d.id}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeProof && (
        <ProofModal
          deposit={activeProof}
          onClose={() => setActiveProof(null)}
          onConfirm={handleConfirm}
          onReject={(d) => setRejectTarget(d)}
        />
      )}

      {rejectTarget && (
        <RejectModal deposit={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={fetchDeposits} />
      )}
    </div>
  )
}

