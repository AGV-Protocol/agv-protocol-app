import React from "react";
import { Wallet, AlertTriangle, Loader2, CheckCircle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { SectionCard } from "./SectionCard";

interface WalletConnectionProps {
  isConnected: boolean;
  hasInsufficientGas: boolean;
  isMinting: boolean;
  currentStep: string;
  mintProgress: number;
  canMint: boolean;
  onMint: () => void;
  account?: any;
  checkingWl: boolean;
  wlEligible: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  isConnected,
  hasInsufficientGas,
  isMinting,
  currentStep,
  mintProgress,
  canMint,
  onMint,
  account,
  checkingWl,
  wlEligible,
}) => {
  return (
    <SectionCard
      icon={Wallet}
      iconBg=""
      title="Connect & Mint"
      className="max-w-md mx-auto"
    >
      <div className="space-y-3 text-center">
        {/* Wallet Connect Button */}
        <div className="flex justify-center">
          <WalletConnect />
        </div>

        {/* Status Messages */}
        <div className="space-y-1 flex flex-col items-center">
          {!isConnected && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Wallet Not Connected</span>
            </div>
          )}
          {hasInsufficientGas && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Insufficient Gas Balance</span>
            </div>
          )}
        </div>

        {/* Whitelist Status */}
        {account && (
          <div className="p-2 rounded-lg border border-white/20 bg-white/5 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-xs font-medium text-white">Whitelist Status:</span>
              {checkingWl ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                  <span className="text-xs text-white/70">Checking...</span>
                </div>
              ) : wlEligible ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Whitelisted</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <X className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Not Whitelisted</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/70">
              Being whitelisted unlocks higher per-wallet limits during the whitelist sale window.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {isMinting && (
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-white">
              <span>{currentStep}</span>
              <span>{mintProgress}%</span>
            </div>
            <Progress value={mintProgress} className="w-full" />
          </div>
        )}

        {/* Mint Button */}
        <Button
          onClick={onMint}
          disabled={!canMint || isMinting}
          className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          size="sm"
        >
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Minting...
            </>
          ) : hasInsufficientGas ? (
            <>
              <AlertTriangle className="mr-2 h-3 w-3" />
              Insufficient Gas
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : (
            <>
              <Zap className="mr-2 h-3 w-3" />
              Mint NFTs
            </>
          )}
        </Button>
      </div>
    </SectionCard>
  );
};
