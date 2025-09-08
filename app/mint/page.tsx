"use client";

import { Suspense } from "react";
import ModernMintingInterface from "@/components/minting/modern-minting-interface";

function MintingInterfaceWrapper() {
  return <ModernMintingInterface />;
}

export default function MintPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-blue-800/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
          <div className="relative z-10 text-center space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                AGV Protocol Minting
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-2">
                Mint exclusive AGV Protocol NFTs across multiple blockchain networks. 
                Choose from SeedPass, TreePass, SolarPass, and ComputePass collections.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">Live Minting</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-300 font-medium">Multi-Chain</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-cyan-300 font-medium">USDT Payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minting Interface */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
          <Suspense fallback={<div className="text-white text-center py-6 sm:py-8 text-sm sm:text-base">Loading minting interface...</div>}>
            <MintingInterfaceWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
