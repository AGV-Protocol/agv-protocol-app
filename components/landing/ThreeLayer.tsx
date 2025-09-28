"use client";

import React from "react";
import { useTranslations } from "../../app/[locale]/TranslationProvider";
import Image from "next/image"
import { FileText } from "lucide-react";

export const ThreeLayer: React.FC = () => {
    const t = useTranslations('landing.threeLayer');
    
    const articles = [
        {
            title: t('fruitBacked.title'),
            description: t('fruitBacked.description'),
        },
        {
            title: t('solarDriven.title'),
            description: t('solarDriven.description'),
        },
        {
            title: t('depinReady.title'),
            description: t('depinReady.description'),
        }
    ];
    return (
        <section className="bg-white py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
                {/* Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#223256] mb-6 sm:mb-8">
                    {t('title')}
                </h2>

                <div className="mb-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        {articles.map((article, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 rounded-lg bg-gray-100">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                    </div>
                                </div>
                                <h4 className="font-semibold text-[#223256] mb-2">{article.title}</h4>
                                <p className="text-[#223256] text-sm mb-4 tracking-widest">{article.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};
