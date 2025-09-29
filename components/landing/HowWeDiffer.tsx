"use client";
import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { ThreeLayer } from "./ThreeLayer";
import { FileText } from "lucide-react";

export const HowWeDiffer: React.FC = () => {
    const { t } = useTranslations();
    
    const articles = [
        {
            title: t('howWeDiffer.realAssets.title'),
            description: t('howWeDiffer.realAssets.description'),
        },
        {
            title: t('howWeDiffer.tokenization.title'),
            description: t('howWeDiffer.tokenization.description'),
        },
        {
            title: t('howWeDiffer.yieldDistribution.title'),
            description: t('howWeDiffer.yieldDistribution.description'),
        },
        {
            title: t('howWeDiffer.scalableSustainability.title'),
            description: t('howWeDiffer.scalableSustainability.description'),
        }
    ];

    return (
        <ThreeLayer
            title={t('howWeDiffer.title')}
            articles={articles}
            icon={<FileText className="text-4xl text-gray-600" />}
        />
    );
};
