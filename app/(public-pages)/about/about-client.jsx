'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Award, Users, Shield, Handshake, Mail } from 'lucide-react';

export default function AboutClient() {
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

    const investmentAreas = [
        {
            title: 'Cryptocurrency',
            description: 'Venture into the dynamic world of digital currencies. With our expert guidance, we offer opportunities to invest in leading cryptocurrencies, leveraging market trends to maximize your returns.'
        },
        {
            title: 'Agriculture',
            description: 'Invest in the backbone of the global economy. Our agriculture investments focus on sustainable and profitable farming practices, ensuring growth and stability in this vital sector.'
        },
        {
            title: 'Real Estate',
            description: 'Diversify your portfolio with real estate investments. From residential properties to commercial projects, we provide opportunities in lucrative real estate markets, helping you build lasting wealth.'
        },
        {
            title: 'Forex',
            description: 'Tap into the vast potential of foreign exchange markets. Our forex investment strategies are designed to capitalize on currency fluctuations, providing you with opportunities for significant gains.'
        },
        {
            title: 'Stocks',
            description: 'Invest in the stock market with confidence. Our team of experts identifies high-potential stocks across various industries, giving you the chance to share in the growth of leading companies worldwide.'
        }
    ];

    const coreValues = [
        {
            icon: Award,
            title: 'Integrity',
            description: 'We uphold the highest standards of integrity in all our actions.'
        },
        {
            icon: Users,
            title: 'Innovation',
            description: 'We continuously seek innovative solutions to meet the evolving needs of our clients.'
        },
        {
            icon: Shield,
            title: 'Commitment',
            description: 'We are committed to delivering outstanding results and building long-term relationships with our clients.'
        },
        {
            icon: Handshake,
            title: 'Transparency',
            description: 'We believe in open, transparent communication, ensuring you are always informed about your investments.'
        }
    ];

    return (
        <main className="overflow-x-hidden min-h-screen bg-bg-base transition-colors duration-300">
            {/* Header Banner */}
            <section className="relative py-20 md:py-28 flex flex-col items-center justify-center border-b border-border-subtle bg-bg-base overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -top-20 right-10 w-[300px] h-[300px] bg-brand-secondary/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-primary tracking-tight text-center relative z-10 transition-transform duration-300 hover:scale-[1.02]">
                    About Us
                </h1>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wide text-text-muted relative z-10">
                    <Link href="/" className="hover:text-brand-primary transition-colors duration-200">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="text-brand-primary">About Us</span>
                </div>
            </section>

            {/* Our Mission Section */}
            <section className="py-16 md:py-24 max-w-4xl mx-auto px-6 relative">
                {/* Glowing details */}
                <div className="absolute -left-20 top-40 w-72 h-72 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col items-center text-center">
                    <span className="inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/5 px-5 py-1.5 text-xs font-semibold tracking-wider text-brand-primary uppercase shadow-md shadow-brand-primary/5 hover:bg-brand-primary/10 transition-colors duration-200 cursor-default">
                        Our Mission
                    </span>
                    
                    <p className="text-lg md:text-xl text-text-main font-medium leading-relaxed max-w-3xl mt-8">
                        At Emporium Capitals, our mission is to make trading approachable, making forex accessible to everyone. We believe in transparency, determination, and dedication to the growth of every trader. Our goal is to help you navigate the complex world of investments with confidence and success.
                    </p>
                </div>

                <div className="mt-16 space-y-8 text-sm md:text-base text-text-muted leading-relaxed">
                    <p>
                        Welcome to Emporium Capitals, your trusted partner in wealth creation and financial growth. We are dedicated to providing exceptional investment opportunities across a diverse range of sectors, including Cryptocurrency, Agriculture, Real Estate, Forex, and Stocks. Our mission is to empower individuals and institutions to achieve their financial goals through smart, strategic investments.
                    </p>
                    <p>
                        With over $20 million in assets under our management, $6.5 million in payouts under our administration, over 10 industry awards, we have established ourselves as the main choice for investors who want to reach their financial goals. Our mission is to help them reach their financial goals, and in due time, without the fear of disappointment.
                    </p>
                    <p>
                        Emporium Capitals was established with the goal of assisting people in realizing their potential through managed master trading. Emporium Capitals has stayed at the top of the field for over the last three years. Emporium Capitals is one of the most diversified educational platforms you will ever see, with accounts from all over the world. Since the founding of Emporium Capitals, the founders have expanded a dedicated office, that is placed at the disposal of traders, from novices to experienced traders.
                    </p>
                </div>
            </section>

            {/* Our Investment Areas Section */}
            <section className="py-16 md:py-24 max-w-4xl mx-auto px-6 border-t border-border-subtle/40 relative">
                <div className="absolute -right-20 top-20 w-80 h-80 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center text-brand-primary mb-12">
                    Our Investment Areas
                </h2>

                <div className="space-y-12">
                    {investmentAreas.map((area, idx) => (
                        <div 
                            key={idx} 
                            className="group p-6 rounded-2xl border border-transparent hover:border-border-subtle hover:bg-bg-card/25 transition-all duration-300"
                        >
                            <h3 className="text-xl font-bold text-text-main group-hover:text-brand-primary transition-colors duration-200">
                                {area.title}
                            </h3>
                            <p className="mt-3 text-sm md:text-base text-text-muted leading-relaxed">
                                {area.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose & Join Us Section */}
            <section className="py-16 md:py-24 max-w-4xl mx-auto px-6 border-t border-border-subtle/40">
                <div className="space-y-16">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-primary">
                            Why Choose Emporium Capitals?
                        </h2>
                        <p className="mt-4 text-sm md:text-base text-text-muted leading-relaxed">
                            Choose Emporium Capitals for expert guidance, diverse opportunities, and robust support. We help you navigate investments to achieve financial success.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-primary">
                            Join Us Today
                        </h2>
                        <div className="mt-4 space-y-6 text-sm md:text-base text-text-muted leading-relaxed">
                            <p>
                                At Emporium Capitals, we are passionate about helping you achieve financial success. Whether you are looking to start your investment journey or expand your portfolio, we are here to support you at every step. Join us today and embark on a path toward financial prosperity.
                            </p>
                            <p className="font-semibold text-text-main">
                                For more information, feel free to contact us. We look forward to partnering with you on your investment journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-16 md:py-24 border-t border-border-subtle/40 bg-bg-card/10 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,77,69,0.03),transparent_60%)] pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <p className="text-sm md:text-base text-text-muted leading-relaxed">
                            Venture into the dynamic world of digital currencies. With our expert guidance, we offer opportunities to invest in leading cryptocurrencies, leveraging market trends to maximize your returns.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {coreValues.map((value, idx) => {
                            const IconComponent = value.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className="glass-panel p-8 text-center border border-border-subtle hover:border-brand-primary/50 transition-all duration-300 group hover:-translate-y-2"
                                >
                                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-secondary/40 to-brand-primary/20 border border-brand-primary/20 text-white mx-auto shadow-lg shadow-brand-primary/5 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="size-7 text-brand-primary group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-main mt-6 group-hover:text-brand-primary transition-colors duration-200">
                                        {value.title}
                                    </h3>
                                    <p className="text-xs text-text-muted mt-3 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
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
