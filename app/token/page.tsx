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
  ArrowRight
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
      nft: "0xFF362C39eB0eDecA946A5528d30D9c9E9285f3fc", // Seedpass NFT contract on BSC
      stake: "0xe268e673a220354c70b324C02635620a591651F5",
    },
    arbitrum: {
      nft: "0x90b9E1C8645bC731be19537A4932B26Fc218e464", // Seedpass NFT contract on Arbitrum
      stake: "0xe268e673a220354c70b324C02635620a591651F5", // Placeholder
    },
    polygon: {
      nft: "0x492a86EdEEa01158FcD3C8f2348A4c0431b8A24d", // Seedpass NFT contract on Polygon
      stake: "0xe268e673a220354c70b324C02635620a591651F5", // Placeholder
    },
  };

  const socialLinks = {
    twitter: "https://twitter.com/agvprotocol",
    discord: "https://discord.gg/agvprotocol",
    github: "https://github.com/agvprotocol",
    website: "https://agvprotocol.com",
  };

  const articles = [
    {
      title: "Seedpass Staking Guide",
      description: "Learn how to stake your Seedpass NFTs and earn rewards",
      url: "#",
      date: "2024-01-15"
    },
    {
      title: "Understanding rGGP Rewards",
      description: "Everything you need to know about reward mechanics",
      url: "#",
      date: "2024-01-10"
    },
    {
      title: "Multi-Chain Staking Strategy",
      description: "Maximize your rewards across different networks",
      url: "#",
      date: "2024-01-05"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-8 mb-8 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-blue-800/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                Seedpass Token
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Your gateway to the AGV Protocol ecosystem. Stake your Seedpass NFTs to earn rewards and unlock exclusive benefits.
              </p>
            </div>
            <div className="flex justify-center gap-4">
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
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Ecosystem Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">2,847</div>
                    <div className="text-xs text-white/60">Total Holders</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">Community Size</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">1,234</div>
                    <div className="text-xs text-white/60">Total Staked</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">Active Staking</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">50 rGGP</div>
                    <div className="text-xs text-white/60">Daily Rewards</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">Reward Rate</div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">98%</div>
                    <div className="text-xs text-white/60">Security Score</div>
                  </div>
                </div>
                <div className="text-white/80 font-medium">Audit Rating</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-2">
            <TabsList className="grid w-full grid-cols-4 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="contracts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-xl"
              >
                Contracts
              </TabsTrigger>
              <TabsTrigger 
                value="staking"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl"
              >
                Staking
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl"
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
                    <span className="text-2xl">🌱</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">What is Seedpass?</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-white/80">
                    Seedpass is the foundational NFT collection of the AGV Protocol ecosystem. 
                    Each Seedpass represents your stake in the future of decentralized computing.
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Key Features:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">Staking rewards in rGGP tokens</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">Access to exclusive ecosystem benefits</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">Multi-chain support (BSC, Arbitrum, Polygon)</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80 text-sm">No lock-up period - withdraw anytime</span>
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
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/70">Total Supply</span>
                      <span className="font-semibold text-white">10,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/70">Minted</span>
                      <span className="font-semibold text-white">8,500</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/70">Staked</span>
                      <span className="font-semibold text-white">1,234</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-white/70">Daily Reward Rate</span>
                      <span className="font-semibold text-green-400">50 rGGP</span>
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
              <h3 className="text-xl font-semibold text-white">Benefits of Holding Seedpass</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Earn Rewards</h4>
                </div>
                <p className="text-sm text-white/70">
                  Stake your Seedpass to earn rGGP tokens daily with no lock-up period.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Exclusive Access</h4>
                </div>
                <p className="text-sm text-white/70">
                  Get early access to new features, airdrops, and ecosystem updates.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Governance Rights</h4>
                </div>
                <p className="text-sm text-white/70">
                  Participate in protocol governance and shape the future of AGV.
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
                  <p className="text-white/60 text-sm">Official contract addresses for Seedpass across different networks</p>
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
                          <p className="font-medium text-white">Seedpass NFT</p>
                          <p className="text-sm text-white/60 font-mono">{contracts.nft}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(contracts.nft, "NFT Contract")}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          {copiedAddress === contracts.nft ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
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
                <CardTitle>How to Stake</CardTitle>
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
                        Connect your wallet that contains Seedpass NFTs
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
                      <h4 className="font-semibold">Stake NFTs</h4>
                      <p className="text-sm text-muted-foreground">
                        Select and stake your Seedpass NFTs to start earning
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
                <CardTitle>Reward Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Reward Rate</span>
                    <span className="font-semibold">50 rGGP per NFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compounding</span>
                    <Badge variant="secondary">Automatic</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Withdrawal</span>
                    <Badge variant="secondary">Anytime</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Stake</span>
                    <span className="font-semibold">1 NFT</span>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Example Calculation</h4>
                  <p className="text-sm text-muted-foreground">
                    Staking 5 Seedpass NFTs for 30 days = 5 × 50 × 30 = 7,500 rGGP
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
                    discord: Globe,
                    github: Github,
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
