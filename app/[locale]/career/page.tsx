"use client";
import React from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ValueCard } from "@/components/landing/ValueCard";
import { JobCard } from "@/components/landing/JobCard";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import { 
  Heart, 
  Users, 
  Lightbulb, 
  Shield, 
  Zap, 
  Globe, 
  Code, 
  TrendingUp, 
  ArrowRight,
  Briefcase,
  Laptop,
  TriangleAlert
} from "lucide-react";
import Image from "next/image";

export default function CareerPage() {
  const { t } = useTranslations();

  // Sample data for company values
  const companyValues = [
    {
      icon: Heart,
      title: t('career.values.passion.title'),
      description: t('career.values.passion.description')
    },
    {
      icon: Users,
      title: t('career.values.collaboration.title'),
      description: t('career.values.collaboration.description')
    },
    {
      icon: Lightbulb,
      title: t('career.values.learning.title'),
      description: t('career.values.learning.description')
    }
  ];

  // Sample data for perks & benefits
  const perksAndBenefits = [
    {
      icon: Shield,
      title: t('career.perks.health.title'),
      description: t('career.perks.health.description')
    },
    {
      icon: Zap,
      title: t('career.perks.flexible.title'),
      description: t('career.perks.flexible.description')
    },
    {
      icon: Globe,
      title: t('career.perks.impact.title'),
      description: t('career.perks.impact.description')
    }
  ];

  // Sample data for open roles
  const openRoles = [
    // {
    //   icon: Code,
    //   title: "Senior Blockchain Developer",
    //   description: "Lead the development of our smart contracts and blockchain infrastructure. Experience with Solidity and Web3 required."
    // },
    // {
    //   icon: TrendingUp,
    //   title: "Product Manager",
    //   description: "Drive product strategy and roadmap for our NFT ecosystem. Strong analytical skills and Web3 experience preferred."
    // },
    // {
    //   icon: Briefcase,
    //   title: "Business Development",
    //   description: "Build partnerships and expand our ecosystem. Experience in Web3 business development and relationship building."
    // },
    // {
    //   icon: Laptop,
    //   title: "Frontend Developer",
    //   description: "Create beautiful and intuitive user interfaces for our platform. React, TypeScript, and Web3 integration experience."
    // }
  ];

  const handleReadMore = (role: string) => {
    // In a real application, this would navigate to a detailed job posting
    console.log(`Read more about ${role}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[500px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/career.png"
            alt="Career Hero Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto sm:px-4 h-full min-h-[500px] flex items-end pb-12">
          <div className="text-white space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              {t('career.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl max-w-2xl">
              {t('career.hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Our Company Values Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              {t('career.values.title')}
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              {t('career.values.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {companyValues.map((value, index) => (
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

      {/* Perks & Benefits Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              {t('career.perks.title')}
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              {t('career.perks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {perksAndBenefits.map((perk, index) => (
              <ValueCard
                key={index}
                icon={perk.icon}
                title={perk.title}
                description={perk.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              {t('career.roles.title')}
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              {t('career.roles.subtitle')}
            </p>
          </div>
          <div className="bg-[#3399FF] rounded-2xl p-8 mb-8">
            {openRoles.length > 0 ? (
              <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {openRoles.map((role, index) => (
                      <JobCard
                        key={index}
                        icon={role.icon}
                        title={role.title}
                        description={role.description}
                        onReadMore={() => handleReadMore(role.title)}
                      />
                    ))}
                  </div>

                {/* See More Button */}
                <div className="text-center">
                  <Button
                    size="lg"
                    className="mt-8 bg-white border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto"
                  >
                    <span>{t('career.roles.seeMore')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <TriangleAlert className="w-10 h-10 text-white mx-auto mb-4" />
                <p className="text-white text-xl font-medium">{t('career.roles.noOpenings')}</p>
              </div>
            )}
            </div>
         
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
