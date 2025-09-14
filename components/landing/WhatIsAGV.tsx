import React from "react";
import Image from "next/image"

export const WhatIsAGV: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#223256] mb-6 sm:mb-8">
          What Is AGV?
        </h2>
        
        {/* Description */}
        <p
          className="text-base text-[#223256] leading-relaxed max-w-4xl mb-8 sm:mb-12 text-center tracking-wide"
          style={{ wordSpacing: "0.05em" }}
        >
          AGV (AgriVolt Protocol) is a real-asset-backed Web3 protocol that brings orchards, solar farms, and decentralized nodes onto the blockchain. Each asset unit generates real-world yield from fruit harvests to solar energy and edge computing. Users can adopt fruit trees, stake in solar, and earn tokenized rewards with transparent returns. Rooted in Chinas leading agricultural and solar regions, AGV makes sustainability investable, verifiable, and globally scalable.
        </p>
        <div className="w-full h-full">
          <Image
            src="/herobg.png"
            alt="AGV Hero"
            width={1000}
            height={0}
            className="rounded-lg w-full h-[30pc]"
          />
        </div>
        
      </div>
    </section>
  );
};
