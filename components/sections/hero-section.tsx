import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FastLink } from "@/components/ui/fast-link"
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe,
  TrendingUp,
  Users,
  Star
} from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn(
      "relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5",
      className
    )}>
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rotate-45 animate-bounce delay-300" />
        <div className="absolute top-40 right-20 w-6 h-6 bg-secondary/20 rounded-full animate-bounce delay-700" />
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-accent/20 rotate-12 animate-bounce delay-1000" />
        <div className="absolute bottom-20 right-1/3 w-5 h-5 bg-primary/20 rounded-full animate-bounce delay-500" />
        
        {/* Subtle Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/3 to-transparent" />
        
        {/* Radial Gradient from Center */}
        <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent" />
      </div>
      
      <div className="container relative py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                <Star className="w-3 h-3 mr-1" />
                Next-Gen NFT Platform
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Mint AGV NFTs
                <span className="text-primary block">Across Chains</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl">
                Experience the future of NFT minting with AGV Protocol. 
                Seamlessly mint across multiple blockchain networks with 
                enterprise-grade security and lightning-fast transactions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group" asChild>
                <FastLink href="#minting">
                  Start Minting
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </FastLink>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <FastLink href="/dashboard">
                  View Dashboard
                </FastLink>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Blockchains</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4</div>
                <div className="text-sm text-muted-foreground">NFT Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative z-10">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                        <Image 
                          src="/logo.svg" 
                          alt="AGV Protocol" 
                          width={32} 
                          height={32}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">AGV Protocol</h3>
                        <p className="text-sm text-muted-foreground">NFT Minting Platform</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 z-20">
              <Card className="w-32 p-3 bg-background/80 backdrop-blur">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium">Secure</span>
                </div>
              </Card>
            </div>
            
            <div className="absolute -bottom-4 -left-4 z-20">
              <Card className="w-32 p-3 bg-background/80 backdrop-blur">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium">Fast</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
