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

export default function TokenPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(`${label} copied to clipboard`);
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
      title: "Dual-Token Staking Guide",
      description: "Learn how to stake GVT and rGGP tokens to maximize your rewards",
      url: "#",
      date: "2024-01-15"
    },
    {
      title: "Understanding rGGP Rewards",
      description: "Everything you need to know about rGGP reward mechanics and distribution",
      url: "#",
      date: "2024-01-10"
    },
    {
      title: "GVT Governance Guide",
      description: "How to participate in protocol governance with GVT tokens",
      url: "#",
      date: "2024-01-08"
    },
    {
      title: "Multi-Chain Token Strategy",
      description: "Maximize your rewards across BSC, Arbitrum, and Polygon networks",
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
                AGV Protocol Tokens
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-2">
                Discover GVT (Governance Token) and rGGP (Reward Token) - the dual-token ecosystem powering the AGV Protocol. Earn rGGP rewards through staking and participate in governance with GVT.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">Live Ecosystem</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-300 font-medium">Multi-Chain</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-cyan-300 font-medium">Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Ecosystem Overview
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
                    <div className="text-lg sm:text-2xl font-bold text-white">2,847</div>
                    <div className="text-xs text-white/60">Token Holders</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium text-sm sm:text-base">GVT Holders</div>
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
                    <div className="text-2xl font-bold text-white">1,234</div>
                    <div className="text-xs text-white/60">Active Stakers</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">rGGP Earners</div>
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
                    <div className="text-2xl font-bold text-white">50,000</div>
                    <div className="text-xs text-white/60">Daily Emission</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">rGGP Rewards</div>
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
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-white/60">Networks</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">Multi-Chain</div>
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
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="contracts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                Contracts
              </TabsTrigger>
              <TabsTrigger 
                value="staking"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                Staking
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
              >
                Resources
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
                  <h3 className="text-xl font-semibold text-white">About GVT & rGGP</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-white/80">
                    The AGV Protocol operates on a dual-token system designed to separate governance and reward mechanisms. 
                    GVT serves as the governance token while rGGP functions as the reward token for ecosystem participation.
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Token Roles:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">GVT: Protocol governance and voting rights</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">rGGP: Staking rewards and ecosystem incentives</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">Multi-chain deployment across major networks</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">Decentralized and community-driven ecosystem</span>
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
                  <h3 className="text-xl font-semibold text-white">Token Economics</h3>
                </div>
                <div className="space-y-6">
                  {/* GVT Token */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      GVT (Governance Token)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Total Supply</span>
                        <span className="font-semibold text-white">1,000,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Circulating</span>
                        <span className="font-semibold text-white">750,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Use Case</span>
                        <span className="font-semibold text-blue-400">Governance</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* rGGP Token */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      rGGP (Reward Token)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Daily Emission</span>
                        <span className="font-semibold text-white">50,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-white/70">Per Stake Reward</span>
                        <span className="font-semibold text-white">50 rGGP/day</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Use Case</span>
                        <span className="font-semibold text-green-400">Staking Rewards</span>
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
              <h3 className="text-xl font-semibold text-white">Dual-Token Ecosystem Benefits</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Earn rGGP Rewards</h4>
                </div>
                <p className="text-sm text-white/70">
                  Stake tokens to earn rGGP rewards daily with no lock-up period.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">GVT Governance</h4>
                </div>
                <p className="text-sm text-white/70">
                  Use GVT tokens to vote on protocol proposals and shape the future of AGV.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Exclusive Access</h4>
                </div>
                <p className="text-sm text-white/70">
                  Get early access to new features, airdrops, and ecosystem updates.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Multi-Chain Support</h4>
                </div>
                <p className="text-sm text-white/70">
                  Access both tokens across BSC, Arbitrum, and Polygon networks.
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
                  <h3 className="text-xl font-semibold text-white">Contract Addresses</h3>
                  <p className="text-white/60 text-sm">Official contract addresses for GVT and rGGP tokens across different networks</p>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(contractAddresses).map(([chain, contracts]) => (
                  <div key={chain} className="space-y-4">
                    <h4 className="font-semibold text-white capitalize flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      {chain} Network
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div>
                          <p className="font-medium text-white">GVT Token</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.gvt}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.gvt, "GVT Contract")}
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
                          <p className="font-medium text-white">rGGP Token</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.rggp}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.rggp, "rGGP Contract")}
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
                          <p className="font-medium text-white">Staking Contract</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.stake}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(contracts.stake, "Staking Contract")}
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
                <CardTitle>How to Stake Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Connect Wallet</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect your wallet that contains GVT or rGGP tokens
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Select Network</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose BSC, Arbitrum, or Polygon network
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Stake Tokens</h4>
                      <p className="text-sm text-muted-foreground">
                        Select and stake your tokens to start earning rewards
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" onClick={() => window.location.href = '/staking'}>
                  Start Staking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dual-Token Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      rGGP Rewards
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Rate</span>
                        <span className="font-semibold text-green-600">50 rGGP per stake</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compounding</span>
                        <Badge variant="secondary">Automatic</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawal</span>
                        <Badge variant="secondary">Anytime</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      GVT Governance
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voting Power</span>
                        <span className="font-semibold text-blue-600">1 GVT = 1 Vote</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proposal Rights</span>
                        <Badge variant="secondary">10,000 GVT</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minimum Stake</span>
                        <span className="font-semibold">100 tokens</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Example Calculation</h4>
                  <p className="text-sm text-muted-foreground">
                    Staking 1000 tokens for 30 days = 1000 × 0.05 × 30 = 1,500 rGGP rewards
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plus governance voting power with GVT tokens
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
                <CardTitle>Social Media</CardTitle>
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
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Token Handbook
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Staking Guide
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Audit
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Latest Articles</CardTitle>
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
                      Read More
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
