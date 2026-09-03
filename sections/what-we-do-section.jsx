'use client';

import { useEffect, useRef } from 'react';
import { ShieldCheck, Target, TrendingUp, Cpu } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function WhatWeDoSection() {
    const { theme } = useTheme();
    const chartContainerRef = useRef(null);

    useEffect(() => {
        if (chartContainerRef.current) {
            // Clear any previous script or content
            chartContainerRef.current.innerHTML = '';
            
            // Create target widget container
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            widgetDiv.style.height = '100%';
            widgetDiv.style.width = '100%';
            chartContainerRef.current.appendChild(widgetDiv);

            // Create script
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
                "height": "400",
                "width": "100%",
                "symbol": "BINANCE:BTCUSDT",
                "interval": "1",
                "timezone": "Etc/UTC",
                "theme": theme === 'dark' ? 'dark' : 'light',
                "style": "1",
                "locale": "en",
                "backgroundColor": theme === 'dark' ? "rgb(21, 20, 54)" : "#ffffff",
                "gridColor": theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                "hide_legend": true,
                "allow_symbol_change": true,
                "save_image": false,
                "support_host": "https://www.tradingview.com"
            });
            chartContainerRef.current.appendChild(script);
        }
    }, [theme]);

    return (
        <section id="about" className="py-20 md:py-28 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section Title */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
                    <div className="max-w-xl text-left">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                            Who We Are
                        </span>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                            Know more about <span className="text-brand-primary">Emporium Capitals</span>
                        </h2>
                    </div>
                    <p className="max-w-xl text-left text-sm md:text-base text-text-muted leading-relaxed">
                        Emporium Capitals is a forward-thinking financial company committed to transforming the investment landscape. By blending innovation with a customer-first approach, Emporium Capitals integrates time-tested investment strategies with advanced technology for a seamless experience.
                    </p>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Vision Card */}
                    <div className="glass-panel p-8 flex flex-col justify-between border border-border-subtle relative overflow-hidden group">
                        <div className="space-y-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                                <Target className="size-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Our Vision</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                We are committed to achieving Financial Independence by breaking down barriers to wealth creation, building a strong Global Community that fosters empowered investors worldwide, and leveraging AI-Driven Trading to pioneer groundbreaking advancements in automated investing.
                            </p>
                        </div>
                        {/* Decorative circle glow */}
                        <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-brand-primary/5 blur-xl group-hover:bg-brand-primary/10 transition-colors duration-300"></div>
                    </div>

                    {/* Investment Strategy Card */}
                    <div className="glass-panel p-8 flex flex-col justify-between border border-border-subtle relative overflow-hidden group">
                        <div className="space-y-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary/15 text-brand-primary">
                                <Cpu className="size-6" />
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Investment Strategy</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Emporium Capitals uses advanced AI algorithms to execute optimized crypto trading strategies within strict risk frameworks. Our quant approach combines strategic Web3 investments, leveraging deep market expertise to capture high growth opportunities. This balanced method ensures consistent market exposure while capitalizing on emerging blockchain innovation.
                            </p>
                        </div>
                        {/* Decorative circle glow */}
                        <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-brand-secondary/10 blur-xl group-hover:bg-brand-secondary/15 transition-colors duration-300"></div>
                    </div>
                </div>

                {/* Chart Widget Panel */}
                <div className="glass-panel p-4 md:p-6 border border-border-subtle mb-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="size-5 text-emerald-400" />
                            <span className="font-semibold text-text-main">Live Market Trading Analysis</span>
                        </div>
                        <span className="text-xs text-text-muted">BTC/USDT BINANCE</span>
                    </div>
                    {/* TradingView Element */}
                    <div ref={chartContainerRef} className="w-full min-h-[400px] rounded-xl overflow-hidden bg-bg-card">
                        <div className="flex items-center justify-center h-[400px] text-text-muted">
                            Loading Advanced TradingView Chart...
                        </div>
                    </div>
                </div>

                {/* Bottom Grid: Security Card & Video player */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Security Card */}
                    <div className="glass-panel p-8 flex flex-col justify-center border border-border-subtle relative overflow-hidden group">
                        <div className="space-y-4">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                <ShieldCheck className="size-7" />
                            </div>
                            <h3 className="text-xl font-bold text-text-main">100% Security and Insurance</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                We employ the highest industry standards to shield customer data from third-party breaches, including enterprise-grade DDoS protection and uninterrupted service reliability. Every data transaction is encrypted with 256-bit SSL technology for maximum safety.
                            </p>
                        </div>
                    </div>

                    {/* Video Player Card */}
                    <div className="glass-panel overflow-hidden border border-border-subtle p-2 flex items-center justify-center bg-bg-card/40">
                        <video 
                            width="100%" 
                            height="auto" 
                            controls 
                            className="rounded-xl shadow-lg border border-border-subtle"
                            poster="/assets/icon.png"
                            suppressHydrationWarning
                        >
                            <source src="/assets/emporiumcapitals.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>

                </div>

            </div>
        </section>
    );
}