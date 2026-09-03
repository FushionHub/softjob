'use client';

import { Star } from 'lucide-react';

export default function OurTestimonialSection() {
    const reviews = [
        {
            review: 'Highly recommend Emporium Capitals to anyone looking to grow their portfolio safely.',
            name: 'Chloe Martinez',
            about: 'Investor',
            rating: 5,
            image: '/assets/reviews/img4.jpg',
        },
        {
            review: 'Emporium Capitals offers more than just profit — it provides peace of mind.',
            name: 'Lucas P.',
            about: 'Investor',
            rating: 5,
            image: '/assets/reviews/img3.jpg',
        },
        {
            review: 'The platform is simple and intuitive. Emporium Capitals really made investing easy for me.',
            name: 'Sophia Jenkins',
            about: 'Investor',
            rating: 5,
            image: '/assets/reviews/img2.jpg',
        },
        {
            review: "I've been investing with Emporium Capitals for months, and the returns have been excellent!",
            name: 'James Carter',
            about: 'Investor',
            rating: 5,
            image: '/assets/reviews/img1.jpg',
        },
    ];

    return (
        <section id="testimonials" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-300">
            {/* Background vector elements */}
            <div className="absolute top-10 right-10 -z-10 h-72 w-72 rounded-full bg-brand-primary/5 blur-[80px] pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                
                {/* Section title */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                        Testimonials
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-text-main sm:text-4xl">
                        Hear <span className="text-brand-primary">What People Say</span> About Us
                    </h2>
                    <p className="text-sm md:text-base text-text-muted leading-relaxed">
                        Explore our services and discover how we can help you achieve your financial goals. Secure, reliable, and convenient – finances are in safe hands.
                    </p>
                </div>

                {/* Testimonial grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {reviews.map((item, index) => (
                        <div 
                            key={index} 
                            className="glass-panel p-6 border border-border-subtle flex flex-col justify-between space-y-6 hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="space-y-3">
                                {/* Stars */}
                                <div className="flex gap-1">
                                    {[...Array(item.rating)].map((_, rIdx) => (
                                        <Star key={rIdx} className="size-3.5 fill-brand-primary text-brand-primary" />
                                    ))}
                                </div>
                                <p className="text-xs md:text-sm text-text-muted leading-relaxed italic text-left">
                                    “{item.review}”
                                </p>
                            </div>

                            {/* Author Info */}
                            <div className="flex items-center gap-3 pt-3 border-t border-border-subtle text-left">
                                <img 
                                    className="size-9 rounded-full object-cover border border-border-subtle shadow-sm" 
                                    src={item.image} 
                                    alt={item.name} 
                                    onError={(e) => {
                                        // Fallback if live image is blocked or down
                                        e.target.src = `https://images.unsplash.com/photo-${1500000000000 + index}?w=100&auto=format&fit=crop&q=60`;
                                    }}
                                />
                                <div>
                                    <h6 className="font-bold text-text-main text-xs">{item.name}</h6>
                                    <p className="text-[10px] text-text-muted">{item.about}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}