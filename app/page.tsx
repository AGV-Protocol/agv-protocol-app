"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  BookOpen, 
  Coins, 
  Shield, 
  Zap, 
  Users, 
  Globe,
  Twitter,
  Github,
  FileText,
  ExternalLink,
  CheckCircle,
  Star,
  TrendingUp,
  Lock
} from "lucide-react";

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Coins className="h-8 w-8 text-green-600" />,
      title: "Earn Rewards",
      description: "Stake your Seedpass NFTs to earn rGGP tokens daily with no lock-up period.",
      benefits: ["50 rGGP per NFT daily", "No minimum lock period", "Automatic compounding"]
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Secure Staking",
      description: "Your NFTs are safely escrowed in audited smart contracts with instant withdrawal.",
      benefits: ["Audited contracts", "Instant withdrawal", "Multi-chain support"]
    },
    {
      icon: <Zap className="h-8 w-8 text-purple-600" />,
      title: "Multi-Chain",
      description: "Stake across BSC, Arbitrum, and Polygon networks for maximum flexibility.",
      benefits: ["BSC Network", "Arbitrum", "Polygon"]
    }
  ];

  const socialLinks = [
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      url: "https://twitter.com/agvprotocol",
      followers: "12.5K"
    },
    {
      name: "Discord",
      icon: <Globe className="h-5 w-5" />,
      url: "https://discord.gg/agvprotocol",
      members: "8.2K"
    },
    {
      name: "GitHub",
      icon: <Github className="h-5 w-5" />,
      url: "https://github.com/agvprotocol",
      stars: "1.2K"
    },
    {
      name: "Website",
      icon: <Globe className="h-5 w-5" />,
      url: "https://agvprotocol.com",
      visits: "50K+"
    }
  ];

  const handbookSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of Seedpass and how to begin your staking journey",
      icon: <BookOpen className="h-6 w-6" />,
      topics: ["What is Seedpass?", "How to buy Seedpass", "Wallet setup", "First steps"]
    },
    {
      title: "Staking Guide",
      description: "Complete guide to staking your Seedpass NFTs and earning rewards",
      icon: <Lock className="h-6 w-6" />,
      topics: ["How to stake", "Reward calculations", "Withdrawal process", "Best practices"]
    },
    {
      title: "Token Economics",
      description: "Understanding the rGGP token and reward mechanisms",
      icon: <TrendingUp className="h-6 w-6" />,
      topics: ["rGGP token utility", "Reward rates", "Token distribution", "Future plans"]
    },
    {
      title: "Security & Audits",
      description: "Learn about our security measures and audit reports",
      icon: <Shield className="h-6 w-6" />,
      topics: ["Smart contract audits", "Security measures", "Risk assessment", "Best practices"]
    }
  ];

  const stats = [
    { label: "Total Seedpass Holders", value: "2,847", icon: <Users className="h-5 w-5" /> },
    { label: "Total Staked NFTs", value: "1,234", icon: <Lock className="h-5 w-5" /> },
    { label: "Daily Rewards Distributed", value: "61,700 rGGP", icon: <Coins className="h-5 w-5" /> },
    { label: "Supported Networks", value: "3", icon: <Globe className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                AGV Protocol Ecosystem
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Seedpass Staking
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Stake your Seedpass NFTs to earn rewards and unlock exclusive benefits in the AGV Protocol ecosystem
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = '/staking'}>
                Start Staking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => window.location.href = '/token'}>
                Learn More
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="flex justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose Seedpass Staking?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of NFT staking with our innovative platform
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all duration-300 ${
                activeFeature === index ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setActiveFeature(index)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Handbook Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Seedpass Token Handbook</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Seedpass and the AGV Protocol ecosystem
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {handbookSections.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  {section.icon}
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.topics.map((topic, topicIndex) => (
                    <li key={topicIndex} className="text-sm text-muted-foreground">
                      • {topic}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Social Media & Community Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Join Our Community</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow Seedpass holders and stay updated with the latest news
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {socialLinks.map((social, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {social.icon}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{social.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {social.followers || social.members || social.stars || social.visits}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(social.url, '_blank')}
                >
                  Follow
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of Seedpass holders who are already earning rewards
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/staking'}
              >
                <Lock className="mr-2 h-5 w-5" />
                Start Staking Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-green-600"
                onClick={() => window.location.href = '/token'}
              >
                <FileText className="mr-2 h-5 w-5" />
                View Token Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(social.url, '_blank')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {social.icon}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AGV Protocol. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}