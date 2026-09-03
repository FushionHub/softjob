'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LogIn, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function HeroSection() {
    const { theme } = useTheme();
    const [marqueeLoaded, setMarqueeLoaded] = useState(false);

    useEffect(() => {
        // Load CoinGecko widget script
        const scriptId = 'coingecko-marquee-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js';
            script.async = true;
            script.onload = () => setMarqueeLoaded(true);
            document.body.appendChild(script);
        } else {
            setMarqueeLoaded(true);
        }
    }, []);

    return (
        <section className="relative overflow-hidden pt-12 pb-20 md:py-32 transition-colors duration-300">
            {/* Glowing background highlights */}
            <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-brand-primary/20 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/3 right-1/4 -z-10 h-96 w-96 rounded-full bg-brand-secondary/35 blur-[120px] pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
                    {/* Left Column Content */}
                    <div className="lg:col-span-7 text-left space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card/50 px-4 py-1.5 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-main">
                                Your Wealth, Automated!
                            </span>
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-text-main sm:text-6xl leading-[1.1]">
                            Building wealth is a habit <br />
                            <span className="bg-gradient-to-r from-brand-primary to-[#ff7d75] bg-clip-text text-transparent">
                                Automate it
                            </span>{' '}
                            with Emporium Capitals
                        </h1>

                        <p className="max-w-xl text-base md:text-lg text-text-muted leading-relaxed">
                            Begin your passive income journey with Emporium Capitals. Zero effort required - We manage the process, you collect the profits.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <a href="/register" className="btn-primary gap-2">
                                <span>Join Us!</span>
                                <ArrowRight className="size-4" />
                            </a>
                            <a href="/login" className="btn-secondary gap-2">
                                <LogIn className="size-4" />
                                <span>Login</span>
                            </a>
                        </div>

                        {/* Stats mini grid */}
                        <div className="grid grid-cols-3 gap-6 pt-10 border-t border-border-subtle">
                            <div>
                                <p className="text-2xl font-bold text-text-main">$42M+</p>
                                <p className="text-xs text-text-muted">AUM Managed</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-text-main">99.8%</p>
                                <p className="text-xs text-text-muted">Uptime Security</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-text-main">450K+</p>
                                <p className="text-xs text-text-muted">Global Investors</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column App UI mockup */}
                    <div className="lg:col-span-5 relative flex justify-center">
                        <div className="relative w-full max-w-[360px] aspect-[9/18] rounded-[40px] border-4 border-text-main bg-[#02030f] p-3.5 shadow-2xl overflow-hidden group">
                            {/* Camera Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black z-20"></div>
                            
                            {/* Inner Screen Graphic */}
                            <div className="w-full h-full flex flex-col justify-between py-6 px-4 bg-gradient-to-b from-[#0e0f22] to-[#040511] rounded-[30px] overflow-hidden text-white relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,77,69,0.15),transparent_60%)]"></div>

                                {/* Top Bar */}
                                <div className="flex justify-between items-center z-10 text-[10px] text-gray-400">
                                    <div className="font-semibold">Emporium App</div>
                                    <div className="flex gap-1 items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                        <span>Live connection</span>
                                    </div>
                                </div>

                                {/* Wallet Component */}
                                <div className="mt-6 space-y-4 z-10">
                                    <div className="glass-panel p-4 border border-white/10 rounded-2xl bg-white/5 space-y-1">
                                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                                            <span>Active Deposit</span>
                                            <Wallet className="size-3.5 text-brand-primary" />
                                        </div>
                                        <p className="text-2xl font-bold tracking-tight text-white">$14,250.00</p>
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                                            <TrendingUp className="size-3" />
                                            <span>+12.4% this week</span>
                                        </div>
                                    </div>

                                    {/* Profit chart placeholder */}
                                    <div className="glass-panel p-4 border border-white/10 rounded-2xl bg-white/5 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                                            <span>Daily Payouts</span>
                                            <span className="text-brand-primary font-semibold">10% - 78% ROI</span>
                                        </div>
                                        {/* Styled Chart Bars */}
                                        <div className="flex items-end justify-between h-16 pt-2">
                                            <div className="w-4 bg-white/10 rounded-t h-8"></div>
                                            <div className="w-4 bg-white/10 rounded-t h-12"></div>
                                            <div className="w-4 bg-white/20 rounded-t h-10"></div>
                                            <div className="w-4 bg-brand-primary/60 rounded-t h-14"></div>
                                            <div className="w-4 bg-brand-primary rounded-t h-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Profit Ticker */}
                                <div className="glass-panel p-3 border border-white/10 rounded-2xl bg-white/5 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                            <DollarSign className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400">Lucas P. just withdrew</p>
                                            <p className="text-xs font-bold text-white">+$1,450.00</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-gray-500">2 min ago</span>
                                </div>
                            </div>
                        </div>

                        {/* Extra decorative circles/blobs behind phone */}
                        <div className="absolute -top-6 -right-6 -z-10 h-24 w-24 rounded-full bg-[#ef4d45]/40 blur-xl"></div>
                        <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-[#8c0030]/50 blur-2xl"></div>
                    </div>
                </div>

                {/* CoinGecko Coin Price Marquee Widget Container */}
                <div className="mt-16 w-full relative z-10 bg-bg-card/50 rounded-2xl p-2 border border-border-subtle backdrop-blur-sm shadow-lg">
                    {marqueeLoaded ? (
                        <gecko-coin-price-marquee-widget 
                            locale="en" 
                            dark-mode={theme === 'dark' ? 'true' : 'false'} 
                            outlined="false" 
                            coin-ids="" 
                            initial-currency="usd"
                        ></gecko-coin-price-marquee-widget>
                    ) : (
                        <div className="flex h-10 w-full items-center justify-center text-xs text-text-muted">
                            Loading Coin Prices...
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}