// "use client";

// import { useState } from "react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { 
//   ArrowRight, 
//   BookOpen, 
//   Coins, 
//   Shield, 
//   Zap, 
//   Users, 
//   Globe,
//   Twitter,
//   Github,
//   FileText,
//   ExternalLink,
//   CheckCircle,
//   Star,
//   TrendingUp,
//   Lock,
//   Settings,
//   MessageCircle,
//   Send
// } from "lucide-react";
// import Link from "next/link";
// import { Footer } from "@/components/layout/footer";
// import { Header } from "@/components/layout";
// import { HeroSection } from "@/components/sections/hero-section";
// import { AppNav } from "@/components/navigation/app-nav";

// export default function HomePage() {
//   const [activeFeature, setActiveFeature] = useState(0);

//   const features = [
//     {
//       title: "Multi-Chain Support",
//       description: "Deploy and manage NFTs across BSC, Polygon, and Arbitrum networks",
//       icon: <Globe className="h-8 w-8" />,
//       color: "bg-blue-500"
//     },
//     {
//       title: "Secure Minting",
//       description: "Advanced security measures and smart contract audits",
//       icon: <Shield className="h-8 w-8" />,
//       color: "bg-green-500"
//     },
//     {
//       title: "Instant Rewards",
//       description: "Earn rewards immediately after minting with our staking system",
//       icon: <Zap className="h-8 w-8" />,
//       color: "bg-yellow-500"
//     }
//   ];

//   const socialLinks = [
//     {
//       name: "GitHub",
//       icon: <Github className="h-5 w-5" />,
//       url: "https://github.com/AGV-Protocol/",
//       stars: "2.1K"
//     },
//     {
//       name: "Twitter",
//       icon: <Twitter className="h-5 w-5" />,
//       url: "https://x.com/agv_partners",
//       followers: "12.5K"
//     },
//     {
//       name: "Discord",
//       icon: <MessageCircle className="h-5 w-5" />,
//       url: "https://discord.gg/JP9RtzM2SC",
//       members: "8.2K"
//     },
//     {
//       name: "Telegram",
//       icon: <Send className="h-5 w-5" />,
//       url: "https://t.me/agvprotocol",
//       members: "5.8K"
//     }
//   ];

//   const articles = [
//     {
//       title: "Getting Started with AGV Protocol",
//       description: "Learn how to mint your first NFT and start earning rewards",
//       url: "#",
//       date: "2024-01-15"
//     },
//     {
//       title: "Understanding Multi-Chain Staking",
//       description: "A comprehensive guide to staking across different networks",
//       url: "#",
//       date: "2024-01-10"
//     },
//     {
//       title: "Security Best Practices",
//       description: "How to keep your NFTs and rewards safe",
//       url: "#",
//       date: "2024-01-05"
//     }
//   ];

//   return (
//     <>
//       {/* Header */}
//       {/* <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
//         <div className="mx-auto max-w-7xl px-4">
//           <div className="flex h-16 items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
//                   <span className="text-white font-bold text-sm">AGV</span>
//                 </div>
//                 <span className="text-xl font-bold text-gray-900">AGV Protocol</span>
//               </div>
//             </div>
//             <nav className="hidden md:flex items-center space-x-8">
//               <Link href="/mint" className="text-gray-600 hover:text-blue-600 transition-colors">
//                 Mint
//               </Link>
//               <Link href="/staking" className="text-gray-600 hover:text-blue-600 transition-colors">
//                 Staking
//               </Link>
//               <Link href="/token" className="text-gray-600 hover:text-blue-600 transition-colors">
//                 Token
//               </Link>
//             </nav>
//             <div className="flex items-center space-x-4">
//               <Button variant="outline" size="sm" className="hidden sm:inline-flex">
//                 Connect Wallet
//               </Button>
//               <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
//                 Get Started
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header> */}
//       <AppNav/>
//       <HeroSection />
//       <div className="min-h-screen bg-white">
//         <div className="mx-auto max-w-7xl px-4 py-8">
//         {/* Hero Section */}
//         {/* <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 border border-blue-200 p-12 mb-12 shadow-2xl">
//           <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-cyan-600/5"></div>
//           <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl"></div>
          
//           <div className="relative z-10 text-center space-y-8">
//             <div className="space-y-6">
//               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-4">
//                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-blue-700 font-medium">🚀 Now Live on Multiple Chains</span>
//               </div>
              
//               <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 bg-clip-text text-transparent leading-tight">
//                 AGV Protocol
//               </h1>
              
//               <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
//                 The complete NFT ecosystem for decentralized computing. 
//                 <span className="font-semibold text-blue-600">Mint, stake, and earn rewards</span> across multiple blockchain networks.
//               </p>
//             </div>
            
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
//               <Link href="/mint">
//                 <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
//                   <Coins className="mr-2 h-5 w-5" />
//                   Start Minting
//                 </Button>
//               </Link>
//               <Link href="/staking">
//                 <Button size="lg" variant="outline" className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold transition-all duration-300">
//                   <Zap className="mr-2 h-5 w-5" />
//                   View Staking
//                 </Button>
//               </Link>
//             </div>
            
