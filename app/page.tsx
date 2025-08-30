"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Binance, Polygon, Arbitrum } from '@thirdweb-dev/chains';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Dialog, DialogContent, DialogTitle, Alert, AlertDescription } from '@/components/ui';
import { CHAINS, USDT_ADDRESSES, NFT_CONTRACTS, CLIENT_ID } from '@/lib/contracts';
import { PASS_PRICES, PASS_DETAILS } from '@/lib/pricing';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAddress, useSDK, useContract, ConnectWallet } from '@thirdweb-dev/react';
import { Moon, Sun } from 'lucide-react';

// Define supported chain IDs and NFT types for type safety
type ChainId = '56' | '137' | '42161';
type NftType = keyof typeof PASS_PRICES;

const ThirdwebProvider = dynamic(
  () => import('@thirdweb-dev/react').then((mod) => mod.ThirdwebProvider),
  { ssr: false }
);

function MintingContent() {
  const address = useAddress();
  const sdk = useSDK();
  const [chainId, setChainId] = useState<ChainId>('56'); // Default to BNB
  const [nftType, setNftType] = useState<NftType>('seed');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { setTheme, theme } = useTheme();

  const chain = CHAINS[chainId];
  const nftContractAddr = NFT_CONTRACTS[nftType][chainId];
  const usdtContractAddr = USDT_ADDRESSES[chainId];
  const { contract: nftContract } = useContract(nftContractAddr, 'nft-collection');
  const { contract: usdtContract } = useContract(usdtContractAddr, 'token');

  // Calculate total price
  const unitPrice = PASS_PRICES[nftType].usd;
  const totalPrice = unitPrice * Number(quantity);

  useEffect(() => {
    console.log('Address:', address);
    console.log('SDK:', sdk);
    if (!address && status !== 'Connect wallet first to mint') {
      setStatus('');
    }
    // Reset nftType to a valid option when chain changes
    const availableNfts = (['seed', 'tree', 'solar', 'compute'] as NftType[]).filter(isNftAvailable);
    if (!availableNfts.includes(nftType)) {
      setNftType(availableNfts[0] as NftType || 'seed');
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
      setStatus('Connect wallet first');
      setIsOpen(true);
      return;
    }
    if (!nftContract || !usdtContract) {
      setStatus('Contract not loaded');
      setIsOpen(true);
      return;
    }
    setIsMinting(true);
    setStatus('Verifying wallet...');
    setIsOpen(true);
    try {
      const verifyRes = await fetch(`https://agv-api-1.onrender.com/verify-wallet?address=${address}`);
      if (!verifyRes.ok) throw new Error('Failed to verify wallet');
      const isWhitelisted = await verifyRes.json();
      if (!isWhitelisted) throw new Error('Wallet not whitelisted');
      const merkleRes = await fetch(`/api/merkle?address=${address}&contract=${nftContractAddr}`);
      if (!merkleRes.ok) throw new Error('Failed to fetch Merkle proof');
      const { proof, leaf } = await merkleRes.json();
      const price = PASS_PRICES[nftType].wei * Number(quantity);
      await usdtContract.call('approve', [nftContractAddr, price]);
      await nftContract.call('mintTo', [address, "ipfs://your-token-uri"]);
      setStatus('Minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      setStatus(`Error: ${(error as Error).message}`);
    } finally {
      setIsMinting(false);
    }
  };

  // Check if NFT contract address exists for the selected chain
  const isNftAvailable = (type: NftType) => {
    return NFT_CONTRACTS[type] && NFT_CONTRACTS[type][chainId];
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-3xl font-bold">AGV NFT Mint</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <ConnectWallet
              className="w-full max-w-xs mx-auto bg-blue-500 text-white hover:bg-blue-600"
            />
          </div>
          {status && (
            <Alert variant="destructive">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
          <h3 className="text-lg font-semibold">Select Blockchain Network</h3>
          <div className="flex justify-center space-x-4">
            <Button
              variant={chainId === '56' ? 'default' : 'outline'}
              onClick={() => setChainId('56')}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === '56' ? 'bg-gray-200 text-blue-600' : ''}`}
            >
              BNB Chain
            </Button>
            <Button
              variant={chainId === '137' ? 'default' : 'outline'}
              onClick={() => setChainId('137')}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === '137' ? 'bg-gray-200 text-blue-600' : ''}`}
            >
              Polygon
            </Button>
            <Button
              variant={chainId === '42161' ? 'default' : 'outline'}
              onClick={() => setChainId('42161')}
              className={`hover:bg-gray-200 hover:text-blue-600 ${chainId === '42161' ? 'bg-gray-200 text-blue-600' : ''}`}
            >
              Arbitrum
            </Button>
          </div>
          <p className="text-center text-sm">Selected Network: {chain?.name ?? 'BNB Chain'}</p>
          <h3 className="text-lg font-semibold">Choose Your NFT Pass</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['seed', 'tree', 'solar', 'compute'].map((type) => (
              <Button
                key={type}
                variant={nftType === type ? 'default' : 'outline'}
                onClick={() => isNftAvailable(type as NftType) ? setNftType(type as NftType) : null}
                disabled={!isNftAvailable(type as NftType)}
                className={`flex-1 p-4 min-h-[120px] text-center hover:bg-gray-100 dark:hover:bg-gray-800 ${nftType === type && isNftAvailable(type as NftType) ? 'bg-gray-200 text-blue-600' : ''}`}
              >
                <div>
                  <h4 className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}Pass</h4>
                  <p className="text-xs">Price: ${PASS_PRICES[type as NftType].usd} USDT</p>
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
          <Button
            onClick={mintNFT}
            disabled={!address || isMinting}
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
          >
            {isMinting ? 'Minting...' : 'Mint Now'}
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogTitle>Minting Status</DialogTitle>
          {status && <Alert>
            <AlertDescription>{status}</AlertDescription>
          </Alert>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return (
    <ThirdwebProvider clientId={CLIENT_ID} supportedChains={[Binance, Polygon, Arbitrum]}>
      <MintingContent />
    </ThirdwebProvider>
  );
}