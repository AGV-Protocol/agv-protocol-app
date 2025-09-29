import React from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MainContent } from "@/components/landing/MainContent";
import { WhatIsAGV } from "@/components/landing/WhatIsAGV";
import { WhyAGV } from "@/components/landing/WhyAGV";
import { Fixing } from "@/components/landing/Fixing";
import { ExploreAGV } from "@/components/landing/ExploreAGV";
import { BlockchainInfrastructure } from "@/components/landing/BlockchainInfrastructure";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/landing/Footer";
import { ThreeLayer } from "@/components/landing/ThreeLayer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content */}
      <MainContent />
      
      {/* What Is AGV */}
      <WhatIsAGV />
      
      {/* Why AGV */}
      <WhyAGV />
      
      {/* Fixing Section */}
      <Fixing />
      
      {/* Explore AGV */}
      <ExploreAGV />
      
      {/* Blockchain Infrastructure */}
      <BlockchainInfrastructure />
      
      {/* Three Layer */}
      <ThreeLayer />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
