"use client";

import { useTranslations } from "../../app/[locale]/TranslationProvider";
import Image from "next/image"

export function BlockchainInfrastructure() {
    const t = useTranslations('landing.blockchainInfrastructure');
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold !text-[#223256] mb-6 sm:mb-8">
                    {t('title')}
                </h2>
            </div>

            {/* Real Assets Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('realAssets.title')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('realAssets.description')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        {Array.isArray(t('realAssets.features')) ? t('realAssets.features').map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                                <span className="text-[#223256] mr-2">•</span>
                                {feature}
                            </li>
                        )) : (
                            <>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    100 mu high-density apple orchards
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    6MW utility-grade solar farm
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Annual revenue: $180,000 - $280,000
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    IRR target: 18% - 26%
                                </li>
                            </>
                        )}
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('realAssets.conclusion')}
                    </p>
                </div>
                <div className="relative">
                    <Image
                        src="/infra3.png"
                        alt="Solar panel farm with green grass strips"
                        width={600}
                        height={1000}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
            </div>

            {/* On-Chain Data Infrastructure Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="relative order-2 lg:order-1">
                    <Image
                        src="/infra1.png"
                        alt="Solar panel infrastructure with monitoring systems"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('onChainData.title')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('onChainData.subtitle')}
                    </p>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('onChainData.description')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        {Array.isArray(t('onChainData.features')) ? t('onChainData.features').map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                                <span className="text-[#223256] mr-2">•</span>
                                {feature}
                            </li>
                        )) : (
                            <>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    IoT sensors for real-time yield and energy data
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Smart contracts and NFT mapping
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Dashboards synced with satellite feeds
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Token emission linked to verified output
                                </li>
                            </>
                        )}
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('onChainData.conclusion')}
                    </p>
                </div>
            </div>

            {/* Built to Scale Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('builtToScale.title')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('builtToScale.description')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        {Array.isArray(t('builtToScale.features')) ? t('builtToScale.features').map((feature: string, index: number) => (
                            <li key={index} className="flex items-start">
                                <span className="text-[#223256] mr-2">•</span>
                                {feature}
                            </li>
                        )) : (
                            <>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Expandable with battery storage & edge compute
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Modular design supports irrigation, AI nodes, or carbon tracking
                                </li>
                                <li className="flex items-start">
                                    <span className="text-[#223256] mr-2">•</span>
                                    Applicable across Asia, LATAM, Africa, and MENA
                                </li>
                            </>
                        )}
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('builtToScale.conclusion')}
                    </p>
                </div>
                <div className="relative">
                    <Image
                        src="/infra2.png"
                        alt="Scalable solar panel infrastructure"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
            </div>
        </section>
    )
}
