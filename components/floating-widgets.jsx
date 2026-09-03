'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smile, Send, X, ExternalLink } from 'lucide-react';

export default function FloatingWidgets() {
    // Chat Widget State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'agent', text: 'Welcome to Emporium Capitals! How can we assist you with your investment journey today?', time: 'Just now' }
    ]);
    const [userMessage, setUserMessage] = useState('');
    const chatEndRef = useRef(null);

    // Floating Socials Toggle
    const [socialsOpen, setSocialsOpen] = useState(false);
    
    // Smartsupp Pop-up Invitation State
    const [showInvitation, setShowInvitation] = useState(false);

    useEffect(() => {
        // Show invitation popup after a short delay on mount
        const timer = setTimeout(() => {
            setShowInvitation(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (chatOpen && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, chatOpen]);

    const handleSendChatMessage = (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: 'user',
            text: userMessage,
            time: 'Just now'
        };

        setChatMessages(prev => [...prev, newMsg]);
        setUserMessage('');

        // Trigger support agent response
        setTimeout(() => {
            setChatMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'agent',
                    text: 'Thank you for reaching out. One of our Emporium Capitals investment specialists will respond in a moment.',
                    time: 'Just now'
                }
            ]);
        }, 1500);
    };

    return (
        <>
            {/* Bottom Left Floating Social Icons & "Estamos online" Badge — mobile: smaller offset */}
            <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2 sm:gap-3">
                {/* Social Toggle / Red Chat Trigger */}
                <div className="relative flex items-center">
                    <button 
                        onClick={() => setSocialsOpen(!socialsOpen)}
                        className="flex size-10 sm:size-12 items-center justify-center rounded-full bg-[#ef4d45] text-white shadow-xl hover:bg-[#d03d35] active:scale-95 transition-all duration-300 cursor-pointer relative z-50 border border-white/10"
                        title={socialsOpen ? "Close support channels" : "Support channels"}
                    >
                        {socialsOpen ? <X className="size-4 sm:size-5" /> : <MessageCircle className="size-4 sm:size-5" />}
                        {/* Status dot */}
                        <span className="absolute top-0 right-0 size-2.5 sm:size-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#010e14]"></span>
                    </button>

                    {/* "We are online" Badge next to the chat bubble, matching screenshot */}
                    {!socialsOpen && (
                        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-bg-card border border-border-subtle/50 text-text-main pl-10 pr-4 py-2 rounded-full text-xs font-semibold shadow-lg absolute left-3 z-10 transition-all duration-500 animate-slide-right whitespace-nowrap">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] text-gray-700 dark:text-gray-300 font-bold">We are online</span>
                        </div>
                    )}
                </div>

                {/* Expanded Quick Chat Socials */}
                {socialsOpen && (
                    <div className="flex gap-1.5 sm:gap-2 animate-fade-in z-45">
                        {/* Telegram Button */}
                        <a 
                            href="https://t.me/emporiumcapitals" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex size-10 sm:size-11 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-sky-600"
                            title="Telegram Chat"
                        >
                            <svg className="size-4 sm:size-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.33.52-.4-.01-1.18-.23-1.76-.42-.71-.23-1.27-.35-1.22-.75.02-.21.31-.42.86-.64 3.37-1.47 5.62-2.44 6.76-2.91 3.22-1.33 3.89-1.56 4.33-1.57.1 0 .32.02.46.14.12.1.15.24.16.34-.01.07 0 .15-.01.21z"/>
                            </svg>
                        </a>

                        {/* WhatsApp Button */}
                        <a 
                            href="https://wa.me/message/emporiumcapitals" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex size-10 sm:size-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-emerald-600"
                            title="WhatsApp Chat"
                        >
                            <svg className="size-4 sm:size-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.936 9.936 0 0 0 4.777 1.218h.004c5.506 0 9.989-4.478 9.99-9.985A9.997 9.997 0 0 0 12.012 2zm5.782 14.135c-.32.903-1.597 1.765-2.203 1.836-.607.072-1.206.326-3.882-.78-3.42-1.413-5.632-4.898-5.803-5.124-.17-.226-1.372-1.826-1.372-3.483 0-1.657.863-2.472 1.171-2.8.307-.329.804-.475 1.121-.475.32 0 .584.004.838.016.27.012.633-.1.99.756.362.88 1.238 3.023 1.347 3.242.11.22.18.475.036.756-.14.28-.316.452-.524.693-.208.24-.438.487-.626.702-.208.24-.426.502-.183.917.243.415 1.08 1.782 2.316 2.885 1.59 1.419 2.927 1.86 3.336 2.029.409.169.646.14.887-.138.24-.28 1.036-1.204 1.312-1.62.276-.416.552-.347.928-.208.376.138 2.385 1.124 2.494 1.18.11.055.18.27.142.49-.038.22-.52 1.17-.84 2.072z"/>
                            </svg>
                        </a>
                    </div>
                )}
            </div>

            {/* Bottom Right Floating Smartsupp Chat Widget — mobile: inset */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 select-none max-w-[calc(100vw-2rem)]">
                
                {/* 1. Smartsupp "Welcome to Emporium - Let's chat" Invitation Pop-up Card — mobile responsive */}
                {showInvitation && !chatOpen && (
                    <div className="w-[280px] max-w-[calc(100vw-2.5rem)] sm:w-[280px] bg-white text-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-gray-100 flex flex-col items-center relative animate-fade-in text-center">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowInvitation(false)}
                            className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>
                        
                        {/* Logo Circle */}
                        <div className="size-14 rounded-full bg-black flex items-center justify-center p-1 shadow-md mb-3 border border-gray-200">
                            <img src="/assets/logo.png" alt="Emporium logo" className="size-full object-contain" />
                        </div>
                        
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">Welcome to Emporium</h4>
                        <p className="text-[11px] text-gray-500 mt-1 mb-4 leading-relaxed font-medium">Click below to start a live conversation with our investment desk.</p>
                        
                        {/* Red Pill Button "Let's Chat" */}
                        <button 
                            onClick={() => {
                                setChatOpen(true);
                                setShowInvitation(false);
                            }}
                            className="w-full bg-[#ef4d45] hover:bg-[#d03d35] text-white rounded-full py-2.5 px-4 font-bold text-xs shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <MessageCircle className="size-4" />
                            <span>Let's chat</span>
                        </button>
                    </div>
                )}

                {/* 2. Expanded Chat Box Window — mobile: full width with margin */}
                {chatOpen && (
                    <div className="w-[calc(100vw-1.5rem)] sm:w-[330px] md:w-[355px] max-w-[355px] max-h-[70vh] sm:max-h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-white dark:bg-bg-card flex flex-col transition-all duration-300 ease-out animate-fade-in text-left">
                        
                        {/* Chat Header in red */}
                        <div className="bg-[#ef4d45] text-white px-5 py-4 flex items-center justify-between shadow-md relative">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-black flex items-center justify-center p-1 border border-white/20">
                                    <img src="/assets/logo.png" alt="Emporium" className="size-full object-contain" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-bold leading-tight">Emporium Support</h4>
                                    <span className="flex items-center gap-1.5 text-[10px] text-white/95 mt-0.5">
                                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        We reply immediately
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setChatOpen(false)}
                                className="text-white/80 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="size-4.5" />
                            </button>
                        </div>

                        {/* Chat Messages Body */}
                        <div className="h-[45vh] sm:h-60 max-h-[320px] overflow-y-auto p-3 sm:p-4 bg-gray-50/50 dark:bg-bg-base/35 flex flex-col gap-3 sm:gap-4 text-[11px] text-gray-800 dark:text-gray-200">
                            {chatMessages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                                >
                                    {msg.sender === 'agent' && (
                                        <div className="size-7 rounded-full bg-black shrink-0 flex items-center justify-center p-0.5 border border-border-subtle">
                                            <img src="/assets/logo.png" alt="agent" className="size-full object-contain" />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-[#ef4d45] text-white rounded-tr-none shadow-md shadow-[#ef4d45]/10' : 'bg-white dark:bg-bg-card border border-gray-200/60 dark:border-border-subtle text-gray-800 dark:text-text-main rounded-tl-none shadow-sm'}`}>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                        <span className={`text-[8px] text-text-muted/70 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendChatMessage} className="border-t border-gray-200/50 dark:border-border-subtle bg-white dark:bg-bg-card p-3 flex items-center gap-2">
                            <input 
                                type="text"
                                value={userMessage}
                                onChange={(e) => setUserMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="flex-1 bg-transparent text-xs text-gray-800 dark:text-text-main placeholder-text-muted outline-none px-2 py-1.5 focus:ring-0"
                            />
                            <button 
                                type="submit"
                                className="text-white hover:bg-[#d03d35] bg-[#ef4d45] transition-all duration-300 flex size-8 items-center justify-center rounded-full shrink-0 shadow-md cursor-pointer"
                                title="Send message"
                            >
                                <Send className="size-3.5" />
                            </button>
                        </form>

                        {/* Smartsupp Powered Link */}
                        <div className="bg-gray-100/50 dark:bg-bg-base/60 py-1.5 border-t border-gray-200/40 dark:border-border-subtle text-center">
                            <a 
                                href="https://www.smartsupp.com/powered-by-smartsupp/?utm_source=chat-widget-basic&utm_medium=chat-widget&utm_campaign=emporiumcapitals.com&domain=emporiumcapitals.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-text-muted/60 hover:text-brand-primary transition-colors inline-flex items-center gap-1 font-medium"
                            >
                                Powered by <span className="font-bold">Smartsupp</span>
                                <ExternalLink className="size-2" />
                            </a>
                        </div>
                    </div>
                )}

                {/* 3. Minimized Chat Pill Button (if not open and no invitation is shown) */}
                {!chatOpen && !showInvitation && (
                    <button 
                        onClick={() => setChatOpen(true)}
                        className="relative flex items-center gap-2 bg-[#ef4d45] hover:bg-[#d03d35] text-white rounded-full px-5 py-2.5 shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer font-bold text-xs border border-white/10"
                        title="Open support chat"
                    >
                        <MessageCircle className="size-4.5 animate-pulse" />
                        <span>Chat</span>
                        {/* Green online status dot */}
                        <span className="flex size-2.5 rounded-full bg-emerald-400 border border-white absolute -top-0.5 -right-0.5"></span>
                    </button>
                )}
            </div>
        </>
    );
}
