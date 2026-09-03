'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingDown,
  AlertCircle,
  X,
  Wallet,
  Globe,
  Mail,
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

function RejectModal({ withdrawal, onClose, onConfirm }) {
  const [note, setNote] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", note, sendEmail }),
      })
      onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f2e] border border-white/10 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Reject Withdrawal</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-white/60">
          Reject withdrawal of {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(withdrawal.amount || 0)}?
        </p>
        <div className="space-y-3">
          <textarea
            placeholder="Rejection reason (sent to user if email enabled)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ef4d45]/50 h-20 resize-none"
          />
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded bg-white/5 border-white/10"
            />
            <Mail className="w-4 h-4" />
            Send email notification to user
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm">Cancel</button>
          <button onClick={handleReject} disabled={loading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function WithdrawalsClient() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [rejectTarget, setRejectTarget] = useState(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  async function fetchWithdrawals() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/withdrawals")
      const data = await res.json()
      setWithdrawals(data?.withdrawals || data?.data || [])
    } catch {
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter)

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    totalAmount: withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + (Number(w.amount) || 0), 0),
  }

  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0)

  const statusStyle = (s) => {
    if (s === "approved") return "bg-green-500/20 text-green-400"
    if (s === "pending") return "bg-yellow-500/20 text-yellow-400"
    if (s === "rejected") return "bg-red-500/20 text-red-400"
    return "bg-white/10 text-white/60"
  }

  const handleApprove = async (id) => {
    await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    })
    fetchWithdrawals()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Withdrawal Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Withdrawals" value={stats.total} color="bg-[#ef4d45]/20" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-yellow-500/20" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="bg-green-500/20" />
        <StatCard icon={TrendingDown} label="Total Paid" value={formatCurrency(stats.totalAmount)} color="bg-purple-500/20" />
      </div>

      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-[#ef4d45] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/50 font-medium py-3 px-4">ID</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">User</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Amount</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Wallet</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Network</th>
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
                  <td colSpan={8} className="py-12 text-center text-white/40">No withdrawals found</td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white/60 font-mono text-xs">{String(w.id).slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-white">{w.userName || w.userEmail || w.userId}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(w.amount)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs truncate max-w-[140px]">{w.walletAddress || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-xs">{w.network || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{new Date(w.createdAt || w.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {w.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(w.id)}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectTarget(w)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <RejectModal withdrawal={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={fetchWithdrawals} />
      )}
    </div>
  )
}
