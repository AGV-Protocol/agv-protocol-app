import Image from "next/image"

export function BlockchainInfrastructure() {
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold !text-[#223256] mb-6 sm:mb-8">
                    Revolutionizing Infrastructure with Blockchain
                </h2>
            </div>

            {/* Real Assets Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">REAL ASSETS. REAL REVENUE.</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      Each AGV unit includes:
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            100 mu high-density apple orchards
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            6MW utility-grade solar farm
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Annual revenue: $180,000 - $280,000
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            IRR target: 18% - 26%
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        Assets are land-based, yield-producing, and inflation-resistant — not synthetic tokens or speculative DeFi
                        experiments.
                    </p>
                </div>
                <div className="relative">
                    <Image
                        src="/infra3.png"
                        alt="Solar panel farm with green grass strips"
                        width={600}
                        height={1000}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
            </div>

            {/* On-Chain Data Infrastructure Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="relative order-2 lg:order-1">
                    <Image
                        src="/infra1.png"
                        alt="Solar panel infrastructure with monitoring systems"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">ON-CHAIN DATA INFRASTRUCTURE</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      On-Chain Data Infrastructure
                    </p>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      Every unit is equipped with:
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            IoT sensors for real-time yield and energy data
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Smart contracts and NFT mapping
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Dashboards synced with satellite feeds
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Token emission linked to verified output
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        Users can monitor growth, power generation, and token accrual — all transparently recorded and accessible
                        on-chain.
                    </p>
                </div>
            </div>

            {/* Built to Scale Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-2xl !text-[#223256] font-bold text-foreground mb-6">BUILT TO SCALE, GLOBALLY</h2>
                    <p 
                      className="text-base text-[#223256] leading-relaxed mb-4 tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                      Each AGV unit is standardized and tokenized via SPV:
                    </p>
                    <ul className="space-y-3 text-muted-foreground">
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Expandable with battery storage & edge compute
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Modular design supports irrigation, AI nodes, or carbon tracking
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#223256] mr-2">•</span>
                            Applicable across Asia, LATAM, Africa, and MENA
                        </li>
                    </ul>
                    <p 
                      className="text-base text-[#223256] leading-relaxed tracking-wide"
                      style={{ wordSpacing: "0.05em" }}
                    >
                        CEX-ready, DeFi-compatible, and ESG-aligned — AGV is built for global integration.
                    </p>
                </div>
                <div className="relative">
                    <Image
                        src="/infra2.png"
                        alt="Scalable solar panel infrastructure"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </div>
            </div>
        </section>
    )
}
