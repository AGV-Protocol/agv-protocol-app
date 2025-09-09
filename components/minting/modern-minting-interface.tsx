"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { NFT_CONTRACTS, USDT_ADDRESSES, NFT_ABI, USDT_ABI, SEED_ABI, TREE_ABI, SOLAR_ABI, COMPUTE_ABI } from "@/lib/contracts";
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
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        overflow: "hidden",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#1f2937",
          color: "#fff",
          borderRadius: "1rem",
          padding: "1.5rem",
          maxWidth: "28rem",
          width: "90%",
          margin: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                background: "linear-gradient(45deg, #f59e0b, #ef4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>!</span>
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
              Spending cap request
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: "0.25rem",
            }}
            aria-label="Close spending cap modal"
          >
            <X size={20} />
          </button>
        </div>
        <p
          style={{
            color: "#d1d5db",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          This site wants permission to withdraw your tokens
        </p>
        <div
          style={{
            backgroundColor: "#374151",
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h4
            style={{
              color: "#f3f4f6",
              fontSize: "0.875rem",
              fontWeight: "semibold",
              marginBottom: "0.5rem",
            }}
          >
            Estimated changes
          </h4>
          <p
            style={{
              color: "#d1d5db",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            You are giving AGV Protocol the permission to spend this amount from
            your account.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span style={{ color: "#d1d5db", fontSize: "0.875rem" }}>
              Spending cap
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#fff", fontWeight: "semibold" }}>
                {spendingCap}
              </span>
              <span style={{ color: "#10b981", fontSize: "0.875rem" }}>
                {tokenSymbol}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Spender</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                }}
              />
              <span
                style={{
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                }}
              >
                {spender}
              </span>
            </div>
          </div>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              Request from
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  backgroundColor: "#8b5cf6",
                }}
              />
              <span style={{ color: "#fff", fontSize: "0.875rem" }}>
                agv-nft.com
              </span>
            </div>
          </div>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              Network fee
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#fff", fontSize: "0.875rem" }}>{networkFee}</span>
              <span style={{ color: "#10b981", fontSize: "0.875rem" }}>
                {tokenSymbol}
              </span>
            </div>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            Includes {networkFee} fee
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: "transparent",
              color: "#d1d5db",
              border: "1px solid #4b5563",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "medium",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "medium",
            }}
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key (only for success/error/timeout stages)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && (stage === "success" || stage === "error" || showTimeoutOption)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, stage, showTimeoutOption]);

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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        overflow: "hidden",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (stage === "success" || stage === "error" || showTimeoutOption)) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#1f2937",
          color: "#fff",
          borderRadius: "1rem",
          padding: "1.5rem",
          maxWidth: "28rem",
          width: "90%",
          margin: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {stage === "success" ? (
              <CheckCircle
                style={{ height: "1.5rem", width: "1.5rem", color: "#10b981" }}
              />
            ) : stage === "error" ? (
              <AlertTriangle
                style={{ height: "1.5rem", width: "1.5rem", color: "#ef4444" }}
              />
            ) : (
              <Loader2
                style={{
                  height: "1.5rem",
                  width: "1.5rem",
                  color: "#3b82f6",
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
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
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "0.25rem",
              }}
              aria-label="Close progress modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              color: "#d1d5db",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            {status}
          </p>
          {timeElapsed > 0 && stage !== "success" && (
            <p style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
              Time elapsed: {formatTime(timeElapsed)}
            </p>
          )}
        </div>

        {txHash && (
          <div
            style={{
              backgroundColor: "#374151",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h4
              style={{
                color: "#f3f4f6",
                fontSize: "0.875rem",
                fontWeight: "semibold",
                marginBottom: "0.5rem",
              }}
            >
              Transaction Hash
            </h4>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  color: "#10b981",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  flex: 1,
                }}
              >
                {txHash}
              </span>
              <button
                onClick={copyTxHash}
                style={{
                  background: "none",
                  border: "1px solid #4b5563",
                  borderRadius: "0.25rem",
                  padding: "0.25rem",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#3b82f6",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                }}
              >
                View on Explorer
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                backgroundColor: stage === "approval" ? "#3b82f6" : "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {stage === "approval" ? (
                <Loader2 size={8} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <CheckCircle size={8} />
              )}
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                color: stage === "approval" ? "#3b82f6" : "#10b981",
              }}
            >
              USDT Approval
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                backgroundColor:
                  stage === "mint" || stage === "confirming"
                    ? "#3b82f6"
                    : stage === "success"
                    ? "#10b981"
                    : "#4b5563",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {stage === "mint" || stage === "confirming" ? (
                <Loader2 size={8} style={{ animation: "spin 1s linear infinite" }} />
              ) : stage === "success" ? (
                <CheckCircle size={8} />
              ) : null}
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                color:
                  stage === "mint" || stage === "confirming"
                    ? "#3b82f6"
                    : stage === "success"
                    ? "#10b981"
                    : "#9ca3af",
              }}
            >
              NFT Mint
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
          {showTimeoutOption && stage === "confirming" && (
            <>
              <p style={{ color: "#fbbf24", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                Transaction is taking longer than expected. This may be due to
                network congestion.
              </p>
              <button
                onClick={onVerifyWallet}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "medium",
                  fontSize: "0.875rem",
                }}
              >
                Check Wallet for NFTs
              </button>
              <p style={{ color: "#9ca3af", fontSize: "0.75rem", textAlign: "center" }}>
                Please check your connected wallet to verify if the NFT was minted
                successfully
              </p>
            </>
          )}

          {stage === "error" && (
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "medium",
              }}
            >
              Close
            </button>
          )}
        </div>

        {stage === "confirming" && !showTimeoutOption && (
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", textAlign: "center" }}>
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
  solar: { "56": 100, "137": 50, "42161": 50},
  compute: { "56": 50, "137": 20, "42161": 20},
} as const;

const MAX_PER_WALLET: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 3, "137": 3, "42161": 3},
  tree: { "56": 2, "137": 2, "42161": 2},
  solar: { "56": 2, "137": 2, "42161": 2},
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

  // Whitelist gating state
  const [wlEligible, setWlEligible] = useState(false);
  const [checkingWl, setCheckingWl] = useState(false);
  const wlCheckedAddressRef = useRef<string | null>(null);

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
    // Check if any premium NFTs are selected and user is not whitelisted
    const hasPremiumNFTs = quantities.solar > 0 || quantities.compute > 0;
    const isWhitelistBlocked = hasPremiumNFTs && !wlEligible && account?.address;
    
    return totalQuantity > 0 && totalCost > 0 && isConnected && !hasInsufficientGas && !isWhitelistBlocked;
  }, [totalQuantity, totalCost, isConnected, hasInsufficientGas, quantities, wlEligible, account?.address]);

  // Handlers
  const handleQuantityChange = (type: NftType, value: number) => {
    const maxAllowed = MAX_PER_WALLET[type][selectedChain];
    const newValue = Math.max(0, Math.min(value, maxAllowed));

    setQuantities(prev => {
      // If setting a quantity > 0, reset all other quantities to 0
      if (newValue > 0) {
        const newQuantities = { seed: 0, tree: 0, solar: 0, compute: 0 };
        newQuantities[type] = newValue;
        return newQuantities;
      } else {
        // If setting to 0, just update this type
        return {
          ...prev,
          [type]: newValue
        };
      }
    });
  };

  // Remove the old handleConnectWallet function since we're using the wallet provider

  // Get USDT decimals at component level - moved after contract definitions

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

    // Validate that only one NFT type is selected
    const selectedTypes = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    if (selectedTypes.length === 0) {
      setIsMinting(false);
      throw new Error("Please select at least one NFT to mint");
    }
    if (selectedTypes.length > 1) {
      setIsMinting(false);
      throw new Error("Please select only one NFT type at a time");
    }

    // Get the selected NFT type and quantity
    const [selectedType, selectedQty] = selectedTypes[0];
    const nftType = selectedType as NftType;
    const quantity = selectedQty;
    const unitPrice = PASS_PRICES[nftType];
    const totalCostUsd = quantity * unitPrice;

    if (quantity < 1) {
      setIsMinting(false);
      throw new Error("Quantity must be at least 1");
    }

    // Get USDT decimals from the hook data
    const decimals = Number(usdtDecimalsData ?? 6);
    const unitAmount = parseUnits(String(totalCostUsd), decimals);
    const amountToApprove = unitAmount;

    const approveTx = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [contractAddr, amountToApprove],
    });

    // Mint NFTs based on selected type
    // The contract expects: mint(uint256 amount, bytes32[] merkleProof)
    const mintTx = prepareContractCall({
      contract: nftContract,
      method: "mint",
      params: [BigInt(quantity), []], // amount and empty merkleProof array for public mint
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

    // Get the current selected NFT type and quantity
    const currentSelectedType = getSelectedNftType();
    const currentQuantity = quantities[currentSelectedType];

    toast.success(`Successfully minted ${currentQuantity} ${currentSelectedType}Pass NFT${currentQuantity > 1 ? "s" : ""}`);

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
        nftType: currentSelectedType,
        quantity: currentQuantity,
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

    // Auto-close after 5 seconds
    setTimeout(() => {
      setShowProgressModal(false);
      setProgressStage("approval");
      setTxHash("");
      setCurrentStep("");
    }, 5000);
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
  
  // Get the primary selected NFT type (first one with quantity > 0)
  const getSelectedNftType = (): NftType => {
    for (const [type, qty] of Object.entries(quantities)) {
      if (qty > 0) return type as NftType;
    }
    return "seed"; // default fallback
  };
  
  const selectedNftType = getSelectedNftType();
  const contractAddr = NFT_CONTRACTS[selectedChain]?.[selectedNftType];
  const usdtAddr = USDT_ADDRESSES[selectedChain];

  // Get the correct ABI based on NFT type
  const getNftAbi = (nftType: NftType) => {
    switch (nftType) {
      case "seed": return SEED_ABI;
      case "tree": return TREE_ABI;
      case "solar": return SOLAR_ABI;
      case "compute": return COMPUTE_ABI;
      default: return SEED_ABI;
    }
  };

  // Contract instances
  const nftContract = useMemo(
    () =>
      contractAddr
        ? getContract({
            client: thirdwebClient,
            address: contractAddr,
            chain: chainInfo.chain,
            abi: getNftAbi(selectedNftType) as any,
          })
        : null,
    [contractAddr, chainInfo.chain, selectedNftType]
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

  // Get USDT decimals at component level
  const { data: usdtDecimalsData } = useReadContract({
    contract: usdtContract!,
    method: "decimals",
    params: [],
    queryOptions: { enabled: !!usdtContract },
  });

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

  // Timeout mechanism for transactions
  useEffect(() => {
    if (!showProgressModal || progressStage === "success" || progressStage === "error") return;

    const timeout = setTimeout(() => {
      if (progressStage === "confirming") {
        setProgressStage("timeout");
        setCurrentStep("Transaction is taking longer than expected. Please check your wallet or try again.");
      }
    }, 300000); // 5 minutes timeout

    return () => clearTimeout(timeout);
  }, [showProgressModal, progressStage]);

  // Whitelist check (ONE-TIME per wallet connection)
  useEffect(() => {
    const run = async () => {
      // Reset on disconnect
      if (!account?.address) {
        setWlEligible(false);
        wlCheckedAddressRef.current = null;
        return;
      }

      // Already checked this address during this connection session
      if (wlCheckedAddressRef.current === account.address) return;

      try {
        setCheckingWl(true);
        const res = await fetch(`/api/merkle-proof?address=${account.address}`, {
          cache: "no-store",
        });

        let whitelisted = false;
        if (res.ok) {
          const data = await res.json();
          whitelisted = !!data?.whitelisted;
        }

        setWlEligible(whitelisted);
      } catch {
        setWlEligible(false);
      } finally {
        setCheckingWl(false);
        // Mark this address as checked so we don't re-call until wallet changes
        wlCheckedAddressRef.current = account.address;
      }
    };
    run();
  }, [account?.address]);
  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Main Content */}
        <div className="grid gap-4 sm:gap-8">
          {/* Minting Interface */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Chain Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Globe className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Select Network</h3>
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
              {Object.entries(CHAINS).map(([chainId, chain]) => (
                <button
                  key={chainId}
                  onClick={() => setSelectedChain(chainId as ChainId)}
                  className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                    selectedChain === chainId 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-semibold">{chain.name}</div>
                      <div className="text-xs opacity-70">{chain.symbol}</div>
                    </div>
                    {selectedChain === chainId && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  {selectedChain === chainId && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Minting Mode */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Minting Mode</h3>
            </div>
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-1 sm:p-2">
              <Tabs value={mintMode} onValueChange={(value: string) => setMintMode(value as MintMode)}>
                <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto">
                  <TabsTrigger 
                    value="public" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
                  >
                    Public Mint
                  </TabsTrigger>
                  <TabsTrigger 
                    value="agent"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg sm:rounded-xl text-xs sm:text-sm py-2 sm:py-3"
                  >
                    Agent Mint
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="public" className="mt-4">
                  <p className="text-sm text-white/70">
                    Mint NFTs directly from the public collection
                  </p>
                </TabsContent>
                <TabsContent value="agent" className="mt-4">
                  <p className="text-sm text-white/70">
                    Mint through an authorized agent (coming soon)
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* NFT Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Select NFTs to Mint</h3>
                <p className="text-white/60 text-xs sm:text-sm">Choose the quantity for each NFT type</p>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(NFT_INFO).map(([type, info]) => {
                const nftType = type as NftType;
                const maxAllowed = MAX_PER_WALLET[nftType][selectedChain];
                const isAvailable = PUBLIC_MINT_CAPS[nftType][selectedChain] > 0;
                
                // Check if this is a premium NFT that requires whitelist
                const isPremiumNFT = nftType === "solar" || nftType === "compute";
                const isWhitelistRequired = isPremiumNFT && !wlEligible && account?.address;

                return (
                  <div key={type} className="space-y-3 bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                          <img 
                            src={`/${type}pass.jpg`}
                            alt={`${info.name} NFT`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{info.name}</h3>
                          <p className="text-xs sm:text-sm text-white/70">{info.description}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-white text-sm sm:text-base">${PASS_PRICES[nftType]}</p>
                        <p className="text-xs sm:text-sm text-white/60">Max: {maxAllowed}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                      <button
                        onClick={() => handleQuantityChange(nftType, quantities[nftType] - 1)}
                        disabled={quantities[nftType] <= 0 || !isAvailable || !!isWhitelistRequired}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={maxAllowed}
                        value={quantities[nftType]}
                        onChange={(e) => handleQuantityChange(nftType, parseInt(e.target.value) || 0)}
                        className="w-16 sm:w-20 text-center rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-2 sm:px-3 py-2 text-sm sm:text-base"
                        disabled={!isAvailable || !!isWhitelistRequired}
                      />
                      <button
                        onClick={() => handleQuantityChange(nftType, quantities[nftType] + 1)}
                        disabled={quantities[nftType] >= maxAllowed || !isAvailable || !!isWhitelistRequired}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        +
                      </button>
                      {!isAvailable && (
                        <span className="px-2 sm:px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs sm:text-sm">
                          Coming Soon
                        </span>
                      )}
                      {isWhitelistRequired && (
                        <span className="px-2 sm:px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs sm:text-sm">
                          Whitelist Required
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                      <div className="w-6 h-6 rounded overflow-hidden bg-white/10 flex-shrink-0">
                        <img 
                          src={`/${type}pass.jpg`}
                          alt={`${NFT_INFO[nftType].name} NFT`}
                          className="w-full h-full object-cover"
                        />
                      </div>
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

              {/* Whitelist Status */}
              {account && (
                <div className="mt-4 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Whitelist Status:</span>
                    {checkingWl ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">Checking...</span>
                      </div>
                    ) : wlEligible ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Whitelisted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Not Whitelisted</span>
                      </div>
                    )}
                  </div>
                  {!wlEligible && account && (
                    <p className="text-xs text-gray-500 mt-2">
                      SolarPass and ComputePass require whitelist access. Only SeedPass and TreePass are available for public minting.
                    </p>
                  )}
                </div>
              )}

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
                ) : (quantities.solar > 0 || quantities.compute > 0) && !wlEligible && account?.address ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Whitelist Required
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