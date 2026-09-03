'use client';

import { ShieldAlert, TrendingUp, Layers, Check } from 'lucide-react';

export default function PaymentOptions() {
    const paymentFeatures = [
        {
            title: 'Diversification',
            description: 'Spreading investments across sectors and geographies to mitigate risks.',
            icon: Layers,
        },
        {
            title: 'Inflation Protection',
            description: 'Investing in real assets like land and property that traditionally outpace inflation.',
            icon: ShieldAlert,
        },
        {
            title: 'Access to Emerging Opportunities',
            description: 'Tapping into growth trends in global markets and innovative sectors.',
            icon: TrendingUp,
        },
    ];

    const cryptoLogos = [
        { name: 'Bitcoin', symbol: 'BTC', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { name: 'Ethereum', symbol: 'ETH', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
        { name: 'Tether', symbol: 'USDT', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
        { name: 'BNB', symbol: 'BNB', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { name: 'Solana', symbol: 'SOL', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
        { name: 'Cardano', symbol: 'ADA', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { name: 'Ripple', symbol: 'XRP', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
        { name: 'Dogecoin', symbol: 'DOGE', color: 'text-yellow-600', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' },
    ];

    return (
        <section id="payments" className="py-20 md:py-28 bg-bg-card/10 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        Multiple Payment Options
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                        We accept <span className="text-brand-primary">The Most Popular</span> Cryptocurrencies
                    </h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed">
                        Fund your account instantly using standard secure blockchain networks. Fast, low fee, and fully automated processing.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Interactive Coins layout */}
                    <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-4">
                        {cryptoLogos.map((coin, idx) => (
                            <div 
                                key={idx} 
                                className={`glass-panel p-4 border ${coin.border} ${coin.bg} flex flex-col items-center justify-center text-center rounded-2xl hover:scale-105 transition-all duration-300`}
                            >
                                <span className={`text-2xl font-black mb-1 ${coin.color}`}>
                                    {coin.symbol}
                                </span>
                                <span className="text-xs font-bold text-text-main">
                                    {coin.name}
                                </span>
                                <span className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                                    <Check className="size-3 text-emerald-400" />
                                    <span>Instant</span>
                                </span>
                            </div>
                        ))}
                        {/* Decorative logo */}
                        <div className="glass-panel p-4 border border-brand-primary/20 bg-brand-primary/5 flex flex-col items-center justify-center text-center rounded-2xl col-span-2 sm:col-span-4 lg:col-span-1">
                            <img 
                                src="/assets/icon.png" 
                                alt="Emporium" 
                                className="h-10 w-auto object-contain animate-bounce"
                            />
                            <span className="text-[10px] font-bold text-brand-primary mt-1">EMPORIUM</span>
                        </div>
                    </div>

                    {/* Right: Key features */}
                    <div className="lg:col-span-6 space-y-6">
                        {paymentFeatures.map((feat, idx) => {
                            const Icon = feat.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className="glass-panel p-6 border border-border-subtle flex gap-5 items-start hover:border-brand-primary/45 transition-colors duration-300"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <h4 className="text-base font-bold text-text-main">{feat.title}</h4>
                                        <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                                            {feat.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

            </div>
        </section>
    );
}
