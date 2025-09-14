"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, Wallet } from "lucide-react"

export function TestimonialsSection() {
    const testimonials = [
        {
            quote: "Tokenization of real-world assets could unlock a $10T market by 2030.",
            source: "Boston Consulting Group",
        },
        {
            quote: "ESG and energy-linked infrastructure are set to dominate institutional flows over the next decade.",
            source: "BlackRock 2024 Outlook",
        },
        {
            quote: "Distributed green energy is the foundation of long-term economic resilience.",
            source: "World Bank",
        },
    ]

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <section className="bg-slate-50 py-20 px-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl text-center md:text-5xl font-bold text-[#223256] mb-6 text-balance">
                        The Future of Infrastructure Is Real,
                        <br />
                        Green, and On-Chain
                    </h2>
                    <p className="text-lg text-[#223256] max-w-4xl mx-auto leading-relaxed">
                        Top institutions agree: real-world assets, sustainable energy, and blockchain integration are shaping the
                        next trillion-dollar opportunity. AGV is positioned at the intersection of these macro trends.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="text-center bg-white p-8 rounded-lg shadow-lg">
                            {/* Placeholder circle for quote icon/image */}
                            <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto mb-6"></div>

                            <blockquote className="text-[#223256] text-lg mb-4 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</blockquote>

                            <cite className="text-[#223256] font-semibold not-italic">- {testimonial.source}</cite>
                        </div>
                    ))}
                </div>

                {/* Call to Action Section */}
                <div className="text-center">
                    <h3 className="text-4xl text-center md:text-5xl font-bold text-[#223256] mb-8 text-balance">
                        The Future Is Powered by Land,
                        <br />
                        Sun, and Code
                    </h3>

                    <Button size="lg" className="border border-[#223256] hover:bg-[#223256]/80 text-[#223256] px-8 py-3 text-lg bg-white">
                        <Wallet className="w-5 h-5" /> Invest Now
                    </Button>
                </div>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 bg-[#223256] hover:bg-[#223256]/80 text-white p-3 rounded-lg shadow-lg transition-colors"
                aria-label="Back to top"
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </section>
    )
}
