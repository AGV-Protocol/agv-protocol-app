import React from "react";
import { Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#3399FF] min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3399FF] via-[#3399FF]/80 to-transparent">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      
      {/* Solar Panels and Crops Background */}
      <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64">
        <div className="grid grid-cols-2 h-full">
          {/* Solar Panels Side */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
            {/* Solar Panel Pattern */}
            <div className="absolute inset-0 opacity-60">
              <div className="grid grid-cols-6 sm:grid-cols-8 grid-rows-4 sm:grid-rows-6 h-full gap-0.5 sm:gap-1 p-1 sm:p-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="bg-gray-700 rounded-sm"></div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30"></div>
          </div>
          
          {/* Crops Side */}
          <div className="bg-gradient-to-bl from-green-600 to-green-800 relative overflow-hidden">
            {/* Crop Pattern */}
            <div className="absolute inset-0 opacity-70">
              <div className="grid grid-cols-4 sm:grid-cols-6 grid-rows-6 sm:grid-rows-8 h-full gap-0.5 sm:gap-1 p-1 sm:p-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="bg-green-500 rounded-sm"></div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/30"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-6 sm:space-y-8">
            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                AGV PROTOCOL
                <br />
                NFT ECOSYSTEM
              </h1>
              
              {/* Description */}
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl">
                Unlock exclusive SeedPass, TreePass, SolarPass, and ComputePass NFTs, your gateway to sustainable rewards. 
                Stake instantly with no lock-up period and start earning daily rewards across BSC, Polygon, and Arbitrum networks.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                size="lg"
                className="bg-black text-white hover:bg-black/90 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3"
              >
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Start Minting</span>
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="bg-white text-[#3399FF] hover:bg-white/90 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3"
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>View Staking</span>
              </Button>
            </div>
          </div>

          {/* Right Content - Statistics */}
          <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="text-white text-center lg:text-right space-y-6 sm:space-y-8">
              {/* Statistics */}
              <div className="grid grid-cols-3 lg:block lg:space-y-6 gap-4 sm:gap-6">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold">3</div>
                  <div className="text-sm sm:text-base lg:text-lg font-medium">Blockchains</div>
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold">4</div>
                  <div className="text-sm sm:text-base lg:text-lg font-medium">NFT Collections</div>
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold">50</div>
                  <div className="text-sm sm:text-base lg:text-lg font-medium">rGGP Daily Rewards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
