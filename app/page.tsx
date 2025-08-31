"use client";

import { useState, useEffect } from "react";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { Moon, Sun, AlertTriangle, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, NFT_ABI, USDT_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { canMintNFT } from "@/lib/mintingCap";

// Create client inside the component to avoid SSR issues
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;

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
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      if (!account || !account.address) {
        setStatus("Connect wallet to mint");
        setIsOpen(true);
      } else {
        setIsOpen(false);
        setStatus("");
      }
      setIsLoading(false);
    };
    initializeComponent();
  }, [account]);

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

  const unitPrice = PASS_PRICES[nftType]?.usd || 59;
  const totalPrice = unitPrice * Number(quantity);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
    setQuantity(value.toString());
  };

  const handleChainChange = async (newChainId: ChainId) => {
    setChainId(newChainId);
    if (account) toast({
      title: "Network Changed",
      description: `Switched to ${newChainId === "56" ? "BNB Chain" : newChainId === "137" ? "Polygon" : "Arbitrum"}`,
      variant: "default",
    });
  };

  const handleNftTypeChange = async (newNftType: NftType) => {
    setNftType(newNftType);
    if (account) toast({
      title: "NFT Type Changed",
      description: `Selected ${newNftType}Pass`,
      variant: "default",
    });
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

      // Check minting eligibility
      setStatus("Checking minting eligibility...");
      const { allowed, message } = await canMintNFT({
        nftContract,
        nftType,
        quantity: Number(quantity),
      });
      if (!allowed) {
        toast({
          title: "Minting Not Allowed",
          description: message,
          variant: "destructive",
        });
        throw new Error(message);
      }

      // Prepare USDT approval
      setStatus("Approving USDT spending...");
      const priceWei = PASS_PRICES[nftType]?.wei
        ? BigInt(PASS_PRICES[nftType].wei) * BigInt(quantity)
        : BigInt(unitPrice) * BigInt(quantity) * BigInt(1e6);
      toast({
        title: "Approve Transaction",
        description: "Please approve USDT spending in your wallet.",
        variant: "default",
      });
      const approveTx = prepareContractCall({
        contract: usdtContract,
        method: "approve",
        params: [contractAddr, priceWei],
      });
      await sendTransaction({ transaction: approveTx, account });

      // Prepare mint transaction with empty proof
      setStatus("Preparing mint transaction...");
      return prepareContractCall({
        contract: nftContract,
        method: "mint",
        params: [account.address, []], // Empty proof array
      });
    } catch (error) {
      setIsMinting(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStatus(`Error: ${errorMessage}`);
      throw error;
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem" }}>
      <div style={{ maxWidth: "32rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "32rem", backgroundColor: "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>AGV NFT Mint</h2>
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
            {!account && !isLoading && (
              <div style={{ backgroundColor: "#fee2e2", padding: "1rem", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle style={{ height: "1rem", width: "1rem", color: "#dc2626" }} />
                <span style={{ color: "#dc2626", marginLeft: "0.5rem" }}>Please connect your wallet</span>
              </div>
            )}
            {account && (
              <div style={{ backgroundColor: "#f0fdf4", padding: "1rem", border: "1px solid #34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle style={{ height: "1rem", width: "1rem", color: "#10b981" }} />
                <span style={{ color: "#065f46", marginLeft: "0.5rem" }}>Wallet connected and eligible for minting</span>
              </div>
            )}
            {status && (
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: nftType === "seed" ? "#2563eb" : "#f1f5f9",
                    color: nftType === "seed" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: "semibold" }}>SeedPass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $29 USDT</span>
                </button>
                <button
                  onClick={() => handleNftTypeChange("tree")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    padding: "1rem",
                    backgroundColor: nftType === "tree" ? "#2563eb" : "#f1f5f9",
                    color: nftType === "tree" ? "#fff" : "#1f2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: "semibold" }}>TreePass</span>
                  <span style={{ fontSize: "0.875rem" }}>Price: $59 USDT</span>
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
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Not Available</span>
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
                  <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Not Available</span>
                </button>
              </div>
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
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
              Connect your wallet to mint.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "semibold", color: "#1f2937" }}>Mint Your NFT</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={!account}
                    style={{ width: "4rem", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", textAlign: "center", outline: "none" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(Max of 5 NFTs)</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.875rem", color: "#4b5563" }}>
              <p>Unit Price: ${unitPrice} USDT</p>
              <p style={{ fontWeight: "semibold", color: "#1f2937" }}>Total: ${totalPrice.toFixed(2)} USDT</p>
            </div>
            <div style={{ paddingTop: "1rem", paddingBottom: "0" }}>
              <TransactionButton
                transaction={buildTransaction}
                onTransactionConfirmed={async (receipt) => {
                  try {
                    await addDoc(collection(db, "mintEvents"), {
                      ...(kolId && { kolId }),
                      address: account?.address,
                      nftType,
                      quantity: Number(quantity),
                      chainId,
                      txHash: receipt.transactionHash,
                      timestamp: new Date(),
                    });
                    setStatus("Minted successfully!");
                    setIsMinting(false);
                    toast({
                      title: "Mint Successful! 🎉",
                      description: `Successfully minted ${quantity} ${nftType}Pass NFT${Number(quantity) > 1 ? 's' : ''}`,
                      variant: "default",
                    });
                  } catch (error) {
                    console.error("Error saving mint event:", error);
                    toast({
                      title: "Database Error",
                      description: "NFT minted but failed to save to database",
                      variant: "destructive",
                    });
                  }
                }}
                onError={(err) => {
                  const errorMessage = err instanceof Error ? err.message : "Transaction failed";
                  setStatus(`Error: ${errorMessage}`);
                  setIsMinting(false);
                  if (errorMessage.toLowerCase().includes("insufficient")) {
                    toast({ title: "Insufficient Funds", description: "You don't have enough USDT to complete this transaction", variant: "destructive" });
                  } else if (errorMessage.toLowerCase().includes("rejected")) {
                    toast({ title: "Transaction Rejected", description: "Transaction was rejected in your wallet", variant: "destructive" });
                  } else if (errorMessage.toLowerCase().includes("supply cap exceeded")) {
                    toast({ title: "Supply Cap Exceeded", description: errorMessage, variant: "destructive" });
                  } else if (errorMessage.toLowerCase().includes("failed to fetch")) {
                    toast({ title: "Network Error", description: "Failed to connect to the blockchain. Please try again.", variant: "destructive" });
                  } else {
                    toast({ title: "Transaction Failed", description: errorMessage, variant: "destructive" });
                  }
                }}
                disabled={!account || isMinting || (nftType !== "seed" && nftType !== "tree")}
                style={{
                  width: "100%",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontWeight: "semibold",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  fontSize: "1.125rem",
                  cursor: !account || isMinting || (nftType !== "seed" && nftType !== "tree") ? "not-allowed" : "pointer",
                  opacity: !account || isMinting || (nftType !== "seed" && nftType !== "tree") ? 0.5 : 1,
                }}
              >
                {isMinting ? "Minting..." : !account ? "Connect Wallet" : (nftType !== "seed" && nftType !== "tree") ? "Not Available" : "Mint Now"}
              </TransactionButton>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/kol-dashboard" style={{ color: "#2563eb", fontWeight: "medium", textDecoration: "underline" }}>
            Go to Dashboard
          </Link>
        </div>
        {isOpen && (
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "#fff", padding: "1rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
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