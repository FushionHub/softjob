'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Eye,
  FileCheck,
  ListChecks,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useRouter } from 'next/navigation'

function SkeletonCard() {
  return (
    <div className="bg-[#05081c] border border-white/5 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-10 w-10 bg-white/5 rounded-lg" />
      </div>
      <div className="h-8 w-20 bg-white/10 rounded mb-2" />
      <div className="h-3 w-32 bg-white/5 rounded" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-[#05081c] border border-white/5 rounded-xl p-5 animate-pulse">
      <div className="h-5 w-40 bg-white/10 rounded mb-6" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 mb-4">
          <div className="h-4 w-16 bg-white/5 rounded" />
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-4 w-20 bg-white/5 rounded" />
          <div className="h-4 w-16 bg-white/5 rounded" />
          <div className="h-4 w-20 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, color, loading }) {
  if (loading) return <SkeletonCard />
  return (
    <div className="bg-[#05081c] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-white/60">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(change)}% this week</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardClient() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingKyc: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
  })
  const [chartData, setChartData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      setLoading(true)
      const [usersRes, txRes, depRes, wdRes, kycRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/deposits'),
        fetch('/api/admin/withdrawals'),
        fetch('/api/admin/kyc'),
      ])

      const [users, transactions, deposits, withdrawals, kyc] = await Promise.all([
        usersRes.json(),
        txRes.json(),
        depRes.json(),
        wdRes.json(),
        kycRes.json(),
      ])

      const userList = users?.users || users?.data || []
      const txList = transactions?.transactions || transactions?.data || []
      const depList = deposits?.deposits || deposits?.data || []
      const wdList = withdrawals?.withdrawals || withdrawals?.data || []
      const kycList = kyc?.kyc || kyc?.data || []

      setStats({
        totalUsers: userList.length,
        totalDeposits: depList.filter(d => d.status === 'confirmed').reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
        totalWithdrawals: wdList.filter(w => w.status === 'approved').reduce((sum, w) => sum + (Number(w.amount) || 0), 0),
        pendingKyc: kycList.filter(k => k.status === 'pending').length,
        pendingWithdrawals: wdList.filter(w => w.status === 'pending').length,
        activeInvestments: txList.filter(t => t.type === 'investment' && t.status === 'active').length,
      })

      const grouped = {}
      txList.forEach(tx => {
        const date = new Date(tx.createdAt || tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!grouped[date]) grouped[date] = { deposits: 0, withdrawals: 0 }
        if (tx.type === 'deposit') grouped[date].deposits += Number(tx.amount) || 0
        if (tx.type === 'withdrawal') grouped[date].withdrawals += Number(tx.amount) || 0
      })
      setChartData(Object.entries(grouped).slice(-7).map(([date, data]) => ({ date, ...data })))

      setRecentActivity(txList.slice(-10).reverse())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
  }

  const statusColor = (status) => {
    const s = status?.toLowerCase()
    if (s === 'completed' || s === 'confirmed' || s === 'approved' || s === 'active') return 'bg-green-500/20 text-green-400'
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400'
    if (s === 'rejected' || s === 'failed') return 'bg-red-500/20 text-red-400'
    return 'bg-white/10 text-white/60'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button onClick={fetchDashboard} className="text-sm text-white/60 hover:text-white transition-colors">
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} change={12} color="bg-[#ef4d45]/20" loading={loading} />
        <StatCard icon={TrendingUp} label="Total Deposits" value={formatCurrency(stats.totalDeposits)} change={8} color="bg-green-500/20" loading={loading} />
        <StatCard icon={TrendingDown} label="Total Withdrawals" value={formatCurrency(stats.totalWithdrawals)} change={-3} color="bg-orange-500/20" loading={loading} />
        <StatCard icon={ShieldCheck} label="Pending KYC" value={stats.pendingKyc} color="bg-yellow-500/20" loading={loading} />
        <StatCard icon={Clock} label="Pending Withdrawals" value={stats.pendingWithdrawals} color="bg-purple-500/20" loading={loading} />
        <StatCard icon={Activity} label="Active Investments" value={stats.activeInvestments} color="bg-blue-500/20" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Deposits vs Withdrawals</h3>
          {loading ? (
            <div className="h-64 bg-white/5 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#fff', fontSize: 12 }} />
                <Bar dataKey="deposits" fill="#22c55e" radius={[4, 4, 0, 0]} name="Deposits" />
                <Bar dataKey="withdrawals" fill="#ef4d45" radius={[4, 4, 0, 0]} name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Transaction Trend</h3>
          {loading ? (
            <div className="h-64 bg-white/5 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="deposits" stroke="#22c55e" strokeWidth={2} dot={false} name="Deposits" />
                <Line type="monotone" dataKey="withdrawals" stroke="#ef4d45" strokeWidth={2} dot={false} name="Withdrawals" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <div className="bg-[#05081c] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/50 font-medium py-3 px-4">Type</th>
                  <th className="text-left text-white/50 font-medium py-3 px-4">User</th>
                  <th className="text-left text-white/50 font-medium py-3 px-4">Amount</th>
                  <th className="text-left text-white/50 font-medium py-3 px-4">Status</th>
                  <th className="text-left text-white/50 font-medium py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((tx, i) => (
                  <tr key={tx.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">{tx.userName || tx.userEmail || tx.userId || 'N/A'}</td>
                    <td className="py-3 px-4 text-white">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{new Date(tx.createdAt || tx.date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40">No recent activity</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ef4d45] hover:bg-[#ef4d45]/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Users
        </button>
        <button
          onClick={() => router.push('/admin/users?tab=kyc')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <FileCheck className="w-4 h-4" />
          Manage KYC
        </button>
        <button
          onClick={() => router.push('/admin/transactions')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ListChecks className="w-4 h-4" />
          View Transactions
        </button>
      </div>
    </div>
  )
}
