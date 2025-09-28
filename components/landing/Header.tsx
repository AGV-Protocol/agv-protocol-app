"use client";

import React from "react";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { FastLink } from "../ui/fast-link";
import { LanguageSwitcher } from "../ui/language-switcher";
import { useTranslations } from "../../app/[locale]/TranslationProvider";
import Image from "next/image"

export const Header: React.FC = () => {
  const t = useTranslations('header');
  return (
    <header className="sticky top-0 z-50 bg-[#3399FF] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FastLink href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="AGV Protocol"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </FastLink>
          <span className="text-white font-semibold text-sm sm:text-lg">AGRIVOLT PROTOCOL</span>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          <a href="/" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">{t('nav.home')}</a>
          <a href="/coming-soon" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">{t('nav.about')}</a>
          <a href="/coming-soon" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">{t('nav.products')}</a>
          <a href="/coming-soon" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">{t('nav.research')}</a>
          <a href="/coming-soon" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">{t('nav.investorRelations')}</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <LanguageSwitcher />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};
