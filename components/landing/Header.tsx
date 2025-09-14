import React from "react";
import { FastLink } from "../ui/fast-link";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import Image from "next/image"

export const Header: React.FC = () => {
  return (
    <header className="bg-[#3399FF] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <FastLink href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="AGV Protocol"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </FastLink>
          <span className="text-white font-semibold text-sm sm:text-lg">AGRIVOLT PROTOCOL</span>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          <a href="#" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">Home</a>
          <a href="#" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">About</a>
          <a href="#" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">Products</a>
          <a href="#" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">Research</a>
          <a href="#" className="text-white hover:text-white/80 transition-colors text-sm xl:text-base">Investors Relations</a>
        </nav>

        {/* Wallet Connect */}
        <WalletConnect />
      </div>
    </header>
  );
};
