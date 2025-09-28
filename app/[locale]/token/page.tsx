"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Users, 
  Coins, 
  Shield, 
  Zap,
  Globe,
  Twitter,
  Github,
  BookOpen,
  FileText,
  ArrowRight,
  Send,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "../TranslationProvider";

export default function TokenPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const t = useTranslations('token');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(t('copySuccess', { label }));
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const contractAddresses = {
    bsc: {
      gvt: "0x1234567890123456789012345678901234567890", // GVT token contract on BSC
      rggp: "0x0987654321098765432109876543210987654321", // rGGP token contract on BSC
      stake: "0xe268e673a220354c70b324C02635620a591651F5", // Staking contract
    },
    arbitrum: {
      gvt: "0x2345678901234567890123456789012345678901", // GVT token contract on Arbitrum
      rggp: "0x1876543210987654321098765432109876543210", // rGGP token contract on Arbitrum
      stake: "0xe268e673a220354c70b324C02635620a591651F5", // Staking contract
    },
    polygon: {
      gvt: "0x3456789012345678901234567890123456789012", // GVT token contract on Polygon
      rggp: "0x2765432109876543210987654321098765432109", // rGGP token contract on Polygon
      stake: "0xe268e673a220354c70b324C02635620a591651F5", // Staking contract
    },
  };

  const socialLinks = {
    twitter: "https://x.com/agv_partners",
    discord: "https://discord.gg/JP9RtzM2SC",
    github: "https://github.com/AGV-Protocol/",
    telegram: "https://t.me/agvprotocol",
    website: "https://agvprotocol.com",
  };

  const articles = [
    {
      title: t('articles.dualTokenStaking.title'),
      description: t('articles.dualTokenStaking.description'),
      url: "#",
      date: "2024-01-15"
    },
    {
      title: t('articles.rggpRewards.title'),
      description: t('articles.rggpRewards.description'),
      url: "#",
      date: "2024-01-10"
    },
    {
      title: t('articles.gvtGovernance.title'),
      description: t('articles.gvtGovernance.description'),
      url: "#",
      date: "2024-01-08"
    },
    {
      title: t('articles.multiChainStrategy.title'),
      description: t('articles.multiChainStrategy.description'),
      url: "#",
      date: "2024-01-05"
    }
  ];

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
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-2">
                {t('hero.description')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">{t('status.liveEcosystem')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-300 font-medium">{t('status.multiChain')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-cyan-300 font-medium">{t('status.secure')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            {t('sections.ecosystemOverview.title')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-white">{t('stats.tokenHolders.value')}</div>
                    <div className="text-xs text-white/60">{t('stats.tokenHolders.label')}</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium text-sm sm:text-base">{t('stats.tokenHolders.title')}</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{t('stats.activeStakers.value')}</div>
                    <div className="text-xs text-white/60">{t('stats.activeStakers.label')}</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">{t('stats.activeStakers.title')}</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{t('stats.dailyEmission.value')}</div>
                    <div className="text-xs text-white/60">{t('stats.dailyEmission.label')}</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">{t('stats.dailyEmission.title')}</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 sm:p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{t('stats.networks.value')}</div>
                    <div className="text-xs text-white/60">{t('stats.networks.label')}</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">{t('stats.networks.title')}</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-1 sm:p-2">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent h-auto">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                {t('tabs.overview')}
              </TabsTrigger>
              <TabsTrigger 
                value="contracts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                {t('tabs.contracts')}
              </TabsTrigger>
              <TabsTrigger 
                value="staking"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                {t('tabs.staking')}
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                {t('tabs.resources')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{t('overview.aboutTokens.title')}</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-white/80">
                    {t('overview.aboutTokens.description')}
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">{t('overview.aboutTokens.tokenRoles.title')}</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">{t('overview.aboutTokens.tokenRoles.gvt')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">{t('overview.aboutTokens.tokenRoles.rggp')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">{t('overview.aboutTokens.tokenRoles.multiChain')}</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">{t('overview.aboutTokens.tokenRoles.decentralized')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{t('overview.tokenEconomics.title')}</h3>
                </div>
                <div className="space-y-6">
                  {/* GVT Token */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {t('overview.tokenEconomics.gvt.title')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">{t('overview.tokenEconomics.gvt.totalSupply')}</span>
                        <span className="font-semibold text-white">{t('overview.tokenEconomics.gvt.totalSupplyValue')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">{t('overview.tokenEconomics.gvt.circulating')}</span>
                        <span className="font-semibold text-white">{t('overview.tokenEconomics.gvt.circulatingValue')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">{t('overview.tokenEconomics.gvt.useCase')}</span>
                        <span className="font-semibold text-blue-400">{t('overview.tokenEconomics.gvt.useCaseValue')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* rGGP Token */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      {t('overview.tokenEconomics.rggp.title')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">{t('overview.tokenEconomics.rggp.dailyEmission')}</span>
                        <span className="font-semibold text-white">{t('overview.tokenEconomics.rggp.dailyEmissionValue')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">{t('overview.tokenEconomics.rggp.perStakeReward')}</span>
                        <span className="font-semibold text-white">{t('overview.tokenEconomics.rggp.perStakeRewardValue')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">{t('overview.tokenEconomics.rggp.useCase')}</span>
                        <span className="font-semibold text-green-400">{t('overview.tokenEconomics.rggp.useCaseValue')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">{t('overview.benefits.title')}</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">{t('overview.benefits.earnRewards.title')}</h4>
                </div>
                <p className="text-sm text-white/70">
                  {t('overview.benefits.earnRewards.description')}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">{t('overview.benefits.governance.title')}</h4>
                </div>
                <p className="text-sm text-white/70">
                  {t('overview.benefits.governance.description')}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">{t('overview.benefits.exclusiveAccess.title')}</h4>
                </div>
                <p className="text-sm text-white/70">
                  {t('overview.benefits.exclusiveAccess.description')}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">{t('overview.benefits.multiChainSupport.title')}</h4>
                </div>
                <p className="text-sm text-white/70">
                  {t('overview.benefits.multiChainSupport.description')}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{t('contracts.title')}</h3>
                  <p className="text-white/60 text-sm">{t('contracts.description')}</p>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(contractAddresses).map(([chain, contracts]) => (
                  <div key={chain} className="space-y-4">
                    <h4 className="font-semibold text-white capitalize flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {t('contracts.networks', { network: chain })}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div>
                          <p className="font-medium text-white">{t('contracts.gvtToken')}</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.gvt}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.gvt, t('contracts.gvtToken'))}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            {copiedAddress === contracts.gvt ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://bscscan.com/address/${contracts.gvt}`, '_blank')}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div>
                          <p className="font-medium text-white">{t('contracts.rggpToken')}</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.rggp}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.rggp, t('contracts.rggpToken'))}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            {copiedAddress === contracts.rggp ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://bscscan.com/address/${contracts.rggp}`, '_blank')}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div>
                          <p className="font-medium text-white">{t('contracts.stakingContract')}</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.stake}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.stake, t('contracts.stakingContract'))}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            {copiedAddress === contracts.stake ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://bscscan.com/address/${contracts.stake}`, '_blank')}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </TabsContent>

        {/* Staking Tab */}
        <TabsContent value="staking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('staking.howToStake.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('staking.howToStake.step1.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('staking.howToStake.step1.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('staking.howToStake.step2.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('staking.howToStake.step2.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('staking.howToStake.step3.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('staking.howToStake.step3.description')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" onClick={() => window.location.href = '/staking'}>
                  {t('staking.startStaking')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('staking.dualTokenRewards.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {t('staking.rewards.rggp.title')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.rggp.dailyRate')}</span>
                        <span className="font-semibold text-green-600">{t('staking.rewards.rggp.dailyRateValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.rggp.compounding')}</span>
                        <Badge variant="secondary">{t('staking.rewards.rggp.compoundingValue')}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.rggp.withdrawal')}</span>
                        <Badge variant="secondary">{t('staking.rewards.rggp.withdrawalValue')}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {t('staking.rewards.gvt.title')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.gvt.votingPower')}</span>
                        <span className="font-semibold text-blue-600">{t('staking.rewards.gvt.votingPowerValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.gvt.proposalRights')}</span>
                        <Badge variant="secondary">{t('staking.rewards.gvt.proposalRightsValue')}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('staking.rewards.gvt.minimumStake')}</span>
                        <span className="font-semibold">{t('staking.rewards.gvt.minimumStakeValue')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">{t('staking.exampleCalculation.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('staking.exampleCalculation.description')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('staking.exampleCalculation.note')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('resources.socialMedia.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  const icons = {
                    twitter: Twitter,
                    discord: MessageCircle,
                    github: Github,
                    telegram: Send,
                    website: Globe,
                  };
                  const Icon = icons[platform as keyof typeof icons];
                  
                  return (
                    <Button
                      key={platform}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {t('resources.socialMedia.platforms', { platform })}
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('resources.documentation.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('resources.documentation.tokenHandbook')}
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('resources.documentation.stakingGuide')}
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  {t('resources.documentation.securityAudit')}
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('resources.latestArticles.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{article.title}</h4>
                      <p className="text-sm text-muted-foreground">{article.description}</p>
                      <p className="text-xs text-muted-foreground">{article.date}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('resources.latestArticles.readMore')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
