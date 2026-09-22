'use client';

import { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Type,
  Hash,
  Mail,
  ToggleLeft,
  ToggleRight,
  Search,
  Upload,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import AdminLayoutClient from '../admin-layout-client';

const settingGroups = [
  {
    id: 'general',
    label: 'General',
    icon: Globe,
    description: 'Basic website identification, domain URL, and contact details.',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'e.g. Emporium Capitals' },
      { key: 'site_tagline', label: 'Site Tagline', type: 'text', placeholder: 'e.g. Premium Multi-Asset Trading Platform' },
      { key: 'site_url', label: 'Live Website URL', type: 'text', placeholder: 'e.g. https://yourdomain.com (Used for emails and links)' },
      { key: 'support_email', label: 'Support Email', type: 'text', placeholder: 'support@yourdomain.com' },
      { key: 'support_phone', label: 'Support Phone', type: 'text', placeholder: '+1 (800) 123-4567' },
      { key: 'company_address', label: 'Company Address', type: 'text', placeholder: 'Suite 400, Financial District, New York, NY' },
    ],
  },
  {
    id: 'media',
    label: 'Logo & Media',
    icon: ImageIcon,
    description: 'Upload your brand logos, favicons, and social share previews. Changes reflect instantly.',
    isMediaUpload: true,
  },
  {
    id: 'seo',
    label: 'SEO & Metadata',
    icon: Search,
    description: 'Search engine optimization parameters injected into HTML head and social graph tags.',
    fields: [
      { key: 'meta_title', label: 'Meta Title', type: 'text', placeholder: 'Emporium Capitals | Next-Gen Multi-Asset Trading' },
      { key: 'meta_description', label: 'Meta Description', type: 'textarea', placeholder: 'Brief summary displayed on search engines...', rows: 3 },
      { key: 'meta_keywords', label: 'Meta Keywords (comma separated)', type: 'text', placeholder: 'crypto, forex, commodities, trading, investment' },
      { key: 'google_analytics_id', label: 'Google Analytics Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    ],
  },
  {
    id: 'compliance',
    label: 'Disclaimers & Legal',
    icon: AlertOctagon,
    description: 'Regulatory, risk disclosure, and financial warning notices presented across the site and emails.',
    fields: [
      { key: 'disclaimer_footer', label: 'Website Footer Legal Disclaimer', type: 'textarea', placeholder: 'Trading foreign exchange, CFDs, and digital assets involves significant risk of capital loss...', rows: 4 },
      { key: 'disclaimer_email', label: 'Email Compliance Notice', type: 'textarea', placeholder: 'Risk Disclosure: Financial operations on this platform carry inherent risk...', rows: 3 },
      { key: 'disclaimer_trading', label: 'Live Trading Risk Warning', type: 'textarea', placeholder: 'CFDs and margin instruments carry a high level of risk to your capital...', rows: 3 },
    ],
  },
  {
    id: 'branding',
    label: 'Branding & Colors',
    icon: Palette,
    description: 'Theme accents and color accents across client interfaces.',
    fields: [
      { key: 'primary_color', label: 'Primary Brand Color', type: 'color' },
      { key: 'secondary_color', label: 'Secondary Brand Color', type: 'color' },
      { key: 'accent_color', label: 'Accent Color', type: 'color' },
      { key: 'bg_color', label: 'Default Background Color', type: 'color' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Limits',
    icon: DollarSign,
    description: 'Deposit, withdrawal, and trading thresholds and commission percentages.',
    fields: [
      { key: 'currency', label: 'Platform Base Currency', type: 'text', placeholder: 'USD' },
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
    label: 'Security & Auth',
    icon: Shield,
    description: 'Platform access policies, sessions, and multi-factor enforcement.',
    fields: [
      { key: 'require_2fa', label: 'Require Two-Factor Auth (2FA)', type: 'boolean' },
      { key: 'enforce_kyc', label: 'Enforce Mandatory KYC', type: 'boolean' },
      { key: 'max_login_attempts', label: 'Max Failed Login Attempts', type: 'number' },
      { key: 'session_timeout', label: 'Session Inactivity Timeout (minutes)', type: 'number' },
    ],
  },
  {
    id: 'kyc',
    label: 'KYC Policies',
    icon: FileCheck,
    description: 'Verification standards and withdrawal gating rules.',
    fields: [
      { key: 'kyc_required', label: 'KYC Required for Trading', type: 'boolean' },
      { key: 'kyc_withdrawal_threshold', label: 'KYC Withdrawal Exemption Threshold ($)', type: 'number' },
      { key: 'auto_approve_kyc', label: 'Auto-Approve Submissions (Demo / Staging)', type: 'boolean' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance Mode',
    icon: Wrench,
    description: 'Emergency lockout switch and customer advisory message.',
    fields: [
      { key: 'maintenance_mode', label: 'System Maintenance Active', type: 'boolean' },
      { key: 'maintenance_message', label: 'Maintenance Alert Banner Message', type: 'textarea', placeholder: 'Scheduled maintenance in progress. Trading operations will resume shortly.', rows: 3 },
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
  const [uploading, setUploading] = useState({ logo: false, favicon: false, og_image: false });
  const [uploadMsg, setUploadMsg] = useState({ type: '', text: '' });

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      const flatSettings = data.flat || (Array.isArray(data) ? Object.fromEntries(data.map((s) => [s.key, s.value])) : data.settings || data || {});
      setSettings(flatSettings);
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('site_settings_updated'));
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [type]: true }));
    setUploadMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSettings((prev) => ({ ...prev, [data.setting_key]: data.url }));
      setUploadMsg({ type: 'success', text: `${data.setting_key} successfully uploaded and updated!` });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('site_settings_updated'));
      }

      setTimeout(() => setUploadMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      e.target.value = '';
    }
  };

  const currentGroup = settingGroups.find((g) => g.id === activeGroup);

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-[#ef4d45]" />
              Site Settings & Administration
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Configure branding, URLs, financial thresholds, legal disclaimers, and SEO in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#05081c] border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-[#ef4d45]/50 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ef4d45] to-[#8c0030] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#ef4d45]/20 disabled:opacity-50 transition-all text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2.5 animate-fade-in shadow-md">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <span className="font-semibold">All settings have been saved and applied across the website in real-time!</span>
          </div>
        )}

        {uploadMsg.text && (
          <div
            className={`rounded-xl p-4 text-sm flex items-center gap-2.5 animate-fade-in shadow-md ${
              uploadMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {uploadMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{uploadMsg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-9 h-9 border-3 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchSettings}
              className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Settings Category Navigation */}
            <div className="lg:w-64 shrink-0">
              <div className="bg-[#05081c] border border-white/10 rounded-2xl p-2.5 space-y-1">
                {settingGroups.map((group) => {
                  const Icon = group.icon;
                  const isActive = activeGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveGroup(group.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white shadow-md shadow-[#ef4d45]/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{group.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Fields Container */}
            <div className="flex-1">
              {currentGroup && (
                <div className="bg-[#05081c] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6">
                  <div className="pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#ef4d45]/10 text-[#ef4d45]">
                        <currentGroup.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{currentGroup.label}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{currentGroup.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Media Upload Group */}
                  {currentGroup.isMediaUpload ? (
                    <div className="space-y-8">
                      {/* 1. Main Logo */}
                      <div className="bg-[#010214] border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#ef4d45]" />
                              Primary Website Logo
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Displayed in navbar, sidebar, login, registration, emails, and footers. Recommended: PNG or SVG with transparent background.
                            </p>
                          </div>
                          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-all shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            {uploading.logo ? 'Uploading...' : 'Upload Logo'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              className="hidden"
                              disabled={uploading.logo}
                              onChange={(e) => handleFileUpload(e, 'logo')}
                            />
                          </label>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                          <div className="w-48 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-3 relative group overflow-hidden">
                            <img
                              src={settings.site_logo || '/assets/logo.png'}
                              alt="Current Site Logo"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => { e.currentTarget.src = '/assets/logo.png'; }}
                            />
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-xs text-gray-400 font-medium">Logo URL Path</label>
                            <input
                              type="text"
                              value={settings.site_logo || ''}
                              onChange={(e) => handleChange('site_logo', e.target.value)}
                              placeholder="/uploads/logo.png or https://..."
                              className="w-full px-4 py-2.5 bg-[#05081c] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Favicon */}
                      <div className="bg-[#010214] border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[#ef4d45]" />
                              Browser Tab Favicon
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Displayed in browser tabs and bookmarks. Recommended: 32x32 or 64x64 PNG or ICO.
                            </p>
                          </div>
                          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-all shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            {uploading.favicon ? 'Uploading...' : 'Upload Favicon'}
                            <input
                              type="file"
                              accept="image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon"
                              className="hidden"
                              disabled={uploading.favicon}
                              onChange={(e) => handleFileUpload(e, 'favicon')}
                            />
                          </label>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                          <div className="size-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-2 shrink-0">
                            <img
                              src={settings.site_favicon || '/favicon.ico'}
                              alt="Current Favicon"
                              className="size-8 object-contain"
                              onError={(e) => { e.currentTarget.src = '/favicon.ico'; }}
                            />
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-xs text-gray-400 font-medium">Favicon URL Path</label>
                            <input
                              type="text"
                              value={settings.site_favicon || ''}
                              onChange={(e) => handleChange('site_favicon', e.target.value)}
                              placeholder="/uploads/favicon.png or /favicon.ico"
                              className="w-full px-4 py-2.5 bg-[#05081c] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. OpenGraph / Social Share Image */}
                      <div className="bg-[#010214] border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-[#ef4d45]" />
                              Social Share Image (OpenGraph & Twitter Card)
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Preview banner displayed when your website link is shared on Telegram, WhatsApp, Twitter/X, and LinkedIn. (1200x630px recommended).
                            </p>
                          </div>
                          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4d45] to-[#8c0030] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-all shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            {uploading.og_image ? 'Uploading...' : 'Upload OG Image'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={uploading.og_image}
                              onChange={(e) => handleFileUpload(e, 'og_image')}
                            />
                          </label>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                          <div className="w-48 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden">
                            <img
                              src={settings.og_image || settings.site_logo || '/assets/logo.png'}
                              alt="Current Social Share Banner"
                              className="max-h-full max-w-full object-cover rounded"
                              onError={(e) => { e.currentTarget.src = '/assets/logo.png'; }}
                            />
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-xs text-gray-400 font-medium">OG Image URL Path</label>
                            <input
                              type="text"
                              value={settings.og_image || ''}
                              onChange={(e) => handleChange('og_image', e.target.value)}
                              placeholder="/uploads/og_image.png or https://..."
                              className="w-full px-4 py-2.5 bg-[#05081c] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/50 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Group Fields */
                    <div className="space-y-5">
                      {currentGroup.fields?.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300 block">
                            {field.label}
                          </label>

                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={settings[field.key] ?? ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder || ''}
                              className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/60 transition-colors"
                            />
                          )}

                          {field.type === 'textarea' && (
                            <textarea
                              rows={field.rows || 3}
                              value={settings[field.key] ?? ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder || ''}
                              className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/60 transition-colors resize-y leading-relaxed font-sans"
                            />
                          )}

                          {field.type === 'number' && (
                            <input
                              type="number"
                              step="any"
                              value={settings[field.key] ?? ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder || '0'}
                              className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]/60 transition-colors font-mono"
                            />
                          )}

                          {field.type === 'color' && (
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={settings[field.key] || '#ef4d45'}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-12 h-11 rounded-xl border border-white/10 cursor-pointer bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                value={settings[field.key] ?? ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder="#ef4d45"
                                className="flex-1 px-4 py-3 bg-[#010214] border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#ef4d45]/60 transition-colors"
                              />
                            </div>
                          )}

                          {field.type === 'boolean' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleChange(
                                  field.key,
                                  settings[field.key] === 'true' || settings[field.key] === true ? 'false' : 'true'
                                )
                              }
                              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                                settings[field.key] === 'true' || settings[field.key] === true
                                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {settings[field.key] === 'true' || settings[field.key] === true ? (
                                <ToggleRight className="w-5 h-5 text-green-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-500" />
                              )}
                              <span>
                                {settings[field.key] === 'true' || settings[field.key] === true
                                  ? 'Active / Enabled'
                                  : 'Disabled'}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
