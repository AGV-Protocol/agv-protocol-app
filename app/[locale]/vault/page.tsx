'use client';

import { useEffect } from 'react';
import { useVaultStore } from '@/lib/vault/store';
import { VaultHeader } from '@/components/vault/VaultHeader';
import { LiveCounter } from '@/components/vault/LiveCounter';
import { AprBars } from '@/components/vault/AprBars';
import { PositionsList } from '@/components/vault/PositionCard';
import { XpPanel } from '@/components/vault/XpPanel';
import { Leaderboard } from '@/components/vault/Leaderboard';
import { NftSelector } from '@/components/vault/NftSelector';
import { VaultWarning } from '@/components/vault/VaultWarning';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Wallet } from 'lucide-react';

export default function VaultPage() {
  const { 
    wallet, 
    isLoading, 
    error, 
    clearError, 
    refreshData, 
    hydrateFromApis,
    lockedNfts,
    setLockedNfts
  } = useVaultStore();

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!wallet) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [wallet, refreshData]);

  // Auto-hydrate when wallet is available
  useEffect(() => {
    if (wallet) {
      hydrateFromApis(wallet);
    }
  }, [wallet, hydrateFromApis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            rGGP Vault
          </h1>
          <p className="text-lg text-white/80">
            Earn rewards by locking your NFTs and completing community tasks
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/20 bg-red-500/10 backdrop-blur-xl">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="flex items-center justify-between text-red-300">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-4 text-red-300 hover:text-red-200 hover:bg-red-500/20"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Vault Header */}
        <div className="mb-8">
          <VaultHeader />
        </div>

        {/* Vault Warning */}
        <VaultWarning />

        {/* Main Content Grid */}
        {wallet ? (
          lockedNfts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Stats */}
              <div className="lg:col-span-2 space-y-8">
                {/* Live Counter */}
                <LiveCounter />
                
                {/* APR Bars */}
                <AprBars />
                
                {/* Positions */}
                <PositionsList />
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-8">
                {/* XP Panel */}
                <XpPanel />
                
                {/* Leaderboard */}
                <Leaderboard />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - NFT Selection */}
              <div className="lg:col-span-2 space-y-8">
                {/* NFT Selector */}
                <NftSelector 
                  onNftsSelected={(selectedNfts) => {
                    // Convert selected NFTs to locked NFTs format
                    const lockedNfts = selectedNfts.map(nft => ({
                      ...nft,
                      nftType: (nft as any).nftType || 'unknown',
                      lockTier: 'flex' as const,
                      lockTimestamp: Math.floor(Date.now() / 1000)
                    }));
                    setLockedNfts(lockedNfts);
                  }}
                  selectedNfts={lockedNfts}
                />
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-8">
                {/* XP Panel */}
                <XpPanel />
                
                {/* Leaderboard */}
                <Leaderboard />
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="p-4 rounded-full bg-blue-500/20 inline-block mb-4">
                  <Wallet className="h-12 w-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-white/80 mb-6">
                  Connect your wallet to view your rGGP vault, staked NFTs, and earning potential.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-white/70">
                  <p>Once connected, you'll be able to:</p>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• View your live rGGP earnings</li>
                    <li>• See your staked NFT positions</li>
                    <li>• Track your XP and rewards</li>
                    <li>• Compare your performance on the leaderboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {wallet && (
          <div className="mt-8 text-center">
            <Button
              onClick={refreshData}
              disabled={isLoading}
              variant="outline"
              className="min-w-32 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-white/60">
          <p className="mt-2">
            Data updates every 60 seconds. XP updates within 1 hour of task completion.
          </p>
        </div>
      </div>
    </div>
  );
}
