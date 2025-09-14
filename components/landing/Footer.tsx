import React from "react";
import { Check, Zap, Link2, MessageCircle, Twitter, Users, Send } from "lucide-react";
import { FastLink } from "../ui/fast-link";
import Image from "next/image"

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#66CCFF] text-white overflow-hidden">
      {/* Circular Overlay */}
      <div className="absolute bottom-0 left-0 w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] bg-[#99DDFF] rounded-full opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Left Section - Company Information */}
          <div className="space-y-4 sm:space-y-6">
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
            
            {/* Tagline */}
            <p className="text-white/90 text-base sm:text-lg font-medium">NFT Minting Platform</p>
            
            {/* Description */}
            <p className="text-white/90 leading-relaxed max-w-lg text-sm sm:text-base">
              The future of decentralized computing through innovative NFT technology. Join thousands of users minting exclusive AGV NFTs across multiple blockchain networks.
            </p>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center space-x-2">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-white text-xs sm:text-sm font-medium">Secure & Trusted</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-white text-xs sm:text-sm font-medium">Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <Link2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-white text-xs sm:text-sm font-medium">Multi-Chain</span>
              </div>
            </div>
            
            {/* Legal/Operational Details */}
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/80">
              <p>Headquartered in Asia. Operated globally. Audited by top firms.</p>
              <p>
                All real-world assets are held by authorized Chinese SPVs and mapped via legal authorization to JLL Asset Ltd. (BVI Company No. 2182436). NFT issuance and operations are executed by iJET Limited (NZBN: 9429049576290). Governance transition to the BVI-based AGV DAO is in progress.
              </p>
            </div>
          </div>
          
          {/* Right Section - Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Product Column */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-white font-bold text-base sm:text-lg">Product</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">NFT Minting</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Dashboard</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">KOL Program</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Analytics</a></li>
              </ul>
            </div>
            
            {/* Company Column */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-white font-bold text-base sm:text-lg">Company</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">About Us</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Careers</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Press</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Blog</a></li>
              </ul>
            </div>
            
            {/* Support Column */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-white font-bold text-base sm:text-lg">Support</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Help Center</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Documentation</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">API Reference</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Contact Support</a></li>
              </ul>
            </div>
            
            {/* Legal Column */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-white font-bold text-base sm:text-lg">Legal</h3>
              <ul className="space-y-1 sm:space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">Cookie Policy</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm">GDPR</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Section - Social Media & Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-6 border-t border-white/20">
          {/* Social Media Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center hover:bg-white/90 transition-colors">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#66CCFF]" />
            </a>
            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center hover:bg-white/90 transition-colors">
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-[#66CCFF]" />
            </a>
            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center hover:bg-white/90 transition-colors">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#66CCFF]" />
            </a>
            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center hover:bg-white/90 transition-colors">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-[#66CCFF]" />
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-white/80 text-xs sm:text-sm">© 2025 AgriVolt Protocol. All rights</p>
        </div>
      </div>
    </footer>
  );
};
