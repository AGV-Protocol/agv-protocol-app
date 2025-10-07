'use client';

import { useVaultStore } from '@/lib/vault/store';
import { useLiveCounter } from '@/lib/vault/useLiveCounter';
import { formatNumber, formatLargeNumber } from '@/lib/vault/math';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Lock } from 'lucide-react';

export function LiveCounter() {
  const { 
    tier, 
    tiers, 
    rggpAccrued, 
    perSecondRate, 
    dailyYieldTotal,
    isLoading 
  } = useVaultStore();

  const liveValue = useLiveCounter(rggpAccrued, perSecondRate);
  
  const tierData = tiers?.tiers[tier];
  const apr = tierData?.apr || 0;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live rGGP Counter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Live rGGP Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Counter */}
        <div className="text-center">
          <div 
            className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400 mb-2"
            aria-live="polite"
            aria-label={`Current rGGP balance: ${formatNumber(liveValue, 4)}`}
          >
            {formatNumber(liveValue, 4)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            rGGP Accrued
          </div>
        </div>

        {/* APR Display */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {apr}% APR
          </Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {tier === 'flex' ? 'Flexible' : `${tier} Lock`}
          </span>
        </div>

        {/* Daily Yield Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {formatNumber(dailyYieldTotal, 2)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Daily Yield
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                {formatNumber(perSecondRate * 86400, 2)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Per Second
              </div>
            </div>
          </div>
        </div>

        {/* Lock Tier CTA */}
        {tier === 'flex' && (
          <div className="text-center">
            <Button className="w-full" size="lg">
              <Lock className="h-4 w-4 mr-2" />
              Lock Tier for Higher APR
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Lock your NFTs to earn up to 490% APR
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
