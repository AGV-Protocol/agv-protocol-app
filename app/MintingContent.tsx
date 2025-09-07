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
  const [chainId, setChainId] = useState<ChainId>("56");
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
  const chainInfo = CHAINS[chainId];
  const contractAddr = NFT_CONTRACTS[chainId]?.[nftType];
  const usdtAddr = USDT_ADDRESSES[chainId];
  const contractMode: "public" | "whitelist" = "public"; // Simplified for now
  const capForMode = 10000; // Simplified for now
  const maxPer = 10; // Simplified for now

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
        chainId,
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-full bg-card rounded-xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <Image src="/logo.svg" alt="AGV Protocol Logo" height={32} width={32} />
            <h2 className="text-xl font-bold text-foreground">
              AGV NFT Mint
            </h2>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border border-border rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Connect Wallet */}
            <div className="text-center">
              <ConnectButton client={thirdwebClient} />
              {isMobile && !account && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowMobileWalletOptions(true)}
                    className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    Having trouble? Open in mobile wallet
                  </button>
                </div>
              )}
            </div>

            {/* Supply/Cap Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-2">
                <span>
                  {nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass {contractMode === "public" ? "Public" : "Whitelist"} Mint
                </span>
                <span>{`Cap (${networkLabel(chainId)} / ${
                  contractMode === "public" ? "Public" : "Whitelist"
                }): ${capForMode}`}</span>
              </div>
              <div className="flex justify-end text-sm text-blue-700 dark:text-blue-300">
                <span>Available: {displayRemaining}</span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Network Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Network</label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value as ChainId)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {Object.entries(CHAINS).map(([id, chain]) => (
                  <option key={id} value={id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* NFT Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">NFT Type</label>
              <select
                value={nftType}
                onChange={(e) => setNftType(e.target.value as NftType)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {["seed", "tree", "solar", "compute"].map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}Pass
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <input
                type="number"
                min="1"
                max={maxPer}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground">
                Max {maxPer} per wallet
              </p>
            </div>

            {/* KOL Referral ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="6 digits (Optional - Only input an ID if you were given one)"
                  value={kolDigits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setKolDigits(value);
                  }}
                  readOnly={kolLocked}
                  className={`w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
                    kolLocked ? "bg-muted cursor-not-allowed" : ""
                  }`}
                />
                {kolLocked && (
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {kolLocked && (
                <p className="text-xs text-muted-foreground">
                  ID locked from referral link
                </p>
              )}
            </div>

            {/* KOL Referral Banner */}
            {fullKolId && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Referred by: {fullKolId}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyReferralLink}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Unit Price: ${unitPrice} USDT</p>
              <p className="font-semibold text-foreground">
                Total: {(unitPrice * Number(quantity || 0)).toFixed(2)} USDT
              </p>
              {account && (
                <p className="text-xs text-muted-foreground">
                  Payment will be processed in USDT only
                </p>
              )}
              {account && (
                <p className="text-xs text-muted-foreground">
                  Your USDT: {usdtBalance} USDT
                </p>
              )}
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
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Minting...</span>
                </>
              ) : (
                <span>Mint {quantity} {nftType.charAt(0).toUpperCase() + nftType.slice(1)}Pass</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Mint Successful!</h3>
              {mintResults.map((result, index) => (
                <div key={index} className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Successfully minted {result.quantity} {result.nftType.charAt(0).toUpperCase() + result.nftType.slice(1)}Pass
                  </p>
                  {result.kolId && (
                    <p className="text-muted-foreground">
                      Referred by: {result.kolId}
                    </p>
                  )}
                  <a
                    href={`${chainInfo.explorer}/tx/${result.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <span>View Transaction</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}