import React from "react";
import { Clock, ArrowLeft, Zap, Globe, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FastLink } from "@/components/ui/fast-link";
import Image from "next/image";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3399FF] via-[#66CCFF] to-[#99DDFF] flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <FastLink href="/" className="inline-flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="AGV Protocol"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-xl">AGRIVOLT PROTOCOL</span>
          </FastLink>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 mb-8 border border-white/20">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
            We&apos;re working hard to bring you something amazing. 
            <br />
            Stay tuned for updates!
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <Zap className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm font-medium">Lightning Fast</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <Globe className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm font-medium">Multi-Chain</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <Users className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm font-medium">Community</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <Shield className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white/80 text-sm font-medium">Secure</p>
            </div>
          </div>

          {/* Back Button */}
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-white text-[#3399FF] hover:bg-white/90 px-8 py-3 text-lg font-semibold flex items-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Footer Text */}
        <p className="text-white/70 text-sm">
          Follow us for updates on our journey to revolutionize real-world asset tokenization
        </p>
      </div>
    </div>
  );
}
