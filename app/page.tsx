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
} from "thirdweb";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, NFT_ABI } from "@/lib/contracts";
import { toast } from "sonner";
import { PASS_PRICES } from "@/lib/pricing";
import { canMintNFT } from "@/lib/mintingCap";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

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
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const { setTheme, theme } = useTheme();
  
  // Check if wallet is whitelisted
  const checkWhitelistStatus = async (walletAddress: string) => {
    try {
      const contractAddr = NFT_CONTRACTS[nftType]?.[chainId];
      if (!contractAddr) {
        throw new Error("Contract not found for selected chain and NFT type");
      }

      const merkleRes = await fetch(
        `/api/merkle?address=${walletAddress}&contract=${contractAddr}`
      );
      
      if (merkleRes.ok) {
        const { proof } = await merkleRes.json();
        return proof && proof.length > 0;
      }
      return false;
    } catch (error) {
      console.error("Error checking whitelist:", error);
      return false;
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      if (!account) {
        setStatus("Connect wallet first to mint");
        setIsOpen(true);
        setIsWhitelisted(null);
      } else {
        setIsOpen(false);
        setStatus("Checking whitelist status...");
        
        try {
          const whitelisted = await checkWhitelistStatus(account.address);
          setIsWhitelisted(whitelisted);
          
          if (!whitelisted) {
            setStatus("Wallet not whitelisted for minting");
            toast({
              title: "Wallet Not Whitelisted",
              description: "Your wallet address is not on the whitelist for minting NFTs.",
              variant: "destructive",
            });
          } else {
            setStatus("");
            toast({
              title: "Wallet Verified",
              description: "Your wallet is whitelisted and eligible for minting!",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error checking whitelist:", error);
          setStatus("Error checking whitelist status");
          toast({
            title: "Verification Error",
            description: "Unable to verify whitelist status. Please try again.",
            variant: "destructive",
          });
        }
      }
      setIsLoading(false);
    };

    initializeComponent();
  }, [account, chainId, nftType, toast]);

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
  }) : null;

  const unitPrice = PASS_PRICES[nftType]?.usd || 59;
  const totalPrice = unitPrice * Number(quantity);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
    setQuantity(value.toString());
  };

  const handleChainChange = async (newChainId: ChainId) => {
    setChainId(newChainId);
    if (account) {
      toast({
        title: "Checking New Network",
        description: "Verifying whitelist status on new network...",
        variant: "default",
      });
    }
  };

  const handleNftTypeChange = async (newNftType: NftType) => {
    setNftType(newNftType);
    if (account) {
      toast({
        title: "NFT Type Changed",
        description: "Verifying eligibility for new NFT type...",
        variant: "default",
      });
    }
  };

  const buildTransaction = async () => {
    if (!account) {
      const errorMsg = "Please connect your wallet first";
      toast({
        title: "Wallet Not Connected",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    if (!nftContract || !usdtContract || !contractAddr) {
      const errorMsg = "Contract not loaded for selected network";
      toast({
        title: "Contract Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }

    if (!isWhitelisted) {
      const errorMsg = "Your wallet is not whitelisted for minting";
      toast({
        title: "Not Whitelisted",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
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
          const errorMsg = "Invalid KOL ID provided";
          toast({
            title: "Invalid KOL ID",
            description: errorMsg,
            variant: "destructive",
          });
          throw new Error(errorMsg);
        }
      }

      // Check minting cap
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

      // Get Merkle Proof
      setStatus("Getting whitelist proof...");
      const merkleRes = await fetch(
        `/api/merkle?address=${account.address}&contract=${contractAddr}`
      );
      
      if (!merkleRes.ok) {
        const errorMsg = "Failed to get whitelist proof";
        toast({
          title: "Whitelist Error",
          description: errorMsg,
          variant: "destructive",
        });
        throw new Error(errorMsg);
      }
      
      const { proof } = await merkleRes.json();

      if (!proof || proof.length === 0) {
        const errorMsg = "Invalid whitelist proof - wallet not eligible";
        toast({
          title: "Not Whitelisted",
          description: errorMsg,
          variant: "destructive",
        });
        throw new Error(errorMsg);
      }

      // Calculate price
      const priceWei = PASS_PRICES[nftType]?.wei
        ? BigInt(PASS_PRICES[nftType].wei) * BigInt(quantity)
        : BigInt(unitPrice) * BigInt(quantity) * BigInt(1e6);

      // Approve USDT spending
      setStatus("Approving USDT spending...");
      toast({
        title: "Approve Transaction",
        description: "Please approve USDT spending in your wallet",
        variant: "default",
      });
      
      await usdtContract.call("approve", [contractAddr, priceWei]);

      setStatus("Preparing mint transaction...");
      return prepareContractCall({
        contract: nftContract,
        method: "mint",
        params: [Number(quantity), proof],
      });

    } catch (error) {
      setIsMinting(false);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStatus(`Error: ${errorMessage}`);
      throw error;
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;

  // Show contract not loaded message if contracts aren't available
  if (!contractAddr || !usdtAddr) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center min-h-screen">
        <Card className="w-full max-w-xl shadow-lg">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Contract not loaded for selected network</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-3xl font-bold">AGV NFT Mint</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <ConnectButton client={thirdwebClient} />
          </div>

          {/* Whitelist Status Indicator */}
          {account && (
            <div className="text-center">
              {isWhitelisted === true && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    ✅ Wallet is whitelisted and eligible for minting
                  </AlertDescription>
                </Alert>
              )}
              {isWhitelisted === false && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Wallet is not whitelisted for minting
                  </AlertDescription>
                </Alert>
              )}
              {isWhitelisted === null && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    🔍 Checking whitelist status...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {status && (
            <Alert variant="destructive">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          {/* Blockchain Network Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Select Blockchain Network</h3>
            <div className="flex gap-2 justify-center">
              <Button
                variant={chainId === "56" ? "default" : "outline"}
                onClick={() => handleChainChange("56")}
                size="sm"
              >
                BNB Chain
              </Button>
              <Button
                variant={chainId === "137" ? "default" : "outline"}
                onClick={() => handleChainChange("137")}
                size="sm"
              >
                Polygon
              </Button>
              <Button
                variant={chainId === "42161" ? "default" : "outline"}
                onClick={() => handleChainChange("42161")}
                size="sm"
              >
                Arbitrum
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Selected Network: {chainId === "56" ? "BNB Chain" : chainId === "137" ? "Polygon" : "Arbitrum"}
            </p>
          </div>

          {/* NFT Pass Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Choose Your NFT Pass</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={nftType === "seed" ? "default" : "outline"}
                onClick={() => handleNftTypeChange("seed")}
                className="flex flex-col h-auto p-3"
                disabled={!isWhitelisted}
              >
                <span className="font-semibold">SeedPass</span>
                <span className="text-sm">Price: $29 USDT</span>
              </Button>
              <Button
                variant={nftType === "tree" ? "default" : "outline"}
                onClick={() => handleNftTypeChange("tree")}
                className="flex flex-col h-auto p-3"
                disabled={!isWhitelisted}
              >
                <span className="font-semibold">TreePass</span>
                <span className="text-sm">Price: $59 USDT</span>
              </Button>
              <Button
                variant={nftType === "solar" ? "default" : "outline"}
                onClick={() => handleNftTypeChange("solar")}
                className="flex flex-col h-auto p-3"
                disabled={true}
              >
                <span className="font-semibold">SolarPass</span>
                <span className="text-sm">Price: $299 USDT</span>
                <span className="text-xs text-red-500">Not Available</span>
              </Button>
              <Button
                variant={nftType === "compute" ? "default" : "outline"}
                onClick={() => handleNftTypeChange("compute")}
                className="flex flex-col h-auto p-3"
                disabled={true}
              >
                <span className="font-semibold">ComputePass</span>
                <span className="text-sm">Price: $899 USDT</span>
                <span className="text-xs text-red-500">Not Available</span>
              </Button>
            </div>
          </div>

          {/* KOL ID Input (Optional) */}
          <div className="space-y-2">
            <label htmlFor="kolId" className="text-sm font-medium">
              KOL ID (Optional)
            </label>
            <input
              id="kolId"
              type="text"
              value={kolId}
              onChange={(e) => setKolId(e.target.value)}
              placeholder="Enter KOL ID if applicable"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Only whitelisted wallets can mint now.
          </p>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mint Your NFT</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={!isWhitelisted}
                  className="w-16 px-2 py-1 border rounded text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-muted-foreground">(Max of 5 NFTs)</span>
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="space-y-2 text-sm">
            <p>Unit Price: ${unitPrice} USDT</p>
            <p className="font-semibold">Total: ${totalPrice.toFixed(2)} USDT</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-6">
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
              
              // Show specific error toasts
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
              } else if (errorMessage.toLowerCase().includes("whitelist")) {
                toast({
                  title: "Whitelist Error",
                  description: errorMessage,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Transaction Failed",
                  description: errorMessage,
                  variant: "destructive",
                });
              }
            }}
            disabled={!account || !isWhitelisted || isMinting || (nftType !== "seed" && nftType !== "tree")}
            className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isMinting ? "Minting..." : 
             !account ? "Connect Wallet" :
             !isWhitelisted ? "Not Whitelisted" :
             (nftType !== "seed" && nftType !== "tree") ? "Not Available" :
             "Mint Now"}
          </TransactionButton>
        </CardFooter>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/kol-dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>

      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogTitle>Wallet Connection Required</DialogTitle>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to continue with minting.
              </AlertDescription>
            </Alert>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}