'use client'
import React from "react";
import { 
  Database, 
  Zap, 
  Shield, 
  ArrowRight,
  Github,
  Twitter,
  MessageCircle,
  Send,
  FileText,
  Coins,
  BookOpen,
  ExternalLink,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const MainContent: React.FC = () => {

  const features = [
    {
      title: "Multi-Chain Support",
      description: "Deploy and manage NFTs across BSC, Polygon, and Arbitrum networks",
      icon: <Globe className="h-8 w-8 text-white" />,
      color: "bg-blue-500"
    },
    {
      title: "Secure Minting",
      description: "Advanced security measures and smart contract audits",
      icon: <Shield className="h-8 w-8 text-white" />,
      color: "bg-green-500"
    },
    {
      title: "Instant Rewards",
      description: "Earn rewards immediately after minting with our staking system",
      icon: <Zap className="h-8 w-8 text-white" />,
      color: "bg-yellow-500"
    }
  ];

  const socialLinks = [
    {
      name: "GitHub",
      icon: <Github className="h-5 w-5" />,
      url: "https://github.com/AGV-Protocol/",
      stars: "2.1K"
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      url: "https://x.com/agv_partners",
      followers: "12.5K"
    },
    {
      name: "Discord",
      icon: <MessageCircle className="h-5 w-5" />,
      url: "https://discord.gg/JP9RtzM2SC",
      members: "8.2K"
    },
    {
      name: "Telegram",
      icon: <Send className="h-5 w-5" />,
      url: "https://t.me/agvprotocol",
      members: "5.8K"
    }
  ];

  const articles = [
    {
      title: "Introducing AGV Protocol",
      description: "Introducing AGV Protocol: Unlocking the Future of Real-World Assets",
      url: "https://docs.google.com/document/d/1WdsXlrIuJws5uCaO0q3dFp2sB32yWntfqcWXds6wKeI/edit?usp=drivesdk",
      date: ""
    },
    // {
    //   title: "Understanding Multi-Chain Staking",
    //   description: "A comprehensive guide to staking across different networks",
    //   url: "#",
    //   date: "2024-01-10"
    // },
    // {
    //   title: "Security Best Practices",
    //   description: "How to keep your NFTs and rewards safe",
    //   url: "#",
    //   date: "2024-01-05"
    // }
  ];
  return (
    <section className="relative">
      {/* Gradient section from hero end to Platform Overview title */}
      <div className="bg-gradient-to-b from-[#66CCFF] to-white pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Platform Overview Title */}
            <div className="flex items-center mb-8 sm:mb-12 px-4 sm:px-8 lg:px-24">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">PLATFORM OVERVIEW</h3>
            </div>
        </div>
      </div>

       {/* White background section for the rest of the content */}
       <div className="bg-white pb-16 px-4 sm:px-8 lg:px-48 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Platform Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">1,234</div>
                  <div className="text-xs text-gray-500">NFTs Minted</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">Total Supply</div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">50 rGGP</div>
                  <div className="text-xs text-gray-500">Daily Rewards</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">Reward Rate</div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">98%</div>
                  <div className="text-xs text-gray-500">Security Score</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">Audit Rating</div>
            </div>
          </div>

          {/* Main Features */}
          <div className="mb-8">
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">Core Features</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-xl ${feature.color} shadow-lg`}>
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">{feature.title}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Actions */}
          <div className="mb-8">
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">Get Started</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">Mint NFTs</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Mint AGV Protocol NFTs across multiple chains</p>
                <Link href="/mint">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                    Start Minting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">Stake & Earn</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Stake your NFTs to earn daily rewards</p>
                <Link href="/staking">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                    Start Staking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">Learn More</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Explore token information and documentation</p>
                <Link href="/token">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mb-8">
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">Community</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {socialLinks.map((social, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {social.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{social.name}</h4>
                      <p className="text-gray-500 text-sm">
                        {social.followers && `${social.followers} followers`}
                        {social.members && `${social.members} members`}
                        {social.stars && `${social.stars} stars`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => window.open(social.url, '_blank')}
                  >
                    Follow
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Articles */}
          <div className="mb-8">
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">Latest Updates</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {articles.map((article, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="text-gray-500 text-sm">{article.date}</div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{article.title}</h4>
                  <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
