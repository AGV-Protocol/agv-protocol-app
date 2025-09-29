"use client";
import React from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ValueCard } from "@/components/landing/ValueCard";
import { JobCard } from "@/components/landing/JobCard";
import { Button } from "@/components/ui/button";
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
  // Sample data for company values
  const companyValues = [
    {
      icon: Heart,
      title: "Passion for Innovation",
      description: "We're driven by a passion for creating cutting-edge Web3 solutions that make a real difference in the world."
    },
    {
      icon: Users,
      title: "Collaborative Culture",
      description: "We believe in the power of teamwork and foster an environment where everyone's voice is heard and valued."
    },
    {
      icon: Lightbulb,
      title: "Continuous Learning",
      description: "We encourage continuous growth and provide opportunities for our team to learn and develop new skills."
    }
  ];

  // Sample data for perks & benefits
  const perksAndBenefits = [
    {
      icon: Shield,
      title: "Health & Wellness",
      description: "Comprehensive health insurance, mental health support, and wellness programs to keep you at your best."
    },
    {
      icon: Zap,
      title: "Flexible Work",
      description: "Remote-first culture with flexible hours and the freedom to work from anywhere in the world."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Be part of a mission-driven company that's building sustainable solutions for the future of Web3."
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
              JOIN OUR TEAM TODAY
            </h1>
            <p className="text-lg sm:text-xl max-w-2xl">
              Help us build the future of sustainable, real-asset-backed Web3 solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Our Company Values Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              OUR COMPANY VALUES
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              These core values guide everything we do and shape our company culture.
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
              PERKS & BENEFITS
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              We offer competitive benefits and perks to support our team&apos;s success and well-being.
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
              OPEN ROLES
            </h2>
            <p className="text-lg text-[#223256] max-w-3xl">
              Join our team and help shape the future of Web3 technology.
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
                    <span>See More</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <TriangleAlert className="w-10 h-10 text-white mx-auto mb-4" />
                <p className="text-white text-xl font-medium">No openings right now</p>
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
