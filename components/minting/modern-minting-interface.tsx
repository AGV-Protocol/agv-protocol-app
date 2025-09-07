"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle, X, Loader2, ExternalLink, Copy, Wallet, Zap, Shield, Globe, Lock, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Image from "next/image";
import { thirdwebClient, WalletConnect, WalletStatus } from "@/components/wallet/wallet-connect";
import { useActiveAccount } from "thirdweb/react";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useWalletBalance } from "thirdweb/react";
import { NFT_CONTRACTS, USDT_ADDRESSES } from "@/lib/contracts";
import { createThirdwebClient, defineChain } from "thirdweb";

/** ---------------- Types ---------------- **/
type ChainId = "56" | "137" | "42161";
type NftType = "seed" | "tree" | "solar" | "compute";
type MintMode = "public" | "agent";

/** ---------------- Constants ---------------- **/
export const CHAINS = {
  "56": {
    chainId: "56",
    name: "Binance Smart Chain",
    symbol: "BNB",
    chain: defineChain(56),
  },
  "137": {
    chainId: "137",
    name: "Polygon",
    symbol: "MATIC",
    chain: defineChain(137),
  },
  "42161": {
    chainId: "42161",
    name: "Arbitrum One",
    symbol: "ETH",
    chain: defineChain(42161),
  },
};


const PASS_PRICES = {
  seed: 29,
  tree: 59,
  solar: 299,
  compute: 899,
} as const;

const NFT_INFO = {
  seed: { name: "SeedPass", description: "Access to basic features", color: "bg-blue-500" },
  tree: { name: "TreePass", description: "Enhanced capabilities", color: "bg-green-500" },
  solar: { name: "SolarPass", description: "Premium features", color: "bg-yellow-500" },
  compute: { name: "ComputePass", description: "Full platform access", color: "bg-purple-500" },
} as const;

const PUBLIC_MINT_CAPS: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 400, "137": 400, "42161": 400 },
  tree: { "56": 200, "137": 200, "42161": 200 },
  solar: { "56": 0, "137": 0, "42161": 0 },
  compute: { "56": 0, "137": 0, "42161": 0 },
} as const;

const MAX_PER_WALLET: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 3, "137": 3, "42161": 3 },
  tree: { "56": 2, "137": 2, "42161": 2 },
  solar: { "56": 1, "137": 1, "42161": 1 },
  compute: { "56": 1, "137": 1, "42161": 1 },
} as const;

