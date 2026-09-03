'use client';

import { Percent, Smartphone, ShieldCheck, Share2 } from 'lucide-react';

export default function OurLatestCreations() {
    const advantages = [
        {
            title: 'Attractive Interest Rates',
            description: 'Take advantage of attractive interest rates that grow your money efficiently, helping you build savings steadily and reach your financial milestones sooner.',
            icon: Percent,
            color: 'from-[#ef4d45]/20 to-[#ef4d45]/5',
            iconColor: 'text-[#ef4d45]',
        },
        {
            title: 'Intuitive Platform',
            description: 'Discover Emporium Capitals’s intuitive investing platform, designed to help you build a well balanced portfolio that aligns with your risk comfort and financial goals.',
            icon: Smartphone,
            color: 'from-blue-500/20 to-blue-500/5',
            iconColor: 'text-blue-400',
        },
        {
            title: 'Strong Security',
            description: 'Earn daily income away from stress and fear, Emporium Capitals is protected with Strong DDOS security and Firewalls, while having a team of experts monitoring 24/7.',
            icon: ShieldCheck,
            color: 'from-emerald-500/20 to-emerald-500/5',
            iconColor: 'text-emerald-400',
        },
        {
            title: 'Affiliate Program',
            description: 'Earn extra income by referring others to Emporium Capitals. Our Affiliate Program incentivizes users for bringing new members to the platform.',
            icon: Share2,
            color: 'from-purple-500/20 to-purple-500/5',
            iconColor: 'text-purple-400',
        },
    ];

    return (
        <section id="advantages" className="py-20 md:py-28 bg-bg-card/20 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        Our Advantages
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                        Explore <span className="text-brand-primary">Emporium Capitals</span> Features
                    </h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed">
                        See how our services can guide you toward your financial objectives. With security, reliability, and convenience, your wealth is well protected.
                    </p>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {advantages.map((adv, index) => {
                        const Icon = adv.icon;
                        return (
                            <div 
                                key={index} 
                                className="glass-panel p-6 border border-border-subtle flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group"
                            >
                                <div className="space-y-4">
                                    <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${adv.color} ${adv.iconColor}`}>
                                        <Icon className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-main group-hover:text-brand-primary transition-colors duration-200">
                                        {adv.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                                        {adv.description}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-xs font-semibold text-brand-primary group-hover:underline cursor-pointer">
                                    <span>Learn more</span>
                                    <span className="ml-1 transition-transform duration-200 group-hover:translate-x-1">→</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}