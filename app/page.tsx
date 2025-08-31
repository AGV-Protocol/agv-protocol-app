"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Binance, Polygon, Arbitrum } from "@thirdweb-dev/chains";
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
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, CLIENT_ID, NFT_ABI } from "@/lib/contracts";
import { canMintNFT } from "@/lib/mintingCap";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAddress, useSDK, useContract, ConnectWallet } from "@thirdweb-dev/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const ThirdwebProvider = dynamic(
  () => import("@thirdweb-dev/react").then((mod) => mod.ThirdwebProvider),
  { ssr: false }
);

const queryClient = new QueryClient();

function MintingContent() {
  const address = useAddress();
  const sdk = useSDK();
  const searchParams = useSearchParams();
  const kolId = searchParams.get("kolId") || "";
  const [chainId, setChainId] = useState("56");
  const [nftType, setNftType] = useState<"seed" | "tree">("seed");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme, theme } = useTheme();

  const chain = CHAINS[chainId];
  const nftContractAddr = NFT_CONTRACTS[nftType][chainId];
  const usdtContractAddr = USDT_ADDRESSES[chainId];
  const { contract: nftContract } = useContract(nftContractAddr, NFT_ABI);
  const { contract: usdtContract } = useContract(usdtContractAddr, "token");

  const unitPrice = { seed: 29, tree: 59 }[nftType] || 29;
  const totalPrice = unitPrice * Number(quantity);

  useEffect(() => {
    if (!sdk) {
      setIsLoading(true);
      setStatus("Initializing...");
    } else {
      setIsLoading(false);
      if (!address && status !== "Connect wallet first to mint") {
        setStatus("Connect wallet first to mint");
        setIsOpen(true);
      }
    }
    const availableNfts = (["seed", "tree"] as const).filter(isNftAvailable);
    if (!availableNfts.includes(nftType)) {
      setNftType(availableNfts[0] || "seed");
    }
  }, [address, sdk, status, chainId]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
    setQuantity(value.toString());
  };

  const incrementQuantity = () => {
    const value = Math.min(5, Number(quantity) + 1);
    setQuantity(value.toString());
  };

  const decrementQuantity = () => {
    const value = Math.max(1, Number(quantity) - 1);
    setQuantity(value.toString());
  };

  const mintNFT = async () => {
    if (!address || !sdk) {
      setStatus("Connect wallet first");
      setIsOpen(true);
      return;
    }
    if (!nftContract || !usdtContract) {
      setStatus("Contract not loaded");
      setIsOpen(true);
      return;
    }
    setIsMinting(true);
    setStatus("Checking minting eligibility...");
    setIsOpen(true);
    try {
      // Validate kolId if provided
      if (kolId) {
        const q = query(collection(db, "kols"), where("kolId", "==", kolId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          throw new Error("Invalid KOL ID");
        }
      }

      // Check minting caps
      const { allowed, message } = await canMintNFT({
        nftContract,
        nftType,
        quantity: Number(quantity),
      });
      if (!allowed) throw new Error(message);

      // Fetch Merkle proof
      const merkleRes = await fetch(`/api/merkle?address=${address}&contract=${nftContractAddr}`);
      if (!merkleRes.ok) {
        const errorData = await merkleRes.json();
        throw new Error(errorData.error || "Failed to fetch Merkle proof");
      }
      const { proof } = await merkleRes.json();

      // Approve USDT
      const price = BigInt({ seed: 29, tree: 59 }[nftType] || 29) * BigInt(quantity) * BigInt(1e6);
      await usdtContract.call("approve", [nftContractAddr, price]);

      // Mint NFT
      const tx = await nftContract.call("mint", [Number(quantity), proof]);

      // Record mint in Firebase
      await addDoc(collection(db, "mintEvents"), {
        ...(kolId && { kolId }), // Include kolId only if provided
        address,
        nftType,
        quantity: Number(quantity),
        chainId,
        txHash: tx.receipt.transactionHash,
        timestamp: new Date(),
      });

      setStatus("Minted successfully!");
    } catch (error) {
      console.error("Minting error:", error);
      setStatus(`Error: ${(error as Error).message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const isNftAvailable = (type: "seed" | "tree") => {
    return (type === "seed" || type === "tree") && NFT_CONTRACTS[type] && NFT_CONTRACTS[type][chainId];
  };

  if (isLoading) return <div className="text-center py-4">Loading SDK...</div>;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-3xl font-bold">AGV NFT Mint</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <ConnectWallet />
          </div>
          {status && (
            <Alert variant="destructive">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          <h3 className="text-lg font-semibold">Select Blockchain Network</h3>
          <div className="flex justify-center space-x-4">
            <Button
              variant={chainId === "56" ? "default" : "outline"}
              onClick={() => setChainId("56")}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === "56" ? "bg-gray-200 text-blue-600" : ""}`}
            >
              BNB Chain
            </Button>
            <Button
              variant={chainId === "137" ? "default" : "outline"}
              onClick={() => setChainId("137")}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === "137" ? "bg-gray-200 text-blue-600" : ""}`}
            >
              Polygon
            </Button>
            <Button
              variant={chainId === "42161" ? "default" : "outline"}
              onClick={() => setChainId("42161")}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === "42161" ? "bg-gray-200 text-blue-600" : ""}`}
            >
              Arbitrum
            </Button>
          </div>
          <p className="text-center text-sm">Selected Network: {chain?.name ?? "BNB Chain"}</p>
          <h3 className="text-lg font-semibold">Choose Your NFT Pass</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["seed", "tree"] as const).map((type) => (
              <Button
                key={type}
                variant={nftType === type ? "default" : "outline"}
                onClick={() => isNftAvailable(type) ? setNftType(type) : null}
                disabled={!isNftAvailable(type)}
                className={`flex-1 p-4 min-h-[120px] text-center hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  nftType === type && isNftAvailable(type) ? "bg-gray-200 text-blue-600" : ""
                }`}
              >
                <div>
                  <h4 className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)} Pass</h4>
                  <p className="text-xs">Price: ${{ seed: 29, tree: 59 }[type]} USDT</p>
                </div>
              </Button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">Only whitelisted wallets can mint now.</p>
          <div className="flex items-center justify-center space-x-4">
            <h3 className="text-left text-lg font-semibold">Mint Your NFT</h3>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              max="5"
              className="w-16 p-2 border rounded text-center"
            />
            <span className="text-sm">(Max of 5 NFTs)</span>
          </div>
          <div className="space-y-2 text-sm">
            <p>Unit Price: ${unitPrice} USDT</p>
            <p>Total: ${totalPrice.toFixed(2)} USDT</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="w-full flex justify-center">
            <Button
              onClick={mintNFT}
              disabled={!address || isMinting}
              className="w-2/3 py-4 text-lg justify-center bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              {isMinting ? "Minting..." : "Mint Now"}
            </Button>
          </div>
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
            <DialogTitle>Minting Status</DialogTitle>
            {status && (
              <Alert variant="destructive">
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider clientId={CLIENT_ID} supportedChains={[Binance, Polygon, Arbitrum]}>
        <MintingContent />
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}
