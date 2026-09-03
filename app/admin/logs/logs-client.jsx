'use client'

import { useState, useEffect } from 'react'
import { Activity, Download, Filter, ChevronLeft, ChevronRight, RefreshCw, Eye, X, Shield, FileText } from 'lucide-react'
import AdminLayoutClient from '../admin-layout-client'

function safeStringifyDetails(details) {
  if (!details) return '-'
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details)
      return typeof parsed === 'object' ? JSON.stringify(parsed) : details
    } catch {
      return details
    }
  }
  if (typeof details === 'object') {
    return JSON.stringify(details)
  }
  return String(details)
}

function DetailModal({ log, onClose }) {
  if (!log) return null

  let formattedJson = ''
  try {
    const d = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    formattedJson = JSON.stringify(d, null, 2)
  } catch {
    formattedJson = String(log.details || '-')
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#05081c] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ef4d45]" />
            <h3 className="text-lg font-bold text-white">Log Details #{log.id}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs block">Admin</span>
              <span className="text-white font-medium">{log.admin_name || log.admin_email || log.admin || `Admin #${log.admin_id || '-'}`}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Action</span>
              <span className="text-[#ef4d45] font-mono">{log.action}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Target</span>
              <span className="text-white">{log.target_type || log.targetType || '-'}: {log.target_id || log.targetId || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">IP Address</span>
              <span className="text-gray-300 font-mono">{log.ip_address || log.ipAddress || '-'}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-1">Payload Details (JSON)</span>
            <pre className="p-3 bg-[#010214] border border-white/5 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto max-h-60">
              {formattedJson}
            </pre>
          </div>
        </div>
        <div className="p-4 border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LogsClient() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [filters, setFilters] = useState({
    action: '',
    target_type: '',
    date_from: '',
    date_to: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.action && { action: filters.action }),
        ...(filters.target_type && { target_type: filters.target_type }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      })
      const res = await fetch(`/api/admin/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data = await res.json()
      setLogs(data.logs || [])
      const pages = data.totalPages || Math.ceil((data.total || 0) / 20) || 1
      setTotalPages(pages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const exportCSV = () => {
    const headers = ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address']
    const rows = logs.map(log => [
      new Date(log.created_at || log.timestamp).toLocaleString(),
      log.admin_name || log.admin_email || log.admin || `Admin #${log.admin_id || ''}`,
      log.action,
      log.target_type || log.targetType || '',
      log.target_id || log.targetId || '',
      safeStringifyDetails(log.details),
      log.ip_address || log.ipAddress || ''
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-[#010214] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ef4d45]/10 rounded-xl">
                <Activity className="w-6 h-6 text-[#ef4d45]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                <p className="text-gray-400 text-sm">Track all admin actions and system events</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/5 rounded-lg text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={fetchLogs}
                className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/5 rounded-lg text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-[#05081c] border border-white/5 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Action Keyword</label>
                  <input
                    type="text"
                    value={filters.action}
                    onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                    placeholder="e.g. login, update, settings..."
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Target Type</label>
                  <input
                    type="text"
                    value={filters.target_type}
                    onChange={(e) => { setFilters({ ...filters, target_type: e.target.value }); setPage(1); }}
                    placeholder="e.g. user, deposit, kyc..."
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => { setFilters({ ...filters, date_from: e.target.value }); setPage(1); }}
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => { setFilters({ ...filters, date_to: e.target.value }); setPage(1); }}
                    className="w-full px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45] text-sm"
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
                  onClick={fetchLogs}
                  className="px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90"
                >
                  Retry
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Activity className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400">No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log, idx) => {
                      const detailsText = safeStringifyDetails(log.details)
                      const adminDisplay = log.admin_name || log.admin_email || log.admin || (log.admin_id ? `Admin #${log.admin_id}` : 'System')
                      const targetDisplay = (log.target_type || log.targetType) ? `${log.target_type || log.targetType} ${log.target_id || log.targetId ? '#' + (log.target_id || log.targetId) : ''}` : '-'

                      return (
                        <tr key={log.id || idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(log.created_at || log.timestamp)}</td>
                          <td className="px-6 py-4 text-sm text-white font-medium">{adminDisplay}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                              String(log.action).includes('create') ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              String(log.action).includes('delete') || String(log.action).includes('reject') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              String(log.action).includes('login') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 font-mono text-xs">{targetDisplay}</td>
                          <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate font-mono text-xs" title={detailsText}>
                            {detailsText}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 font-mono text-xs">{log.ip_address || log.ipAddress || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ef4d45]/10 text-gray-400 hover:text-[#ef4d45] transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 bg-[#010214] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-[#010214] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </AdminLayoutClient>
  )
}

