// app/page.tsx (Server Component)
import { Suspense, lazy } from "react";
import Image from "next/image";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { AppNav } from "@/components/navigation/app-nav";
import { Footer } from "@/components/layout/footer";

// Lazy load the heavy minting component
const MintingContent = lazy(() => import("./MintingContent"));

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Minting Interface */}
      <section id="minting" className="py-24 lg:py-32 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Image
                      src="/logo.svg"
                      alt="AGV Protocol"
                      width={48}
                      height={48}
                      className="h-12 w-12"
                    />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      AGV Protocol
                    </h1>
                  </div>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mint exclusive NFTs and join the future of decentralized computing. Connect your wallet and begin minting AGV NFTs across multiple blockchain networks.

                  </p>
                </div>
          
          <div className="max-w-4xl mx-auto">
            <Suspense
              fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading minting interface...</p>
                  </div>
                </div>
              }
            >
              <MintingContent />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
