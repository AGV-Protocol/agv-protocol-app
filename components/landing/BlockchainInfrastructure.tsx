"use client";
import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import Image from "next/image"

export function BlockchainInfrastructure() {
  const { t } = useTranslations();
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold !text-[#223256] mb-6 sm:mb-8">
                    {t('blockchain.title')}
                </h2>
            </div>

            {/* Real Assets Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('blockchain.realAssets')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('blockchain.eachUnit')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item1')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item2')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item3')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item4')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item5')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.item6')}
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('blockchain.assetsDescription')}
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
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('blockchain.onChainData')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('blockchain.onChainDataDesc')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.onChainItem1')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.onChainItem2')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.onChainItem3')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.onChainItem4')}
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('blockchain.onChainDataDesc2')}
                    </p>
                </div>
            </div>

            {/* Built to Scale Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">{t('blockchain.builtToScale')}</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      {t('blockchain.builtToScaleDesc')}
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.builtItem1')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.builtItem2')}
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            {t('blockchain.builtItem3')}
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        {t('blockchain.builtToScaleDesc2')}
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
