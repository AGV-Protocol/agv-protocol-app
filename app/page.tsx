"use client";

import { useState, useEffect } from "react";
import { ThirdwebProvider, ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareContractCall } from "thirdweb";
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Dialog, DialogContent, DialogTitle, Alert, AlertDescription } from "@/components/ui";
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, NFT_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { canMintNFT } from "@/lib/mintingCap";
import Link from "next/link";
import { useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// 1. Thirdweb client
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// 2. React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
    mutations: { retry: 1 },
  },
});

type ChainId = "56" | "137" | "42161";
type NftType = keyof typeof PASS_PRICES;

function MintingContent() {
  const account = useActiveAccount();
  const [kolId, setKolId] = useState("");
  const [chainId, setChainId] = useState<ChainId>("56");
  const [nftType, setNftType] = useState<NftType>("seed");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (!account) {
      setStatus("Connect wallet first to mint");
      setIsOpen(true);
    }
    setIsLoading(false);
  }, [account]);

  // Prepare contract instances
  const chainInfo = CHAINS[chainId];
  const contractAddr = NFT_CONTRACTS[nftType]?.[chainId]!;
  const usdtAddr = USDT_ADDRESSES[chainId]!;
  const nftContract = getContract({
    client: thirdwebClient,
    address: contractAddr,
    chain: chainInfo.chain,
    abi: NFT_ABI,
  });
  const usdtContract = getContract({
    client: thirdwebClient,
    address: usdtAddr,
    chain: chainInfo.chain,
  });

  const unitPrice = PASS_PRICES[nftType]?.usd || 29;
  const totalPrice = unitPrice * Number(quantity);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
    setQuantity(value.toString());
  };

  const buildTransaction = async () => {
    if (!account) throw new Error("Connect wallet first");

    setIsMinting(true);
    setStatus("Checking eligibility...");

    if (kolId) {
      const q = query(collection(db, "kols"), where("kolId", "==", kolId));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("Invalid KOL ID");
    }

    const { allowed, message } = await canMintNFT({
      nftContract,
      nftType,
      quantity: Number(quantity),
    });
    if (!allowed) throw new Error(message);

    const merkleRes = await fetch(
      `/api/merkle?address=${account.address}&contract=${contractAddr}`
    );
    if (!merkleRes.ok) throw new Error("Failed to fetch Merkle proof");
    const { proof } = await merkleRes.json();

    const priceWei = PASS_PRICES[nftType]?.wei
      ? BigInt(PASS_PRICES[nftType].wei) * BigInt(quantity)
      : BigInt(unitPrice) * BigInt(quantity) * BigInt(1e6);

    // First approve USDT
    await usdtContract.call("approve", [contractAddr, priceWei]);

    // Prepare mint transaction
    return prepareContractCall({
      contract: nftContract,
      method: "mint",
      params: [Number(quantity), proof],
    });
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="flex justify-between items-center">
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
            <ConnectButton client={{ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! }} />
          </div>
          {status && (
            <Alert variant="destructive">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          {/* Rest of your inputs... */}
          <div className="space-y-2 text-sm">
            <p>Unit Price: ${unitPrice} USDT</p>
            <p>Total: ${totalPrice.toFixed(2)} USDT</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="w-full flex justify-center">
            <TransactionButton
              transaction={buildTransaction}
              onTransactionConfirmed={async (receipt) => {
                await addDoc(collection(db, "mintEvents"), {
                  ...(kolId && { kolId }),
                  address: account?.address,
                  nftType,
                  quantity: Number(quantity),
                  chainId,
                  txHash: receipt.transactionHash,
                  timestamp: new Date(),
                });
                setStatus("✅ Minted successfully!");
                setIsMinting(false);
              }}
              onError={(err) => {
                setStatus(`Error: ${(err as Error).message}`);
                setIsMinting(false);
              }}
            >
              {isMinting ? "Minting..." : "Mint Now"}
            </TransactionButton>
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
      <ThirdwebProvider>
        <MintingContent />
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}