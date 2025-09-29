"use client";
import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { ThreeLayer } from "./ThreeLayer";
import { FileText } from "lucide-react";

export const WhatWeBuilding: React.FC = () => {
    const { t } = useTranslations();
    
    const articles = [
        {
            title: t('whatWeBuilding.assetBackedNFT.title'),
            description: t('whatWeBuilding.assetBackedNFT.description'),
        },
        {
            title: t('whatWeBuilding.powerToMint.title'),
            description: t('whatWeBuilding.powerToMint.description'),
        },
        {
            title: t('whatWeBuilding.dualTokenSystem.title'),
            description: t('whatWeBuilding.dualTokenSystem.description'),
        },
        {
            title: t('whatWeBuilding.daoCompliance.title'),
            description: t('whatWeBuilding.daoCompliance.description'),
        }
    ];

    return (
        <ThreeLayer
            title={t('whatWeBuilding.title')}
            articles={articles}
            icon={<FileText className="text-4xl text-gray-600" />}
        />
    );
};
