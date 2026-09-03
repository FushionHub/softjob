'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Download, Laptop, ShieldCheck } from 'lucide-react';

export default function HowItWorks() {
    const [progress1, setProgress1] = useState(0);
    const [progress2, setProgress2] = useState(0);

    useEffect(() => {
        // Animate the progress indicators after mount
        const timer = setTimeout(() => {
            setProgress1(45); // Starter Plan ~45% visual indicator
            setProgress2(95); // Advanced Plan ~95% visual indicator
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section id="how-it-works" className="py-20 md:py-28 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        How It Works
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                        It's easy to <span className="text-brand-primary">start</span> your journey with us
                    </h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed">
                        Welcome to an intelligent investment platform designed to grow your wealth effortlessly.
                    </p>
                </div>

                {/* Steps layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Step 1 */}
                    <div className="glass-panel p-8 border border-border-subtle flex flex-col justify-between space-y-6 relative group">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-primary uppercase">Step 01</span>
                                <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-semibold text-xs">1</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Open a Deposit</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Growing your wealth with Emporium Capitals is simple: Register, select your ideal investment plan to begin and deposit to activate your portfolio.
                            </p>
                        </div>

                        {/* Earnings progress illustration */}
                        <div className="bg-bg-base/50 border border-border-subtle rounded-2xl p-4 space-y-4">
                            <p className="text-xs font-semibold text-text-main">A bigger investment brings better earnings</p>
                            
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] text-text-muted font-medium">
                                    <span>Starter Plan Earnings</span>
                                    <span className="text-brand-primary">5%+</span>
                                </div>
                                <div className="h-2 w-full bg-bg-card rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-primary rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress1}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] text-text-muted font-medium">
                                    <span>Advanced Plan Earnings</span>
                                    <span className="text-brand-primary">100%+</span>
                                </div>
                                <div className="h-2 w-full bg-bg-card rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress2}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="glass-panel p-8 border border-border-subtle flex flex-col justify-between space-y-6 relative group">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-primary uppercase">Step 02</span>
                                <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-semibold text-xs">2</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Manage Investments</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Emporium Capitals’s platform delivers total control: track earnings, secure your account, monitor referrals, and manage investments in one intuitive interface.
                            </p>
                        </div>

                        {/* Bullet point details */}
                        <div className="bg-bg-base/50 border border-border-subtle rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2.5 text-xs text-text-muted">
                                <CheckCircle2 className="size-4 text-brand-primary shrink-0" />
                                <span>Start from $95.00</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-text-muted">
                                <CheckCircle2 className="size-4 text-brand-primary shrink-0" />
                                <span>Earn passive daily income</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-text-muted">
                                <CheckCircle2 className="size-4 text-brand-primary shrink-0" />
                                <span>Withdraw your earnings anytime</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-panel p-8 border border-border-subtle flex flex-col justify-between space-y-6 relative group">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-primary uppercase">Step 03</span>
                                <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-semibold text-xs">3</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">Receive Payments</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                At Emporium Capitals, your payout is our high priority. We do our best to process and pay the fastest way possible, usually within a few minutes.
                            </p>
                        </div>

                        {/* Payout highlight grids */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-base/50 border border-border-subtle rounded-xl p-3 flex flex-col justify-between text-left space-y-2">
                                <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <Download className="size-3.5" />
                                </div>
                                <p className="text-[10px] text-text-muted leading-tight font-medium">
                                    Request withdrawal anytime, without restrictions.
                                </p>
                            </div>
                            <div className="bg-bg-base/50 border border-border-subtle rounded-xl p-3 flex flex-col justify-between text-left space-y-2">
                                <div className="size-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <ShieldCheck className="size-3.5" />
                                </div>
                                <p className="text-[10px] text-text-muted leading-tight font-medium">
                                    Direct wallet payouts in less than 48 hours.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}