//             <div className="flex flex-wrap justify-center gap-4 pt-6">
//               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
//                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-green-700 font-medium">Live Platform</span>
//               </div>
//               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
//                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-blue-700 font-medium">Multi-Chain</span>
//               </div>
//               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 border border-cyan-200">
//                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-cyan-700 font-medium">Secure</span>
//               </div>
//               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200">
//                 <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
//                 <span className="text-sm text-purple-700 font-medium">No Lock-up</span>
//               </div>
//             </div>
//           </div>
//         </div> */}

        

//         {/* Quick Stats */}
//         <div className="mb-8">
//           <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//             Platform Overview
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//             <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
//                   <Users className="h-6 w-6 text-white" />
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-gray-800">2,847</div>
//                   <div className="text-xs text-gray-500">Total Users</div>
//                 </div>
//               </div>
//               <div className="text-gray-600 font-medium">Community Size</div>
//             </div>
            
//             <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
//                   <Coins className="h-6 w-6 text-white" />
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-gray-800">1,234</div>
//                   <div className="text-xs text-gray-500">NFTs Minted</div>
//                 </div>
//               </div>
//               <div className="text-gray-600 font-medium">Total Supply</div>
//             </div>
            
//             <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
//                   <Zap className="h-6 w-6 text-white" />
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-gray-800">50 rGGP</div>
//                   <div className="text-xs text-gray-500">Daily Rewards</div>
//                 </div>
//               </div>
//               <div className="text-gray-600 font-medium">Reward Rate</div>
//             </div>
            
//             <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
//                   <Shield className="h-6 w-6 text-white" />
//                 </div>
//                 <div className="text-right">
//                   <div className="text-2xl font-bold text-gray-800">98%</div>
//                   <div className="text-xs text-gray-500">Security Score</div>
//                 </div>
//               </div>
//               <div className="text-gray-600 font-medium">Audit Rating</div>
//             </div>
//           </div>
//         </div>

//         {/* Main Features */}
//         <div className="mb-8">
//           <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//             Core Features
//           </h3>
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//             {features.map((feature, index) => (
//               <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className={`p-3 rounded-xl ${feature.color} shadow-lg`}>
//                     {feature.icon}
//                   </div>
//                   <h4 className="text-lg font-semibold text-gray-800">{feature.title}</h4>
//                 </div>
//                 <p className="text-gray-600 text-sm">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Platform Actions */}
//         <div className="mb-8">
//           <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//             <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
//             Get Started
//           </h3>
//           <div className="grid gap-6 md:grid-cols-3">
//             <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
//                   <Coins className="h-6 w-6 text-white" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-800">Mint NFTs</h4>
//               </div>
//               <p className="text-gray-600 text-sm mb-4">Mint AGV Protocol NFTs across multiple chains</p>
//               <Link href="/mint">
//                 <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
//                   Start Minting
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//             </div>

//             <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
//                   <Zap className="h-6 w-6 text-white" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-800">Stake & Earn</h4>
//               </div>
//               <p className="text-gray-600 text-sm mb-4">Stake your NFTs to earn daily rewards</p>
//               <Link href="/staking">
//                 <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
//                   Start Staking
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//             </div>

//             <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
//                   <BookOpen className="h-6 w-6 text-white" />
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-800">Learn More</h4>
//               </div>
//               <p className="text-gray-600 text-sm mb-4">Explore token information and documentation</p>
//               <Link href="/token">
//                 <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
//                   View Details
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//             </div>
//           </div>
//         </div>

//         {/* Social Links */}
//         <div className="mb-8">
//           <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//             <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
//             Community
//           </h3>
//           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//             {socialLinks.map((social, index) => (
//               <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//                 <div className="flex items-center space-x-3 mb-3">
//                   <div className="p-2 rounded-lg bg-gray-100">
//                     {social.icon}
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-gray-800">{social.name}</h4>
//                     <p className="text-gray-500 text-sm">
//                       {social.followers && `${social.followers} followers`}
//                       {social.members && `${social.members} members`}
//                       {social.stars && `${social.stars} stars`}
//                     </p>
//                   </div>
//                 </div>
//                 <Button 
//                   variant="outline" 
//                   className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
//                   onClick={() => window.open(social.url, '_blank')}
//                 >
//                   Follow
//                   <ExternalLink className="ml-2 h-4 w-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Latest Articles */}
//         <div className="mb-8">
//           <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
//             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//             Latest Updates
//           </h3>
//           <div className="grid gap-6 md:grid-cols-3">
//             {articles.map((article, index) => (
//               <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
//                 <div className="flex items-center space-x-3 mb-3">
//                   <div className="p-2 rounded-lg bg-gray-100">
//                     <FileText className="h-5 w-5 text-gray-600" />
//                   </div>
//                   <div className="text-gray-500 text-sm">{article.date}</div>
//                 </div>
//                 <h4 className="font-semibold text-gray-800 mb-2">{article.title}</h4>
//                 <p className="text-gray-600 text-sm mb-4">{article.description}</p>
//                 <Button 
//                   variant="outline" 
//                   className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
//                   onClick={() => window.open(article.url, '_blank')}
//                 >
//                   Read More
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//     <Footer/>
//     </>
//   );
// }

import React from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MainContent } from "@/components/landing/MainContent";
import { WhatIsAGV } from "@/components/landing/WhatIsAGV";
import { Footer } from "@/components/landing/Footer";
import { ThreeLayer } from "@/components/landing/ThreeLayer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <MainContent />

      {/* What Is AGV */}
      <WhatIsAGV />

      {/* Three Layer */}
      <ThreeLayer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
