'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  Globe,
  Key,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';

export default function WalletsClient() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    api_key: '',
    api_secret: '',
    api_base_url: '',
    webhook_secret: '',
    config: '',
    active: true,
  });

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/wallets');
      if (!res.ok) throw new Error('Failed to fetch wallet providers');
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : data.providers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const openCreate = () => {
    setEditingProvider(null);
    setForm({
      name: '',
      slug: '',
      api_key: '',
      api_secret: '',
      api_base_url: '',
      webhook_secret: '',
      config: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setForm({
      name: provider.name || '',
      slug: provider.slug || '',
      api_key: provider.api_key || '',
      api_secret: provider.api_secret || '',
      api_base_url: provider.api_base_url || '',
      webhook_secret: provider.webhook_secret || '',
      config: typeof provider.config === 'object' ? JSON.stringify(provider.config, null, 2) : provider.config || '',
      active: provider.active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let parsedConfig = null;
      if (form.config.trim()) {
        try {
          parsedConfig = JSON.parse(form.config);
        } catch {
          alert('Invalid JSON in config field');
          setActionLoading(false);
          return;
        }
      }
      const url = editingProvider ? `/api/admin/wallets/${editingProvider.id}` : '/api/admin/wallets';
      const method = editingProvider ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, config: parsedConfig }),
      });
      if (!res.ok) throw new Error(editingProvider ? 'Failed to update provider' : 'Failed to create provider');
      setModalOpen(false);
      fetchProviders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/wallets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete provider');
      fetchProviders();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-white">Wallet Providers</h1>
            <p className="text-gray-400 text-sm mt-1">Manage payment and wallet provider integrations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchProviders} className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#ef4d45] rounded-lg text-white font-medium hover:bg-[#ef4d45]/80 transition-colors">
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
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
            <button onClick={fetchProviders} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30">
              Retry
            </button>
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No wallet providers configured</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#ef4d45] rounded-lg text-white text-sm font-medium hover:bg-[#ef4d45]/80">
              Add First Provider
            </button>
          </div>
        ) : (
          <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Slug</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">API Base</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Active</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#ef4d45]" />
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono text-xs">{p.slug || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{p.api_base_url || '-'}</td>
                      <td className="px-4 py-3">
                        {p.active !== false ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs">
                            <ToggleRight className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 text-xs">
                            <ToggleLeft className="w-4 h-4" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ef4d45]/10 text-gray-400 hover:text-[#ef4d45] transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <div className="bg-[#05081c] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">{editingProvider ? 'Edit Provider' : 'Add Provider'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Provider Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Coinbase"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Slug *</label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="e.g. coinbase"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> API Key
                  </label>
                  <input
                    type="password"
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    placeholder="API key"
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> API Secret
                  </label>
                  <input
                    type="password"
                    value={form.api_secret}
                    onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                    placeholder="API secret"
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> API Base URL
                  </label>
                  <input
                    type="url"
                    value={form.api_base_url}
                    onChange={(e) => setForm({ ...form, api_base_url: e.target.value })}
                    placeholder="https://api.example.com"
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Webhook Secret</label>
                  <input
                    type="password"
                    value={form.webhook_secret}
                    onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
                    placeholder="Webhook signing secret"
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Config (JSON)</label>
                  <textarea
                    value={form.config}
                    onChange={(e) => setForm({ ...form, config: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 font-mono focus:outline-none focus:border-[#ef4d45]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.active
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {form.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {form.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm font-medium hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-[#ef4d45] rounded-lg text-white text-sm font-medium hover:bg-[#ef4d45]/80 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
