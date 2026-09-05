'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldX,
  Wallet,
  User,
  Mail,
  AtSign,
  Calendar,
  Eye,
  FileCheck,
} from 'lucide-react'

function UserDetailModal({ user, onClose, onAction }) {
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  })
  const [balanceAdj, setBalanceAdj] = useState({ coin: 'BTC', amount: '', action: 'add' })
  const [saving, setSaving] = useState(false)

  const handleEditSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        onAction()
        setEditMode(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBalanceAdj = async () => {
    if (!balanceAdj.amount) return
    setSaving(true)
    try {
      await fetch(`/api/admin/users/${user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balanceAdj),
      })
      onAction()
    } finally {
      setSaving(false)
    }
  }

  const handleKyc = async (action) => {
    await fetch(`/api/admin/users/${user.id}/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    onAction()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    onAction()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">User Details</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#ef4d45]/20 flex items-center justify-center">
              <User className="w-7 h-7 text-[#ef4d45]" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">{user.name}</div>
              <div className="text-white/50 text-sm">{user.email}</div>
            </div>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 bg-[#ef4d45] hover:bg-[#ef4d45]/80 text-white rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/50">
                <AtSign className="w-4 h-4" /> Username: <span className="text-white">{user.username || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Mail className="w-4 h-4" /> Email: <span className="text-white">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Wallet className="w-4 h-4" /> Balance: <span className="text-white">${Number(user.balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <Calendar className="w-4 h-4" /> Joined: <span className="text-white">{new Date(user.createdAt || user.joined).toLocaleDateString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-white/50">KYC: </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                  user.kycStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {user.kycStatus || 'unverified'}
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Adjust Balance</h4>
            <div className="flex gap-2 items-end">
              <select
                value={balanceAdj.coin}
                onChange={(e) => setBalanceAdj({ ...balanceAdj, coin: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
              </select>
              <select
                value={balanceAdj.action}
                onChange={(e) => setBalanceAdj({ ...balanceAdj, action: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="add">Add</option>
                <option value="deduct">Deduct</option>
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={balanceAdj.amount}
                onChange={(e) => setBalanceAdj({ ...balanceAdj, amount: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4d45]/50"
              />
              <button onClick={handleBalanceAdj} disabled={saving} className="px-4 py-2 bg-[#ef4d45] hover:bg-[#ef4d45]/80 text-white rounded-lg text-sm disabled:opacity-50">
                Apply
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-wrap gap-2 items-center">
            <Link
              href={`/admin/kyc?user_id=${user.id}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4d45]/15 hover:bg-[#ef4d45]/25 text-[#ef4d45] border border-[#ef4d45]/30 rounded-lg text-sm transition-colors font-medium"
            >
              <FileCheck className="w-3.5 h-3.5" /> View ID & KYC Docs
            </Link>
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit User
            </button>
            <button onClick={() => handleKyc('approved')} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Approve KYC
            </button>
            <button onClick={() => handleKyc('rejected')} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-sm transition-colors">
              <ShieldX className="w-3.5 h-3.5" /> Reject KYC
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors ml-auto">
              <Trash2 className="w-3.5 h-3.5" /> Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersClient() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch, page])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, search: debouncedSearch })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data?.users || data?.data || [])
      setTotalPages(data?.totalPages || Math.max(1, Math.ceil((data?.total || 0) / 20)))
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">User Management</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full bg-[#05081c] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ef4d45]/50 transition-colors"
        />
      </div>

      <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/50 font-medium py-3 px-4">ID</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Name</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Email</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Username</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Balance</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Deposits</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">KYC</th>
                <th className="text-left text-white/50 font-medium py-3 px-4">Joined</th>
                <th className="text-left text-white/50 font-medium py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-white/5 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <td className="py-3 px-4 text-white/60 font-mono text-xs">{String(u.id).slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-white">{u.name}</td>
                    <td className="py-3 px-4 text-white/70">{u.email}</td>
                    <td className="py-3 px-4 text-white/70">@{u.username || '—'}</td>
                    <td className="py-3 px-4 text-white">${Number(u.balance || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-white">${Number(u.totalDeposits || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                        u.kycStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {u.kycStatus || 'unverified'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">{new Date(u.createdAt || u.joined).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-white/40">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={fetchUsers} />
      )}
    </div>
  )
}
