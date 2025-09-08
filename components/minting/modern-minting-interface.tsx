"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle, X, Loader2, ExternalLink, Copy, Wallet, Zap, Shield, Globe, Lock, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Image from "next/image";
import { thirdwebClient, WalletConnect, WalletStatus } from "@/components/wallet/wallet-connect";
import { useActiveAccount, useWalletBalance, useReadContract } from "thirdweb/react";

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
import { NFT_CONTRACTS, USDT_ADDRESSES, NFT_ABI, USDT_ABI } from "@/lib/contracts";
import { defineChain, getContract, prepareContractCall, sendTransaction, waitForReceipt, sendAndConfirmTransaction } from "thirdweb";
import { parseUnits } from "viem";
import { recordSuccessfulMintStrict } from "@/lib/recordMint";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

/** ---------------- Types ---------------- **/
type ChainId = "56" | "137" | "42161" ;
type NftType = "seed" | "tree" | "solar" | "compute";
type MintMode = "public" | "agent";

/** ---------------- UI: Spending Cap Modal ---------------- **/
interface SpendingCapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  spender: string;
  requestFrom: string;
  spendingCap: string;
  tokenSymbol: string;
  networkFee: string;
}

const SpendingCapModal = ({
  isOpen,
  onClose,
  onConfirm,
  spender,
  requestFrom,
  spendingCap,
  tokenSymbol,
  networkFee,
}: SpendingCapModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-2xl p-6 max-w-md w-[90%] mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-red-500 flex items-center justify-center">
              <span className="text-xs font-bold">!</span>
            </div>
            <h3 className="text-lg font-bold">Spending cap request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close spending cap modal"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-300 mb-6 text-sm">
          This site wants permission to withdraw your tokens
        </p>
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-gray-100 text-sm font-semibold mb-2">Estimated changes</h4>
          <p className="text-gray-300 text-sm mb-4">
            You are giving AGV Protocol the permission to spend this amount from your account.
          </p>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-300 text-sm">Spending cap</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{spendingCap}</span>
              <span className="text-green-400 text-sm">{tokenSymbol}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Spender</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-white text-sm font-mono">{spender}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Request from</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-white text-sm">agv-nft.com</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Network fee</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{networkFee}</span>
              <span className="text-green-400 text-sm">{tokenSymbol}</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-2">Includes {networkFee} fee</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-transparent text-gray-300 border border-gray-600 rounded-lg font-medium hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-blue-600 text-white border-none rounded-lg font-medium hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/** ---------------- UI: Transaction Progress Modal ---------------- **/
interface TransactionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  txHash?: string;
  chainId: ChainId;
  stage: "approval" | "mint" | "confirming" | "success" | "timeout" | "error";
  onVerifyWallet: () => void;
}

