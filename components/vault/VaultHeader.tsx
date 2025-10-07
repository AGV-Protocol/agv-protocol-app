'use client';

import { useEffect } from 'react';
import { useVaultStore } from '@/lib/vault/store';
import { LockTier } from '@/lib/vault/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet } from 'lucide-react';
import { useActiveAccount, ConnectButton } from 'thirdweb/react';
import { thirdwebClient } from '@/components/wallet/wallet-connect';

export function VaultHeader() {
  const { wallet, tier, setTier, setWallet } = useVaultStore();
  const account = useActiveAccount();

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


  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-white/80">
            Wallet:
          </span>
          <ConnectButton client={thirdwebClient} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/80">
            Lock Tier:
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
