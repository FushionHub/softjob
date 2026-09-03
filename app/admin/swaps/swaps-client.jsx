'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftRight, RefreshCw, Filter, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import AdminLayoutClient from '../admin-layout-client'

export default function SwapsClient() {
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalSwaps: 0,
    completedSwaps: 0,
    totalVolume: 0,
    totalFees: 0
  })

  const fetchSwaps = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      const res = await fetch(`/api/admin/swaps?${params}`)
      if (!res.ok) throw new Error('Failed to fetch swaps')
      const data = await res.json()
      setSwaps(data.swaps || [])

      const swapsData = data.swaps || []
      setStats({
        totalSwaps: swapsData.length,
        completedSwaps: swapsData.filter(s => s.status === 'completed').length,
        totalVolume: swapsData.reduce((acc, s) => acc + (s.fromAmount || 0), 0),
        totalFees: swapsData.reduce((acc, s) => acc + (s.fee || 0), 0)
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSwaps()
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(num)
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: 'bg-green-500/10 text-green-400', icon: CheckCircle },
      pending: { color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
      processing: { color: 'bg-blue-500/10 text-blue-400', icon: RefreshCw },
      failed: { color: 'bg-red-500/10 text-red-400', icon: ArrowLeftRight }
    }
    const badge = badges[status] || badges.pending
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
                <ArrowLeftRight className="w-6 h-6 text-[#ef4d45]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Swap Management</h1>
                <p className="text-gray-400 text-sm">Monitor and manage all asset swaps</p>
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
                  <p className="text-sm text-gray-400">Total Swaps</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalSwaps}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg">
                  <ArrowLeftRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.completedSwaps}</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
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
                  <p className="text-sm text-gray-400">Total Fees</p>
                  <p className="text-2xl font-bold text-[#ef4d45] mt-1">{formatCurrency(stats.totalFees)}</p>
                </div>
                <div className="p-2 bg-[#ef4d45]/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#ef4d45]" />
                </div>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-[#05081c] border border-white/5 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onClick={fetchSwaps}
                  className="px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90"
                >
                  Retry
                </button>
              </div>
            ) : swaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ArrowLeftRight className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400">No swaps found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">From Asset</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">To Asset</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">From Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">To Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fee</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {swaps.map((swap) => (
                      <tr key={swap.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{swap.id?.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm text-white">{swap.userName || swap.userEmail}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{swap.fromAsset}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{swap.toAsset}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatNumber(swap.fromAmount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatNumber(swap.toAmount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{swap.rate ? formatNumber(swap.rate) : '-'}</td>
                        <td className="px-6 py-4 text-sm text-[#ef4d45]">{swap.fee ? formatCurrency(swap.fee) : '-'}</td>
                        <td className="px-6 py-4">{getStatusBadge(swap.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(swap.createdAt)}</td>
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
