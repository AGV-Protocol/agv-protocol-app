"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ConnectButton, useActiveAccount, useReadContract, useWalletBalance } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareContractCall, sendTransaction, waitForReceipt, sendAndConfirmTransaction } from "thirdweb";
import { parseUnits } from "viem";
import { Moon, Sun, AlertTriangle, CheckCircle, X, Loader2, ExternalLink, Copy } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { CollectionKey } from "@/lib/contracts";
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, NFT_ABI, USDT_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

/** ---------------- Types ---------------- **/
type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;
type MintMode = "public" | "agent";

/** ---------------- Chain-aware caps ---------------- **/
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

/** ---------------- Thirdweb client ---------------- **/
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
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
          <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "1rem" }}>
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
                {requestFrom}
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

  const chainInfo = CHAINS[chainId];
  const explorerBase =
    chainInfo?.chain?.blockExplorers?.default?.url ??
    chainInfo?.chain?.blockExplorers?.etherscan?.url ??
    "";
  const explorerUrl = txHash ? `${explorerBase}/tx/${txHash}` : null;

  // One interval; avoid depth loops
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
    toast({
      title: "Copied!",
      description: "Transaction hash copied",
      variant: "default",
    });
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
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

/** ---------------- Helpers ---------------- **/
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

/** ---------------- Main Component ---------------- **/
export default function MintingContent() {
  const account = useActiveAccount();

  // ----- UI State -----
  const [mintMode, setMintMode] = useState<MintMode>("public"); // only "public" and "agent"
  const [kolId, setKolId] = useState("");
  const [chainId, setChainId] = useState<ChainId>("42161");
  const [nftType, setNftType] = useState<NftType>("tree");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const searchParams = useSearchParams();

  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [progressStage, setProgressStage] = useState<
    "approval" | "mint" | "confirming" | "success" | "timeout" | "error"
  >("approval");

  // Transactions prepared (approval -> mint)
  const [pendingApprovalTx, setPendingApprovalTx] = useState<any>(null);
  const [pendingMintTx, setPendingMintTx] = useState<any>(null);

  const { setTheme, theme } = useTheme();

  const chainInfo = CHAINS[chainId];
  const contractAddr = NFT_CONTRACTS[nftType]?.[chainId];
  const usdtAddr = USDT_ADDRESSES[chainId];

  const nftContract = useMemo(
    () =>
      contractAddr
        ? getContract({
            client: thirdwebClient,
            address: contractAddr,
            chain: chainInfo.chain,
            abi: NFT_ABI[nftType as CollectionKey],
          })
        : null,
    [contractAddr, chainInfo.chain, nftType]
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

  // Reads
  const { data: totalSupply } = useReadContract({
    contract: nftContract!,
    method: "totalSupply",
    params: [],
    queryOptions: { enabled: !!nftContract },
  });

  const { data: userBalance } = useReadContract({
    contract: nftContract!,
    method: "balanceOf",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!nftContract && !!account?.address },
  });

  const { data: usdtDecimalsData } = useReadContract({
    contract: usdtContract!,
    method: "decimals",
    params: [],
    queryOptions: { enabled: !!usdtContract },
  });

  // Caps (chain-aware)
  const publicMintCap = PUBLIC_MINT_CAPS[nftType]?.[chainId] ?? 0;
  const currentSupply = totalSupply ? Number(totalSupply) : 0;
  const remainingSupply = Math.max(0, publicMintCap - currentSupply);

  const userMintedCount = userBalance ? Number(userBalance) : 0;
  const maxPerWalletChain = MAX_PER_WALLET[nftType]?.[chainId] ?? 0;
  const canMintMore = Math.max(
    0,
    Math.min(maxPerWalletChain - userMintedCount, remainingSupply)
  );

  // ------ Balances via Hooks (no manual RPC) ------
  const { data: nativeData } = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
  });

  const { data: usdtData } = useWalletBalance({
    client: thirdwebClient,
    chain: chainInfo.chain,
    address: account?.address,
    tokenAddress: usdtAddr,
  });

  const [nativeBalance, setNativeBalance] = useState<string>("0");
  const [hasInsufficientGas, setHasInsufficientGas] = useState(false);
  const gasToastShownRef = useRef(false);

  // Sync kolId from URL params (ref is alias)
  useEffect(() => {
  const v = searchParams?.get("kolId") ?? searchParams?.get("ref");
  if (v) setKolId(v);
    }, [searchParams]);

  // Derive gas balance + threshold alerts (avoid loops with refs)
  useEffect(() => {
    const display = nativeData?.displayValue ?? "0";
    setNativeBalance(display);

    const thresholds: Record<ChainId, number> = {
      "56": 0.005,
      "137": 0.01,
      "42161": 0.001,
    };
    const minReq = thresholds[chainId];
    const current = parseFloat(display);
    const insufficient = current < minReq;
    setHasInsufficientGas(insufficient);

    if (insufficient && !gasToastShownRef.current && account?.address) {
      gasToastShownRef.current = true;
      const tokenName = chainId === "56" ? "BNB" : chainId === "137" ? "MATIC" : "ETH";
      toast({
        title: "Insufficient Gas Token",
        description: `You need at least ${minReq} ${tokenName} for fees`,
        variant: "destructive",
      });
    }
    if (!insufficient) {
      gasToastShownRef.current = false;
    }
  }, [nativeData?.displayValue, chainId, account?.address]);

  // Global error toasts so nothing is silent
  useEffect(() => {
    const onErr = (event: ErrorEvent) => {
      toast({
        title: "Unexpected Error",
        description: normalizeError(event.error || event.message),
        variant: "destructive",
      });
    };
    const onRej = (event: PromiseRejectionEvent) => {
      toast({
        title: "Request Failed",
        description: normalizeError(event.reason),
        variant: "destructive",
      });
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWalletOptions, setShowMobileWalletOptions] = useState(false);
  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  const handleMobileWalletRedirect = (
    walletType: "metamask" | "binance" | "trustwallet"
  ) => {
    const currentUrl = window.location.href;
    let deepLink = "";
    switch (walletType) {
      case "metamask":
        deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        break;
      case "binance":
        deepLink = `https://safepal.io/dapp?url=${encodeURIComponent(currentUrl)}`;
        break;
      case "trustwallet":
        deepLink = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(
          currentUrl
        )}`;
        break;
    }
    window.open(deepLink, "_blank");
    toast({
      title: "Opening in Mobile Wallet",
      description: `Redirecting to ${walletType} mobile app...`,
      variant: "default",
    });
  };

  /** ---- Eligibility logic (loop-safe) ---- */
  // Reset eligibility when core params change
  useEffect(() => {
    setEligibilityChecked(false);
    setIsEligible(false);
    setStatus("");
  }, [account?.address, chainId, nftType, mintMode]);

  // Perform one-off check when ready
  useEffect(() => {
    const runCheck = async () => {
      if (!account?.address || !nftContract || eligibilityChecked) return;

      setStatus("Checking minting eligibility...");
      try {
        if (mintMode === "public") {
          const currentSupplyNum = totalSupply ? Number(totalSupply) : 0;
          const cap = PUBLIC_MINT_CAPS[nftType]?.[chainId] ?? 0;

          if (cap === 0) {
            setIsEligible(false);
            setStatus(`${nftType}Pass not available for public mint on this chain`);
            toast({
              title: "Not Available",
              description:
                "This pass is not available for public mint on this network",
              variant: "destructive",
            });
            setEligibilityChecked(true);
            return;
          }

          if (currentSupplyNum >= cap) {
            setIsEligible(false);
            setStatus(`Public mint sold out (${cap}/${cap})`);
            toast({
              title: "Public Mint Sold Out",
              description: `All ${cap} ${nftType}Pass on this network are minted`,
              variant: "destructive",
            });
            setEligibilityChecked(true);
            return;
          }

          const minted = userBalance ? Number(userBalance) : 0;
          const maxPer = MAX_PER_WALLET[nftType]?.[chainId] ?? 0;

          if (minted >= maxPer) {
            setIsEligible(false);
            setStatus(`Per-wallet limit reached (${maxPer} on this chain)`);
            toast({
              title: "Minting Limit Reached",
              description: `You already minted ${maxPer} on this network`,
              variant: "destructive",
            });
          } else {
            const remainingForUser = Math.min(
              maxPer - minted,
              cap - currentSupplyNum
            );
            setIsEligible(true);
            setStatus("Eligible for minting");
            toast({
              title: "Eligibility Confirmed",
              description: `You can mint up to ${remainingForUser} more on this network`,
              variant: "default",
            });
          }
        } else {
          // Agent: requires KOL id; DB check will happen before mint; here allow UI to proceed
          setIsEligible(true);
          setStatus("Eligible for agent minting");
        }
      } catch (error) {
        console.error("Eligibility check failed:", error);
        setIsEligible(false);
        setStatus("Eligibility check failed");
      } finally {
        setEligibilityChecked(true);
      }
    };

    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account?.address,
    nftContract,
    chainId,
    nftType,
    mintMode,
    eligibilityChecked,
    totalSupply,
    userBalance,
  ]);

  const handleChainChange = (newChainId: ChainId) => {
    if (newChainId === chainId) return;
    setChainId(newChainId);
    toast({
      title: "Network Changed",
      description:
        newChainId === "56"
          ? "BNB Chain"
          : newChainId === "137"
          ? "Polygon"
          : "Arbitrum",
      variant: "default",
    });
  };

  const handleNftTypeChange = (newNftType: NftType) => {
    if (newNftType === nftType) return;
    setNftType(newNftType);
    toast({
      title: "NFT Type Changed",
      description: `Selected ${newNftType}Pass`,
      variant: "default",
    });
  };

  /** ---- Mint Flow:
   *  1) Click "Mint" -> prepare txs -> show SpendingCapModal ONLY
   *  2) Click "Confirm" in SpendingCapModal -> show ProgressModal and run approval+mint
   *  3) Update progress stages accordingly
   * ---- **/

  // Build & stage transactions (no progress modal here)
  const prepareTransactions = async () => {
    if (!account?.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed with minting.",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }
    if (!isEligible) {
      toast({
        title: "Not Eligible",
        description: "Please check your minting eligibility first.",
        variant: "destructive",
      });
      throw new Error("Not eligible for minting");
    }
    if (!nftContract || !usdtContract || !contractAddr) {
      toast({
        title: "Contract Error",
        description: "Contracts not loaded for the selected network.",
        variant: "destructive",
      });
      throw new Error("Contracts not loaded");
    }

    setIsMinting(true);
    setStatus("Preparing transaction…");

    // Agent mode requires KOL ID and must exist
    if (mintMode === "agent") {
      if (!kolId.trim()) {
        setIsMinting(false);
        toast({
          title: "KOL ID Required",
          description: "Please enter a valid KOL ID for Agent minting.",
          variant: "destructive",
        });
        throw new Error("KOL ID missing");
      }
      // Validate KOL ID from Firestore
      setStatus("Validating KOL ID…");
      const q = query(collection(db, "kols"), where("kolId", "==", kolId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setIsMinting(false);
        toast({
          title: "Invalid KOL ID",
          description: "The provided KOL ID is invalid.",
          variant: "destructive",
        });
        throw new Error("Invalid KOL ID");
      }
    } else if (kolId.trim()) {
      // Optional: allow KOL attribution on public mint, but do not block if invalid
      const q = query(collection(db, "kols"), where("kolId", "==", kolId.trim()));
      await getDocs(q).catch(() => void 0);
    }

    // Public mode caps and per-wallet limits
    const qty = Number(quantity);
    if (qty < 1) {
      setIsMinting(false);
      throw new Error("Quantity must be at least 1");
    }

    if (mintMode === "public") {
      const minted = userBalance ? Number(userBalance) : 0;
      const maxPer = MAX_PER_WALLET[nftType]?.[chainId] ?? 0;
      const cap = PUBLIC_MINT_CAPS[nftType]?.[chainId] ?? 0;
      const current = totalSupply ? Number(totalSupply) : 0;

      if (cap === 0) {
        setIsMinting(false);
        throw new Error(`${nftType}Pass is not available for public mint`);
      }
      if (minted + qty > maxPer) {
        setIsMinting(false);
        throw new Error(`Exceeds maximum per wallet (${maxPer})`);
      }
      if (current + qty > cap) {
        setIsMinting(false);
        throw new Error(`Exceeds public mint cap. Only ${cap - current} remaining`);
      }
    }

    // Prepare approval+mint
    const decimals = Number(usdtDecimalsData ?? 6);
    const unitAmount = parseUnits(String(PASS_PRICES[nftType]?.usd ?? 59), decimals);
    const amountToApprove = unitAmount * BigInt(qty);

    const approveTx = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [contractAddr, amountToApprove],
    });

    // Infer mint function for agent or public
    const mintMethod = mintMode === "agent" ? "mintAgent" : "mint";
    const mintParams: any[] =
      mintMode === "agent" ? [BigInt(qty)] : [BigInt(qty), []];

    const mintTx = prepareContractCall({
      contract: nftContract,
      // @ts-ignore allow custom method names from ABI
      method: mintMethod,
      params: mintParams,
    });

    setPendingApprovalTx(approveTx);
    setPendingMintTx(mintTx);

    // Show spending cap modal ONLY (as requested)
    setShowSpendingModal(true);
    setStatus("Review and confirm the spending cap to continue…");
  };

  const handleSpendingCapConfirm = async () => {
    try {
      // Close spending cap, then open progress modal (requested order)
      setShowSpendingModal(false);
      setShowProgressModal(true);
      setProgressStage("approval");
      setStatus("Approving USDT spending…");
      toast({
        title: "Approve Transaction",
        description: "Please approve USDT spending in your wallet.",
        variant: "default",
      });

      // 1) Send approval and wait receipt
      const approveRes = await sendTransaction({
        transaction: pendingApprovalTx,
        account,
      });

      // show hash immediately once available
      if (approveRes?.transactionHash) setTxHash(approveRes.transactionHash);

      const approveReceipt = await waitForReceipt({
        client: thirdwebClient,
        chain: chainInfo.chain,
        transactionHash: approveRes.transactionHash,
      });
      if (approveReceipt.status !== "success")
        throw new Error("Approval failed on-chain");

      toast({
        title: "Approval Successful",
        description: "USDT spending approved. Proceeding with mint…",
        variant: "default",
      });

      // 2) Mint
      setProgressStage("mint");
      setStatus("Executing mint transaction…");
      const receipt = await sendAndConfirmTransaction({
        transaction: pendingMintTx,
        account,
      });

      // 3) Confirming/Success
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
    setStatus("");
    setPendingApprovalTx(null);
    setPendingMintTx(null);
  };

  const handleProgressClose = () => {
    setShowProgressModal(false);
    setProgressStage("approval");
    setTxHash("");
    setIsMinting(false);
    setStatus("");
  };

  const handleVerifyWallet = () => {
    toast({
      title: "Check Your Wallet",
      description:
        "Please check your connected wallet's NFT collection to verify if the mint was successful",
      variant: "default",
    });
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleTransactionSuccess = async (receipt: any) => {
    setProgressStage("success");
    setStatus("Minted successfully!");
    setIsMinting(false);

    toast({
      title: "Mint Successful! 🎉",
      description: `Successfully minted ${quantity} ${nftType}Pass NFT${
        Number(quantity) > 1 ? "s" : ""
      }`,
      variant: "default",
    });

    try {
      await addDoc(collection(db, "mintEvents"), {
        ...(kolId && { kolId }),
        address: account?.address,
        nftType,
        quantity: Number(quantity),
        chainId,
        txHash: receipt?.transactionHash || txHash,
        timestamp: new Date(),
        mintType: mintMode,
      });
      toast({
        title: "Transaction Recorded",
        description: "Mint event saved to database successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving mint event:", error);
      toast({
        title: "Database Warning",
        description:
          "NFT minted successfully but failed to save to database (non-critical)",
        variant: "default",
      });
    }

    setTimeout(() => window.location.reload(), 5000);
  };

  const handleTransactionError = (err: any) => {
    const errorMessage = normalizeError(err);
    console.error("Transaction error:", err);

    setStatus(`Error: ${errorMessage}`);
    setIsMinting(false);
    setProgressStage("error");

    if (chainId === "137") {
      if (errorMessage.toLowerCase().includes("gas")) {
        toast({
          title: "Polygon Network Error",
          description: "Gas estimation failed on Polygon. Try again later.",
          variant: "destructive",
        });
      } else if (errorMessage.toLowerCase().includes("insufficient")) {
        toast({
          title: "Insufficient MATIC",
          description: "You need MATIC for gas fees on Polygon.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Polygon Transaction Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else if (errorMessage.toLowerCase().includes("insufficient")) {
      const gasToken = chainId === "56" ? "BNB" : chainId === "42161" ? "ETH" : "tokens";
      toast({
        title: "Insufficient Funds",
        description: `You don't have enough ${
          chainId === "137" ? "USDT or MATIC" : "USDT"
        }. ${chainId !== "137" ? `Also need ${gasToken} for gas.` : ""}`,
        variant: "destructive",
      });
    } else if (errorMessage.toLowerCase().includes("rejected")) {
      toast({
        title: "Transaction Rejected",
        description: "Transaction was rejected in your wallet",
        variant: "destructive",
      });
    } else if (errorMessage.toLowerCase().includes("supply cap exceeded")) {
      toast({
        title: "Supply Cap Exceeded",
        description: errorMessage,
        variant: "destructive",
      });
    } else if (
      errorMessage.toLowerCase().includes("failed to fetch") ||
      errorMessage.toLowerCase().includes("network")
    ) {
      toast({
        title: "Network Error",
        description: `${
          chainId === "56" ? "BNB Chain" : chainId === "137" ? "Polygon" : "Arbitrum"
        } is unreachable. Please try again.`,
        variant: "destructive",
      });
    } else if (errorMessage.toLowerCase().includes("mint")) {
      toast({
        title: "Minting Failed",
        description: "Failed to mint the NFT. Please try again.",
        variant: "destructive",
      });
    } else if (errorMessage.toLowerCase().includes("gas")) {
      toast({
        title: "Gas Error",
        description: `Gas estimation failed on ${
          chainId === "56" ? "BNB Chain" : chainId === "137" ? "Polygon" : "Arbitrum"
        }.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Deriveds
  const unitPrice = PASS_PRICES[nftType]?.usd ?? 59;
  const progressPct = publicMintCap ? (currentSupply / publicMintCap) * 100 : 0;

  // Mobile wallet helper modal
  const MobileWalletModal = () => {
    if (!showMobileWalletOptions) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 70,
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            padding: "1.5rem",
            maxWidth: "20rem",
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
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "bold",
                margin: 0,
                color: "#1f2937",
              }}
            >
              Open in Mobile Wallet
            </h3>
            <button
              onClick={() => setShowMobileWalletOptions(false)}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: "0.25rem",
              }}
              aria-label="Close mobile wallet modal"
            >
              <X size={20} />
            </button>
          </div>
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.875rem" }}>
            For best mobile experience, open this page in a mobile wallet app:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={() => handleMobileWalletRedirect("metamask")}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "medium",
              }}
            >
              Open in MetaMask
            </button>
            <button
              onClick={() => handleMobileWalletRedirect("binance")}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#eab308",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "medium",
              }}
            >
              Open in Binance Wallet
            </button>
            <button
              onClick={() => handleMobileWalletRedirect("trustwallet")}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "medium",
              }}
            >
              Open in Trust Wallet
            </button>
          </div>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "0.75rem",
              textAlign: "center",
              marginTop: "1rem",
            }}
          >
            Or use the regular wallet connect above
          </p>
        </div>
      </div>
    );
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxPer = MAX_PER_WALLET[nftType]?.[chainId] ?? 0;
    const raw = Number(e.target.value);
    const value = Math.max(1, Math.min(maxPer || 1, Number.isFinite(raw) ? raw : 1));

    const minted = userMintedCount;
    const totalAfter = minted + value;

    const cap = PUBLIC_MINT_CAPS[nftType]?.[chainId] ?? 0;
    const current = currentSupply;

    if (mintMode === "public") {
      if (totalAfter > maxPer) {
        const remainingForUser = Math.max(0, maxPer - minted);
        toast({
          title: "Quantity Limit",
          description: `You can mint ${remainingForUser} more ${nftType}Pass on this network`,
          variant: "destructive",
        });
        setQuantity(String(Math.max(1, remainingForUser)));
        return;
      }

      if (current + value > cap) {
        const remaining = Math.max(0, cap - current);
        toast({
          title: "Supply Limit",
          description: `Only ${remaining} ${nftType}Pass remaining on this network`,
          variant: "destructive",
        });
        setQuantity(String(Math.max(1, remaining)));
        return;
      }
    }

    setQuantity(String(value));
  };

  if (!contractAddr || !usdtAddr) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#e6f0fa",
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ paddingTop: "1.5rem" }}>
            <div
              style={{
                backgroundColor: "#fee2e2",
                padding: "1rem",
                border: "1px solid #fecaca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle
                style={{ height: "1rem", width: "1rem", color: "#dc2626" }}
              />
              <span style={{ color: "#dc2626", marginLeft: "0.5rem" }}>
                Contract not loaded for selected network
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem" }}>
      <div
        style={{
          maxWidth: "32rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            backgroundColor: "#fff",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              borderBottom: "1px solid #e5e7eb",
            }}>
            <Image src="/logo.svg" alt="AGV Protocol Logo" height={32} width={32} />
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>
              AGV NFT Mint
            </h2>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ border: "1px solid #d1d5db", borderRadius: "9999px", padding: "0.25rem" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun style={{ height: "1.25rem", width: "1.25rem" }} />
              ) : (
                <Moon style={{ height: "1.25rem", width: "1.25rem" }} />
              )}
            </button>
          </div>

          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {/* Connect */}
            <div style={{ textAlign: "center" }}>
              <ConnectButton client={thirdwebClient} />
              {isMobile && !account && (
                <div style={{ marginTop: "0.75rem" }}>
                  <button
                    onClick={() => setShowMobileWalletOptions(true)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Having trouble? Open in mobile wallet
                  </button>
                </div>
              )}
            </div>

            {/* Mint mode selector (Whitelist removed) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>
                Mint Type
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setMintMode("public")}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    backgroundColor: mintMode === "public" ? "#111827" : "#f1f5f9",
                    color: mintMode === "public" ? "#fff" : "#111827",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Public
                </button>
                <button
                  onClick={() => setMintMode("agent")}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    backgroundColor: mintMode === "agent" ? "#111827" : "#f1f5f9",
                    color: mintMode === "agent" ? "#fff" : "#111827",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Agent (KOL ID)
                </button>
              </div>
            </div>

            {/* Supply Information (public only) */}
            {mintMode === "public" && (
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  padding: "1rem",
                  border: "1px solid #0ea5e9",
                  borderRadius: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "#0369a1",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>{nftType}Pass Public Mint</span>
                  <span>{publicMintCap} Total Cap (this chain)</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "#0369a1",
                  }}
                >
                  <span>
                    Minted: {currentSupply}/{publicMintCap}
                  </span>
                  <span>Available: {remainingSupply}</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#e0f2fe",
                    borderRadius: "9999px",
                    height: "0.5rem",
                    marginTop: "0.5rem",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: remainingSupply === 0 ? "#dc2626" : "#0ea5e9",
                      height: "100%",
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* User Minting Status */}
            {account && eligibilityChecked && (
              <div
                style={{
                  backgroundColor: isEligible ? "#f0fdf4" : "#fee2e2",
                  padding: "1rem",
                  border: `1px solid ${isEligible ? "#34d399" : "#fecaca"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isEligible ? (
                  <CheckCircle
                    style={{ height: "1rem", width: "1rem", color: "#10b981" }}
                  />
                ) : (
                  <AlertTriangle
                    style={{ height: "1rem", width: "1rem", color: "#dc2626" }}
                  />
                )}
                <span
                  style={{
                    color: isEligible ? "#065f46" : "#dc2626",
                    marginLeft: "0.5rem",
                  }}
                >
                  {isEligible
                    ? mintMode === "public"
                      ? `You can mint ${canMintMore} more NFTs (${userMintedCount} already minted)`
                      : "Agent mint available"
                    : status}
                </span>
              </div>
            )}

            {!account && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  padding: "1rem",
                  border: "1px solid #fecaca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle
                  style={{ height: "1rem", width: "1rem", color: "#dc2626" }}
                />
                <span style={{ color: "#dc2626", marginLeft: "0.5rem" }}>
                  Please connect your wallet
                </span>
              </div>
            )}

            {/* Gas warnings */}
            {account && hasInsufficientGas && (
              <div
                style={{
                  backgroundColor: "#fef3cd",
                  padding: "1rem",
                  border: "1px solid #f59e0b",
                  borderRadius: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertTriangle
                    style={{ height: "1rem", width: "1rem", color: "#d97706" }}
                  />
                  <span
                    style={{
                      color: "#92400e",
                      fontWeight: "semibold",
                      fontSize: "0.875rem",
                    }}
                  >
                    Insufficient Gas Token
                  </span>
                </div>
                <p style={{ color: "#92400e", fontSize: "0.75rem", margin: 0 }}>
                  You need {chainId === "56" ? "BNB" : chainId === "137" ? "MATIC" : "ETH"} tokens
                  for transaction fees. Current balance: {parseFloat(nativeBalance).toFixed(4)}{" "}
                  {chainId === "56" ? "BNB" : chainId === "137" ? "MATIC" : "ETH"}
                </p>
                <p style={{ color: "#92400e", fontSize: "0.75rem", margin: 0 }}>
                  Required: ~
                  {chainId === "56"
                    ? "0.005 BNB"
                    : chainId === "137"
                    ? "0.01 MATIC"
                    : "0.001 ETH"}{" "}
                  for gas fees
                </p>
              </div>
            )}

            {account && !hasInsufficientGas && nativeBalance !== "0" && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "0.75rem",
                  border: "1px solid #34d399",
                  borderRadius: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#065f46", fontSize: "0.875rem" }}>
                    Gas Token Balance:
                  </span>
                  <span
                    style={{
                      color: "#065f46",
                      fontSize: "0.875rem",
                      fontWeight: "semibold",
                    }}
                  >
                    {parseFloat(nativeBalance).toFixed(4)}{" "}
                    {chainId === "56" ? "BNB" : chainId === "137" ? "MATIC" : "ETH"}
                  </span>
                </div>
              </div>
            )}

            {status && !isEligible && eligibilityChecked && (
              <div
                style={{
                  backgroundColor: "#fefcbf",
                  padding: "1rem",
                  border: "1px solid #facc15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#92400e" }}>{status}</span>
              </div>
            )}

            {/* Network selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>
                Select Blockchain Network
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleChainChange("56")}
                  style={{
                    flex: "1",
                    padding: "0.5rem",
                    backgroundColor: chainId === "56" ? "#2563eb" : "#f1f5f9",
                    color: chainId === "56" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  BNB Chain
                </button>
                <button
                  onClick={() => handleChainChange("137")}
                  style={{
                    flex: "1",
                    padding: "0.5rem",
                    backgroundColor: chainId === "137" ? "#2563eb" : "#f1f5f9",
                    color: chainId === "137" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Polygon
                </button>
                <button
                  onClick={() => handleChainChange("42161")}
                  style={{
                    flex: "1",
                    padding: "0.5rem",
                    backgroundColor: chainId === "42161" ? "#2563eb" : "#f1f5f9",
                    color: chainId === "42161" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Arbitrum
                </button>
              </div>
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
                Selected Network:{" "}
                {chainId === "56" ? "BNB Chain" : chainId === "137" ? "Polygon" : "Arbitrum"}
              </p>
            </div>

            {/* Pass selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>
                Choose Your NFT Pass
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {/* SeedPass */}
                {(() => {
                  const cap = PUBLIC_MINT_CAPS.seed[chainId] ?? 0;
                  const soldOutPublic = mintMode === "public" && (cap === 0 || currentSupply >= cap);
                  return (
                    <button
                      onClick={() => handleNftTypeChange("seed")}
                      disabled={mintMode === "public" ? soldOutPublic : false}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "auto",
                        padding: "1rem",
                        backgroundColor: nftType === "seed" ? "#2563eb" : "#f1f5f9",
                        color: nftType === "seed" ? "#fff" : "#1f2937",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        cursor:
                          mintMode === "public" && soldOutPublic ? "not-allowed" : "pointer",
                        opacity: mintMode === "public" && soldOutPublic ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontWeight: "semibold" }}>SeedPass</span>
                      <span style={{ fontSize: "0.875rem" }}>Price: $29 USDT</span>
                      {mintMode === "public" && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: nftType === "seed" ? "#e5e7eb" : "#6b7280",
                          }}
                        >
                          Cap (this chain): {cap}
                        </span>
                      )}
                      {mintMode === "public" && soldOutPublic && (
                        <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                          {cap === 0 ? "Not in public mint" : "Sold Out"}
                        </span>
                      )}
                    </button>
                  );
                })()}

                {/* TreePass */}
                {(() => {
                  const cap = PUBLIC_MINT_CAPS.tree[chainId] ?? 0;
                  const soldOutPublic = mintMode === "public" && (cap === 0 || currentSupply >= cap);
                  return (
                    <button
                      onClick={() => handleNftTypeChange("tree")}
                      disabled={mintMode === "public" ? soldOutPublic : false}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "auto",
                        padding: "1rem",
                        backgroundColor: nftType === "tree" ? "#2563eb" : "#f1f5f9",
                        color: nftType === "tree" ? "#fff" : "#1f2937",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        cursor:
                          mintMode === "public" && soldOutPublic ? "not-allowed" : "pointer",
                        opacity: mintMode === "public" && soldOutPublic ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontWeight: "semibold" }}>TreePass</span>
                      <span style={{ fontSize: "0.875rem" }}>Price: $59 USDT</span>
                      {mintMode === "public" && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: nftType === "tree" ? "#e5e7eb" : "#6b7280",
                          }}
                        >
                          Cap (this chain): {cap}
                        </span>
                      )}
                      {mintMode === "public" && soldOutPublic && (
                        <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                          {cap === 0 ? "Not in public mint" : "Sold Out"}
                        </span>
                      )}
                    </button>
                  );
                })()}

                {/* SolarPass (hidden from public; disabled) */}
                <button
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: "#f1f5f9",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                  disabled
                >
                  <span style={{ fontWeight: "semibold" }}>SolarPass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $299 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                    Not Available in Public Mint
                  </span>
                </button>

                {/* ComputePass (hidden from public; disabled) */}
                <button
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: "#f1f5f9",
                    color: "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                  disabled
                >
                  <span style={{ fontWeight: "semibold" }}>ComputePass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $899 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                    Not Available in Public Mint
                  </span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            {(() => {
              const minted = userMintedCount;
              const maxPerThisChain = MAX_PER_WALLET[nftType][chainId] ?? 0;
              const _canMintMore = Math.max(
                0,
                Math.min(maxPerThisChain - minted, remainingSupply)
              );

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    htmlFor="quantity"
                    style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}
                  >
                    Quantity
                    {mintMode === "public" ? ` (Max ${_canMintMore})` : ""}
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={mintMode === "public" ? Math.max(1, _canMintMore) : 99}
                    value={quantity}
                    onChange={handleQuantityChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      outline: "none",
                    }}
                  />
                </div>
              );
            })()}

            {/* KOL ID (required for Agent) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="kolId"
                style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}
              >
                {mintMode === "agent" ? "KOL ID (Required)" : "KOL ID (Optional)"}
              </label>
              <input
                id="kolId"
                type="text"
                value={kolId}
                onChange={(e) => setKolId(e.target.value)}
                placeholder={
                  mintMode === "agent"
                    ? "Enter your KOL ID to mint as Agent"
                    : "Enter KOL ID if applicable"
                }
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Price summary */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                fontSize: "0.875rem",
                color: "#4b5563",
              }}
            >
              <p>Unit Price: ${unitPrice} USDT</p>
              <p style={{ fontWeight: "semibold", color: "#1f2937" }}>
                Total: {(unitPrice * Number(quantity || 0)).toFixed(2)} USDT
              </p>
              {account && (
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Payment will be processed in USDT only
                </p>
              )}
              {account && usdtData?.displayValue && (
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Your USDT: {usdtData.displayValue} {usdtData.symbol}
                </p>
              )}
            </div>

            {/* Mint CTA (custom flow; no TransactionButton to avoid state loops) */}
            <div style={{ paddingTop: "1rem", paddingBottom: 0 }}>
              <button
                onClick={async () => {
                  try {
                    await prepareTransactions();
                  } catch (e) {
                    // errors already toasted
                  }
                }}
                disabled={
                  !account ||
                  isMinting ||
                  !isEligible ||
                  (mintMode === "public" && remainingSupply === 0) ||
                  hasInsufficientGas ||
                  (mintMode === "agent" && kolId.trim().length === 0)
                }
                style={{
                  width: "100%",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: "semibold",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  fontSize: "1.125rem",
                  cursor:
                    !account ||
                    isMinting ||
                    !isEligible ||
                    (mintMode === "public" && remainingSupply === 0) ||
                    hasInsufficientGas ||
                    (mintMode === "agent" && kolId.trim().length === 0)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !account ||
                    isMinting ||
                    !isEligible ||
                    (mintMode === "public" && remainingSupply === 0) ||
                    hasInsufficientGas ||
                    (mintMode === "agent" && kolId.trim().length === 0)
                      ? 0.5
                      : 1,
                }}
              >
                {isMinting
                  ? "Preparing…"
                  : !account
                  ? "Connect Wallet"
                  : hasInsufficientGas
                  ? `Need ${chainId === "56" ? "BNB" : chainId === "137" ? "MATIC" : "ETH"} for Gas`
                  : !isEligible
                  ? "Not Eligible"
                  : mintMode === "agent" && !kolId.trim()
                  ? "Enter KOL ID"
                  : mintMode === "public" && remainingSupply === 0
                  ? "Sold Out"
                  : "Mint Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Spending Cap Modal (appears first after Mint clicked) */}
        <SpendingCapModal
          isOpen={showSpendingModal}
          onClose={handleSpendingCapClose}
          onConfirm={handleSpendingCapConfirm}
          spender={contractAddr ? `${contractAddr.slice(0, 6)}...${contractAddr.slice(-4)}` : ""}
          requestFrom="agv-nft.com"
          spendingCap={(unitPrice * Number(quantity || 0)).toFixed(2)}
          tokenSymbol="USDT"
          networkFee="~"
        />

        {/* Mobile Wallet Options Modal */}
        <MobileWalletModal />

        {/* Transaction Progress Modal (ONLY after Confirm) */}
        <TransactionProgressModal
          isOpen={showProgressModal}
          onClose={handleProgressClose}
          status={status}
          txHash={txHash}
          chainId={chainId}
          stage={progressStage}
          onVerifyWallet={handleVerifyWallet}
        />

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>
            Are you a KOL or Agent? {""}       
            <Link
            href="/dashboard"
            style={{ color: "#2563eb", fontWeight: "medium", textDecoration: "underline" }}
          >
            Go to Dashboard
          </Link>
          </h2>
        </div>
        <footer
          style={{
            marginTop: "auto",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          &copy; AGV Protocol {new Date().getFullYear()}
        </footer>

        {/* Wallet required modal (derived, loop-safe) */}
        {!account && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "#ecececff",
              padding: "1rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 80,
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: "semibold" }}>
              Wallet Connection Required
            </h3>
            <div
              style={{
                backgroundColor: "#fefcbf",
                padding: "1rem",
                border: "1px solid #facc15",
                marginTop: "0.5rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              <AlertTriangle
                style={{ height: "1rem", width: "1rem", color: "#d97706" }}
              />
              <span style={{ color: "#92400e", marginLeft: "0.5rem" }}>
                Please connect your wallet to continue with minting.
              </span>
            </div>
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <ConnectButton client={thirdwebClient} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}