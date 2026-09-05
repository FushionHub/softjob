'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Repeat,
  Activity,
  Briefcase,
  X,
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

const TYPE_ICONS = {
  deposit: TrendingUp,
  withdrawal: TrendingDown,
  trade: ArrowUpDown,
  swap: Repeat,
  investment: Briefcase,
}

const TYPE_COLORS = {
  deposit: 'bg-green-500/20 text-green-400',
  withdrawal: 'bg-red-500/20 text-red-400',
  trade: 'bg-blue-500/20 text-blue-400',
  swap: 'bg-purple-500/20 text-purple-400',
  investment: 'bg-orange-500/20 text-orange-400',
}

const STATUS_COLORS = {
  completed: 'bg-green-500/20 text-green-400',
  confirmed: 'bg-green-500/20 text-green-400',
  active: 'bg-green-500/20 text-green-400',
  approved: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-red-500/20 text-red-400',
  failed: 'bg-red-500/20 text-red-400',
}

export default function TransactionsClient() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  async function fetchTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/admin/transactions?${params}`)
      const data = await res.json()
      setTransactions(data?.transactions || data?.data || [])
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [typeFilter, statusFilter, dateFrom, dateTo])

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)

  const filtered = transactions

  const stats = {
    total: transactions.length,
    deposits: transactions.filter(t => t.type === 'deposit').length,
    withdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    trades: transactions.filter(t => t.type === 'trade').length,
    swaps: transactions.filter(t => t.type === 'swap').length,
    investments: transactions.filter(t => t.type === 'investment').length,
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/admin/transactions/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">All Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters ? 'bg-[#ef4d45] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Activity} label="Total" value={stats.total} color="bg-white/10" />
        <StatCard icon={TrendingUp} label="Deposits" value={stats.deposits} color="bg-green-500/20" />
        <StatCard icon={TrendingDown} label="Withdrawals" value={stats.withdrawals} color="bg-red-500/20" />
        <StatCard icon={ArrowUpDown} label="Trades" value={stats.trades} color="bg-blue-500/20" />
        <StatCard icon={Repeat} label="Swaps" value={stats.swaps} color="bg-purple-500/20" />
        <StatCard icon={Briefcase} label="Investments" value={stats.investments} color="bg-orange-500/20" />
      </div>

      {showFilters && (
        <div className="bg-[#05081c] border border-white/5 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="trade">Trade</option>
                <option value="swap">Swap</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
              />
            </div>
          </div>
          <button
            onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo('') }}
            className="text-xs text-[#ef4d45] hover:text-[#ef4d45]/80 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/50 font-medium py-3 px-4">ID</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Type</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">User</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Amount</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Status</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">No transactions found</td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const TypeIcon = TYPE_ICONS[tx.type] || Activity
                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/60 font-mono text-xs">{String(tx.id).slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[tx.type] || 'bg-white/10 text-white/60'}`}>
                          <TypeIcon className="w-3 h-3" />
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{tx.userName || tx.userEmail || tx.userId || 'N/A'}</td>
                      <td className="py-3 px-4 text-white font-medium">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[tx.status] || 'bg-white/10 text-white/60'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/60">{new Date(tx.createdAt || tx.date).toLocaleDateString()}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
