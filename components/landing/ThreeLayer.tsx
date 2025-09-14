import React from "react";
import Image from "next/image"
import { FileText } from "lucide-react";

export const ThreeLayer: React.FC = () => {
    const articles = [
        {
            title: "Fruit-Backed NFTs",
            description: "AGV transforms apple orchards into tokenized assets.Each NFT maps to a real tree, producing fruit, revenue, and verifiable yield on- chain.",
            
        },
        {
            title: "Solar-Driven Rewards",
            description: "Each unit includes 6MW of solar capacity powering not only the farm,but also edge nodes and energy- backed token minting — “sunlight as income.”",
        },
        {
            title: "DePIN-Ready Infrastructure",
            description: "AGV unites sensors, smart contracts, and real-time data to power edge nodes, record carbon, and deliver Web3 services worldwide."
        }
    ];
    return (
        <section className="bg-white py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
                {/* Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#223256] mb-6 sm:mb-8">
                    Three Layers of Real-World Yield
                </h2>

                <div className="mb-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        {articles.map((article, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 rounded-lg bg-gray-100">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                    </div>
                                </div>
                                <h4 className="font-semibold text-[#223256] mb-2">{article.title}</h4>
                                <p className="text-[#223256] text-sm mb-4 tracking-widest">{article.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};
