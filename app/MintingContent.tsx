"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
  useWalletBalance,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
  sendAndConfirmTransaction,
} from "thirdweb";
import { parseUnits } from "viem";
import {
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  ExternalLink,
  Copy,
  Lock,
} from "lucide-react";
import { recordSuccessfulMintStrict } from "@/lib/recordMint";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { CollectionKey } from "@/lib/contracts";
import {
  CHAINS,
  USDT_ADDRESSES,
  NFT_CONTRACTS,
  NFT_ABI,
  USDT_ABI,
} from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

/** ---------------- Types ---------------- **/
type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;
type EffectiveMode = "public" | "whitelist";

/** ---------------- Mode caps (per chain) ---------------- **/
/**
 * Kept as-is per your totals:
 * Seed: WL 200, Public 400
 * Tree: WL 100, Public 200
 * Solar: WL 100, Public 100, Agent 100 (agent now on /agent-mint)
 * Compute: WL 29, Public 20, Agent 50 (agent now on /agent-mint)
 */
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

/** Per-chain wallet caps (unchanged) **/
const MAX_PER_WALLET: Record<NftType, Record<ChainId, number>> = {
  seed: { "56": 3, "137": 3, "42161": 3 },
  tree: { "56": 2, "137": 2, "42161": 2 },
  solar: { "56": 2, "137": 2, "42161": 2 },
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

  const EXPLORERS: Record<ChainId, string> = {
    "56": "https://bscscan.io",
    "137": "https://polscan.io",
    "42161": "https://arbiscan.io",
  };

  const fallback =
    chainInfo?.chain?.blockExplorers?.default?.url ??
    chainInfo?.chain?.blockExplorers?.etherscan?.url ??
    "";

  const explorerBase = EXPLORERS[chainId] ?? fallback;
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

const networkLabel = (id: ChainId) =>
  id === "56" ? "BNB Chain" : id === "137" ? "Polygon" : "Arbitrum";

/** Normalize config() result across Seed/Tree (uint16 vs uint256 counters) */
function parseSaleConfig(raw: any) {
  if (!raw) return null as null;
  const get = (x: any, k: number | string) =>
    typeof k === "number" ? (Array.isArray(x) ? x[k] : undefined) : (x?.[k]);
  const wlStartTime = Number(get(raw, 0) ?? get(raw, "wlStartTime") ?? 0);
  const wlEndTime = Number(get(raw, 1) ?? get(raw, "wlEndTime") ?? 0);
  const saleActive = Boolean(get(raw, 2) ?? get(raw, "saleActive") ?? false);
  const metadataFrozen = Boolean(get(raw, 3) ?? get(raw, "metadataFrozen") ?? false);
  const publicMinted = Number(get(raw, 4) ?? get(raw, "publicMinted") ?? 0);
  const whitelistMinted = Number(get(raw, 5) ?? get(raw, "whitelistMinted") ?? 0);
  return { wlStartTime, wlEndTime, saleActive, metadataFrozen, publicMinted, whitelistMinted };
}

const isWhitelistPhaseString = (s: string) => {
  const u = (s || "").toUpperCase();
  return u.includes("WL") || u.includes("WHITELIST");
};

/** ---------------- Main Component ---------------- **/
export default function MintingContent() {
  const account = useActiveAccount();

  // ----- UI State -----
  const [kolDigits, setKolDigits] = useState(""); // 0-6 digits only
  const [kolLocked, setKolLocked] = useState(false); // locked when from referral
  const fullKolId = useMemo(
    () => (kolDigits && kolDigits.length === 6 ? `AGV-KOL${kolDigits}` : ""),
    [kolDigits]
  );
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

  // ----- Whitelist gating (proof from API) -----
  const [wlEligible, setWlEligible] = useState(false);
  const [wlProof, setWlProof] = useState<string[] | null>(null);
  const [checkingWl, setCheckingWl] = useState(false);

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

  // On-chain sale config + phase
  const { data: rawConfig, isLoading: loadingConfig, error: configErr } = useReadContract({
    contract: nftContract!,
    method: "config",
    params: [],
    queryOptions: { enabled: !!nftContract },
  });

  const { data: rawPhase } = useReadContract({
    contract: nftContract!,
    method: "getCurrentPhase",
    params: [],
    queryOptions: { enabled: !!nftContract },
  });

  const saleConfig = useMemo(() => parseSaleConfig(rawConfig), [rawConfig]);
  const phaseStr = useMemo(() => (rawPhase ? String(rawPhase) : ""), [rawPhase]);

  const nowSec = Math.floor(Date.now() / 1000);
  const wlWindowOpen =
    !!saleConfig &&
    saleConfig.saleActive &&
    nowSec >= saleConfig.wlStartTime &&
    nowSec <= saleConfig.wlEndTime &&
    isWhitelistPhaseString(phaseStr);

  const wlHasNotStarted =
    !!saleConfig && saleConfig.saleActive && nowSec < saleConfig.wlStartTime;

  const wlHasEnded =
    !!saleConfig &&
    saleConfig.saleActive &&
    (nowSec > saleConfig.wlEndTime || (!isWhitelistPhaseString(phaseStr) && phaseStr.toUpperCase().includes("PUBLIC")));

  const configAvailable = !!saleConfig;
  const mintingActive = !!saleConfig?.saleActive;

  const effectiveMode: EffectiveMode =
    wlWindowOpen && wlEligible ? "whitelist" : "public";

  // Per-mode minted from config (more accurate than totalSupply for progress in the selected mode)
  const mintedForMode = saleConfig
    ? effectiveMode === "whitelist"
      ? Number(saleConfig.whitelistMinted || 0)
      : Number(saleConfig.publicMinted || 0)
    : 0;

  // Mode-cap helpers (per chain) based on effective mode
  const capForMode = MODE_CAPS_BY_CHAIN[nftType]?.[chainId]?.[effectiveMode] ?? 0;

  // REAL remaining for logic
  const remainingActual = Math.max(0, capForMode - mintedForMode);

  // FOMO: display only 10% of actual remaining unless actual (nearest whole) < 10
  const nearestRem = Math.round(remainingActual);
  const displayRemaining = nearestRem < 10 ? nearestRem : Math.max(1, Math.floor(nearestRem * 0.1));


  // Progress (per selected mode)
  // FOMO: 10% view of actual remaining (already computed above as displayRemaining)
  const fomoRemaining = displayRemaining;

  // Progress must correspond to the *displayed* available:
  // e.g., if total=250 and Available=24, progress = (250-24)/250 = 90.4%
  const progressPct = capForMode
    ? ((capForMode - Math.min(fomoRemaining, capForMode)) / capForMode) * 100
    : 0;


  // User minted count & per-wallet cap
  const { data: userBalance } = useReadContract({
    contract: nftContract!,
    method: "balanceOf",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!nftContract && !!account?.address },
  });

  const userMintedCount = userBalance ? Number(userBalance) : 0;
  const maxPerWalletChain = MAX_PER_WALLET[nftType]?.[chainId] ?? 0;

  // ------ Balances via Hooks ------
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

  // Sync kolId from URL params (ref is alias) and LOCK if prefilled
  const pathname = usePathname();
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

  // Gas thresholds
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

  // Global error toasts
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

  /** ---- Whitelist proof fetch ---- */
  useEffect(() => {
    const run = async () => {
      setWlEligible(false);
      setWlProof(null);
      if (!account?.address) return;

      try {
        setCheckingWl(true);
        const res = await fetch(`/api/merkle-proof?address=${account.address}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setWlEligible(false);
          setWlProof(null);
          return;
        }
        const data = await res.json();
        const proof = Array.isArray(data?.proof) ? data.proof : [];
        if (data?.whitelisted && proof.length > 0) {
          setWlEligible(true);
          setWlProof(proof);
        } else {
          setWlEligible(false);
          setWlProof(null);
        }
      } catch {
        setWlEligible(false);
        setWlProof(null);
      } finally {
        setCheckingWl(false);
      }
    };
    run();
  }, [account?.address]);

  /** ---- Eligibility (auto-mode) ---- */
  useEffect(() => {
    setEligibilityChecked(false);
    setIsEligible(false);
    setStatus("");
  }, [account?.address, chainId, nftType, saleConfig, phaseStr, wlEligible, wlProof]);

  useEffect(() => {
    const runCheck = async () => {
      if (!account?.address) return;

      // If contract/config not available
      if (!nftContract || !configAvailable) {
        setIsEligible(false);
        setStatus("Unavailable on this network");
        setEligibilityChecked(true);
        return;
      }

      // saleActive gates minting entirely
      if (!mintingActive) {
        setIsEligible(false);
        setStatus("Minting not active");
        setEligibilityChecked(true);
        return;
      }

      // Per-wallet + supply checks against EFFECTIVE mode
      const minted = userMintedCount;
      const maxPer = maxPerWalletChain;
      const cap = capForMode;
      const mintedMode = mintedForMode;

      if (cap === 0) {
        setIsEligible(false);
        setStatus(`This pass is not available for ${effectiveMode} mint on this network`);
        setEligibilityChecked(true);
        return;
      }
      if (mintedMode >= cap || remainingActual <= 0) {
        setIsEligible(false);
        setStatus(`${effectiveMode === "public" ? "Public" : "Whitelist"} mint sold out (${cap}/${cap})`);
        setEligibilityChecked(true);
        return;
      }
      if (minted >= maxPer) {
        setIsEligible(false);
        setStatus(`Per-wallet limit reached (${maxPer} on this chain)`);
        setEligibilityChecked(true);
        return;
      }

      // WL-specific requirement when we’re inside WL phase
      if (effectiveMode === "whitelist") {
        if (checkingWl) {
          setStatus("Fetching whitelist proof…");
          return;
        }
        if (!wlProof || wlProof.length === 0) {
          setIsEligible(false);
          setStatus("Address not whitelisted");
          setEligibilityChecked(true);
          return;
        }
      }

      const remainingForUser = Math.min(maxPer - minted, remainingActual);
      setIsEligible(true);
      setStatus(
        effectiveMode === "public"
          ? `You can mint up to ${remainingForUser} more on this network`
          : "Eligible for whitelist minting"
      );
      setEligibilityChecked(true);
    };

    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account?.address,
    nftContract,
    configAvailable,
    mintingActive,
    effectiveMode,
    checkingWl,
    wlProof,
    userMintedCount,
    maxPerWalletChain,
    capForMode,
    mintedForMode,
    remainingActual,
  ]);

  const handleChainChange = (newChainId: ChainId) => {
    if (newChainId === chainId) return;
    setChainId(newChainId);
    toast({
      title: "Network Changed",
      description: newChainId === "56" ? "BNB Chain" : newChainId === "137" ? "Polygon" : "Arbitrum",
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

  /** ---- Mint Flow ---- **/
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
    if (!configAvailable) {
      toast({
        title: "Unavailable",
        description: "Contract not available on this network.",
        variant: "destructive",
      });
      throw new Error("Config not available");
    }
    if (!mintingActive) {
      toast({
        title: "Minting Inactive",
        description: "Minting is not active on-chain.",
        variant: "destructive",
      });
      throw new Error("Minting inactive");
    }

    setIsMinting(true);
    setStatus("Preparing transaction…");

    // Optional KOL attribution (non-blocking here)
    if (fullKolId) {
      const q = query(collection(db, "kols"), where("kolId", "==", fullKolId));
      await getDocs(q).catch(() => void 0);
    }

    const qty = Number(quantity);
    if (qty < 1) {
      setIsMinting(false);
      throw new Error("Quantity must be at least 1");
    }

    // Per-wallet & cap checks with ACTUAL remaining
    const minted = userMintedCount;
    const maxPer = maxPerWalletChain;
    const cap = capForMode;
    const currentModeMinted = mintedForMode;

    if (cap === 0) {
      setIsMinting(false);
      throw new Error(`Not available for ${effectiveMode} mint`);
    }
    if (minted + qty > maxPer) {
      setIsMinting(false);
      throw new Error(`Exceeds maximum per wallet (${maxPer})`);
    }
    if (currentModeMinted + qty > cap) {
      setIsMinting(false);
      throw new Error(
        `Exceeds ${effectiveMode} cap. Only ${Math.max(0, cap - currentModeMinted)} remaining`
      );
    }

    const decimals = Number(usdtDecimalsData ?? 6);
    const unitAmount = parseUnits(String(PASS_PRICES[nftType]?.usd ?? 59), decimals);
    const amountToApprove = unitAmount * BigInt(qty);

    const approveTx = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [contractAddr, amountToApprove],
    });

    // mint(uint256 qty, bytes32[] proof)
    const mintParams: any[] =
      effectiveMode === "whitelist" ? [BigInt(qty), wlProof ?? []] : [BigInt(qty), []];

    const mintTx = prepareContractCall({
      contract: nftContract,
      method: "mint",
      params: mintParams,
    });

    setPendingApprovalTx(approveTx);
    setPendingMintTx(mintTx);

    setShowSpendingModal(true);
    setStatus("Review and confirm the spending cap to continue…");
  };

  const { data: usdtDecimalsData } = useReadContract({
    contract: usdtContract!,
    method: "decimals",
    params: [],
    queryOptions: { enabled: !!usdtContract },
  });

  const handleSpendingCapConfirm = async () => {
    try {
      setShowSpendingModal(false);
      setShowProgressModal(true);
      setProgressStage("approval");
      setStatus("Approving USDT spending…");
      toast({
        title: "Approve Transaction",
        description: "Please approve USDT spending in your wallet.",
        variant: "default",
      });

      const approveRes = await sendTransaction({
        transaction: pendingApprovalTx,
        account,
      });

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

      setProgressStage("mint");
      setStatus("Executing mint transaction…");
      const receipt = await sendAndConfirmTransaction({
        transaction: pendingMintTx,
        account,
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
      await recordSuccessfulMintStrict(db, fullKolId, {
        address: account?.address!,
        nftType,
        quantity: Number(quantity),
        chainId,
        txHash: receipt?.transactionHash || txHash,
        timestamp: new Date(),
        mintType: effectiveMode,
      });

      toast({
        title: "Transaction Recorded",
        description: "Mint recorded successfully for KOL and mintEvents",
        variant: "default",
      });
    } catch (error) {
      console.error("Error recording mint:", error);
      toast({
        title: "Database Warning",
        description:
          "NFT minted successfully but failed to update KOL counters (non-critical)",
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
    const maxPer = maxPerWalletChain;
    const raw = Number(e.target.value);
    const value = Math.max(1, Math.min(maxPer || 1, Number.isFinite(raw) ? raw : 1));

    const minted = userMintedCount;
    const totalAfter = minted + value;

    const cap = capForMode;
    const currentModeMinted = mintedForMode;

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

    if (currentModeMinted + value > cap) {
      const remaining = Math.max(0, cap - currentModeMinted);
      toast({
        title: "Supply Limit",
        description: `Only ${remaining} ${nftType}Pass remaining in ${effectiveMode === "public" ? "Public" : "Whitelist"} on this network`,
        variant: "destructive",
      });
      setQuantity(String(Math.max(1, remaining)));
      return;
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

  const unitPrice = PASS_PRICES[nftType]?.usd ?? 59;

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
            }}
          >
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

            {/* Supply / Cap box (per effective mode) */}
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
                <span>
                  {nftType}Pass {effectiveMode === "public" ? "Public" : "Whitelist"} Mint
                </span>
                <span>{`Cap (${networkLabel(chainId)} / ${effectiveMode === "public" ? "Public" : "Whitelist"}): ${capForMode}`}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  fontSize: "0.875rem",
                  color: "#0369a1",
                }}
              >
                <span>Available: {displayRemaining}</span>
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
                    backgroundColor: displayRemaining === 0 ? "#dc2626" : "#0ea5e9",
                    height: "100%",
                    borderRadius: "9999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* WL timing + alerts */}
              {configAvailable && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#0369a1" }}>
                  <div>
                    WL window:{" "}
                    <strong>{new Date((saleConfig!.wlStartTime || 0) * 1000).toLocaleString()}</strong>{" "}
                    —{" "}
                    <strong>{new Date((saleConfig!.wlEndTime || 0) * 1000).toLocaleString()}</strong>
                  </div>

                  {!mintingActive && (
                    <div style={{ color: "#b91c1c", marginTop: 6 }}>
                      Minting not active.
                    </div>
                  )}

                  {mintingActive && wlHasNotStarted && (
                    <div style={{ color: "#b45309", marginTop: 6 }}>
                      Whitelist opens at{" "}
                      <strong>
                        {new Date(saleConfig!.wlStartTime * 1000).toLocaleString()}
                      </strong>
                    </div>
                  )}

                  {mintingActive && wlHasEnded && (
                    <div style={{ color: "#b45309", marginTop: 6 }}>
                      Whitelist minting has ended, minting is now only available in public mode
                    </div>
                  )}
                </div>
              )}

              {!configAvailable && (
                <p style={{ marginTop: "0.5rem", color: "#b45309", fontSize: "0.875rem" }}>
                  Unavailable on this network
                </p>
              )}
            </div>

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
                    ? effectiveMode === "public"
                      ? `You can mint up to ${Math.min(
                          maxPerWalletChain - userMintedCount,
                          remainingActual
                        )} more NFTs (${userMintedCount} already minted)`
                      : "Eligible for whitelist minting"
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
                {networkLabel(chainId)}
              </p>
            </div>

            {/* Pass selector (all four visible; availability determined after select via config()) */}
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
                {(["seed","tree","solar","compute"] as NftType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNftTypeChange(key)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "auto",
                      padding: "1rem",
                      backgroundColor: nftType === key ? "#2563eb" : "#f1f5f9",
                      color: nftType === key ? "#fff" : "#1f2937",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontWeight: "semibold" }}>
                      {key[0].toUpperCase() + key.slice(1)}Pass
                    </span>
                    <span style={{ fontSize: "0.875rem" }}>
                      Price: ${PASS_PRICES[key].usd} USDT
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: nftType === key ? "#e5e7eb" : "#6b7280",
                      }}
                    >
                      Cap ({networkLabel(chainId)} / {effectiveMode === "public" ? "Public" : "Whitelist"}):{" "}
                      {MODE_CAPS_BY_CHAIN[key][chainId][effectiveMode]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            {(() => {
              const minted = userMintedCount;
              const maxPerThisChain = MAX_PER_WALLET[nftType][chainId] ?? 0;
              const _canMintMore = Math.max(0, Math.min(maxPerThisChain - minted, remainingActual));

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label
                    htmlFor="quantity"
                    style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}
                  >
                    Quantity (Max {_canMintMore})
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={Math.max(1, _canMintMore)}
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

            {/* KOL ID (locks if prefilled via referral) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                htmlFor="kolDigits"
                style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}
              >
                ID (6 digits, Optional - "Only input an ID if you were given one"){" "}
                {kolLocked && (
                  <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>
                    <Lock style={{ display: "inline", width: 14, height: 14, marginRight: 4 }} />
                  </span>
                )}
              </label>
              <input
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
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  outline: "none",
                  letterSpacing: 2,
                  backgroundColor: kolLocked ? "#f3f4f6" : "#fff",
                  color: kolLocked ? "#6b7280" : "#111827",
                  cursor: kolLocked ? "not-allowed" : "text",
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

            {/* Mint CTA */}
            <div style={{ paddingTop: "1rem", paddingBottom: 0 }}>
              <button
                onClick={async () => {
                  try {
                    await prepareTransactions();
                  } catch (e) {
                    toast({
                      title: "Unable to proceed",
                      description: normalizeError(e),
                      variant: "destructive",
                    });
                  }
                }}
                disabled={
                  !account ||
                  isMinting ||
                  !isEligible ||
                  remainingActual === 0 ||
                  hasInsufficientGas ||
                  !configAvailable ||
                  !mintingActive ||
                  (effectiveMode === "whitelist" && (checkingWl || !wlProof || wlProof.length === 0))
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
                    remainingActual === 0 ||
                    hasInsufficientGas ||
                    !configAvailable ||
                    !mintingActive ||
                    (effectiveMode === "whitelist" && (checkingWl || !wlProof || wlProof.length === 0))
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !account ||
                    isMinting ||
                    !isEligible ||
                    remainingActual === 0 ||
                    hasInsufficientGas ||
                    !configAvailable ||
                    !mintingActive ||
                    (effectiveMode === "whitelist" && (checkingWl || !wlProof || wlProof.length === 0))
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
                  : !configAvailable
                  ? "Unavailable on this network"
                  : !mintingActive
                  ? "Minting not active"
                  : !isEligible
                  ? "Not Eligible"
                  : remainingActual === 0
                  ? "Sold Out"
                  : effectiveMode === "whitelist" && (checkingWl || !wlProof || wlProof.length === 0)
                  ? "Verifying whitelist…"
                  : "Mint Now"}
              </button>
            </div>
          </div>
        </div>

        {/* Spending Cap Modal */}
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

        {/* Transaction Progress Modal */}
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
        <Link href="/dashboard" style={{ color: "#2563eb", fontWeight: "medium", textDecoration: "underline" }} >
          Go to Dashboard </Link> 
        </h2> 
        </div> 
        <footer style={{ marginTop: "auto", textAlign: "center", color: "#6b7280", fontSize: "0.875rem", }} >
          &copy; AGV Protocol {new Date().getFullYear()} 
         </footer>

        {/* Wallet required modal */}
        {!account && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "#000000ff",
              padding: "1rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 80,
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: "semibold", color: "#ffffffff" }}>
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
              <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#d97706" }} />
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