const TransactionProgressModal = ({
  isOpen,
  onClose,
  status,
  txHash,
  chainId,
  stage,
  onVerifyWallet,
}: TransactionProgressModalProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showTimeoutOption, setShowTimeoutOption] = useState(false);

  const EXPLORERS: Record<ChainId, string> = {
    "56": "https://bscscan.io",
    "137": "https://polscan.io",
    "42161": "https://arbiscan.io",
  };

  const explorerBase = EXPLORERS[chainId] ?? "";
  const explorerUrl = txHash ? `${explorerBase}/tx/${txHash}` : null;

  useEffect(() => {
    if (!isOpen || stage === "success") return;
    const timer = setInterval(() => setTimeElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, stage]);

  useEffect(() => {
    if (stage === "confirming" && timeElapsed >= 120) {
      setShowTimeoutOption(true);
    }
  }, [stage, timeElapsed]);

  useEffect(() => {
    if (isOpen) {
      setTimeElapsed(0);
      setShowTimeoutOption(false);
    }
  }, [isOpen]);

  const copyTxHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    toast.success("Transaction hash copied");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div className="bg-gray-800 text-white rounded-2xl p-6 max-w-md w-[90%] mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {stage === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : stage === "error" ? (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            ) : (
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            )}
            <h3 className="text-lg font-bold">
              {stage === "success"
                ? "Transaction Successful!"
                : stage === "error"
                ? "Transaction Failed"
                : stage === "timeout"
                ? "Transaction Timeout"
                : "Transaction Progress"}
            </h3>
          </div>
          {(stage === "success" || stage === "error" || showTimeoutOption) && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Close progress modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">{status}</p>
          {timeElapsed > 0 && stage !== "success" && (
            <p className="text-gray-400 text-xs">Time elapsed: {formatTime(timeElapsed)}</p>
          )}
        </div>

        {txHash && (
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-gray-100 text-sm font-semibold mb-2">Transaction Hash</h4>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400 text-xs font-mono break-all flex-1">{txHash}</span>
              <button
                onClick={copyTxHash}
                className="border border-gray-600 rounded p-1 text-gray-400 hover:text-white"
                aria-label="Copy tx hash"
              >
                <Copy size={14} />
              </button>
            </div>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 text-xs hover:text-blue-300"
              >
                View on Explorer
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              stage === "approval" ? "bg-blue-500" : "bg-green-500"
            }`}>
              {stage === "approval" ? (
                <Loader2 size={8} className="animate-spin" />
              ) : (
                <CheckCircle size={8} />
              )}
            </div>
            <span className={`text-xs ${
              stage === "approval" ? "text-blue-500" : "text-green-500"
            }`}>
              USDT Approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              stage === "mint" || stage === "confirming"
                ? "bg-blue-500"
                : stage === "success"
                ? "bg-green-500"
                : "bg-gray-500"
            }`}>
              {stage === "mint" || stage === "confirming" ? (
                <Loader2 size={8} className="animate-spin" />
              ) : stage === "success" ? (
                <CheckCircle size={8} />
              ) : null}
            </div>
            <span className={`text-xs ${
              stage === "mint" || stage === "confirming"
                ? "text-blue-500"
                : stage === "success"
                ? "text-green-500"
                : "text-gray-400"
            }`}>
              NFT Mint
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {showTimeoutOption && stage === "confirming" && (
            <>
              <p className="text-yellow-400 text-xs mb-2">
                Transaction is taking longer than expected. This may be due to network congestion.
              </p>
              <button
                onClick={onVerifyWallet}
                className="w-full py-3 bg-blue-600 text-white border-none rounded-lg font-medium text-sm hover:bg-blue-700"
              >
                Check Wallet for NFTs
              </button>
              <p className="text-gray-400 text-xs text-center">
                Please check your connected wallet to verify if the NFT was minted successfully
              </p>
            </>
          )}

          {stage === "error" && (
            <button
              onClick={onClose}
              className="w-full py-3 bg-red-600 text-white border-none rounded-lg font-medium"
            >
              Close
            </button>
          )}
        </div>

        {stage === "confirming" && !showTimeoutOption && (
          <p className="text-gray-400 text-xs text-center">
            Please do not refresh or leave the page. This may take a few minutes.
          </p>
        )}
      </div>
    </div>
  );
};

/** ---------------- Constants ---------------- **/
// CHAINS will be defined inside the component to use dynamic defineChain


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
  seed: { "56": 400, "137": 400, "42161": 400},
  tree: { "56": 200, "137": 200, "42161": 200},
  solar: { "56": 0, "137": 0, "42161": 0},
  compute: { "56": 0, "137": 0, "42161": 0},
} as const;

const MAX_PER_WALLET: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 3, "137": 3, "42161": 3},
  tree: { "56": 2, "137": 2, "42161": 2},
  solar: { "56": 1, "137": 1, "42161": 1},
  compute: { "56": 1, "137": 1, "42161": 1},
} as const;

