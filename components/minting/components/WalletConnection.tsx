import React, { useState, useEffect, useMemo, useRef } from "react";
import { Wallet, AlertTriangle, Loader2, CheckCircle, X, Zap, Shield, Plus, Minus, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { SectionCard } from "./SectionCard";
import { toast } from "sonner";
import { thirdwebClient } from "@/components/wallet/wallet-connect";
import { useActiveAccount, useWalletBalance, useReadContract, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { NFT_CONTRACTS, USDT_ADDRESSES, USDT_ABI, SEED_ABI, TREE_ABI, SOLAR_ABI, COMPUTE_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { defineChain, getContract, prepareContractCall, sendTransaction, waitForReceipt, sendAndConfirmTransaction } from "thirdweb";
import { parseUnits } from "viem";
import { recordSuccessfulMintStrict } from "@/lib/recordMint";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";

/** ---------------- Types ---------------- **/
type MintMode = "public" | "agent";
type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;

/** ---------------- Sale Caps & Limits ---------------- **/
const MODE_CAPS_BY_CHAIN: Record<
  NftType,
  Record<ChainId, { whitelist: number; public: number }>
> = {
  seed: {
    "56": { whitelist: 100, public: 250 },
    "137": { whitelist: 50, public: 100 },
    "42161": { whitelist: 50, public: 50 },
  },
  tree: {
    "56": { whitelist: 50, public: 150 },
    "137": { whitelist: 25, public: 50 },
    "42161": { whitelist: 25, public: 50 },
  },
  solar: {
    "56": { whitelist: 100, public: 50 },
    "137": { whitelist: 50, public: 25 },
    "42161": { whitelist: 50, public: 25 },
  },
  compute: {
    "56": { whitelist: 40, public: 10 },
    "137": { whitelist: 29, public: 5 },
    "42161": { whitelist: 29, public: 5 },
  },
} as const;

const MAX_PER_WALLET: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 3, "137": 3, "42161": 3 },
  tree: { "56": 2, "137": 2, "42161": 2 },
  solar: { "56": 2, "137": 2, "42161": 2 },
  compute: { "56": 1, "137": 1, "42161": 1 },
} as const;

/** ---------------- NFT metadata (UI only) ---------------- **/
const NFT_INFO = {
  seed: { name: "SeedPass", description: "Access to basic features", color: "bg-blue-500" },
  tree: { name: "TreePass", description: "Enhanced capabilities", color: "bg-green-500" },
  solar: { name: "SolarPass", description: "Premium features", color: "bg-yellow-500" },
  compute: { name: "ComputePass", description: "Full platform access", color: "bg-purple-500" },
} as const;

/** Correct USDT decimals per chain (fallback) */
const USDT_DECIMALS_FALLBACK: Record<ChainId, number> = {
  "56": 18,
  "137": 6,
  "42161": 6,
} as const;

/** helper for short addr */
const short = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

interface WalletConnectionProps {
  // Remove these props since we'll handle them internally
  // isConnected: boolean;
  // hasInsufficientGas: boolean;
  // isMinting: boolean;
  // currentStep: string;
  // mintProgress: number;
  // canMint: boolean;
  // onMint: () => void;
  // account?: any;
  // checkingWl: boolean;
  // wlEligible: boolean;
}

export const WalletConnection: React.FC<WalletConnectionProps> = () => {
  // Wallet and chain state
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const isConnected = !!account;
  const chainId = (account as any)?.chain?.id?.toString() || "56";

  const CHAINS = useMemo(() => ({
    "56": { chainId: "56", name: "Binance Smart Chain", symbol: "BNB", chain: defineChain(56) },
    "137": { chainId: "137", name: "Polygon", symbol: "MATIC", chain: defineChain(137) },
    "42161": { chainId: "42161", name: "Arbitrum One", symbol: "ETH", chain: defineChain(42161) },
  }), []);

  // KOL Referral
  const [kolDigits, setKolDigits] = useState("");
  const [kolLocked, setKolLocked] = useState(false);
  const fullKolId = useMemo(() => (kolDigits && kolDigits.length === 6 ? `AGV-KOL${kolDigits}` : ""), [kolDigits]);

  // State
  const [selectedChain, setSelectedChain] = useState<ChainId>("56");
  const [mintMode, setMintMode] = useState<MintMode>("public");
  const [quantities, setQuantities] = useState<Record<NftType, number>>({ seed: 0, tree: 0, solar: 0, compute: 0 });
  const [isMinting, setIsMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintResults, setMintResults] = useState<any[]>([]);
  const [hasInsufficientGas, setHasInsufficientGas] = useState(false);

  const [wlEligible, setWlEligible] = useState(false);
  const [checkingWl, setCheckingWl] = useState(false);
  const wlCheckedAddressRef = useRef<string | null>(null);
  
  const [txHash, setTxHash] = useState<string>("");
  const [progressStage, setProgressStage] = useState<"approval" | "mint" | "confirming" | "success" | "timeout" | "error">("approval");
  const [pendingApprovalTx, setPendingApprovalTx] = useState<ReturnType<typeof prepareContractCall> | null>(null);
  const [pendingMintTx, setPendingMintTx] = useState<ReturnType<typeof prepareContractCall> | null>(null);

  /** -------- Helpers: sale-mode-aware caps -------- **/
  const saleMode: "whitelist" | "public" = wlEligible ? "whitelist" : "public";

  const getModeCap = (type: NftType, chain: ChainId) =>
    MODE_CAPS_BY_CHAIN[type][chain][saleMode];

  const getPerWalletMax = (type: NftType, chain: ChainId) =>
    MAX_PER_WALLET[type][chain];

  const getMaxSelectableFor = (type: NftType, chain: ChainId) =>
    Math.min(getPerWalletMax(type, chain), getModeCap(type, chain));

  // Calculated totals
  const totalCost = useMemo(() => {
    return (Object.entries(quantities) as [NftType, number][])
      .reduce((total, [type, qty]) => total + qty * Number((PASS_PRICES as any)[type]?.usd ?? 0), 0);
  }, [quantities]);

  const totalQuantity = useMemo(() => Object.values(quantities).reduce((s, q) => s + q, 0), [quantities]);

  const canMint = useMemo(() => {
    if (!isConnected || hasInsufficientGas) return false;
    if (totalQuantity === 0 || totalCost <= 0) return false;
    const picked = Object.entries(quantities).filter(([, q]) => q > 0);
    if (picked.length !== 1) return false;
    const [pickedType, pickedQty] = picked[0] as [NftType, number];
    const allowed = getMaxSelectableFor(pickedType, selectedChain);
    return allowed > 0 && pickedQty <= allowed;
  }, [isConnected, hasInsufficientGas, totalQuantity, totalCost, quantities, selectedChain, saleMode]);

  const handleQuantityChange = (type: NftType, value: number) => {
    const maxAllowed = getMaxSelectableFor(type, selectedChain);
    const newValue = Math.max(0, Math.min(value, maxAllowed));
    setQuantities(prev =>
      newValue > 0
        ? ({ seed: 0, tree: 0, solar: 0, compute: 0, [type]: newValue } as Record<NftType, number>)
        : { ...prev, [type]: newValue }
    );
  };

  const resolveUsdtAddress = (chain: ChainId) => {
    const byString = (USDT_ADDRESSES as Record<string, string>)?.[chain];
    const byNumber = (USDT_ADDRESSES as Record<number, string>)?.[Number(chain)];
    return byString || byNumber || "";
  };

  const resolveNftAddress = (nftType: NftType, chain: ChainId) => {
    const byTypeThenChain =
      (NFT_CONTRACTS as Record<string, Record<string | number, string>>)?.[nftType]?.[chain] ||
      (NFT_CONTRACTS as Record<string, Record<string | number, string>>)?.[nftType]?.[Number(chain)];
    const byChainThenType =
      (NFT_CONTRACTS as Record<string | number, Record<string, string>>)?.[chain]?.[nftType] ||
      (NFT_CONTRACTS as Record<string | number, Record<string, string>>)?.[Number(chain)]?.[nftType];
    return byTypeThenChain || byChainThenType || "";
  };

  /** Reflect wallet network -> UI selection */
  useEffect(() => {
    const activeId = activeChain?.id;
    if (!activeId) return;
    const asStr = String(activeId) as ChainId;
    if (asStr === "56" || asStr === "137" || asStr === "42161") {
      setSelectedChain(asStr);
    }
  }, [activeChain?.id]);

  const chainInfo = CHAINS[selectedChain];

  const getSelectedNftType = (): NftType => {
    for (const [type, qty] of Object.entries(quantities)) if (qty > 0) return type as NftType;
    return "seed";
  };
  const selectedNftType = getSelectedNftType();

  const contractAddr = resolveNftAddress(selectedNftType, selectedChain);
  const usdtAddr = resolveUsdtAddress(selectedChain);

  const getNftAbi = (nftType: NftType) => {
    switch (nftType) {
      case "seed": return SEED_ABI;
      case "tree": return TREE_ABI;
      case "solar": return SOLAR_ABI;
      case "compute": return COMPUTE_ABI;
      default: return SEED_ABI;
    }
  };

  const nftContract = useMemo(() => contractAddr ? getContract({ client: thirdwebClient, address: contractAddr, chain: chainInfo.chain, abi: getNftAbi(selectedNftType) as any }) : null, [contractAddr, chainInfo.chain, selectedNftType]);
  const usdtContract = useMemo(() => usdtAddr ? getContract({ client: thirdwebClient, address: usdtAddr, chain: chainInfo.chain, abi: USDT_ABI }) : null, [usdtAddr, chainInfo.chain]);

  const { data: usdtDecimalsData } = useReadContract({
    contract: usdtContract!,
    method: "decimals",
    params: [],
    queryOptions: { enabled: !!usdtContract },
  });

  function safeStringifyError(err: unknown) {
    try {
      if (err instanceof Error) {
        const plain: Record<string, unknown> = {};
        Object.getOwnPropertyNames(err).forEach((k) => (plain[k] = (err as any)[k]));
        if ((err as any).cause) plain.cause = safeStringifyError((err as any).cause);
        return JSON.stringify(plain);
      }
      return JSON.stringify(err);
    } catch {
      try { return String(err); } catch { return "Unstringifiable error"; }
    }
  }
  function extractErrorMessage(e: unknown): string {
    const any = e as Record<string, any> | undefined;
    const msg =
      any?.shortMessage || any?.message || any?.reason ||
      any?.error?.data?.message || any?.error?.message ||
      any?.data?.message || any?.details ||
      any?.cause?.shortMessage || any?.cause?.message || any?.cause?.reason;
    if (typeof msg === "string" && msg) return msg;
    return safeStringifyError(e);
  }
  const normalizeError = (e: unknown) => extractErrorMessage(e);

  const usdtBalanceResult = useWalletBalance({ client: thirdwebClient, chain: chainInfo.chain, address: account?.address, tokenAddress: usdtAddr });
  const usdtData = usdtBalanceResult?.data || undefined;

  const nativeBalanceResult = useWalletBalance({ client: thirdwebClient, chain: chainInfo.chain, address: account?.address });
  const nativeData = nativeBalanceResult?.data || undefined;

  const gasInfo = useMemo(() => {
    const GAS_THRESHOLDS: Record<ChainId, number> = { "56": 0.005, "137": 0.01, "42161": 0.001 } as const;
    const currentGas = parseFloat(nativeData?.displayValue ?? "0");
    const minRequired = GAS_THRESHOLDS[selectedChain];
    const symbol = CHAINS[selectedChain].symbol;
    return { currentGas, minRequired, isInsufficient: currentGas < minRequired, symbol };
  }, [nativeData?.displayValue, selectedChain, CHAINS]);

  useEffect(() => { setHasInsufficientGas(gasInfo.isInsufficient); }, [gasInfo.isInsufficient]);

  useEffect(() => {
    const run = async () => {
      if (!account?.address) { setWlEligible(false); wlCheckedAddressRef.current = null; return; }
      if (wlCheckedAddressRef.current === account.address) return;
      try {
        setCheckingWl(true);
        const res = await fetch(`/api/merkle-proof?address=${account.address}`, { cache: "no-store" });
        let whitelisted = false;
        if (res.ok) {
          const data = await res.json();
          whitelisted = !!data?.whitelisted;
        }
        setWlEligible(whitelisted);
      } catch { setWlEligible(false); }
      finally { setCheckingWl(false); wlCheckedAddressRef.current = account.address; }
    };
    run();
  }, [account?.address]);

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  /** ---- Confirmation toast (dark) that resolves/rejects ---- */
  const requestApproveConfirmation = (amount: number, spender?: string, chainName?: string) =>
    new Promise<void>((resolve, reject) => {
      toast.custom((t) => (
        <div className="w-[360px] rounded-xl bg-neutral-900 text-white border border-white/10 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Confirm USDT approval</p>
              <p className="text-xs text-white/70 mt-1">
                Request from <span className="font-medium">mint.agvprotocol.org</span>{chainName ? ` • ${chainName}` : ""}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-white/70">Spending cap</span>
                <span className="font-semibold">{amount.toFixed(2)} USDT</span>
              </div>
              {spender && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-white/60">Spender</span>
                  <span className="font-mono">{short(spender)}</span>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { toast.dismiss(t); reject(new Error("User cancelled")); }}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { toast.dismiss(t); resolve(); }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      ), { duration: Infinity });
    });

  const prepareTransactions = async () => {
    if (!account?.address) { toast.error("Please connect your wallet to proceed with minting."); throw new Error("Wallet not connected"); }
    if (!canMint) { toast.error("Please check your minting eligibility."); throw new Error("Not eligible for minting"); }

    const selectedTypes = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    if (selectedTypes.length === 0) throw new Error("Please select at least one NFT to mint");
    if (selectedTypes.length > 1) throw new Error("Please select only one NFT type at a time");
    const [selectedType, selectedQty] = selectedTypes[0] as [NftType, number];
    const nftType = selectedType;
    const quantity = selectedQty;
    if (quantity < 1) throw new Error("Quantity must be at least 1");

    const allowed = getMaxSelectableFor(nftType, selectedChain);
    if (allowed === 0 || quantity > allowed) {
      throw new Error("Selected quantity exceeds current minting cap.");
    }

    if (!isValidAddress(contractAddr)) { const msg = `Missing/invalid NFT contract address for ${nftType} on chain ${selectedChain}`; toast.error(msg); throw new Error(msg); }
    if (!isValidAddress(usdtAddr)) { const msg = `Missing/invalid USDT address on chain ${selectedChain}`; toast.error(msg); throw new Error(msg); }

    const localNft = getContract({ client: thirdwebClient, address: contractAddr, chain: CHAINS[selectedChain].chain, abi: getNftAbi(nftType) as any });
    const localUsdt = getContract({ client: thirdwebClient, address: usdtAddr, chain: CHAINS[selectedChain].chain, abi: USDT_ABI });

    if (fullKolId) { const q = query(collection(db, "kols"), where("kolId", "==", fullKolId)); await getDocs(q).catch(() => void 0); }

    try {
      const target = CHAINS[selectedChain].chain;
      const currentId = activeChain?.id;
      const targetId = (target as any)?.id ?? parseInt(selectedChain, 10);
      if (!currentId || currentId !== targetId) await switchChain?.(target);
    } catch {
      // ignore; wallet can still prompt during tx
    }

    const unitPriceUsd = Number((PASS_PRICES as any)[nftType]?.usd ?? 0);
    const totalCostUsd = quantity * unitPriceUsd;
    const decimals = (typeof usdtDecimalsData === "number" ? usdtDecimalsData : undefined) ?? USDT_DECIMALS_FALLBACK[selectedChain];
    const amountToApprove = parseUnits(String(totalCostUsd), decimals);

    console.debug("USDT approval params", { totalCostUsd, quantity, decimals, amountToApprove: amountToApprove.toString(), usdtAddr, spender: contractAddr, chain: selectedChain });

    const approveTx = prepareContractCall({ contract: localUsdt, method: "approve", params: [contractAddr, amountToApprove] });
    const mintTx = prepareContractCall({ contract: localNft, method: "mint", params: [BigInt(quantity), []] });

    setPendingApprovalTx(approveTx);
    setPendingMintTx(mintTx);

    return { approveTx, mintTx, totalCostUsd, quantity, nftType };
  };

  const handleSpendingCapConfirm = async (txs?: {
    approveTx: ReturnType<typeof prepareContractCall>;
    mintTx: ReturnType<typeof prepareContractCall>;
  }) => {
    try {
      setProgressStage("approval");
      setCurrentStep("Approving USDT spending…");
      setMintProgress(30);
      toast.info("Please approve USDT spending in your wallet.");

      const approveToUse = txs?.approveTx ?? pendingApprovalTx;
      const mintToUse    = txs?.mintTx ?? pendingMintTx;

      if (!approveToUse) throw new Error("Approval transaction not prepared");
      const approveRes = await sendTransaction({ transaction: approveToUse, account: account! });
      if (approveRes?.transactionHash) setTxHash(approveRes.transactionHash);

      const approveReceipt = await waitForReceipt({
        client: thirdwebClient,
        chain: chainInfo.chain,
        transactionHash: approveRes.transactionHash,
      });
      if (approveReceipt.status !== "success") throw new Error("Approval failed on-chain");

      toast.success("USDT spending approved. Proceeding with mint…");
      setProgressStage("mint");
      setCurrentStep("Executing mint transaction…");
      setMintProgress(60);

      if (!mintToUse) throw new Error("Mint transaction not prepared");
      const receipt = await sendAndConfirmTransaction({ transaction: mintToUse, account: account! });

      setProgressStage("confirming");
      setMintProgress(85);
      if (receipt?.transactionHash) setTxHash(receipt.transactionHash);

      await handleTransactionSuccess(receipt);
    } catch (error) {
      handleTransactionError(error);
      throw error;
    }
  };

  const handleTransactionSuccess = async (receipt: { transactionHash?: string } | null) => {
    setProgressStage("success"); setCurrentStep("Minted successfully!"); setMintProgress(100); setIsMinting(false);
    const currentSelectedType = getSelectedNftType();
    const currentQuantity = quantities[currentSelectedType];
    toast.success(`Successfully minted ${currentQuantity} ${currentSelectedType}Pass NFT${currentQuantity > 1 ? "s" : ""}`);
    try {
      const results = (Object.entries(quantities) as [NftType, number][])
        .filter(([, qty]) => qty > 0)
        .map(([type, qty]) => ({
          type,
          quantity: qty,
          txHash: receipt?.transactionHash || txHash,
          cost: qty * Number((PASS_PRICES as any)[type]?.usd ?? 0),
          kolId: fullKolId || null
        }));
      setMintResults(results); setShowSuccess(true);
      await recordSuccessfulMintStrict(db, fullKolId, { address: account?.address!, nftType: currentSelectedType, quantity: currentQuantity, chainId: selectedChain as any, txHash: receipt?.transactionHash || txHash, timestamp: new Date(), mintType: "public" });
      toast.success("Mint recorded successfully");
    } catch (error) {
      console.error("Error recording mint:", error);
      toast.error("NFT minted successfully but failed to update records (non-critical)");
    }
    setQuantities({ seed: 0, tree: 0, solar: 0, compute: 0});
    setTimeout(() => { setProgressStage("approval"); setTxHash(""); setCurrentStep(""); setMintProgress(0); }, 1200);
  };

  const handleTransactionError = (err: unknown) => {
    const errorMessage = normalizeError(err);
    console.error("Transaction error:", err);
    setCurrentStep(`Error: ${errorMessage}`);
    setIsMinting(false);
    setMintProgress(0);
    setProgressStage("error");
    toast.error(`Transaction failed: ${errorMessage}`);
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);
      setMintProgress(10);
      setCurrentStep("Preparing transaction…");

      const prep = await prepareTransactions();
      setMintProgress(25);
      setCurrentStep("Awaiting your confirmation…");

      await requestApproveConfirmation(prep.totalCostUsd, contractAddr, CHAINS[selectedChain].name);

      await handleSpendingCapConfirm({ approveTx: prep.approveTx, mintTx: prep.mintTx });
    } catch (e) {
      if ((e as Error)?.message === "User cancelled") {
        toast.message("Approval cancelled");
      } else {
        toast.error(`Unable to proceed: ${normalizeError(e)}`);
      }
      setIsMinting(false);
      setMintProgress(0);
      setCurrentStep("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Select NFT to Mint */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-green-500 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Select NFT to mint</h3>
            <p className="text-white/70 text-sm">Choose the quantity for each NFT type</p>
          </div>
        </div>

        {/* Public Mint Section */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white mb-4">Public Mint</h4>
          <div className="space-y-4">
            {(["seed", "tree"] as NftType[]).map((type) => {
              const info = NFT_INFO[type];
              const modeCap = getModeCap(type, selectedChain);
              const maxPerWallet = getPerWalletMax(type, selectedChain);
              const maxAllowed = Math.min(maxPerWallet, modeCap);
              const isAvailable = maxAllowed > 0;

              return (
                <div key={type} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Left Section - Item Identification */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-300 flex-shrink-0">
                        <img
                          src={`/${type}pass.jpg`}
                          alt={`${info.name} NFT`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-semibold text-white">{info.name}</h3>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{info.description}</p>
                      </div>
                    </div>

                    {/* Middle Section - Quantity Selector */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center bg-gray-200 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(type, quantities[type] - 1)}
                          disabled={quantities[type] <= 0 || !isAvailable}
                          className="w-8 h-8 rounded-l-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-gray-700 font-medium">
                          {quantities[type]}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(type, quantities[type] + 1)}
                          disabled={quantities[type] >= maxAllowed || !isAvailable}
                          className="w-8 h-8 rounded-r-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-white/70">Max {maxAllowed}</span>
                    </div>

                    {/* Right Section - Details */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Price</p>
                        <p className="text-lg font-semibold text-white">
                          ${Number((PASS_PRICES as any)[type]?.usd ?? 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Minted</p>
                        <p className="text-lg font-semibold text-white">
                          {type === "seed" ? "272" : "187"}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          <Users className="h-4 w-4 text-white/70" />
                          <span className="text-sm text-white/70 ml-1">
                            {type === "seed" ? "85" : "60"}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Ends In</p>
                        <p className="text-lg font-semibold text-white">2w 3d 5hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Whitelist Mint Section */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Whitelist Mint</h4>
          <div className="space-y-4">
            {(["solar", "compute"] as NftType[]).map((type) => {
              const info = NFT_INFO[type];
              const modeCap = getModeCap(type, selectedChain);
              const maxPerWallet = getPerWalletMax(type, selectedChain);
              const maxAllowed = Math.min(maxPerWallet, modeCap);
              const isAvailable = maxAllowed > 0;

              return (
                <div key={type} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Left Section - Item Identification */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-300 flex-shrink-0">
                        <img
                          src={`/${type}pass.jpg`}
                          alt={`${info.name} NFT`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-semibold text-white">{info.name}</h3>
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{info.description}</p>
                      </div>
                    </div>

                    {/* Middle Section - Quantity Selector */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center bg-gray-200 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(type, quantities[type] - 1)}
                          disabled={quantities[type] <= 0 || !isAvailable}
                          className="w-8 h-8 rounded-l-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-gray-700 font-medium">
                          {quantities[type]}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(type, quantities[type] + 1)}
                          disabled={quantities[type] >= maxAllowed || !isAvailable}
                          className="w-8 h-8 rounded-r-lg bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-white/70">Max {maxAllowed}</span>
                    </div>

                    {/* Right Section - Details */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Price</p>
                        <p className="text-lg font-semibold text-white">
                          ${Number((PASS_PRICES as any)[type]?.usd ?? 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Minted</p>
                        <p className="text-lg font-semibold text-white">
                          {type === "solar" ? "450" : "60"}
                        </p>
                        <div className="flex items-center justify-center mt-1">
                          <Users className="h-4 w-4 text-white/70" />
                          <span className="text-sm text-white/70 ml-1">
                            {type === "solar" ? "108" : "80"}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-1">Ends In</p>
                        <p className="text-lg font-semibold text-white">2w 3d 5hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Referral ID */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Referral ID</h3>
            <p className="text-white/70 text-sm">Input 6 Digit ID (Only input ID provided)</p>
          </div>
        </div>
        <div className="max-w-xs">
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
            placeholder="E.g 123456"
            className={cn(
              "text-center text-lg font-mono tracking-wider bg-white/10 border-white/20 text-white placeholder-white/50",
              kolLocked && "bg-white/5 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <h3 className="text-xl font-semibold text-white">Summary</h3>
        </div>
        <div className="text-center py-8">
          {totalQuantity === 0 ? (
            <p className="text-white/70">No items selected yet</p>
          ) : (
            <div className="space-y-4">
              {(Object.entries(quantities) as [NftType, number][])
                .filter(([, qty]) => qty > 0)
                .map(([type, qty]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded overflow-hidden bg-white/10 flex-shrink-0">
                      <img
                        src={`/${type}pass.jpg`}
                        alt={`${NFT_INFO[type].name} NFT`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-white">{NFT_INFO[type].name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {qty} × ${Number((PASS_PRICES as any)[type]?.usd ?? 0)}
                    </p>
                    <p className="text-xs text-white/70">
                      ${(qty * Number((PASS_PRICES as any)[type]?.usd ?? 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>${totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect & Mint */}
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
            onClick={handleMint}
            disabled={!canMint || isMinting}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
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
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Mint NFTs
              </>
            )}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
};
