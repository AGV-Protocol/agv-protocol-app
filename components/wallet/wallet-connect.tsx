"use client";

import { useState } from "react";
import { Wallet, LogOut, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useActiveAccount, useDisconnect } from "thirdweb/react";
import { toast } from "sonner";

const CHAINS = {
  "0x38": { name: "BSC", symbol: "BNB", explorer: "https://bscscan.com" },
  "0x89": { name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com" },
  "0xa4b1": { name: "Arbitrum", symbol: "ETH", explorer: "https://arbiscan.io" },
} as const;

export function WalletConnect() {
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success("Address copied to clipboard");
    }
  };

  const handleViewExplorer = () => {
    if (account?.address && account?.chain) {
      const chainId = account.chain.id.toString(16);
      const chain = CHAINS[`0x${chainId}` as keyof typeof CHAINS];
      if (chain) {
        window.open(`${chain.explorer}/address/${account.address}`, "_blank");
      }
    }
  };

  const handleSwitchChain = async (targetChainId: string) => {
    setIsSwitching(true);
    try {
      // For now, we'll just show a message since thirdweb handles chain switching differently
      toast.info("Chain switching is handled by the wallet");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!account) {
    return (
      <Button
        onClick={() => {
          // This will be handled by the ConnectButton in the minting page
          toast.info("Please connect your wallet in the minting interface");
        }}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  const chainId = account.chain?.id.toString(16);
  const currentChain = chainId ? CHAINS[`0x${chainId}` as keyof typeof CHAINS] : null;
  const shortAddress = account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "";

  return (
    <div className="flex items-center gap-3">
      {/* Chain Badge */}
      {currentChain && (
        <Badge variant="secondary" className="gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {currentChain.name}
        </Badge>
      )}

      {/* Wallet Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {shortAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Connected Wallet</CardTitle>
            <CardDescription className="text-xs">
              {account.address}
            </CardDescription>
          </CardHeader>
          
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Network</span>
              <span>{currentChain?.name || "Unknown"}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Copy Address */}
          <DropdownMenuItem onClick={handleCopyAddress} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy Address
          </DropdownMenuItem>

          {/* View on Explorer */}
          <DropdownMenuItem onClick={handleViewExplorer} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Switch Network */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Switch Network</div>
            <div className="space-y-1">
              {Object.entries(CHAINS).map(([chainId, chain]) => (
                <Button
                  key={chainId}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={() => handleSwitchChain(chainId)}
                  disabled={isSwitching}
                >
                  {chain.name}
                  {chainId === `0x${account.chain?.id.toString(16)}` && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Current
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Disconnect */}
          <DropdownMenuItem onClick={handleDisconnect} className="gap-2 text-red-600">
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function WalletStatus() {
  const account = useActiveAccount();

  if (!account) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Wallet Not Connected</p>
              <p className="text-sm text-amber-700">
                Connect your wallet to start minting NFTs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chainId = account.chain?.id.toString(16);
  const currentChain = chainId ? CHAINS[`0x${chainId}` as keyof typeof CHAINS] : null;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <p className="font-medium text-green-800">Wallet Connected</p>
            <p className="text-sm text-green-700">
              {account.address?.slice(0, 6)}...{account.address?.slice(-4)} on {currentChain?.name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
