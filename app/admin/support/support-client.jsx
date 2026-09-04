'use client'

import { useState, useEffect, useRef } from 'react'
import { Headphones, Send, Paperclip, Mic, MicOff, Image, File, Play, Pause, MessageSquare, Clock, Circle, CheckCircle, XCircle, StopCircle } from 'lucide-react'
import AdminLayoutClient from '../admin-layout-client'
import { useAdminResource } from '@/lib/hooks/useAdminResource'

export default function SupportClient() {
  const { data: supportData, loading, error, refetch: fetchTickets } = useAdminResource('/api/admin/support')
  const tickets = supportData?.tickets || []
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  const fetchMessages = async (ticketId) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/messages`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      setMessages(data.messages || [])
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const sendMessage = async (type = 'text', content = null) => {
    if (!selectedTicket || (!newMessage.trim() && type === 'text')) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('ticketId', selectedTicket.id)
      formData.append('type', type)

      if (type === 'text') {
        formData.append('content', newMessage)
      } else if (type === 'voice') {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        formData.append('audio', audioBlob, 'voice-note.webm')
      } else if (type === 'image' || type === 'file') {
        formData.append('file', content)
      }

      const res = await fetch(`/api/admin/support/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Failed to send message')

      setNewMessage('')
      audioChunksRef.current = []
      fetchMessages(selectedTicket.id)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    sendMessage(isImage ? 'image' : 'file', file)
    e.target.value = ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        sendMessage('voice')
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const cancelRecording = () => {
    audioChunksRef.current = []
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      fetchTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status })
      }
    } catch (err) {
      console.error('Failed to update ticket:', err)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { color: 'bg-green-500/10 text-green-400', icon: Circle },
      in_progress: { color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
      resolved: { color: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
      closed: { color: 'bg-gray-500/10 text-gray-400', icon: XCircle }
    }
    const badge = badges[status] || badges.open
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  const renderMessage = (msg) => {
    const isAdmin = msg.senderType === 'admin'

    if (msg.type === 'image') {
      return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs rounded-lg overflow-hidden ${isAdmin ? 'bg-[#ef4d45]' : 'bg-[#010214]'}`}>
            <img src={msg.content} alt="Shared image" className="w-full h-auto" />
            {msg.text && <p className="px-3 py-2 text-sm text-white">{msg.text}</p>}
          </div>
        </div>
      )
    }

    if (msg.type === 'file') {
      return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isAdmin ? 'bg-[#ef4d45]' : 'bg-[#010214]'}`}>
            <File className="w-8 h-8 text-white" />
            <div>
              <p className="text-sm text-white font-medium">{msg.fileName}</p>
              <a href={msg.content} target="_blank" rel="noopener noreferrer" className="text-xs text-white/70 hover:text-white">
                Download
              </a>
            </div>
          </div>
        </div>
      )
    }

    if (msg.type === 'voice') {
      return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isAdmin ? 'bg-[#ef4d45]' : 'bg-[#010214]'}`}>
            <audio controls src={msg.content} className="h-8" />
          </div>
        </div>
      )
    }

    return (
      <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs px-4 py-2 rounded-lg ${isAdmin ? 'bg-[#ef4d45] text-white' : 'bg-[#010214] text-white'}`}>
          <p className="text-sm">{msg.content}</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-[#010214] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#ef4d45]/10 rounded-xl">
              <Headphones className="w-6 h-6 text-[#ef4d45]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Support & Ticketing</h1>
              <p className="text-gray-400 text-sm">Manage customer support tickets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
            <div className="lg:col-span-1 bg-[#05081c] border border-white/5 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">Tickets</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[#ef4d45] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button onClick={fetchTickets} className="mt-2 text-[#ef4d45] text-sm hover:underline">
                      Retry
                    </button>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Headphones className="w-10 h-10 text-gray-600 mb-2" />
                    <p className="text-gray-400 text-sm">No tickets</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-white truncate flex-1">{ticket.subject}</h3>
                        {ticket.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-[#ef4d45] rounded-full text-xs text-white font-semibold">
                            {ticket.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2 truncate">{ticket.userName || ticket.userEmail}</p>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-gray-500">
                          {ticket.lastReplyAt ? formatMessageTime(ticket.lastReplyAt) : ''}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#05081c] border border-white/5 rounded-xl overflow-hidden flex flex-col">
              {selectedTicket ? (
                <>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                      <p className="text-sm text-gray-400">{selectedTicket.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                        className="px-3 py-2 bg-[#010214] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#ef4d45]"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                      <div key={msg.id}>{renderMessage(msg)}</div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-white/5">
                    {isRecording ? (
                      <div className="flex items-center justify-between bg-[#010214] rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm text-white font-mono">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={cancelRecording}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={stopRecording}
                            className="p-2 bg-[#ef4d45] rounded-full text-white hover:bg-[#ef4d45]/90"
                          >
                            <StopCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          disabled={sending}
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button
                          onClick={startRecording}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          disabled={sending}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 bg-[#010214] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4d45]"
                          disabled={sending}
                        />
                        <button
                          onClick={() => sendMessage()}
                          disabled={sending || !newMessage.trim()}
                          className="p-2 bg-[#ef4d45] rounded-lg text-white hover:bg-[#ef4d45]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">Select a ticket to view conversation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
}
