'use client';

import { useVaultStore } from '@/lib/vault/store';
import { formatNumber, formatWalletAddress } from '@/lib/vault/math';
import { dailyYield, calculateAccrued } from '@/lib/vault/math';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sprout, TreePine, Sun } from 'lucide-react';

interface PositionCardProps {
  position: {
    type: 'Seed' | 'Tree' | 'Solar';
    start_ts: number;
    lock_tier?: string;
  };
  index: number;
}

const nftIcons = {
  Seed: Sprout,
  Tree: TreePine,
  Solar: Sun
};

const nftColors = {
  Seed: 'text-green-600 dark:text-green-400',
  Tree: 'text-blue-600 dark:text-blue-400',
  Solar: 'text-yellow-600 dark:text-yellow-400'
};

const nftBgColors = {
  Seed: 'bg-green-50 dark:bg-green-950/20',
  Tree: 'bg-blue-50 dark:bg-blue-950/20',
  Solar: 'bg-yellow-50 dark:bg-yellow-950/20'
};

export function PositionCard({ position, index }: PositionCardProps) {
  const { tier, tiers, xp } = useVaultStore();
  
  if (!tiers || !xp) return null;

  const tierData = tiers.tiers[tier];
  const nftMultiplier = tiers.nftMultipliers[position.type];
  const dailyYieldForNft = dailyYield(tierData.apr, nftMultiplier, xp.xp);
  const accrued = calculateAccrued(position.start_ts, dailyYieldForNft);
  
  const Icon = nftIcons[position.type];
  const colorClass = nftColors[position.type];
  const bgClass = nftBgColors[position.type];

  const startDate = new Date(position.start_ts * 1000);
  const daysStaked = Math.floor((Date.now() - position.start_ts * 1000) / (1000 * 60 * 60 * 24));

  return (
    <Card className="w-full bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/10 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-white">{position.type} NFT</div>
              <div className="text-sm text-white/70">
                Position #{index + 1}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs bg-white/10 border-white/20 text-white">
            {nftMultiplier}x Multiplier
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatNumber(accrued, 4)}
            </div>
            <div className="text-xs text-white/70">
              rGGP Accrued
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {formatNumber(dailyYieldForNft, 4)}
            </div>
            <div className="text-xs text-white/70">
              Daily Yield
            </div>
          </div>
        </div>

        {/* Staking Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Staked Since:</span>
            <span className="font-medium text-white">
              {startDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Days Staked:</span>
            <span className="font-medium text-white">{daysStaked} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Lock Tier:</span>
            <Badge variant="outline" className="text-xs bg-white/10 border-white/20 text-white">
              {position.lock_tier || tier}
            </Badge>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          disabled
        >
          Claim Rewards (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}

export function PositionsList() {
  const { positions, isLoading } = useVaultStore();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="w-full bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-500/20">
                <Sprout className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">No NFTs Staked</h3>
              <p className="text-white/70 mb-4">
                Start earning rGGP rewards by staking your NFTs
              </p>
              <Button className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Mint & Stake NFTs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Your Staked Positions</h3>
      {positions.map((position, index) => (
        <PositionCard key={index} position={position} index={index} />
      ))}
    </div>
  );
}
