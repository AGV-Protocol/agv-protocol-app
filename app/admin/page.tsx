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
  Settings,
  BarChart3,
  UserCheck,
  Activity,
  TrendingUp,
  Lock
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const adminFeatures = [
    {
      title: "User Analytics",
      description: "Track user engagement, growth metrics, and platform adoption",
      icon: <Users className="h-8 w-8" />,
      color: "bg-blue-500",
      href: "/dashboard"
    },
    {
      title: "Performance Analytics",
      description: "Monitor platform performance, response times, and system health",
      icon: <BarChart3 className="h-8 w-8" />,
      color: "bg-green-500",
      href: "/dashboard/analytics"
    },
    {
      title: "KOL Tracking",
      description: "Monitor Key Opinion Leader performance and referral metrics",
      icon: <UserCheck className="h-8 w-8" />,
      color: "bg-purple-500",
      href: "/dashboard/kols"
    },
    {
      title: "Activity Monitoring",
      description: "Real-time tracking of user activities and system events",
      icon: <Activity className="h-8 w-8" />,
      color: "bg-yellow-500",
      href: "/dashboard/activity"
    },
    {
      title: "Performance Metrics",
      description: "Track minting, staking, and token performance across all chains",
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-cyan-500",
      href: "/dashboard/performance"
    },
    {
      title: "System Monitoring",
      description: "Monitor system configuration and operational parameters",
      icon: <Settings className="h-8 w-8" />,
      color: "bg-orange-500",
      href: "/dashboard/settings"
    }
  ];

  const quickStats = [
    {
      title: "Active Users",
      value: "2,847",
      change: "+12%",
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: "Minting Activity",
      value: "1,234",
      change: "+8%",
      icon: <Coins className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: "Staking Volume",
      value: "5,678",
      change: "+15%",
      icon: <Zap className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: "System Uptime",
      value: "99.8%",
      change: "+0.2%",
      icon: <Shield className="h-5 w-5" />,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-blue-700/10 border border-blue-200 p-8 mb-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-blue-700/5"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                System Dashboard
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Monitor and track all AGV Protocol functionalities. Real-time analytics, performance metrics, and system health monitoring.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">System Online</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Secure Access</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700 font-medium">Admin Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            System Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <div key={index} className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.change}</div>
                  </div>
                </div>
                <div className="text-gray-600 font-medium">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Functionality Tracking */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Functionality Monitoring
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adminFeatures.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl ${feature.color} shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{feature.title}</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <Link href={feature.href}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                    View Metrics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Quick Access
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Dashboard</h4>
                </div>
                <p className="text-gray-600 text-sm">View main dashboard</p>
              </div>
            </Link>

            <Link href="/dashboard/users">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Users</h4>
                </div>
                <p className="text-gray-600 text-sm">Manage users</p>
              </div>
            </Link>

            <Link href="/dashboard/analytics">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Analytics</h4>
                </div>
                <p className="text-gray-600 text-sm">View analytics</p>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Settings className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Settings</h4>
                </div>
                <p className="text-gray-600 text-sm">Configure system</p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">System Status</h4>
              <p className="text-blue-700 text-sm">
                This dashboard provides real-time monitoring of all AGV Protocol functionalities. 
                All metrics are updated automatically and provide insights into platform performance, 
                user activity, and system health across all features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
