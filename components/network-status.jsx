'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function NetworkStatus() {
    const [status, setStatus] = useState(null); // 'online', 'offline', 'poor', 'stable', null
    const [visible, setVisible] = useState(false);
    const [transitioning, setTransitioning] = useState(false);

    const triggerNotification = (newStatus) => {
        setStatus(newStatus);
        setVisible(true);
        setTransitioning(true);

        // If it's a success or stable status, hide after 3 seconds
        if (newStatus === 'stable' || newStatus === 'online') {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    };

    const checkRealSpeed = async () => {
        // Fallback latency check using a tiny fetch request
        const startTime = performance.now();
        try {
            // Fetch with a cache-buster query parameter to test real network request
            const response = await fetch('/favicon.ico?cb=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-store'
            });
            
            if (response.ok) {
                const duration = performance.now() - startTime;
                // If ping latency is higher than 1200ms, classify as poor
                if (duration > 1200) {
                    return 'poor';
                }
                return 'stable';
            } else {
                return 'offline';
            }
        } catch (error) {
            return 'offline';
        }
    };

    const updateConnectionStatus = async () => {
        if (!navigator.onLine) {
            triggerNotification('offline');
            return;
        }

        // Check Navigator Connection API if available
        let quality = 'stable';
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (conn) {
            const { effectiveType, saveData, rtt, downlink } = conn;
            if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g' || rtt > 1000 || downlink < 1.0) {
                quality = 'poor';
            }
        } else {
            // Measure latency if API not supported
            quality = await checkRealSpeed();
        }

        triggerNotification(quality);
    };

    useEffect(() => {
        // Initial check on mount
        if (typeof window !== 'undefined') {
            updateConnectionStatus();

            const handleOnline = () => {
                triggerNotification('online');
                // Run a second check to determine if speed is poor or stable
                setTimeout(updateConnectionStatus, 1000);
            };

            const handleOffline = () => {
                triggerNotification('offline');
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Listen to connection changes if API exists
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                conn.addEventListener('change', updateConnectionStatus);
            }

            // Periodic connection health-check every 30 seconds
            const interval = setInterval(updateConnectionStatus, 30000);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                if (conn) {
                    conn.removeEventListener('change', updateConnectionStatus);
                }
                clearInterval(interval);
            };
        }
    }, []);

    if (!visible || !status) return null;

    // Configuration for the different connection notification styles
    const config = {
        offline: {
            bg: 'bg-red-500/10 dark:bg-red-950/20 border-red-500/30 text-red-200',
            icon: <WifiOff className="size-5 text-red-400 animate-pulse" />,
            title: 'Connection Lost',
            desc: 'You are offline. Please check your network connection.'
        },
        online: {
            bg: 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-200',
            icon: <CheckCircle className="size-5 text-emerald-400" />,
            title: 'Connection Restored',
            desc: 'Your internet connection has been successfully restored.'
        },
        poor: {
            bg: 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-amber-200',
            icon: <AlertTriangle className="size-5 text-amber-400 animate-bounce" />,
            title: 'Slow Connection',
            desc: 'We detected network lag. Some media might load slowly.'
        },
        stable: {
            bg: 'bg-blue-500/10 dark:bg-blue-950/20 border-blue-500/30 text-blue-200',
            icon: <Zap className="size-5 text-blue-400" />,
            title: 'Connection Stable',
            desc: 'Your internet connection is fast and stable.'
        }
    };

    const current = config[status];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" style={{animation:'fadeIn 0.2s ease-out'}} onClick={() => setVisible(false)}>
            <div 
                className={`relative flex items-start gap-3 sm:gap-4 p-5 sm:p-6 rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)] max-w-[400px] w-full ${current.bg}`} 
                style={{animation:'modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)'}} 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-2.5 rounded-xl bg-white/5 dark:bg-black/20 shrink-0">
                    {current.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <h5 className="text-sm font-bold tracking-wide uppercase opacity-90">{current.title}</h5>
                    <p className="text-xs sm:text-sm mt-1.5 opacity-75 font-medium leading-relaxed">{current.desc}</p>
                </div>
                <button 
                    onClick={() => setVisible(false)} 
                    className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors cursor-pointer text-base leading-none"
                >
                    ✕
                </button>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes modalPop { from { opacity: 0; transform: scale(0.9) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            `}</style>
        </div>
    );
}
