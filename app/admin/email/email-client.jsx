'use client'

import { useState, useEffect } from 'react'
import { Mail, Plus, Edit2, Trash2, Send, X, FileText, Search } from 'lucide-react'
import AdminLayoutClient from '../admin-layout-client'

export default function EmailClient() {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '' })
  const [saving, setSaving] = useState(false)

  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
    templateId: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/email')
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to search users')
      const data = await res.json()
      setSearchResults(data.users || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const openCreateModal = () => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', subject: '', body: '' })
    setShowModal(true)
  }

  const openEditModal = (template) => {
    setEditingTemplate(template)
    setTemplateForm({ name: template.name, subject: template.subject, body: template.body })
    setShowModal(true)
  }

  const saveTemplate = async () => {
    setSaving(true)
    try {
      const url = editingTemplate
        ? `/api/admin/email/${editingTemplate.id}`
        : '/api/admin/email'
      const method = editingTemplate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      })

      if (!res.ok) throw new Error('Failed to save template')

      setShowModal(false)
      fetchTemplates()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch(`/api/admin/email/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete template')
      fetchTemplates()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const sendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      alert('Please fill in all required fields')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: emailForm.to,
          subject: emailForm.subject,
          body: emailForm.body,
          templateId: emailForm.templateId || undefined
        })
      })

      if (!res.ok) throw new Error('Failed to send email')

      setEmailForm({ to: '', subject: '', body: '', templateId: '' })
      alert('Email sent successfully!')
    } catch (err) {
      alert('Failed to send email: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setEmailForm({
        ...emailForm,
        templateId: template.id,
        subject: template.subject,
        body: template.body
      })
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-[#010214] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#ef4d45]/10 rounded-xl">
              <Mail className="w-6 h-6 text-[#ef4d45]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Email Management</h1>
              <p className="text-gray-400 text-sm">Manage email templates and send emails</p>
            </div>
          </div>

          <div className="flex gap-1 mb-6 bg-[#05081c] border border-white/5 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-[#ef4d45] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'send'
                  ? 'bg-[#ef4d45] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Send Email
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="bg-[#05081c] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Email Templates</h2>
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button onClick={fetchTemplates} className="text-[#ef4d45] hover:underline">
                    Retry
                  </button>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Mail className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">No templates yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {templates.map(template => (
                    <div key={template.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">Subject: {template.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">Last updated: {formatDate(template.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'send' && (
            <div className="bg-[#05081c] border border-white/5 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Send Email</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">To (User)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setEmailForm({ ...emailForm, to: '' })
                      }}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                    />
                    {searchResults.length > 0 && !emailForm.to && (
                      <div className="absolute z-10 w-full mt-1 bg-[#010214] border border-white/10 rounded-lg overflow-hidden">
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setEmailForm({ ...emailForm, to: user.email })
                              setSearchQuery(user.email)
                              setSearchResults([])
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                          >
                            <p className="text-white text-sm">{user.name || user.email}</p>
                            <p className="text-gray-400 text-xs">{user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {emailForm.to && (
                    <p className="mt-2 text-sm text-green-400">Selected: {emailForm.to}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Template (Optional)</label>
                  <select
                    value={emailForm.templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ef4d45]"
                  >
                    <option value="">No template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    placeholder="Email subject..."
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Body (HTML supported)</label>
                  <textarea
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    placeholder="Email content..."
                    rows={12}
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] font-mono text-sm"
                  />
                </div>

                <button
                  onClick={sendEmail}
                  disabled={sending || !emailForm.to || !emailForm.subject || !emailForm.body}
                  className="flex items-center gap-2 px-6 py-3 bg-[#ef4d45] rounded-lg text-white font-medium hover:bg-[#ef4d45]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#05081c] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white">
                  {editingTemplate ? 'Edit Template' : 'New Template'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Template name..."
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="Email subject..."
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Body (HTML)</label>
                  <textarea
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    placeholder="HTML content..."
                    rows={15}
                    className="w-full px-4 py-3 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving || !templateForm.name || !templateForm.subject}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  )
}
