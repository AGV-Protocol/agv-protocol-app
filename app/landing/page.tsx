import React from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MainContent } from "@/components/landing/MainContent";
import { WhatIsAGV } from "@/components/landing/WhatIsAGV";
import { BlueprintSection } from "@/components/landing/BlueprintSection";
import { Footer } from "@/components/landing/Footer";

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
      
      {/* Blueprint Section */}
      <BlueprintSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
