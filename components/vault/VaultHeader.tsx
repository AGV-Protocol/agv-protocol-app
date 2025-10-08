'use client';

import { useEffect, useState } from 'react';
import { useVaultStore } from '@/lib/vault/store';
import { LockTier } from '@/lib/vault/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, CheckCircle } from 'lucide-react';
import { useActiveAccount, ConnectButton, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { thirdwebClient } from '@/components/wallet/wallet-connect';
import { bsc, polygon, arbitrum } from 'thirdweb/chains';
import { useTranslations } from '@/hooks/useTranslations';

type ChainKey = "56" | "42161" | "137";

const CHAIN_CONFIG: Record<
  ChainKey,
  { id: number; label: string; chain: any }
> = {
  "56": { id: 56, label: "BSC", chain: bsc },
  "42161": { id: 42161, label: "Arbitrum", chain: arbitrum },
  "137": { id: 137, label: "Polygon", chain: polygon },
};

export function VaultHeader() {
  const { t } = useTranslations();
  const { wallet, tier, setTier, setWallet, chainKey, setChainKey } = useVaultStore();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  // Update vault store when wallet connects/disconnects
  useEffect(() => {
    if (account?.address) {
      setWallet(account.address as `0x${string}`);
    } else {
      setWallet(undefined);
    }
  }, [account?.address, setWallet]);

  const handleTierChange = (newTier: string) => {
    setTier(newTier as LockTier);
  };

  const handleChainChange = async (newChainKey: ChainKey) => {
    setChainKey(newChainKey);
    
    // Switch wallet chain if needed
    if (activeChain?.id !== CHAIN_CONFIG[newChainKey].id) {
      try {
        await switchChain(CHAIN_CONFIG[newChainKey].chain);
      } catch (error) {
        console.warn('Failed to switch chain:', error);
      }
    }
  };


  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-white/80">
                {t('vault.header.wallet')}
              </span>
              <ConnectButton client={thirdwebClient} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">
                {t('vault.header.network')}
              </span>
              <Select value={chainKey} onValueChange={handleChainChange}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="56" className="text-white hover:bg-white/10">BSC</SelectItem>
                  <SelectItem value="137" className="text-white hover:bg-white/10">Polygon</SelectItem>
                  <SelectItem value="42161" className="text-white hover:bg-white/10">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80">
                {t('vault.header.lockTier')}
              </span>
              <Select value={tier} onValueChange={handleTierChange}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="flex" className="text-white hover:bg-white/10">Flex</SelectItem>
                  <SelectItem value="1m" className="text-white hover:bg-white/10">1 Month</SelectItem>
                  <SelectItem value="3m" className="text-white hover:bg-white/10">3 Months</SelectItem>
                  <SelectItem value="6m" className="text-white hover:bg-white/10">6 Months</SelectItem>
                  <SelectItem value="12m" className="text-white hover:bg-white/10">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
      </div>
    </div>
  );
}
