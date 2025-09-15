import React from "react";
import Image from "next/image"

export const WhyAGV: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
        {/* Title */}
        <h2 className="text-3xl text-center sm:text-4xl lg:text-5xl font-bold text-[#223256] mb-6 sm:mb-8">
          Why AGV Is a Blueprint for Real <br /> Yield Infrastructure?
        </h2>
        
        {/* Description */}
        <p
          className="text-base text-[#223256] leading-relaxed max-w-4xl mb-8 sm:mb-12 text-center tracking-wide"
          style={{ wordSpacing: "0.05em" }}
        >
          AGV is not a one-off project. It&apos;s a replicable protocol turning real land into digital yield infrastructure.
          <br />
          Every AGV unit is expected to generate $180k–$280k in annual revenue, with an IRR between 18% and 26%, based on actual orchard yields and regional solar performance data.
          <br />
          We combine China&apos;s world-leading agricultural and solar assets with modular SPV tokenization and on-chain data architecture, making every physical unit digitally verifiable, yield-bearing, and DeFi-compatible.
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
