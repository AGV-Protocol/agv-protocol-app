import React from "react";
import Image from "next/image"

export const Fixing: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
        {/* Title */}
        <h2 className="text-3xl text-center sm:text-4xl lg:text-5xl font-bold text-[#223256] mb-6 sm:mb-8">
          Fixing What&apos;s Broken in Real-World <br /> Tokenization
        </h2>
        
        {/* Description */}
        <p
          className="text-base text-[#223256] leading-relaxed max-w-4xl mb-4 sm:mb-8 text-center tracking-wide"
          style={{ wordSpacing: "0.05em" }}
        >
          AGV bridges the digital and physical worlds by turning orchards and solar farms into NFTs and tokens. Each asset is linked to smart contracts that automate income sharing, ownership, and governance — solving issues like fragmented data, unverifiable yields, and opaque land rights.

        </p>
        <p
          className="text-base text-[#223256] leading-relaxed max-w-4xl mb-4 sm:mb-8 text-center tracking-wide"
          style={{ wordSpacing: "0.05em" }}
        >
          At its core, AGV uses a standardized asset unit: 100 mu of high-yield apple orchards paired with 6MW of solar. This model delivers $180k–$280k annual income per unit with 18%–26% IRR, backed by IoT-based performance data and predictive models.


        </p>
        <p
          className="text-base text-[#223256] leading-relaxed max-w-4xl mb-4 sm:mb-8 text-center tracking-wide"
          style={{ wordSpacing: "0.05em" }}
        >
          Unlike traditional agri-projects that are hard to replicate, AGV units are SPV-packaged, DeFi-compatible, and globally modular — enabling fast deployment and repeatable scaling across borders.

        </p>
        <div className="w-full h-full">
          <Image
            src="/whyAgv.png"
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
