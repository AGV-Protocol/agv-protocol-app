'use client';

import { useVaultStore } from '@/lib/vault/store';
import { formatNumber } from '@/lib/vault/math';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Zap, Users } from 'lucide-react';

export function AprBars() {
  const { tier, tiers, isLoading } = useVaultStore();
  
  const tierData = tiers?.tiers[tier];
  
  if (isLoading || !tierData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            APR Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { apr, split } = tierData;
  const realApr = apr * split.real;
  const boostApr = apr * split.boost;
  const socialApr = apr * split.social;

  const bars = [
    {
      label: 'Real Yield',
      value: realApr,
      percentage: split.real * 100,
      color: 'bg-green-500',
      icon: TrendingUp,
      description: 'Base rewards from staking'
    },
    {
      label: 'Boost Multiplier',
      value: boostApr,
      percentage: split.boost * 100,
      color: 'bg-blue-500',
      icon: Zap,
      description: 'Multiplier rewards from NFT tier'
    },
    {
      label: 'Social Rewards',
      value: socialApr,
      percentage: split.social * 100,
      color: 'bg-purple-500',
      icon: Users,
      description: 'Community and engagement rewards'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          APR Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bars.map((bar, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <bar.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium">{bar.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatNumber(bar.value, 1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(bar.percentage, 1)}% of total
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${bar.color}`}
                      style={{ width: `${bar.percentage}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{bar.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total APR</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(apr, 1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
