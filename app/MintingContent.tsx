"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ConnectButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  Lock,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Globe,
  Coins,
  Gift,
  Star,
  ArrowRight,
  Info,
  ChevronDown,
  Wallet,
  CreditCard,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  CHAINS,
  USDT_ADDRESSES,
  NFT_CONTRACTS,
} from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { thirdwebClient } from "./provider";

/** ---------------- Types ---------------- **/
type ChainId = "56" | "137" | "42161";
type NftType = "seed" | "tree" | "solar" | "compute";

/** ---------------- Thirdweb Client ---------------- **/
// Client will be obtained from the provider context

/** ---------------- Helper Functions ---------------- **/
function normalizeError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as any).message);
  }
  return "An unexpected error occurred";
}

function networkLabel(chainId: ChainId): string {
  return CHAINS[chainId]?.name ?? `Chain ${chainId}`;
}

/** ---------------- Main Component ---------------- **/
export default function MintingContent() {
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const account = useActiveAccount();

  // State
  const [selectedChainId, setSelectedChainId] = useState<ChainId>("56");
  const [nftType, setNftType] = useState<NftType>("seed");
  const [quantity, setQuantity] = useState("1");
  const [kolDigits, setKolDigits] = useState("");
  const [kolLocked, setKolLocked] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResults, setMintResults] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMobileWalletOptions, setShowMobileWalletOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [nativeBalance, setNativeBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");

  // Derived state
  const chainInfo = CHAINS[selectedChainId];
  const contractAddr = NFT_CONTRACTS[selectedChainId]?.[nftType];
  const usdtAddr = USDT_ADDRESSES[selectedChainId];
  const contractMode: "public" | "whitelist" = "public"; // Simplified for now
  const capForMode = 10000; // Simplified for now
  
  // Max quantities per NFT type
  const getMaxQuantity = (nftType: NftType): number => {
    switch (nftType) {
      case "seed": return 3;
      case "tree": return 2;
      case "solar": return 2;
      case "compute": return 1;
      default: return 1;
    }
  };
  
  const maxPer = getMaxQuantity(nftType);

  // Memoized KOL ID
  const fullKolId = useMemo(() => {
    if (!kolDigits) return null;
    return `AGV${kolDigits}`;
  }, [kolDigits]);

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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mock data for now - in real implementation, these would come from contract reads
  const currentSupply = 0;
  const userMinted = 0;
  const remainingActual = Math.max(0, capForMode - currentSupply);
  const progressPct = Math.min(100, (currentSupply / capForMode) * 100);
  const displayRemaining = remainingActual.toLocaleString();
  const isEligible = true;
  const configAvailable = true;
  const mintingActiveUi = true;

  // Handlers
  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 1) {
      setQuantity("1");
      return;
    }
    if (numValue > maxPer) {
      setQuantity(String(maxPer));
      return;
    }
    setQuantity(String(numValue));
  };

  // Auto-adjust quantity when NFT type changes
  useEffect(() => {
    const currentQuantity = parseInt(quantity) || 1;
    if (currentQuantity > maxPer) {
      setQuantity(String(maxPer));
    }
  }, [nftType, maxPer, quantity]);

  const handleCopyReferralLink = async () => {
    if (!fullKolId) return;
    const url = `${window.location.origin}/${kolDigits}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Copied! Referral link copied to clipboard");
    } catch (err) {
      toast("Failed to copy. Please copy the link manually");
    }
  };

  const handleMint = async () => {
    if (!account) {
      toast("Wallet not connected. Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mintResult = {
        hash: "0x" + Math.random().toString(16).substr(2, 64),
        quantity: Number(quantity),
        nftType,
        chainId: selectedChainId,
        kolId: fullKolId || null,
      };

      setMintResults([mintResult]);
      setShowSuccessModal(true);

      toast(`Mint Successful! Successfully minted ${quantity} ${nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass`);
    } catch (error) {
      toast(`Mint Failed: ${normalizeError(error)}`);
    } finally {
      setIsMinting(false);
    }
  };

  const unitPrice = PASS_PRICES[nftType]?.usd ?? 59;

  if (!contractAddr || !usdtAddr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
            <span className="text-destructive text-sm">
              Contract not loaded for selected network
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        </div>

      <div className="relative max-w-lg mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AGV Protocol
          </h1>
          <p className="text-muted-foreground text-lg">
            Mint Your Exclusive NFT Pass
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {contractMode === "public" ? "Public" : "Whitelist"} Mint
                  </p>
                </div>
              </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Network</div>
                  <div className="font-medium text-foreground">{networkLabel(selectedChainId)}</div>
                </div>
            </div>

            {/* Supply Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Supply Progress</span>
                <span className="font-medium text-foreground">
                  {currentSupply.toLocaleString()} / {capForMode.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{displayRemaining} remaining</span>
                <span>{progressPct.toFixed(1)}% minted</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Connect Wallet Section */}
            <div className="text-center">
              <div className="mb-4">
                <ConnectButton client={thirdwebClient} />
              </div>
              {isMobile && !account && (
                <button
                  onClick={() => setShowMobileWalletOptions(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Open in mobile wallet</span>
                </button>
              )}
            </div>

            {/* Configuration Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Configuration</span>
              </h3>

              {/* Network Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>Network</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedChainId}
                    onChange={(e) => setSelectedChainId(e.target.value as ChainId)}
                    className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {Object.entries(CHAINS).map(([id, chain]) => (
                      <option key={id} value={id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* NFT Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  <span>NFT Type</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["seed", "tree", "solar", "compute"].map((type) => {
                    const typeKey = type as NftType;
                    const maxQty = getMaxQuantity(typeKey);
                    return (
                      <button
                        key={type}
                        onClick={() => setNftType(typeKey)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          nftType === type
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {type.charAt(0).toUpperCase() + type.slice(1)}Pass
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${PASS_PRICES[typeKey]?.usd ?? 59} • Max {maxQty}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>Quantity</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={maxPer}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    Max {maxPer}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum {maxPer} {nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass per wallet
                </p>
              </div>

              {/* KOL Referral ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <span>Referral ID (Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 6-digit referral code"
                    value={kolDigits}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setKolDigits(value);
                    }}
                    readOnly={kolLocked}
                    className={`w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      kolLocked ? "bg-slate-100 dark:bg-slate-600 cursor-not-allowed" : ""
                    }`}
                  />
                  {kolLocked && (
                    <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {kolLocked && (
                  <p className="text-xs text-muted-foreground flex items-center space-x-1">
                    <Info className="h-3 w-3" />
                    <span>ID locked from referral link</span>
                  </p>
                )}
              </div>
            </div>

            {/* KOL Referral Banner */}
            {fullKolId && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Referred by: {fullKolId}
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        You'll receive referral benefits
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyReferralLink}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unit Price</span>
                  <span className="font-medium text-foreground">${unitPrice} USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="font-medium text-foreground">{quantity}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-500 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ${(unitPrice * Number(quantity || 0)).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
                {account && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Your USDT Balance</span>
                    <span>{usdtBalance} USDT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={
                !account ||
                isMinting ||
                !isEligible ||
                remainingActual === 0 ||
                !configAvailable ||
                !mintingActiveUi
              }
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 group"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Minting Your NFT...</span>
                </>
              ) : (
                <>
                  <span>Mint {quantity} {nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <div className="font-medium mb-1">Secure Transaction</div>
                <div>Your payment is processed securely through USDT on the blockchain. No personal data is stored.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md w-full">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Mint Successful!</h3>
                <p className="text-muted-foreground">
                  Your NFT has been minted and added to your wallet
                </p>
              </div>

              {/* Transaction Details */}
              {mintResults.map((result, index) => (
                <div key={index} className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">NFT Type</span>
                      <span className="font-medium text-foreground">
                        {result.quantity}x {result.nftType.charAt(0).toUpperCase() + result.nftType.slice(1)}Pass
                      </span>
                    </div>
                    {result.kolId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Referral</span>
                        <span className="font-medium text-foreground">{result.kolId}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="font-medium text-foreground">{networkLabel(result.chainId)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="space-y-3">
                <a
                  href={`${chainInfo.explorer}/tx/${mintResults[0]?.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on Explorer</span>
                </a>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}