'use client';

import { useState, useEffect, useRef } from 'react';
import { WifiOff, CheckCircle, X } from 'lucide-react';

export default function NetworkStatus() {
    const [status, setStatus] = useState(null); // 'offline' | 'online' | null
    const [visible, setVisible] = useState(false);
    const wasOffline = useRef(false);
    const dismissTimer = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Only show offline notification if the user is truly offline on mount
        if (!navigator.onLine) {
            wasOffline.current = true;
            setStatus('offline');
            setVisible(true);
        }

        const handleOffline = () => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
            wasOffline.current = true;
            setStatus('offline');
            setVisible(true);
        };

        const handleOnline = () => {
            // Only trigger "Connection Restored" if the user was previously detected as offline
            if (wasOffline.current) {
                wasOffline.current = false;
                setStatus('online');
                setVisible(true);

                if (dismissTimer.current) clearTimeout(dismissTimer.current);
                dismissTimer.current = setTimeout(() => {
                    setVisible(false);
                }, 3500);
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
        };
    }, []);

    if (!visible || !status) return null;

    const isOffline = status === 'offline';

    return (
        <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto px-4 w-full max-w-md animate-slide-up"
        >
            <div
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                    isOffline
                        ? 'bg-[#150a0a]/90 border-red-500/30 text-red-200 shadow-red-950/40'
                        : 'bg-[#0a1812]/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/40'
                }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`p-2 rounded-xl shrink-0 ${
                            isOffline
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                    >
                        {isOffline ? (
                            <WifiOff className="size-4.5 animate-pulse" />
                        ) : (
                            <CheckCircle className="size-4.5" />
                        )}
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-xs sm:text-sm font-semibold tracking-wide">
                            {isOffline ? 'Connection Lost' : 'Connection Restored'}
                        </p>
                        <p className="text-[11px] opacity-75 truncate">
                            {isOffline
                                ? 'You appear to be offline. Reconnecting...'
                                : 'Your internet connection has been restored.'}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    aria-label="Dismiss network notification"
                >
                    <X className="size-4" />
                </button>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </aside>
    );
}
