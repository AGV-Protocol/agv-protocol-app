'use client';

import { useEffect } from 'react';
import { useVaultStore } from '@/lib/vault/store';
import { VaultHeader } from '@/components/vault/VaultHeader';
import { LiveCounter } from '@/components/vault/LiveCounter';
import { AprBars } from '@/components/vault/AprBars';
import { PositionsList } from '@/components/vault/PositionCard';
import { XpPanel } from '@/components/vault/XpPanel';
import { Leaderboard } from '@/components/vault/Leaderboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function VaultPage() {
  const { 
    wallet, 
    isLoading, 
    error, 
    clearError, 
    refreshData,
    hydrateFromApis 
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            rGGP Vault
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Earn rewards by staking your NFTs and completing community tasks
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-4"
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

        {/* Main Content Grid */}
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

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="outline"
            className="min-w-32"
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

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            This is a simulated rewards system. Real on-chain rewards will be available soon.
          </p>
          <p className="mt-2">
            Data updates every 60 seconds. XP updates within 1 hour of task completion.
          </p>
        </div>
      </div>
    </div>
  );
}
