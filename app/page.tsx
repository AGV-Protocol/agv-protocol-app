"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { Moon, Sun, AlertTriangle, CheckCircle, X, Loader2, ExternalLink, Copy } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, NFT_ABI, USDT_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";

// Create client inside the component to avoid SSR issues
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;

// Public mint supply caps
const PUBLIC_MINT_CAPS = {
  seed: 400,
  tree: 200,
  solar: 0, // Not available for public mint
  compute: 0, // Not available for public mint
} as const;

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

interface TransactionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  txHash?: string;
  chainId: ChainId;
  stage: 'approval' | 'mint' | 'confirming' | 'success' | 'timeout' | 'error';
  onVerifyWallet: () => void;
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
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: "#1f2937",
        color: "#fff",
        borderRadius: "1rem",
        padding: "1.5rem",
        maxWidth: "28rem",
        width: "90%",
        margin: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
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
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ color: "#d1d5db", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          This site wants permission to withdraw your tokens
        </p>
        <div style={{ backgroundColor: "#374151", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem" }}>
          <h4 style={{ color: "#f3f4f6", fontSize: "0.875rem", fontWeight: "semibold", marginBottom: "0.5rem" }}>
            Estimated changes
          </h4>
          <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "1rem" }}>
            You're giving someone else permission to spend this amount from your account.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#d1d5db", fontSize: "0.875rem" }}>Spending cap</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#fff", fontWeight: "semibold" }}>{spendingCap}</span>
              <span style={{ color: "#10b981", fontSize: "0.875rem" }}>{tokenSymbol}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Spender</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }}></div>
              <span style={{ color: "#fff", fontSize: "0.875rem", fontFamily: "monospace" }}>
                {spender}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Request from</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                backgroundColor: "#8b5cf6",
              }}></div>
              <span style={{ color: "#fff", fontSize: "0.875rem" }}>{requestFrom}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Network fee</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#fff", fontSize: "0.875rem" }}>{networkFee}</span>
              <span style={{ color: "#10b981", fontSize: "0.875rem" }}>{tokenSymbol}</span>
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
  const explorerUrl = txHash ? `${chainInfo?.explorer}/tx/${txHash}` : null;

  useEffect(() => {
    if (!isOpen || stage === 'success') return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Show timeout option after 2 minutes for mint stage
    if (stage === 'confirming' && timeElapsed >= 120) {
      setShowTimeoutOption(true);
    }

    return () => clearInterval(timer);
  }, [isOpen, stage, timeElapsed]);

  useEffect(() => {
    if (isOpen) {
      setTimeElapsed(0);
      setShowTimeoutOption(false);
    }
  }, [isOpen]);

  const copyTxHash = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash);
      toast({
        title: "Copied!",
        description: "Transaction hash copied to clipboard",
        variant: "default",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 60,
    }}>
      <div style={{
        backgroundColor: "#1f2937",
        color: "#fff",
        borderRadius: "1rem",
        padding: "1.5rem",
        maxWidth: "28rem",
        width: "90%",
        margin: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {stage === 'success' ? (
              <CheckCircle style={{ height: "1.5rem", width: "1.5rem", color: "#10b981" }} />
            ) : stage === 'error' ? (
              <AlertTriangle style={{ height: "1.5rem", width: "1.5rem", color: "#ef4444" }} />
            ) : (
              <Loader2 style={{ 
                height: "1.5rem", 
                width: "1.5rem", 
                color: "#3b82f6", 
                animation: "spin 1s linear infinite" 
              }} />
            )}
            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
              {stage === 'success' ? 'Transaction Successful!' : 
               stage === 'error' ? 'Transaction Failed' :
               stage === 'timeout' ? 'Transaction Timeout' :
               'Transaction Progress'}
            </h3>
          </div>
          {(stage === 'success' || stage === 'error' || showTimeoutOption) && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            {status}
          </p>
          {timeElapsed > 0 && stage !== 'success' && (
            <p style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
              Time elapsed: {formatTime(timeElapsed)}
            </p>
          )}
        </div>

        {/* Transaction Hash Display */}
        {txHash && (
          <div style={{ 
            backgroundColor: "#374151", 
            borderRadius: "0.5rem", 
            padding: "1rem", 
            marginBottom: "1rem" 
          }}>
            <h4 style={{ color: "#f3f4f6", fontSize: "0.875rem", fontWeight: "semibold", marginBottom: "0.5rem" }}>
              Transaction Hash
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ 
                color: "#10b981", 
                fontSize: "0.75rem", 
                fontFamily: "monospace",
                wordBreak: "break-all",
                flex: 1
              }}>
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

        {/* Progress Steps */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "1rem",
              height: "1rem",
              borderRadius: "50%",
              backgroundColor: stage === 'approval' ? "#3b82f6" : "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {stage === 'approval' ? (
                <Loader2 size={8} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <CheckCircle size={8} />
              )}
            </div>
            <span style={{ fontSize: "0.75rem", color: stage === 'approval' ? "#3b82f6" : "#10b981" }}>
              USDT Approval
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "1rem",
              height: "1rem",
              borderRadius: "50%",
              backgroundColor: stage === 'mint' || stage === 'confirming' ? "#3b82f6" : 
                              stage === 'success' ? "#10b981" : "#4b5563",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {(stage === 'mint' || stage === 'confirming') ? (
                <Loader2 size={8} style={{ animation: "spin 1s linear infinite" }} />
              ) : stage === 'success' ? (
                <CheckCircle size={8} />
              ) : null}
            </div>
            <span style={{ 
              fontSize: "0.75rem", 
              color: (stage === 'mint' || stage === 'confirming') ? "#3b82f6" : 
                     stage === 'success' ? "#10b981" : "#9ca3af" 
            }}>
              NFT Mint
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
          {showTimeoutOption && stage === 'confirming' && (
            <>
              <p style={{ color: "#fbbf24", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                Transaction is taking longer than expected. This may be due to network congestion.
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
                Please check your connected wallet to verify if the NFT was minted successfully
              </p>
            </>
          )}
          
          {stage === 'error' && (
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

        {stage === 'confirming' && !showTimeoutOption && (
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", textAlign: "center" }}>
            Please do not refresh or leave the page. This may take a few minutes.
          </p>
        )}
      </div>
    </div>
  );
};

export default function MintingContent() {
  const account = useActiveAccount();
  const [kolId, setKolId] = useState("");
  const [chainId, setChainId] = useState<ChainId>("42161");
  const [nftType, setNftType] = useState<NftType>("tree");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [progressStage, setProgressStage] = useState<'approval' | 'mint' | 'confirming' | 'success' | 'timeout' | 'error'>('approval');
  const [pendingApprovalTx, setPendingApprovalTx] = useState<any>(null);
  const [pendingMintTx, setPendingMintTx] = useState<any>(null);
  const { setTheme, theme } = useTheme();
  const chainInfo = CHAINS[chainId];
  const contractAddr = NFT_CONTRACTS[nftType]?.[chainId];
  const usdtAddr = USDT_ADDRESSES[chainId];
  const nftContract = contractAddr ? getContract({
    client: thirdwebClient,
    address: contractAddr,
    chain: chainInfo.chain,
    abi: NFT_ABI,
  }) : null;
  const usdtContract = usdtAddr ? getContract({
    client: thirdwebClient,
    address: usdtAddr,
    chain: chainInfo.chain,
    abi: USDT_ABI,
  }) : null;

  // Get NFT supply information using ThirdWeb hooks
  const { data: totalSupply } = useReadContract({
    contract: nftContract!,
    method: "totalSupply",
    params: [],
  });
  const { data: userBalance } = useReadContract({
    contract: nftContract!,
    method: "balanceOf",
    params: [account?.address || "0x0"],
  });

  const unitPrice = PASS_PRICES[nftType]?.usd || 59;
  const totalPrice = unitPrice * Number(quantity);
  const publicMintCap = PUBLIC_MINT_CAPS[nftType];
  const currentSupply = totalSupply ? Number(totalSupply) : 0;
  const remainingSupply = Math.max(0, publicMintCap - currentSupply);

  // One-time eligibility check on wallet connection
  const checkEligibility = useCallback(async () => {
    if (!account?.address || !nftContract || eligibilityChecked) return;
    setStatus("Checking minting eligibility...");
    try {
      // Check if public mint cap has been reached
      const currentSupply = totalSupply ? Number(totalSupply) : 0;
      const publicMintCap = PUBLIC_MINT_CAPS[nftType];
      if (currentSupply >= publicMintCap) {
        setIsEligible(false);
        setStatus(`Public mint sold out (${publicMintCap}/${publicMintCap})`);
        toast({
          title: "Public Mint Sold Out",
          description: `All ${publicMintCap} ${nftType}Pass NFTs have been minted`,
          variant: "destructive",
        });
        setEligibilityChecked(true);
        return;
      }
      if (publicMintCap === 0) {
        setIsEligible(false);
        setStatus(`${nftType}Pass not available for public mint`);
        toast({
          title: "Not Available",
          description: `${nftType}Pass is not available for public mint`,
          variant: "destructive",
        });
        setEligibilityChecked(true);
        return;
      }
      // Check if user has already minted the maximum allowed per wallet
      const userMintedCount = userBalance ? Number(userBalance) : 0;
      const maxPerWallet = 5; // Assuming 5 is the max per wallet
      if (userMintedCount >= maxPerWallet) {
        setIsEligible(false);
        setStatus(`Maximum minting limit reached (${maxPerWallet})`);
        toast({
          title: "Minting Limit Reached",
          description: `You have already minted the maximum of ${maxPerWallet} NFTs`,
          variant: "destructive",
        });
      } else {
        const remainingForUser = Math.min(maxPerWallet - userMintedCount, publicMintCap - currentSupply);
        setIsEligible(true);
        setStatus("Eligible for minting");
        toast({
          title: "Eligibility Confirmed",
          description: `You can mint up to ${remainingForUser} more ${nftType}Pass NFTs`,
          variant: "default",
        });
      }
      setEligibilityChecked(true);
    } catch (error) {
      console.error("Eligibility check failed:", error);
      setIsEligible(false);
      setStatus("Eligibility check failed");
      setEligibilityChecked(true);
    }
  }, [account?.address, nftContract, userBalance, eligibilityChecked, totalSupply, nftType]);

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      if (!account || !account.address) {
        setStatus("Connect wallet to mint");
        setIsOpen(true);
        setEligibilityChecked(false);
        setIsEligible(false);
      } else {
        setIsOpen(false);
        // Only check eligibility once when wallet connects
        if (!eligibilityChecked) {
          await checkEligibility();
        }
      }
      setIsLoading(false);
    };
    initializeComponent();
  }, [account, checkEligibility, eligibilityChecked]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
    // Check if the selected quantity would exceed available supply
    const userMintedCount = userBalance ? Number(userBalance) : 0;
    const totalAfterMinting = userMintedCount + value;
    const maxPerWallet = 5;
    const currentSupply = totalSupply ? Number(totalSupply) : 0;
    const publicMintCap = PUBLIC_MINT_CAPS[nftType];
    // Check per-wallet limit
    if (totalAfterMinting > maxPerWallet) {
      toast({
        title: "Quantity Limit",
        description: `You can only mint ${maxPerWallet - userMintedCount} more NFTs`,
        variant: "destructive",
      });
      setQuantity((maxPerWallet - userMintedCount).toString());
      return;
    }
    // Check public mint cap
    if (currentSupply + value > publicMintCap) {
      const remaining = publicMintCap - currentSupply;
      toast({
        title: "Supply Limit",
        description: `Only ${remaining} ${nftType}Pass NFTs remaining in public mint`,
        variant: "destructive",
      });
      setQuantity(Math.min(value, remaining).toString());
      return;
    }
    setQuantity(value.toString());
  };

  const handleChainChange = async (newChainId: ChainId) => {
    setChainId(newChainId);
    // Reset eligibility check for new chain
    setEligibilityChecked(false);
    setIsEligible(false);
    if (account) {
      toast({
        title: "Network Changed",
        description: `Switched to ${newChainId === "56" ? "BNB Chain" : newChainId === "137" ? "Polygon" : "Arbitrum"}`,
        variant: "default",
      });
      // Re-check eligibility for new chain
      setTimeout(() => checkEligibility(), 1000);
    }
  };

  const handleNftTypeChange = async (newNftType: NftType) => {
    setNftType(newNftType);
    // Reset eligibility check for new NFT type
    setEligibilityChecked(false);
    setIsEligible(false);
    if (account) {
      toast({
        title: "NFT Type Changed",
        description: `Selected ${newNftType}Pass`,
        variant: "default",
      });
      // Re-check eligibility for new NFT type
      setTimeout(() => checkEligibility(), 1000);
    }
  };

  const showSpendingCapApproval = () => {
    setShowSpendingModal(true);
  };

  const handleSpendingCapConfirm = async () => {
    setShowSpendingModal(false);
    setShowProgressModal(true);
    setProgressStage('approval');
    
    if (pendingApprovalTx && pendingMintTx) {
      try {
        setStatus("Approving USDT spending...");
        toast({
          title: "Approve Transaction",
          description: "Please approve USDT spending in your wallet.",
          variant: "default",
        });
        
        const approvalResult = await sendTransaction({ transaction: pendingApprovalTx, account });
        
        toast({
          title: "Approval Successful",
          description: "USDT spending approved. Proceeding with mint...",
          variant: "default",
        });
        
        setProgressStage('mint');
        setStatus("Executing mint transaction...");
        
        // Return the mint transaction to be executed by TransactionButton
        return pendingMintTx;
      } catch (error) {
        toast({
          title: "Approval Failed",
          description: "Failed to approve USDT spending",
          variant: "destructive",
        });
        setIsMinting(false);
        setProgressStage('error');
        setStatus("Approval failed");
        throw error;
      }
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
    setProgressStage('approval');
    setTxHash("");
    setIsMinting(false);
    setStatus("");
  };

  const handleVerifyWallet = () => {
    toast({
      title: "Check Your Wallet",
      description: "Please check your connected wallet's NFT collection to verify if the mint was successful",
      variant: "default",
    });
    
    // Refresh the page to update NFT balance
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const buildTransaction = async () => {
    if (!account || !account.address) {
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
    setStatus("Preparing transaction...");
    try {
      // Validate KOL ID if provided
      if (kolId) {
        setStatus("Validating KOL ID...");
        const q = query(collection(db, "kols"), where("kolId", "==", kolId));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast({
            title: "Invalid KOL ID",
            description: "The provided KOL ID is invalid.",
            variant: "destructive",
          });
          throw new Error("Invalid KOL ID");
        }
      }
      // Check supply availability
      const userMintedCount = userBalance ? Number(userBalance) : 0;
      const totalAfterMinting = userMintedCount + Number(quantity);
      const maxPerWallet = 5;
      const currentSupply = totalSupply ? Number(totalSupply) : 0;
      const publicMintCap = PUBLIC_MINT_CAPS[nftType];
      if (totalAfterMinting > maxPerWallet) {
        throw new Error(`Exceeds maximum per wallet (${maxPerWallet})`);
      }
      if (currentSupply + Number(quantity) > publicMintCap) {
        throw new Error(`Exceeds public mint cap. Only ${publicMintCap - currentSupply} ${nftType}Pass NFTs remaining`);
      }
      if (publicMintCap === 0) {
        throw new Error(`${nftType}Pass is not available for public mint`);
      }
      // Calculate price for approval
      const totalPrice = Number(quantity) * (PASS_PRICES[nftType]?.usd || 59);
      // Adjust decimals based on chain: 18 for BNB, 6 for Polygon/Arbitrum
      const decimals = chainId === "56" ? 1_000_000_000_000_000_000 : 1_000_000;
      const priceWei = BigInt(Math.floor(totalPrice * decimals)).toString();
      // Prepare USDT approval transaction with exact spending cap
      setStatus("Preparing USDT approval...");
      const approveTx = prepareContractCall({
        contract: usdtContract,
        method: "approve",
        params: [contractAddr, priceWei],
      });
      // Prepare mint transaction
      const mintTx = prepareContractCall({
        contract: nftContract,
        method: "mint",
        params: [BigInt(quantity), []],
      });
      setPendingApprovalTx(approveTx);
      setPendingMintTx(mintTx);
      // Show spending cap modal for approval
      showSpendingCapApproval();
      // Wait for user confirmation and return mint transaction
      return new Promise((resolve, reject) => {
        const checkModalClosed = setInterval(() => {
          if (!showSpendingModal && pendingMintTx) {
            clearInterval(checkModalClosed);
            setStatus("Awaiting wallet approval...");
            resolve(pendingMintTx);
          }
        }, 500);
        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkModalClosed);
          setIsMinting(false);
          setShowProgressModal(false);
          reject(new Error("Transaction approval timeout"));
        }, 120_000);
      });
    } catch (error) {
      setIsMinting(false);
      setShowProgressModal(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStatus(`Error: ${errorMessage}`);
      throw error;
    }
  };

  const handleTransactionSent = (txHash: string) => {
    // This fires immediately when transaction is sent
    setTxHash(txHash);
    setProgressStage('confirming');
    setStatus("Transaction sent! Confirming on blockchain...");
    
    toast({
      title: "Transaction Sent!",
      description: `Transaction hash: ${txHash.substring(0, 10)}...`,
      variant: "default",
    });

    // Set a timeout to show verification option if transaction takes too long
    setTimeout(() => {
      if (progressStage === 'confirming') {
        setProgressStage('timeout');
        setStatus("Transaction is taking longer than expected");
      }
    }, 180000); // 3 minutes timeout
  };

  const handleTransactionSuccess = async (receipt: any) => {
    try {
      setProgressStage('success');
      setStatus("Minted successfully!");
      
      // Save to database
      await addDoc(collection(db, "mintEvents"), {
        ...(kolId && { kolId }),
        address: account?.address,
        nftType,
        quantity: Number(quantity),
        chainId,
        txHash: receipt.transactionHash || txHash,
        timestamp: new Date(),
        mintType: "public",
      });
      
      setIsMinting(false);
      
      toast({
        title: "Mint Successful! 🎉",
        description: `Successfully minted ${quantity} ${nftType}Pass NFT${Number(quantity) > 1 ? 's' : ''}`,
        variant: "default",
      });
      
      // Auto-reload page after 5 seconds to show new balance
      setTimeout(() => {
        window.location.reload();
      }, 5000);
      
    } catch (error) {
      console.error("Error saving mint event:", error);
      toast({
        title: "Database Error",
        description: "NFT minted but failed to save to database",
        variant: "destructive",
      });
      setIsMinting(false);
      setProgressStage('success'); // Still show success since NFT was minted
      
      // Still reload even if database save fails
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  };

  const handleTransactionError = (err: any) => {
    const errorMessage = err instanceof Error ? err.message : "Transaction failed";
    setStatus(`Error: ${errorMessage}`);
    setIsMinting(false);
    setProgressStage('error');
    
    if (errorMessage.toLowerCase().includes("insufficient")) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough USDT to complete this transaction",
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
    } else if (errorMessage.toLowerCase().includes("failed to fetch")) {
      toast({
        title: "Network Error",
        description: "Failed to connect to the blockchain. Please try again.",
        variant: "destructive",
      });
    } else if (errorMessage.toLowerCase().includes("mint")) {
      toast({
        title: "Minting Failed",
        description: "Failed to mint the NFT. Please check the contract or try again.",
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

  if (isLoading) return <div style={{ textAlign: "center", padding: "1rem" }}>Loading...</div>;

  if (!contractAddr || !usdtAddr) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "32rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ paddingTop: "1.5rem" }}>
            <div style={{ backgroundColor: "#fee2e2", padding: "1rem", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#dc2626" }} />
              <span style={{ color: "#dc2626", marginLeft: "0.5rem" }}>Contract not loaded for selected network</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userMintedCount = userBalance ? Number(userBalance) : 0;
  const maxPerWallet = 5;
  const canMintMore = Math.min(maxPerWallet - userMintedCount, remainingSupply);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem" }}>
      <div style={{ maxWidth: "32rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "32rem", backgroundColor: "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>AGV NFT Public Mint</h2>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ border: "1px solid #d1d5db", borderRadius: "9999px", padding: "0.25rem" }}
            >
              {theme === "dark" ? <Sun style={{ height: "1.25rem", width: "1.25rem" }} /> : <Moon style={{ height: "1.25rem", width: "1.25rem" }} />}
            </button>
          </div>
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <ConnectButton client={thirdwebClient} />
            </div>
            {/* Supply Information */}
            {totalSupply !== undefined && (
              <div style={{ backgroundColor: "#f0f9ff", padding: "1rem", border: "1px solid #0ea5e9", borderRadius: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#0369a1", marginBottom: "0.5rem" }}>
                  <span>{nftType}Pass Public Mint</span>
                  <span>{PUBLIC_MINT_CAPS[nftType]} Total Cap</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#0369a1" }}>
                  <span>Minted: {currentSupply}/{PUBLIC_MINT_CAPS[nftType]}</span>
                  <span>Available: {remainingSupply}</span>
                </div>
                <div style={{
                  width: "100%",
                  backgroundColor: "#e0f2fe",
                  borderRadius: "9999px",
                  height: "0.5rem",
                  marginTop: "0.5rem",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${(currentSupply / PUBLIC_MINT_CAPS[nftType]) * 100}%`,
                    backgroundColor: remainingSupply === 0 ? "#dc2626" : "#0ea5e9",
                    height: "100%",
                    borderRadius: "9999px",
                    transition: "width 0.3s ease"
                  }}></div>
                </div>
              </div>
            )}
            {/* User Minting Status */}
            {account && eligibilityChecked && (
              <div style={{ backgroundColor: isEligible ? "#f0fdf4" : "#fee2e2", padding: "1rem", border: `1px solid ${isEligible ? "#34d399" : "#fecaca"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isEligible ? <CheckCircle style={{ height: "1rem", width: "1rem", color: "#10b981" }} /> : <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#dc2626" }} />}
                <span style={{ color: isEligible ? "#065f46" : "#dc2626", marginLeft: "0.5rem" }}>
                  {isEligible ? `You can mint ${canMintMore} more NFTs (${userMintedCount} already minted)` : status}
                </span>
              </div>
            )}
            {!account && !isLoading && (
              <div style={{ backgroundColor: "#fee2e2", padding: "1rem", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#dc2626" }} />
                <span style={{ color: "#dc2626", marginLeft: "0.5rem" }}>Please connect your wallet</span>
              </div>
            )}
            {status && !isEligible && eligibilityChecked && (
              <div style={{ backgroundColor: "#fefcbf", padding: "1rem", border: "1px solid #facc15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#92400e" }}>{status}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>Select Blockchain Network</h3>
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
                Selected Network: {chainId === "56" ? "BNB Chain" : chainId === "137" ? "Polygon" : "Arbitrum"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>Choose Your NFT Pass</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
                <button
                  onClick={() => handleNftTypeChange("seed")}
                  disabled={PUBLIC_MINT_CAPS.seed === 0 || currentSupply >= PUBLIC_MINT_CAPS.seed}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: nftType === "seed" ? "#2563eb" : "#f1f5f9",
                    color: nftType === "seed" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: (PUBLIC_MINT_CAPS.seed === 0 || currentSupply >= PUBLIC_MINT_CAPS.seed) ? "not-allowed" : "pointer",
                    opacity: (PUBLIC_MINT_CAPS.seed === 0 || currentSupply >= PUBLIC_MINT_CAPS.seed) ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontWeight: "semibold" }}>SeedPass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $29 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: nftType === "seed" ? "#e5e7eb" : "#6b7280" }}>
                    Cap: {PUBLIC_MINT_CAPS.seed}
                  </span>
                  {currentSupply >= PUBLIC_MINT_CAPS.seed && (
                    <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Sold Out</span>
                  )}
                </button>
                <button
                  onClick={() => handleNftTypeChange("tree")}
                  disabled={PUBLIC_MINT_CAPS.tree === 0 || currentSupply >= PUBLIC_MINT_CAPS.tree}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: nftType === "tree" ? "#2563eb" : "#f1f5f9",
                    color: nftType === "tree" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: (PUBLIC_MINT_CAPS.tree === 0 || currentSupply >= PUBLIC_MINT_CAPS.tree) ? "not-allowed" : "pointer",
                    opacity: (PUBLIC_MINT_CAPS.tree === 0 || currentSupply >= PUBLIC_MINT_CAPS.tree) ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontWeight: "semibold" }}>TreePass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $59 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: nftType === "tree" ? "#e5e7eb" : "#6b7280" }}>
                    Cap: {PUBLIC_MINT_CAPS.tree}
                  </span>
                  {currentSupply >= PUBLIC_MINT_CAPS.tree && (
                    <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Sold Out</span>
                  )}
                </button>
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
                  disabled={true}
                >
                  <span style={{ fontWeight: "semibold" }}>SolarPass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $299 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Not Available in Public Mint</span>
                </button>
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
                  disabled={true}
                >
                  <span style={{ fontWeight: "semibold" }}>ComputePass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $899 USDT</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Not Available in Public Mint</span>
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="quantity" style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}>
                Quantity (Max {Math.min(5, canMintMore)})
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={Math.min(5, canMintMore)}
                value={quantity}
                onChange={handleQuantityChange}
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="kolId" style={{ fontSize: "0.875rem", fontWeight: "medium", color: "#374151" }}>
                KOL ID (Optional)
              </label>
              <input
                id="kolId"
                type="text"
                value={kolId}
                onChange={(e) => setKolId(e.target.value)}
                placeholder="Enter KOL ID if applicable"
                style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.875rem", color: "#4b5563" }}>
              <p>Unit Price: ${unitPrice} USDT</p>
              <p style={{ fontWeight: "semibold", color: "#1f2937" }}>Total: ${totalPrice.toFixed(2)} USDT</p>
              {account && (
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Payment will be processed in USDT only
                </p>
              )}
            </div>
            <div style={{ paddingTop: "1rem", paddingBottom: "0" }}>
              <TransactionButton
                transaction={buildTransaction}
                onTransactionSent={handleTransactionSent}
                onTransactionConfirmed={handleTransactionSuccess}
                onError={handleTransactionError}
                disabled={!account || isMinting || !isEligible || remainingSupply === 0}
                style={{
                  width: "100%",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: "semibold",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  fontSize: "1.125rem",
                  cursor: (!account || isMinting || !isEligible || remainingSupply === 0) ? "not-allowed" : "pointer",
                  opacity: (!account || isMinting || !isEligible || remainingSupply === 0) ? 0.5 : 1,
                }}
              >
                {isMinting ? "Processing..." :
                 !account ? "Connect Wallet" :
                 !isEligible ? "Not Eligible" :
                 remainingSupply === 0 ? "Sold Out" :
                 "Mint Now"}
              </TransactionButton>
            </div>
          </div>
        </div>
        {/* Spending Cap Modal */}
        <SpendingCapModal
          isOpen={showSpendingModal}
          onClose={handleSpendingCapClose}
          onConfirm={handleSpendingCapConfirm}
          spender={contractAddr?.substring(0, 6) + "..." + contractAddr?.substring(contractAddr.length - 4) || ""}
          requestFrom="agv-nft.com"
          spendingCap={totalPrice.toFixed(2)}
          tokenSymbol="USDT"
          networkFee="0.12"
        />
        {/* Enhanced Progress Modal */}
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
          <Link href="/kol-dashboard" style={{ color: "#2563eb", fontWeight: "medium", textDecoration: "underline" }}>
            Go to Dashboard
          </Link>
        </div>
        {isOpen && (
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "#ecececff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "semibold" }}>Wallet Connection Required</h3>
            <div style={{ backgroundColor: "#fefcbf", padding: "1rem", border: "1px solid #facc15", marginTop: "0.5rem", display: "flex", alignItems: "center" }}>
              <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#d97706" }} />
              <span style={{ color: "#92400e", marginLeft: "0.5rem" }}>Please connect your wallet to continue with minting.</span>
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