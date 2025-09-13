import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header: React.FC = () => {
  return (
    <header className="bg-[#3399FF] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-3 h-3 sm:w-5 sm:h-5 text-[#3399FF]" />
          </div>
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

        {/* Connect Button */}
        <Button 
          className="bg-white text-[#3399FF] hover:bg-white/90 font-medium px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm"
        >
          Connect
        </Button>
      </div>
    </header>
  );
};