export default function ModernMintingInterface() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const account = useActiveAccount();
  const isConnected = !!account;
  const chainId = (account as any)?.chain?.id?.toString() || "56";

  // Define CHAINS inside component to use defineChain
  const CHAINS = useMemo(() => ({
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
  }), []);

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

  // New state for real minting
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [progressStage, setProgressStage] = useState<
    "approval" | "mint" | "confirming" | "success" | "timeout" | "error"
  >("approval");
  const [pendingApprovalTx, setPendingApprovalTx] = useState<any>(null);
  const [pendingMintTx, setPendingMintTx] = useState<any>(null);

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

  const prepareTransactions = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet to proceed with minting.");
      throw new Error("Wallet not connected");
    }
    if (!canMint) {
      toast.error("Please check your minting eligibility.");
      throw new Error("Not eligible for minting");
    }
    if (!nftContract || !usdtContract || !contractAddr) {
      toast.error("Contracts not loaded for the selected network.");
      throw new Error("Contracts not loaded");
    }

    setIsMinting(true);
    setCurrentStep("Preparing transaction…");

    // Optional KOL attribution (non-blocking here)
    if (fullKolId) {
      const q = query(collection(db, "kols"), where("kolId", "==", fullKolId));
      await getDocs(q).catch(() => void 0);
    }

    // Calculate total quantity and cost
    const totalQty = totalQuantity;
    const totalCostUsd = totalCost;

    if (totalQty < 1) {
      setIsMinting(false);
      throw new Error("Quantity must be at least 1");
    }
    console.log("Preparing to useReadContractttttttttttttttttttttttttttttttttttt")
    // Get USDT decimals
    console.log({usdtContract})
    const { data: usdtDecimalsData } = useReadContract({
      contract: usdtContract!,
      method: "decimals",
      params: [],
      queryOptions: { enabled: !!usdtContract },
    });

    const decimals = Number(usdtDecimalsData ?? 6);
    const unitAmount = parseUnits(String(totalCostUsd), decimals);
    const amountToApprove = unitAmount;
    console.log("Preparing to minnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
    const approveTx = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [contractAddr, amountToApprove],
    });

    // For now, we'll mint seed NFTs only (can be extended)
    const mintTx = prepareContractCall({
      contract: nftContract,
      method: "mint",
      params: [BigInt(totalQty), []], // Empty proof array for public mint
    });

    setPendingApprovalTx(approveTx);
    setPendingMintTx(mintTx);

    setShowSpendingModal(true);
    setCurrentStep("Review and confirm the spending cap to continue…");
  };

  const handleSpendingCapConfirm = async () => {
    try {
      setShowSpendingModal(false);
      setShowProgressModal(true);
      setProgressStage("approval");
      setCurrentStep("Approving USDT spending…");
      toast.success("Please approve USDT spending in your wallet.");

      const approveRes = await sendTransaction({
        transaction: pendingApprovalTx,
        account: account!,
      });

      if (approveRes?.transactionHash) setTxHash(approveRes.transactionHash);

      const approveReceipt = await waitForReceipt({
        client: thirdwebClient,
        chain: chainInfo.chain,
        transactionHash: approveRes.transactionHash,
      });
      if (approveReceipt.status !== "success")
        throw new Error("Approval failed on-chain");

      toast.success("USDT spending approved. Proceeding with mint…");

      setProgressStage("mint");
      setCurrentStep("Executing mint transaction…");
      const receipt = await sendAndConfirmTransaction({
        transaction: pendingMintTx,
        account: account!,
      });

      setProgressStage("confirming");
      if (receipt?.transactionHash) setTxHash(receipt.transactionHash);

      await handleTransactionSuccess(receipt);
    } catch (error) {
      handleTransactionError(error);
    }
  };

  const handleSpendingCapClose = () => {
    setShowSpendingModal(false);
    setIsMinting(false);
    setCurrentStep("");
    setPendingApprovalTx(null);
    setPendingMintTx(null);
  };

  const handleProgressClose = () => {
    setShowProgressModal(false);
    setProgressStage("approval");
    setTxHash("");
    setIsMinting(false);
    setCurrentStep("");
  };

  const handleVerifyWallet = () => {
    toast.success("Please check your connected wallet's NFT collection to verify if the mint was successful");
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleTransactionSuccess = async (receipt: any) => {
    setProgressStage("success");
    setCurrentStep("Minted successfully!");
    setIsMinting(false);

    toast.success(`Successfully minted ${totalQuantity} NFT${totalQuantity > 1 ? "s" : ""}`);

    try {
      // Record the successful mint
      const results = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([type, qty]) => ({
          type,
          quantity: qty,
          txHash: receipt?.transactionHash || txHash,
          cost: qty * PASS_PRICES[type as NftType],
          kolId: fullKolId || null
        }));

      setMintResults(results);
      setShowSuccess(true);

      await recordSuccessfulMintStrict(db, fullKolId, {
        address: account?.address!,
        nftType: "seed", // For now, only seed
        quantity: totalQuantity,
        chainId: selectedChain as any,
        txHash: receipt?.transactionHash || txHash,
        timestamp: new Date(),
        mintType: "public",
      });

      toast.success("Mint recorded successfully");
    } catch (error) {
      console.error("Error recording mint:", error);
      toast.error("NFT minted successfully but failed to update records (non-critical)");
    }

    // Reset quantities
    setQuantities({ seed: 0, tree: 0, solar: 0, compute: 0});

    setTimeout(() => window.location.reload(), 5000);
  };

  const handleTransactionError = (err: any) => {
    const errorMessage = normalizeError(err);
    console.error("Transaction error:", err);

    setCurrentStep(`Error: ${errorMessage}`);
    setIsMinting(false);
    setProgressStage("error");

    toast.error(`Transaction failed: ${errorMessage}`);
  };

  const handleMint = async () => {
    try {
      await prepareTransactions();
    } catch (e) {
      toast.error(`Unable to proceed: ${normalizeError(e)}`);
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
  
  const chainInfo = CHAINS[selectedChain];
  const contractAddr = NFT_CONTRACTS[selectedChain]?.["seed"];
  const usdtAddr = USDT_ADDRESSES[selectedChain];

  // Contract instances
  const nftContract = useMemo(
    () =>
      contractAddr
        ? getContract({
            client: thirdwebClient,
            address: contractAddr,
            chain: chainInfo.chain,
            abi: NFT_ABI.seed as any,
          })
        : null,
    [contractAddr, chainInfo.chain]
  );

  const usdtContract = useMemo(
    () =>
      usdtAddr
        ? getContract({
            client: thirdwebClient,
            address: usdtAddr,
            chain: chainInfo.chain,
            abi: USDT_ABI,
          })
        : null,
    [usdtAddr, chainInfo.chain]
  );

  // Helper functions
  const normalizeError = (e: unknown) => {
    if (!e) return "Unknown error";
    if (typeof e === "string") return e;
    if (e instanceof Error && e.message) return e.message;
    try {
      const any = e as any;
      return (
        any?.shortMessage ||
        any?.reason ||
        any?.error?.message ||
        any?.message ||
        JSON.stringify(any)
      );
    } catch {
      return String(e);
    }
  };
  
  // Wallet balance hooks - use selected chain for balance checking
  const usdtBalanceResult = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
    tokenAddress: usdtAddr,
  });
  const usdtData = usdtBalanceResult?.data || undefined;
  
  const nativeBalanceResult = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
  });
  const nativeData = nativeBalanceResult?.data || undefined;

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
        minRequired: GAS_THRESHOLDS[selectedChain],
        isInsufficient: false,
        symbol: CHAINS[selectedChain].symbol,
      };
    }

    const currentGas = parseFloat(nativeData.displayValue);
    const minRequired = GAS_THRESHOLDS[selectedChain];
    const isInsufficient = currentGas < minRequired;
    return {
      currentGas,
      minRequired,
      isInsufficient,
      symbol: CHAINS[selectedChain].symbol,
    };
  }, [nativeData?.displayValue, selectedChain]);

  // Update insufficient gas state when gas info changes
  useEffect(() => {
    setHasInsufficientGas(gasInfo.isInsufficient);
  }, [gasInfo.isInsufficient]);
  return (
    <div className="max-w-6xl mx-auto space-y-8">
        {/* Main Content */}
        <div className="grid gap-8">
          {/* Minting Interface */}
          <div className="lg:col-span-2 space-y-6 bg-blue-50 dark:bg-blue-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
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

      {/* Spending Cap Modal */}
      <SpendingCapModal
        isOpen={showSpendingModal}
        onClose={handleSpendingCapClose}
        onConfirm={handleSpendingCapConfirm}
        spender={contractAddr ? `${contractAddr.slice(0, 6)}...${contractAddr.slice(-4)}` : ""}
        requestFrom="agv-nft.com"
        spendingCap={totalCost.toFixed(2)}
        tokenSymbol="USDT"
        networkFee="~"
      />

      {/* Transaction Progress Modal */}
      <TransactionProgressModal
        isOpen={showProgressModal}
        onClose={handleProgressClose}
        status={currentStep}
        txHash={txHash}
        chainId={selectedChain}
        stage={progressStage}
        onVerifyWallet={handleVerifyWallet}
      />
    </div>
  );
}