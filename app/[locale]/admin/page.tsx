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
import { useTranslations } from "../TranslationProvider";

export default function AdminPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const t = useTranslations('admin');

  const adminFeatures = [
    {
      title: t('features.userAnalytics.title'),
      description: t('features.userAnalytics.description'),
      icon: <Users className="h-8 w-8" />,
      color: "bg-blue-500",
      href: "/dashboard"
    },
    {
      title: t('features.performanceAnalytics.title'),
      description: t('features.performanceAnalytics.description'),
      icon: <BarChart3 className="h-8 w-8" />,
      color: "bg-green-500",
      href: "/dashboard/analytics"
    },
    {
      title: t('features.kolTracking.title'),
      description: t('features.kolTracking.description'),
      icon: <UserCheck className="h-8 w-8" />,
      color: "bg-purple-500",
      href: "/dashboard/kols"
    },
    {
      title: t('features.activityMonitoring.title'),
      description: t('features.activityMonitoring.description'),
      icon: <Activity className="h-8 w-8" />,
      color: "bg-yellow-500",
      href: "/dashboard/activity"
    },
    {
      title: t('features.performanceMetrics.title'),
      description: t('features.performanceMetrics.description'),
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-cyan-500",
      href: "/dashboard/performance"
    },
    {
      title: t('features.systemMonitoring.title'),
      description: t('features.systemMonitoring.description'),
      icon: <Settings className="h-8 w-8" />,
      color: "bg-orange-500",
      href: "/dashboard/settings"
    }
  ];

  const quickStats = [
    {
      title: t('stats.activeUsers.title'),
      value: t('stats.activeUsers.value'),
      change: t('stats.activeUsers.change'),
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-600"
    },
    {
      title: t('stats.mintingActivity.title'),
      value: t('stats.mintingActivity.value'),
      change: t('stats.mintingActivity.change'),
      icon: <Coins className="h-5 w-5" />,
      color: "text-green-600"
    },
    {
      title: t('stats.stakingVolume.title'),
      value: t('stats.stakingVolume.value'),
      change: t('stats.stakingVolume.change'),
      icon: <Zap className="h-5 w-5" />,
      color: "text-purple-600"
    },
    {
      title: t('stats.systemUptime.title'),
      value: t('stats.systemUptime.value'),
      change: t('stats.systemUptime.change'),
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
                {t('hero.title')}
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                {t('hero.description')}
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">{t('status.online')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">{t('status.secure')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-purple-700 font-medium">{t('status.adminOnly')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {t('sections.systemOverview.title')}
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
            {t('sections.functionalityMonitoring.title')}
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
                    {t('buttons.viewMetrics')}
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
            {t('sections.quickAccess.title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">{t('quickAccess.dashboard.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm">{t('quickAccess.dashboard.description')}</p>
              </div>
            </Link>

            <Link href="/dashboard/users">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">{t('quickAccess.users.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm">{t('quickAccess.users.description')}</p>
              </div>
            </Link>

            <Link href="/dashboard/analytics">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">{t('quickAccess.analytics.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm">{t('quickAccess.analytics.description')}</p>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Settings className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">{t('quickAccess.settings.title')}</h4>
                </div>
                <p className="text-gray-600 text-sm">{t('quickAccess.settings.description')}</p>
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
              <h4 className="font-semibold text-blue-800 mb-2">{t('systemStatus.title')}</h4>
              <p className="text-blue-700 text-sm">
                {t('systemStatus.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
