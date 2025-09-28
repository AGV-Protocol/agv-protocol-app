"use client"

import { Button } from "@/components/ui/button"
import { ArrowUp, Wallet, Quote } from "lucide-react"
import { FastLink } from "../ui/fast-link"
import { useTranslations } from "../../app/[locale]/TranslationProvider";

export function TestimonialsSection() {
    const t = useTranslations('landing.testimonials');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <section className="bg-slate-50 py-20 px-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl text-center md:text-5xl font-bold text-[#223256] mb-6 text-balance">
                        {t('title')}
                    </h2>
                    <p className="text-lg text-[#223256] max-w-4xl mx-auto leading-relaxed">
                        {t('description')}
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {Array.isArray(t('quotes')) ? t('quotes').map((testimonial: any, index: number) => (
                        <div key={index} className="text-center bg-white p-8 rounded-lg shadow-lg">
                            {/* Placeholder circle for quote icon/image */}
                            <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto mb-6 flex items-center justify-center"><Quote className="w-8 h-8 text-[#223256]"/></div>

                            <blockquote className="text-[#223256] text-lg mb-4 leading-relaxed">&ldquo;{testimonial?.text || ''}&rdquo;</blockquote>

                            <cite className="text-[#223256] font-semibold not-italic">- {testimonial?.source || ''}</cite>
                        </div>
                    )) : (
                        <>
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                                <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto mb-6 flex items-center justify-center"><Quote className="w-8 h-8 text-[#223256]"/></div>
                                <blockquote className="text-[#223256] text-lg mb-4 leading-relaxed">&ldquo;Tokenization of real-world assets could unlock a $10T market by 2030.&rdquo;</blockquote>
                                <cite className="text-[#223256] font-semibold not-italic">- Boston Consulting Group</cite>
                            </div>
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                                <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto mb-6 flex items-center justify-center"><Quote className="w-8 h-8 text-[#223256]"/></div>
                                <blockquote className="text-[#223256] text-lg mb-4 leading-relaxed">&ldquo;ESG and energy-linked infrastructure are set to dominate institutional flows over the next decade.&rdquo;</blockquote>
                                <cite className="text-[#223256] font-semibold not-italic">- BlackRock 2024 Outlook</cite>
                            </div>
                            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                                <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto mb-6 flex items-center justify-center"><Quote className="w-8 h-8 text-[#223256]"/></div>
                                <blockquote className="text-[#223256] text-lg mb-4 leading-relaxed">&ldquo;Distributed green energy is the foundation of long-term economic resilience.&rdquo;</blockquote>
                                <cite className="text-[#223256] font-semibold not-italic">- World Bank</cite>
                            </div>
                        </>
                    )}
                </div>

                {/* Call to Action Section */}
                <div className="text-center">
                    <h3 className="text-4xl text-center md:text-5xl font-bold text-[#223256] mb-8 text-balance">
                        {t('cta.title')}
                    </h3>
                    <FastLink href="/mint">
                        <Button size="lg" className="border border-[#223256] hover:bg-[#223256]/80 hover:text-white text-[#223256] px-8 py-3 text-lg bg-white">
                            <Wallet className="w-5 h-5" /> {t('cta.button')}
                        </Button>
                    </FastLink>
                    
                </div>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 bg-[#223256] hover:bg-[#223256]/80 text-white p-3 rounded-lg shadow-lg transition-colors"
                aria-label={t('cta.backToTop')}
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </section>
    )
}
