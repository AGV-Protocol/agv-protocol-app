"use client";
import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import Image from "next/image";


export const ExecutionProofs: React.FC = () => {
    const { t } = useTranslations();

    const articles = [
        {
            title: t('executionProofs.solarPlantOnline.title'),
            description: t('executionProofs.solarPlantOnline.description'),
            image: "solarPlant.png",
        },
        {
            title: t('executionProofs.ppaInProgress.title'),
            description: t('executionProofs.ppaInProgress.description'),
            image: "ppaInProgress.png",
        },
        {
            title: t('executionProofs.computeNodeRunning.title'),
            description: t('executionProofs.computeNodeRunning.description'),
            image: "computeNode.png",
        }
    ];
    return (
        <section className="py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#223256] mb-8 sm:mb-12 text-center">
                    {t('executionProofs.title')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                    {articles.map((article, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 group hover:shadow-lg transition-all duration-300 text-center">
                            <div className="mb-4 sm:mb-6">
                                <Image 
                                    src={`/executionProof/${article.image}`} 
                                    alt={article.title} 
                                    width={300} 
                                    height={200}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            </div>
                            <h4 className="font-semibold text-[#223256] mb-2 sm:mb-3 text-sm sm:text-base">{article.title}</h4>
                            <p className="text-[#223256] text-xs sm:text-sm mb-4 tracking-wide leading-relaxed">{article.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
