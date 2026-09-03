'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  AlertTriangle,
  RefreshCw,
  Globe,
  Palette,
  DollarSign,
  Shield,
  FileCheck,
  Wrench,
  Image,
  Type,
  Hash,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';

const settingGroups = [
  {
    id: 'general',
    label: 'General',
    icon: Globe,
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'My Platform' },
      { key: 'site_tagline', label: 'Tagline', type: 'text', placeholder: 'Your investment platform' },
      { key: 'site_logo', label: 'Logo URL', type: 'text', placeholder: 'https://...' },
      { key: 'site_favicon', label: 'Favicon URL', type: 'text', placeholder: 'https://...' },
      { key: 'support_email', label: 'Support Email', type: 'text', placeholder: 'support@example.com' },
    ],
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: Palette,
    fields: [
      { key: 'primary_color', label: 'Primary Color', type: 'color' },
      { key: 'secondary_color', label: 'Secondary Color', type: 'color' },
      { key: 'accent_color', label: 'Accent Color', type: 'color' },
      { key: 'bg_color', label: 'Background Color', type: 'color' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    fields: [
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'USD' },
      { key: 'min_deposit', label: 'Minimum Deposit ($)', type: 'number' },
      { key: 'max_deposit', label: 'Maximum Deposit ($)', type: 'number' },
      { key: 'min_withdrawal', label: 'Minimum Withdrawal ($)', type: 'number' },
      { key: 'max_withdrawal', label: 'Maximum Withdrawal ($)', type: 'number' },
      { key: 'withdrawal_fee', label: 'Withdrawal Fee (%)', type: 'number' },
      { key: 'deposit_fee', label: 'Deposit Fee (%)', type: 'number' },
      { key: 'referral_bonus', label: 'Referral Bonus ($)', type: 'number' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    fields: [
      { key: 'require_2fa', label: 'Require 2FA', type: 'boolean' },
      { key: 'enforce_kyc', label: 'Enforce KYC', type: 'boolean' },
      { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number' },
      { key: 'session_timeout', label: 'Session Timeout (minutes)', type: 'number' },
    ],
  },
  {
    id: 'kyc',
    label: 'KYC',
    icon: FileCheck,
    fields: [
      { key: 'kyc_required', label: 'KYC Required', type: 'boolean' },
      { key: 'kyc_withdrawal_threshold', label: 'KYC Withdrawal Threshold ($)', type: 'number' },
      { key: 'auto_approve_kyc', label: 'Auto-Approve KYC', type: 'boolean' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
    fields: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean' },
      { key: 'maintenance_message', label: 'Maintenance Message', type: 'text', placeholder: 'System under maintenance...' },
    ],
  },
];

export default function SettingsClient() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeGroup, setActiveGroup] = useState('general');

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(Array.isArray(data) ? Object.fromEntries(data.map((s) => [s.key, s.value])) : data.settings || data || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentGroup = settingGroups.find((g) => g.id === activeGroup);

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Settings</h1>
            <p className="text-gray-400 text-sm mt-1">Configure your platform settings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 bg-[#05081c] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#ef4d45] rounded-lg text-white font-medium hover:bg-[#ef4d45]/80 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
            <ToggleRight className="w-4 h-4" />
            Settings saved successfully
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchSettings} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30">
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-56 shrink-0">
              <div className="bg-[#05081c] border border-white/5 rounded-xl p-2 space-y-1">
                {settingGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroup(group.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeGroup === group.id
                        ? 'bg-[#ef4d45]/10 text-[#ef4d45]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <group.icon className="w-4 h-4 shrink-0" />
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              {currentGroup && (
                <div className="bg-[#05081c] border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <currentGroup.icon className="w-5 h-5 text-[#ef4d45]" />
                    <h2 className="text-lg font-bold text-white">{currentGroup.label} Settings</h2>
                  </div>
                  <div className="space-y-5">
                    {currentGroup.fields.map((field) => (
                      <div key={field.key}>
                        <label className="text-sm text-gray-400 mb-1.5 block">{field.label}</label>
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={settings[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                          />
                        )}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            step="any"
                            value={settings[field.key] || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder || '0'}
                            className="w-full px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50"
                          />
                        )}
                        {field.type === 'color' && (
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={settings[field.key] || '#ef4d45'}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={settings[field.key] || ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder="#ef4d45"
                              className="flex-1 px-4 py-2.5 bg-[#010214] border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#ef4d45]/50"
                            />
                          </div>
                        )}
                        {field.type === 'boolean' && (
                          <button
                            type="button"
                            onClick={() => handleChange(field.key, settings[field.key] === 'true' || settings[field.key] === true ? 'false' : 'true')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                              settings[field.key] === 'true' || settings[field.key] === true
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            {settings[field.key] === 'true' || settings[field.key] === true ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                            {settings[field.key] === 'true' || settings[field.key] === true ? 'Enabled' : 'Disabled'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
