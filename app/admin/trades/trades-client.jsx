'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Filter, DollarSign, Activity, Clock } from 'lucide-react'
import AdminLayoutClient from '../admin-layout-client'

export default function TradesClient() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    asset: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalTrades: 0,
    activeTrades: 0,
    totalVolume: 0,
    avgProfit: 0
  })

  const fetchTrades = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        ...(filters.status && { status: filters.status }),
        ...(filters.asset && { asset: filters.asset }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      const res = await fetch(`/api/admin/trades?${params}`)
      if (!res.ok) throw new Error('Failed to fetch trades')
      const data = await res.json()
      setTrades(data.trades || [])

      const tradesData = data.trades || []
      setStats({
        totalTrades: tradesData.length,
        activeTrades: tradesData.filter(t => t.status === 'active').length,
        totalVolume: tradesData.reduce((acc, t) => acc + (t.amount || 0), 0),
        avgProfit: tradesData.length > 0
          ? tradesData.reduce((acc, t) => acc + (t.profit || 0), 0) / tradesData.length
          : 0
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [filters])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-500/10 text-green-400', icon: Activity },
      completed: { color: 'bg-blue-500/10 text-blue-400', icon: TrendingUp },
      closed: { color: 'bg-gray-500/10 text-gray-400', icon: TrendingDown },
      cancelled: { color: 'bg-red-500/10 text-red-400', icon: TrendingDown }
    }
    const badge = badges[status] || badges.active
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-[#010214] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ef4d45]/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-[#ef4d45]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Trade Management</h1>
                <p className="text-gray-400 text-sm">Monitor and manage all trades</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/5 rounded-lg text-white hover:bg-white/5 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Trades</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalTrades}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Trades</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.activeTrades}</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalVolume)}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Profit</p>
                  <p className={`text-2xl font-bold mt-1 ${stats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(stats.avgProfit)}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stats.avgProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {stats.avgProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-[#05081c] border border-white/5 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45]"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Asset</label>
                  <input
                    type="text"
                    value={filters.asset}
                    onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
                    placeholder="Search asset..."
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#ef4d45] animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchTrades}
                  className="px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90"
                >
                  Retry
                </button>
              </div>
            ) : trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BarChart3 className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400">No trades found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Exit Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{trade.id?.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm text-white">{trade.userName || trade.userEmail}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{trade.asset}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            trade.type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{formatCurrency(trade.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatCurrency(trade.entryPrice)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {trade.profit ? formatCurrency(trade.profit) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(trade.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {trade.duration || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(trade.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
}
