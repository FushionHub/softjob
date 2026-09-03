'use client';

import { Check, ShieldCheck, Zap } from 'lucide-react';

export default function FaqSection() {
    const plans = [
        {
            name: 'Basic',
            roi: '10%',
            duration: '24 hours',
            min: '$95.00',
            max: '$1,200.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
        {
            name: 'Essential',
            roi: '25%',
            duration: '3 days',
            min: '$650.00',
            max: '$2,500.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
        {
            name: 'Standard',
            roi: '40%',
            duration: '4 days',
            min: '$2,500.00',
            max: '$4,000.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
        {
            name: 'Professional',
            roi: '50%',
            duration: '2 days',
            min: '$1,000.00',
            max: '$3,500.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: true, // Mark Professional as the featured card
        },
        {
            name: 'Fortune Path',
            roi: '60%',
            duration: '18 hours',
            min: '$1,500.00',
            max: '$5,000.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
        {
            name: 'Golden',
            roi: '78%',
            duration: '10 hours',
            min: '$3,001.00',
            max: '$15,000.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
        {
            name: 'Digital Bonus',
            roi: '70%',
            duration: '6 hours',
            min: '$2,000.00',
            max: '$9,999.00',
            features: ['Unlimited Support', 'Fast Payout', 'Principal Included'],
            highlight: false,
        },
    ];

    return (
        <section id="plans" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-300">
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[150px] pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        Investment Plans
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                        Select The Plan According To Your <span className="text-brand-primary">Demands.</span>
                    </h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed">
                        Explore our services and discover how we can help you achieve your financial goals. Secure, reliable, and convenient – your finances are in safe hands.
                    </p>
                </div>

                {/* Grid layout for 7 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
                    {plans.map((plan, idx) => (
                        <div 
                            key={idx} 
                            className={`glass-panel p-6 border flex flex-col justify-between transition-all duration-300 relative group ${
                                plan.highlight 
                                    ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-[1.02] bg-brand-primary/[0.03]' 
                                    : 'border-border-subtle hover:border-brand-primary/40'
                            }`}
                        >
                            {plan.highlight && (
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                    <Zap className="size-3 fill-white" />
                                    <span>Most Popular</span>
                                </span>
                            )}

                            <div className="space-y-6">
                                {/* Plan Header */}
                                <div className="text-left space-y-2">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{plan.name}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-extrabold text-text-main tracking-tight">{plan.roi}</span>
                                        <span className="text-xs text-text-muted">/ {plan.duration}</span>
                                    </div>
                                    <div className="h-px bg-border-subtle w-full pt-2"></div>
                                </div>

                                {/* Deposit Limits */}
                                <div className="space-y-2 text-left">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-muted">Min Deposit:</span>
                                        <span className="font-semibold text-text-main">{plan.min}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-muted">Max Deposit:</span>
                                        <span className="font-semibold text-text-main">{plan.max}</span>
                                    </div>
                                </div>

                                {/* Features List */}
                                <ul className="space-y-2 text-left pt-2">
                                    {plan.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-2.5 text-xs text-text-muted">
                                            <Check className="size-4 text-brand-primary shrink-0" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Button */}
                            <div className="mt-8">
                                <a 
                                    href="/login" 
                                    className={`w-full text-center py-2.5 rounded-full font-bold text-xs transition-all duration-300 block ${
                                        plan.highlight 
                                            ? 'btn-primary' 
                                            : 'border border-border-subtle text-text-main bg-bg-card/50 hover:border-brand-primary hover:bg-brand-primary hover:text-white'
                                    }`}
                                >
                                    Get Started Now
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Safety Seal */}
                <div className="mt-16 inline-flex items-center gap-2.5 text-xs text-text-muted bg-bg-card/30 border border-border-subtle px-5 py-2.5 rounded-full">
                    <ShieldCheck className="size-5 text-emerald-400" />
                    <span>Protected by 256-bit SSL encryption & uninterrupted DDoS protection.</span>
                </div>

            </div>
        </section>
    );
}