export default function ModernMintingInterface() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const account = useActiveAccount();
  const isConnected = !!account;
  const chainId = (account as any)?.chain?.id?.toString() || "56";

  // KOL Referral State
  const [kolDigits, setKolDigits] = useState(""); // 0-6 digits only
  const [kolLocked, setKolLocked] = useState(false); // locked when from referral
  const fullKolId = useMemo(
    () => (kolDigits && kolDigits.length === 6 ? `AGV-KOL${kolDigits}` : ""),
    [kolDigits]
  );

  // State
  const [selectedChain, setSelectedChain] = useState<ChainId>("56");
  const [mintMode, setMintMode] = useState<MintMode>("public");
  const [quantities, setQuantities] = useState<Record<NftType, number>>({
    seed: 0,
    tree: 0,
    solar: 0,
    compute: 0,
  });
  const [isMinting, setIsMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintResults, setMintResults] = useState<any[]>([]);
  const [hasInsufficientGas, setHasInsufficientGas] = useState(false);

  // Computed values
  const totalCost = useMemo(() => {
    return Object.entries(quantities).reduce((total, [type, qty]) => {
      return total + (qty * PASS_PRICES[type as NftType]);
    }, 0);
  }, [quantities]);

  const totalQuantity = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  const canMint = useMemo(() => {
    return totalQuantity > 0 && totalCost > 0 && isConnected && !hasInsufficientGas;
  }, [totalQuantity, totalCost, isConnected, hasInsufficientGas]);

  // Handlers
  const handleQuantityChange = (type: NftType, value: number) => {
    const maxAllowed = MAX_PER_WALLET[type][selectedChain];
    const newValue = Math.max(0, Math.min(value, maxAllowed));

    setQuantities(prev => ({
      ...prev,
      [type]: newValue
    }));
  };

  // Remove the old handleConnectWallet function since we're using the wallet provider

  const handleMint = async () => {
    if (!canMint) return;

    setIsMinting(true);
    setMintProgress(0);
    setCurrentStep("Preparing transaction...");

    try {
      // Simulate minting process
      const steps = [
        "Preparing transaction...",
        "Approving USDT...",
        "Minting NFTs...",
        "Confirming transaction...",
        "Finalizing..."
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setMintProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Simulate successful mint
      const results = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([type, qty]) => ({
          type,
          quantity: qty,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          cost: qty * PASS_PRICES[type as NftType],
          kolId: fullKolId || null
        }));

      setMintResults(results);
      setShowSuccess(true);
      toast.success("NFTs minted successfully!");

      // Reset quantities
      setQuantities({ seed: 0, tree: 0, solar: 0, compute: 0 });

    } catch (error) {
      toast.error("Minting failed. Please try again.");
    } finally {
      setIsMinting(false);
      setMintProgress(0);
      setCurrentStep("");
    }
  };

  // Sync kolId from URL params (ref is alias) and LOCK if prefilled
  useEffect(() => {
    const qp = (searchParams?.get("kolId") ?? searchParams?.get("ref") ?? "").trim();
    let digits = "";
    if (qp) digits = (qp.match(/\d{6}/) || [])[0] || "";

    if (!digits && pathname) {
      const m = pathname.match(/\/(\d{6})(?:$|[/?#])/);
      if (m) digits = m[1];
    }

    if (digits) {
      setKolDigits(digits);
      setKolLocked(true); // lock if from referral link
    }
  }, [searchParams, pathname]);

  const handleCopyReferralLink = () => {
    const link = `${window.location.origin}/?kolId=${fullKolId}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied to clipboard");
  };

  // Gas balance calculations
  
  const chainInfo = CHAINS[(chainId ?? "56") as ChainId];
  const contractAddr = NFT_CONTRACTS[selectedChain]?.["seed"];
  const usdtAddr = USDT_ADDRESSES[(chainId ?? "56") as ChainId];
  
  // Wallet balance hooks
  const { data: usdtData } = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
    tokenAddress: usdtAddr,
  });
  
  const { data: nativeData } = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
  });

  // Gas thresholds for different chains
  const GAS_THRESHOLDS: Record<ChainId, number> = {
    "56": 0.005,    // BSC
    "137": 0.01,    // Polygon
    "42161": 0.001, // Arbitrum
  } as const;

  // Memoized gas calculations
  const gasInfo = useMemo(() => {
    if (!nativeData?.displayValue) {
      return {
        currentGas: 0,
        minRequired: GAS_THRESHOLDS[(chainId ?? "56") as ChainId],
        isInsufficient: false,
        symbol: chainInfo.symbol,
      };
    }

    const currentGas = parseFloat(nativeData.displayValue);
    const minRequired = GAS_THRESHOLDS[(chainId ?? "56") as ChainId];
    const isInsufficient = currentGas < minRequired;

    return {
      currentGas,
      minRequired,
      isInsufficient,
      symbol: chainInfo.symbol,
    };
  }, [nativeData?.displayValue, chainId, chainInfo.symbol]);

  // Update insufficient gas state when gas info changes
  useEffect(() => {
    setHasInsufficientGas(gasInfo.isInsufficient);
  }, [gasInfo.isInsufficient]);
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Image
            src="/logo.svg"
            alt="AGV Protocol"
            width={48}
            height={48}
            className="h-12 w-12"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AGV Protocol
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mint exclusive NFTs and join the future of decentralized computing
        </p>
      </div>

      {/* KOL Referral Banner */}
      {fullKolId && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Referred by KOL</p>
                  <p className="text-sm text-muted-foreground">KOL ID: {fullKolId}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyReferralLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Minting Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chain Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Select Network</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(CHAINS).map(([chainId, chain]) => (
                  <Button
                    key={chainId}
                    variant={selectedChain === chainId ? "default" : "outline"}
                    onClick={() => setSelectedChain(chainId as ChainId)}
                    className="h-auto p-4 flex flex-col space-y-2"
                  >
                    <span className="font-semibold">{chain.name}</span>
                    <span className="text-sm text-muted-foreground">{chain.symbol}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Minting Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Minting Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={mintMode} onValueChange={(value: string) => setMintMode(value as MintMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="public">Public Mint</TabsTrigger>
                  <TabsTrigger value="agent">Agent Mint</TabsTrigger>
                </TabsList>
                <TabsContent value="public" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mint NFTs directly from the public collection
                  </p>
                </TabsContent>
                <TabsContent value="agent" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mint through an authorized agent (coming soon)
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* NFT Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select NFTs to Mint</CardTitle>
              <CardDescription>
                Choose the quantity for each NFT type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(NFT_INFO).map(([type, info]) => {
                const nftType = type as NftType;
                const maxAllowed = MAX_PER_WALLET[nftType][selectedChain];
                const isAvailable = PUBLIC_MINT_CAPS[nftType][selectedChain] > 0;

                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${info.color}`} />
                        <div>
                          <h3 className="font-semibold">{info.name}</h3>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${PASS_PRICES[nftType]}</p>
                        <p className="text-sm text-muted-foreground">Max: {maxAllowed}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(nftType, quantities[nftType] - 1)}
                        disabled={quantities[nftType] <= 0 || !isAvailable}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={maxAllowed}
                        value={quantities[nftType]}
                        onChange={(e) => handleQuantityChange(nftType, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        disabled={!isAvailable}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(nftType, quantities[nftType] + 1)}
                        disabled={quantities[nftType] >= maxAllowed || !isAvailable}
                      >
                        +
                      </Button>
                      {!isAvailable && (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* KOL ID Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Referral ID</span>
              </CardTitle>
              <CardDescription>
                ID (6 digits, Optional - "Only input an ID if you were given one"){" "}
                {kolLocked && (
                  <span className="text-muted-foreground text-xs">
                    <Lock className="inline h-3 w-3 mr-1" />
                    Locked from referral link
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  id="kolDigits"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={kolDigits}
                  readOnly={kolLocked}
                  onChange={(e) => {
                    if (kolLocked) return;
                    setKolDigits(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  placeholder="e.g. 123456"
                  className={cn(
                    "text-center text-lg font-mono tracking-wider",
                    kolLocked && "bg-muted cursor-not-allowed"
                  )}
                />
                
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(quantities).map(([type, qty]) => {
                if (qty === 0) return null;
                const nftType = type as NftType;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${NFT_INFO[nftType].color}`} />
                      <span className="text-sm">{NFT_INFO[nftType].name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{qty} × ${PASS_PRICES[nftType]}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(qty * PASS_PRICES[nftType]).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {totalQuantity === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No items selected yet
                </p>
              )}

              {totalQuantity > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalCost.toLocaleString()}</span>
                  </div>
                </>
              )}

              {isConnected && (
                <p className="text-xs text-muted-foreground text-center">
                  Payment will be processed in {CHAINS[selectedChain].symbol} (USDT equivalent)
                </p>
              )}
              {account && usdtData?.displayValue && (
                <p className="text-xs text-muted-foreground">
                  Your USDT: {usdtData.displayValue} {usdtData.symbol}
                </p>
              )}
              
              {account && nativeData && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Your {gasInfo.symbol}: {gasInfo.currentGas.toFixed(6)} {gasInfo.symbol}
                  </p>
                  {gasInfo.isInsufficient && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Insufficient gas. Minimum required: {gasInfo.minRequired} {gasInfo.symbol}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Connection & Minting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Connect & Mint</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Wallet Status */}
              <WalletStatus />

              {/* Wallet Connect Button */}
              <div className="flex justify-center">
                <WalletConnect />
              </div>

              {isMinting && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{currentStep}</span>
                    <span>{mintProgress}%</span>
                  </div>
                  <Progress value={mintProgress} className="w-full" />
                </div>
              )}

              {hasInsufficientGas && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Insufficient Gas Balance</p>
                      <p className="text-amber-700">
                        You need at least {gasInfo.minRequired} {gasInfo.symbol} to cover transaction fees.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleMint}
                disabled={!canMint || isMinting}
                className="w-full"
                size="lg"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : hasInsufficientGas ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Insufficient Gas
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Mint NFTs
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}