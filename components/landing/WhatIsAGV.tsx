import React from "react";

export const WhatIsAGV: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1e40af] mb-6 sm:mb-8">
          What Is AGV?
        </h2>
        
        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-4xl mb-8 sm:mb-12">
          AGV (AgriVolt Protocol) is a real-asset-backed Web3 protocol that brings orchards, solar farms, and decentralized nodes onto the blockchain. Each asset unit generates real-world yield from fruit harvests to solar energy and edge computing. Users can adopt fruit trees, stake in solar, and earn tokenized rewards with transparent returns. Rooted in China's leading agricultural and solar regions, AGV makes sustainability investable, verifiable, and globally scalable.
        </p>
        
        {/* Aerial Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-2 h-64 sm:h-80 lg:h-96">
            {/* Solar Panels Side */}
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 relative overflow-hidden">
              {/* Ground base */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/80 to-amber-300/60"></div>
              
              {/* Solar Panel Pattern */}
              <div className="absolute inset-0 opacity-70">
                <div className="grid grid-cols-6 sm:grid-cols-8 grid-rows-4 sm:grid-rows-6 h-full gap-0.5 sm:gap-1 p-1 sm:p-2">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-sm shadow-sm border border-slate-700/50"></div>
                  ))}
                </div>
              </div>
              
              {/* Panel reflections */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-6 sm:grid-cols-8 grid-rows-4 sm:grid-rows-6 h-full gap-0.5 sm:gap-1 p-1 sm:p-2">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="bg-white/30 rounded-sm"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Agricultural Fields Side */}
            <div className="bg-gradient-to-bl from-green-400 to-green-600 relative overflow-hidden">
              {/* Base field color */}
              <div className="absolute inset-0 bg-gradient-to-bl from-green-500/90 to-green-700/80"></div>
              
              {/* Crop rows pattern */}
              <div className="absolute inset-0 opacity-80">
                <div className="grid grid-cols-4 sm:grid-cols-6 grid-rows-6 sm:grid-rows-8 h-full gap-0.5 sm:gap-1 p-1 sm:p-2">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="bg-green-600 rounded-sm shadow-sm"></div>
                  ))}
                </div>
              </div>
              
              {/* Field divisions (paths/roads) */}
              <div className="absolute inset-0">
                <div className="grid grid-cols-3 grid-rows-4 h-full gap-1 sm:gap-2 p-1 sm:p-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="border-2 border-green-700/40 rounded-sm bg-green-600/20"></div>
                  ))}
                </div>
              </div>
              
              {/* Additional crop texture */}
              <div className="absolute inset-0 opacity-60">
                <div className="grid grid-cols-8 grid-rows-12 h-full gap-0.5 p-1">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <div key={i} className="bg-green-500/30 rounded-sm"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle center divider */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300/50 transform -translate-x-1/2"></div>
        </div>
      </div>
    </section>
  );
};
