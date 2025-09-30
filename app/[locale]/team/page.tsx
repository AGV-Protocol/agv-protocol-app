"use client";
import React from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ValueCard } from "@/components/landing/ValueCard";
import { useTranslations } from "@/hooks/useTranslations";
import Image from "next/image";

export default function CareerPage() {
  const { t } = useTranslations();

  // Sample data for teams
  const teams = [
    {
      icon: "/icons/teams/gd.svg",
      title: t('team.members.susan.name') || "Susan",
      description: t('team.members.susan.role') || "General Director"
    },
    
    {
      icon: "/icons/teams/cto.svg",
      title: t('team.members.tyler.name') || "Tyler",
      description: t('team.members.tyler.role') || "Chief Technology Officer"
    },
    
    {
      icon: "/icons/teams/techLead.svg",
      title: t('team.members.yasir.name') || "Yasir",
      description: t('team.members.yasir.role') || "Tech Lead"
    },
    
    {
      icon: "/icons/teams/dao.svg",
      title: t('team.members.winnie.name') || "Winnie",
      description: t('team.members.winnie.role') || "Capital/DAO Lead"
    },
    
    {
      icon: "/icons/teams/bdl.svg",
      title: t('team.members.yatogami.name') || "Yatogami",
      description: t('team.members.yatogami.role') || "Business Development Lead"
    },
    
    {
      icon: "/icons/teams/marketing.svg",
      title: t('team.members.frank.name') || "Frank",
      description: t('team.members.frank.role') || "Marketing & PR"
    },
    
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left semicircle */}
        <div className="absolute top-[70pc] left-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full -translate-x-[600px] -translate-y-[600px]"></div>
        {/* Right semicircle */}
        <div className="absolute top-[100pc] right-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full translate-x-[500px] -translate-y-[500px]"></div>
      </div>
      
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/team/hero.png"
            alt="Team Hero Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>        
      </section>
      {/* Our Teams Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 text-[#223256]">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center uppercase">
              {t('team.section.title') || 'MEET THE TEAM'}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl px-4 sm:px-8 md:px-16 lg:px-24 xl:px-48 text-center leading-relaxed">
              {t('team.section.description') || 'AGV is powered by a globally distributed team of execution-driven builders, engineers and operators with expertise across RWA, renewable energy, compute, tokenization and DePIN networks'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12 lg:gap-16 xl:gap-24">
            {teams.map((value, index) => (
              <ValueCard
                key={index}
                icon={value.icon}
                title={value.title}
                description={value.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
