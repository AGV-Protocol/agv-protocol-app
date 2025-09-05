// app/page.tsx (Server Component)
import { Suspense, lazy } from "react";
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
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Start Minting NFTs
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect your wallet and begin minting AGV NFTs across multiple blockchain networks.
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
