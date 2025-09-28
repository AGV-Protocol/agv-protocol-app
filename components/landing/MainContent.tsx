'use client'
import React from "react";
import { 
  Database, 
  Zap, 
  Shield, 
  ArrowRight,
  Github,
  X,
  MessageCircle,
  Send,
  FileText,
  Coins,
  BookOpen,
  ExternalLink,
  Globe,
  Twitter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "../../app/[locale]/TranslationProvider";
import Link from "next/link";

export const MainContent: React.FC = () => {
  const t = useTranslations('landing');
  const tPlatform = useTranslations('landing.platformOverview');
  const tFeatures = useTranslations('landing.coreFeatures');
  const tGetStarted = useTranslations('landing.getStarted');
  const tCommunity = useTranslations('landing.community');
  const tUpdates = useTranslations('landing.latestUpdates');

  const features = [
    {
      title: tFeatures('multiChain.title'),
      description: tFeatures('multiChain.description'),
      icon: <Globe className="h-8 w-8 text-white" />,
      color: "bg-blue-500"
    },
    {
      title: tFeatures('secureMinting.title'),
      description: tFeatures('secureMinting.description'),
      icon: <Shield className="h-8 w-8 text-white" />,
      color: "bg-green-500"
    },
    {
      title: tFeatures('instantRewards.title'),
      description: tFeatures('instantRewards.description'),
      icon: <Zap className="h-8 w-8 text-white" />,
      color: "bg-yellow-500"
    }
  ];

  const socialLinks = [
    {
      name: tCommunity('github'),
      icon: <Github className="h-5 w-5" />,
      url: "https://github.com/AGV-Protocol/",
      stats: "2.1K",
      statType: tCommunity('stars')
    },
    {
      name: tCommunity('twitter'),
      icon: <Twitter className="h-5 w-5" />,
      url: "https://x.com/AgvProtocol",
      stats: "12.5K",
      statType: tCommunity('followers')
    },
    {
      name: tCommunity('discord'),
      icon: <MessageCircle className="h-5 w-5" />,
      url: "https://discord.gg/JP9RtzM2SC",
      stats: "8.2K",
      statType: tCommunity('members')
    },
    {
      name: tCommunity('telegram'),
      icon: <Send className="h-5 w-5" />,
      url: "https://t.me/agvprotocol",
      stats: "5.8K",
      statType: tCommunity('members')
    }
  ];

  const articles = [
    {
      title: tUpdates('articles.introducing.title'),
      description: tUpdates('articles.introducing.description'),
      url: "https://medium.com/@agvprotocol/introducing-agv-protocol-unlocking-the-future-of-real-world-assets-c0715b23ff63",
      date: "2025-09-14"
    },
    {
       title: tUpdates('articles.rggpExplained.title'),
       description: tUpdates('articles.rggpExplained.description'),
       url: "https://medium.com/@agvprotocol/rggp-explained-how-agv-protocol-turns-real-world-yields-into-rewards-dacb0a7c31e9",
       date: "2025-09-15"
    }
  ];
  return (
    <section className="relative">
      {/* Gradient section from hero end to Platform Overview title */}
      <div className="bg-gradient-to-b from-[#66CCFF] to-white pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pl-[12px]">
          {/* Platform Overview Title */}
            <div className="flex items-center mb-8 sm:mb-12 px-4 sm:px-8 lg:px-24">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">{tPlatform('title')}</h3>
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
                  <div className="text-2xl font-bold text-gray-800">1,299</div>
                  <div className="text-xs text-gray-500">{tPlatform('nftsMinted')}</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">{tPlatform('totalSupply')}</div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">Upto 50 rGGP</div>
                  <div className="text-xs text-gray-500">{tPlatform('dailyRewards')}</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">{tPlatform('rewardRate')}</div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">98%</div>
                  <div className="text-xs text-gray-500">{tPlatform('securityScore')}</div>
                </div>
              </div>
              <div className="text-gray-600 font-medium">{tPlatform('auditRating')}</div>
            </div>
          </div>

          {/* Main Features */}
          <div className="mb-8">
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">{tFeatures('title')}</h3>
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
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">{tGetStarted('title')}</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{tGetStarted('mintNFTs.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">{tGetStarted('mintNFTs.description')}</p>
                <Link href="/mint">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                    {tGetStarted('mintNFTs.button')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{tGetStarted('stakeEarn.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">{tGetStarted('stakeEarn.description')}</p>
                <Link href="/staking">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                    {tGetStarted('stakeEarn.button')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{tGetStarted('learnMore.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">{tGetStarted('learnMore.description')}</p>
                <Link href="/token">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    {tGetStarted('learnMore.button')}
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
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">{tCommunity('title')}</h3>
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
                        {social.stats} {social.statType}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => window.open(social.url, '_blank')}
                  >
                    {tCommunity('follow')}
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
              <h3 className="text-xl uppercase sm:text-xl font-bold text-[#223256]">{tUpdates('title')}</h3>
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
                    {tUpdates('readMore')}
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
