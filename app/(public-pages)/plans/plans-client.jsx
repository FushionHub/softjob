'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Mail, BarChart3 } from 'lucide-react';

export default function PlansClient() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 5000);
        }
    };

    const plans = [
        {
            title: 'Basic',
            rate: '10%',
            duration: '24 hours',
            min: '$95.00',
            max: '$1200.00',
        },
        {
            title: 'Essential',
            rate: '25%',
            duration: '3 days',
            min: '$650.00',
            max: '$2500.00',
        },
        {
            title: 'Standard',
            rate: '40%',
            duration: '4 days',
            min: '$2500.00',
            max: '$4000.00',
        },
        {
            title: 'Professional',
            rate: '50%',
            duration: '2 days',
            min: '$1000.00',
            max: '$3500.00',
        },
        {
            title: 'Fortune Path',
            rate: '60%',
            duration: '18 hours',
            min: '$1500.00',
            max: '$5000.00',
        },
        {
            title: 'Golden',
            rate: '78%',
            duration: '10 hours',
            min: '$3000.00',
            max: '$15000.00',
        },
        {
            title: 'Digital Bonus',
            rate: '70%',
            duration: '6 hours',
            min: '$2000.00',
            max: '$9999.00',
        }
    ];

    return (
        <main className="overflow-x-hidden min-h-screen bg-bg-base transition-colors duration-300">
            {/* Header Banner */}
            <section className="relative py-20 md:py-28 flex flex-col items-center justify-center border-b border-border-subtle bg-bg-base overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 left-10 w-[300px] h-[300px] bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-primary tracking-tight text-center relative z-10 transition-transform duration-300 hover:scale-[1.02]">
                    Investment Plans
                </h1>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wide text-text-muted relative z-10">
                    <Link href="/" className="hover:text-brand-primary transition-colors duration-200">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="text-brand-primary">Plans</span>
                </div>
            </section>

            {/* Intro Header Section */}
            <section className="py-16 md:py-20 text-center max-w-4xl mx-auto px-6 relative">
                {/* Glow detail */}
                <div className="absolute -left-20 top-20 w-72 h-72 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col items-center text-center">
                    <span className="inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/5 px-5 py-1.5 text-xs font-semibold tracking-wider text-brand-primary uppercase shadow-md shadow-brand-primary/5 hover:bg-brand-primary/10 transition-colors duration-200 cursor-default">
                        Investment Plans
                    </span>
                    
                    <h2 className="mt-6 text-3xl md:text-5xl font-extrabold tracking-tight text-text-main">
                        Select The Plan According To All your <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-[#d03d35] bg-clip-text text-transparent">Demands</span>.
                    </h2>
                    
                    <p className="mt-6 text-sm md:text-base text-text-muted leading-relaxed max-w-2xl">
                        Explore our services and discover how we can help you achieve your financial goals. secure, reliable, and convenient – finances are in safe hands.
                    </p>
                </div>
            </section>

            {/* Investment Plans Grid Section */}
            <section className="pb-24 px-6 max-w-7xl mx-auto relative">
                {/* Right ambient glow */}
                <div className="absolute right-0 bottom-40 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div 
                            key={idx} 
                            className="glass-panel p-8 flex flex-col justify-between border border-border-subtle relative overflow-hidden group hover:border-brand-primary/40 hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-300 hover:-translate-y-2 rounded-2xl"
                        >
                            {/* Accent line on hover */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-primary to-brand-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

                            <div>
                                {/* Header of Card */}
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-text-main group-hover:text-brand-primary transition-colors duration-200">
                                        {plan.title}
                                    </h3>
                                    
                                    {/* Circular Chart Icon */}
                                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-secondary/40 text-brand-primary shadow-lg border border-brand-primary/20 group-hover:scale-110 transition-transform duration-300">
                                        <BarChart3 className="size-4.5" />
                                    </div>
                                </div>

                                {/* Plan yield & duration */}
                                <div className="mt-6">
                                    <span className="text-4xl md:text-5xl font-black text-text-main tracking-tight block">
                                        {plan.rate}
                                    </span>
                                    <span className="text-xs md:text-sm text-text-muted mt-1 block">
                                        {plan.duration}
                                    </span>
                                </div>

                                {/* Get Started Button */}
                                <div className="mt-8">
                                    <Link 
                                        href="/register" 
                                        className="block text-center py-2.5 px-6 rounded-full border border-brand-primary/20 bg-bg-card/40 text-text-main font-semibold text-xs md:text-sm hover:bg-brand-primary hover:border-brand-primary transition-all duration-300 hover:scale-[1.02] shadow-inner"
                                    >
                                        Get Started Now
                                    </Link>
                                </div>

                                {/* Plan details checkmarks */}
                                <ul className="mt-8 space-y-4">
                                    <li className="flex items-center gap-3 text-xs md:text-sm text-text-muted">
                                        <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shrink-0 shadow-sm border border-brand-primary/10">
                                            <Check className="size-2.5 stroke-[3]" />
                                        </span>
                                        <span>Minimum: {plan.min}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-xs md:text-sm text-text-muted">
                                        <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shrink-0 shadow-sm border border-brand-primary/10">
                                            <Check className="size-2.5 stroke-[3]" />
                                        </span>
                                        <span>Maximum: {plan.max}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-xs md:text-sm text-text-muted">
                                        <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shrink-0 shadow-sm border border-brand-primary/10">
                                            <Check className="size-2.5 stroke-[3]" />
                                        </span>
                                        <span>Unlimited Support</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-xs md:text-sm text-text-muted">
                                        <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary shrink-0 shadow-sm border border-brand-primary/10">
                                            <Check className="size-2.5 stroke-[3]" />
                                        </span>
                                        <span>Fast Payout</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Newsletter Glass-Panel Form */}
            <section className="py-16 px-6 max-w-5xl mx-auto relative z-10">
                <div className="glass-panel p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-br from-bg-card to-bg-base/35 border border-border-subtle shadow-2xl rounded-3xl">
                    {/* Floating glows */}
                    <div className="absolute -top-12 -left-12 size-32 rounded-full bg-brand-primary/10 blur-xl pointer-events-none"></div>
                    <div className="absolute -bottom-12 -right-12 size-32 rounded-full bg-brand-secondary/10 blur-xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 max-w-xl text-center sm:text-left relative z-10">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary shadow-inner">
                            <Mail className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-main tracking-tight">
                                Subscribe To Our Newsletter
                            </h3>
                            <p className="text-xs md:text-sm text-text-muted mt-1">
                                Receive latest news & updates from Emporium Capitals.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 relative z-10">
                        {subscribed ? (
                            <div className="text-emerald-400 font-semibold text-sm px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-fade-in">
                                Thank you for subscribing!
                            </div>
                        ) : (
                            <>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email..." 
                                    required
                                    className="w-full sm:w-64 rounded-full border border-border-subtle bg-bg-base/60 px-5 py-3 text-xs text-text-main placeholder-text-muted outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300" 
                                />
                                <button 
                                    type="submit" 
                                    className="btn-primary w-full sm:w-auto text-xs px-6 py-3 font-semibold whitespace-nowrap"
                                >
                                    Subscribe Now
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </section>
        </main>
    );
}
