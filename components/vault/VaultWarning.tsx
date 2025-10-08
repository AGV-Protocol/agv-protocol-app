'use client';

import { useVaultStore } from '@/lib/vault/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Lock } from 'lucide-react';

export function VaultWarning() {
  const { lockedNfts } = useVaultStore();

  if (lockedNfts.length === 0) return null;

  return (
    <Alert className="mb-6 border-yellow-500/20 bg-yellow-500/10 backdrop-blur-xl">
      <AlertTriangle className="h-4 w-4 text-yellow-400" />
      <AlertDescription className="text-yellow-300">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="font-medium">
            {lockedNfts.length} NFT{lockedNfts.length !== 1 ? 's' : ''} locked in vault
          </span>
        </div>
        <p className="text-sm text-yellow-300/80 mt-1">
          ⚠️ <strong>Important:</strong> Warning: NFT is locked in vault. Do not transfer it, or rewards will stop. Use &quot;Unlock&quot; to safely remove it first.
        </p>
      </AlertDescription>
    </Alert>
  );
}
