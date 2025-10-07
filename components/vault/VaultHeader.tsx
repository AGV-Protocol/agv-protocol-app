'use client';

import { useState } from 'react';
import { useVaultStore } from '@/lib/vault/store';
import { LockTier } from '@/lib/vault/api';
import { formatWalletAddress } from '@/lib/vault/math';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Settings } from 'lucide-react';

export function VaultHeader() {
  const { wallet, tier, setTier, setWallet } = useVaultStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      // Mock wallet connection - replace with actual wallet connection logic
      const mockWallet = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`;
      setWallet(mockWallet);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTierChange = (newTier: string) => {
    setTier(newTier as LockTier);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Wallet:
          </span>
          {wallet ? (
            <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
              {formatWalletAddress(wallet)}
            </span>
          ) : (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              size="sm"
              variant="outline"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Lock Tier:
          </span>
          <Select value={tier} onValueChange={handleTierChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flex">Flex</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="12m">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <Settings className="h-3 w-3 mr-1" />
          Simulated Rewards (Pre-On-Chain)
        </Badge>
      </div>
    </div>
  );
}
