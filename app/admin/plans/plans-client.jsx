'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  X,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Palette,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';

export default function PlansClient() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    percentage: '',
    duration: '',
    min_investment: '',
    max_investment: '',
    description: '',
    color: '#ef4d45',
    featured: false,
  });

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      percentage: '',
      duration: '',
      min_investment: '',
      max_investment: '',
      description: '',
      color: '#ef4d45',
      featured: false,
    });
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      percentage: plan.percentage || plan.daily_percentage || '',
      duration: plan.duration || plan.duration_days || '',
      min_investment: plan.min_investment || plan.min_amount || '',
      max_investment: plan.max_investment || plan.max_amount || '',
      description: plan.description || '',
      color: plan.color || '#ef4d45',
      featured: plan.featured || false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          percentage: parseFloat(form.percentage),
          duration: parseInt(form.duration),
          min_investment: parseFloat(form.min_investment),
          max_investment: parseFloat(form.max_investment),
        }),
      });
      if (!res.ok) throw new Error(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      fetchPlans();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Investment Plans</h1>
            <p className="text-gray-400 text-sm mt-1">Manage investment plans offered to users</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchPlans} className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#ef4d45] rounded-lg text-white font-medium hover:bg-[#ef4d45]/80 transition-colors">
              <Plus className="w-4 h-4" />
              New Plan
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
            <button onClick={fetchPlans} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30">
              Retry
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-[#05081c] border border-white/5 rounded-xl p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No plans created yet</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#ef4d45] rounded-lg text-white text-sm font-medium hover:bg-[#ef4d45]/80">
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#05081c] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors relative"
              >
                {plan.featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Featured</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color || '#ef4d45'}20` }}
                  >
                    <TrendingUp className="w-5 h-5" style={{ color: plan.color || '#ef4d45' }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{plan.name}</h3>
                    <p className="text-xs text-gray-400">{plan.description || 'No description'}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Daily Return
                    </span>
                    <span className="text-white font-medium" style={{ color: plan.color || '#ef4d45' }}>
                      {plan.percentage || plan.daily_percentage || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </span>
                    <span className="text-white font-medium">{plan.duration || plan.duration_days || 0} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Min Investment
                    </span>
                    <span className="text-white font-medium">${parseFloat(plan.min_investment || plan.min_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Max Investment
                    </span>
                    <span className="text-white font-medium">${parseFloat(plan.max_investment || plan.max_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-[#ef4d45]/50 text-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <div className="bg-[#05081c] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Gold Plan"
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Daily % *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.percentage}
                      onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                      placeholder="e.g. 2.5"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Duration (days) *</label>
                    <input
                      type="number"
                      required
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g. 30"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Min Investment ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.min_investment}
                      onChange={(e) => setForm({ ...form, min_investment: e.target.value })}
                      placeholder="e.g. 100"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Max Investment ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.max_investment}
                      onChange={(e) => setForm({ ...form, max_investment: e.target.value })}
                      placeholder="e.g. 50000"
                      className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of this plan..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="flex-1 px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#ef4d45]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Featured</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, featured: !form.featured })}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.featured
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${form.featured ? 'fill-yellow-400' : ''}`} />
                      {form.featured ? 'Featured' : 'Not Featured'}
                    </button>
                  </div>
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
                    {actionLoading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
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
