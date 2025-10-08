'use client';

import { useVaultStore } from '@/lib/vault/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock, Clock, RefreshCw } from 'lucide-react';

export function VaultWarning() {
  const { lockedNfts, lastValidationTime, performPeriodicValidation } = useVaultStore();

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
        <div className="flex items-center justify-between mt-2">
          {lastValidationTime > 0 && (
            <div className="flex items-center gap-1 text-xs text-yellow-300/60">
              <Clock className="h-3 w-3" />
              <span>
                Last validation: {new Date(lastValidationTime).toLocaleTimeString()}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20"
            onClick={() => performPeriodicValidation()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Validate Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
