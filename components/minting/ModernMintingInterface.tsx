"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { thirdwebClient, WalletConnect, WalletStatus } from "@/components/wallet/wallet-connect";
import { useActiveAccount, useWalletBalance, useReadContract, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";

// Components
import { ChainSelector } from "./components/ChainSelector";
import { MintingModeSelector } from "./components/MintingModeSelector";
import { NftSelection } from "./components/NftSelection";
import { ReferralInput } from "./components/ReferralInput";
import { OrderSummary } from "./components/OrderSummary";
import { WalletConnection } from "./components/WalletConnection";

// Hooks and Utils
import { useMintingState } from "./hooks/useMintingState";
import { NftType, ChainId } from "./types";
import { NFT_INFO, GAS_THRESHOLDS, USDT_DECIMALS_FALLBACK } from "./constants";

// Libs
import { NFT_CONTRACTS, USDT_ADDRESSES, USDT_ABI, SEED_ABI, TREE_ABI, SOLAR_ABI, COMPUTE_ABI } from "@/lib/contracts";
import { PASS_PRICES } from "@/lib/pricing";
import { defineChain, getContract, prepareContractCall, sendTransaction, waitForReceipt, sendAndConfirmTransaction } from "thirdweb";
import { parseUnits } from "viem";
import { recordSuccessfulMintStrict } from "@/lib/recordMint";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Modal Components (keeping existing functionality)
import { SpendingCapModal } from "./components/SpendingCapModal";
import { TransactionProgressModal } from "./components/TransactionProgressModal";

export default function ModernMintingInterface() {
  const {
    // State
    selectedChain,
    setSelectedChain,
    mintMode,
    setMintMode,
    quantities,
    setQuantities,
    isMinting,
    setIsMinting,
    mintProgress,
    setMintProgress,
    currentStep,
    setCurrentStep,
    hasInsufficientGas,
    setHasInsufficientGas,
    wlEligible,
    setWlEligible,
    checkingWl,
    setCheckingWl,
    kolDigits,
    setKolDigits,
    kolLocked,
    setKolLocked,
    
    // Computed values
    CHAINS,
    fullKolId,
    saleMode,
    account,
    activeChain,
    
    // Helper functions
    getModeCap,
    getPerWalletMax,
    getMaxSelectableFor,
    
    // Refs
    wlCheckedAddressRef,
  } = useMintingState();

  const switchChain = useSwitchActiveWalletChain();
  const isConnected = !!account;
  const chainInfo = CHAINS[selectedChain];

  // Transaction state
  const [showSpendingModal, setShowSpendingModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [progressStage, setProgressStage] = useState<"approval" | "mint" | "confirming" | "success" | "timeout" | "error">("approval");
  const [pendingApprovalTx, setPendingApprovalTx] = useState<any>(null);
  const [pendingMintTx, setPendingMintTx] = useState<any>(null);

  // Contract setup
  const getSelectedNftType = (): NftType => {
    for (const [type, qty] of Object.entries(quantities)) if (qty > 0) return type as NftType;
    return "seed";
  };
  const selectedNftType = getSelectedNftType();

  const resolveUsdtAddress = (chain: ChainId) => {
    const byString = (USDT_ADDRESSES as Record<string, string>)?.[chain];
    const byNumber = (USDT_ADDRESSES as Record<number, string>)?.[Number(chain)];
    return byString || byNumber || "";
  };

  const resolveNftAddress = (nftType: NftType, chain: ChainId) => {
    const byTypeThenChain =
      (NFT_CONTRACTS as Record<string, Record<string | number, string>>)?.[nftType]?.[chain] ||
      (NFT_CONTRACTS as Record<string, Record<string | number, string>>)?.[nftType]?.[Number(chain)];
    const byChainThenType =
      (NFT_CONTRACTS as Record<string | number, Record<string, string>>)?.[chain]?.[nftType] ||
      (NFT_CONTRACTS as Record<string | number, Record<string, string>>)?.[Number(chain)]?.[nftType];
    return byTypeThenChain || byChainThenType || "";
  };

  const getNftAbi = (nftType: NftType) => {
    switch (nftType) {
      case "seed": return SEED_ABI;
      case "tree": return TREE_ABI;
      case "solar": return SOLAR_ABI;
      case "compute": return COMPUTE_ABI;
      default: return SEED_ABI;
    }
  };

  const contractAddr = resolveNftAddress(selectedNftType, selectedChain);
  const usdtAddr = resolveUsdtAddress(selectedChain);

  const nftContract = useMemo(() => 
    contractAddr ? getContract({ 
      client: thirdwebClient, 
      address: contractAddr, 
      chain: chainInfo.chain, 
      abi: getNftAbi(selectedNftType) as any 
    }) : null, 
    [contractAddr, chainInfo.chain, selectedNftType]
  );

  const usdtContract = useMemo(() => 
    usdtAddr ? getContract({ 
      client: thirdwebClient, 
      address: usdtAddr, 
      chain: chainInfo.chain, 
      abi: USDT_ABI 
    }) : null, 
    [usdtAddr, chainInfo.chain]
  );

  const { data: usdtDecimalsData } = useReadContract({
    contract: usdtContract!,
    method: "decimals",
    params: [],
    queryOptions: { enabled: !!usdtContract },
  });

  // Balance and gas info
  const usdtBalanceResult = useWalletBalance({ 
    client: thirdwebClient, 
    chain: chainInfo.chain, 
    address: account?.address, 
    tokenAddress: usdtAddr 
  });
  const usdtData = usdtBalanceResult?.data || undefined;

  const nativeBalanceResult = useWalletBalance({ 
    client: thirdwebClient, 
    chain: chainInfo.chain, 
    address: account?.address 
  });
  const nativeData = nativeBalanceResult?.data || undefined;

  const gasInfo = useMemo(() => {
    const currentGas = parseFloat(nativeData?.displayValue ?? "0");
    const minRequired = GAS_THRESHOLDS[selectedChain];
    const symbol = CHAINS[selectedChain].symbol;
    return { currentGas, minRequired, isInsufficient: currentGas < minRequired, symbol };
  }, [nativeData?.displayValue, selectedChain, CHAINS]);

  useEffect(() => { 
    setHasInsufficientGas(gasInfo.isInsufficient); 
  }, [gasInfo.isInsufficient, setHasInsufficientGas]);

  // Whitelist checking
  useEffect(() => {
    const run = async () => {
      if (!account?.address) { 
        setWlEligible(false); 
        wlCheckedAddressRef.current = null; 
        return; 
      }
      if (wlCheckedAddressRef.current === account.address) return;
      try {
        setCheckingWl(true);
        const res = await fetch(`/api/merkle-proof?address=${account.address}`, { cache: "no-store" });
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
        wlCheckedAddressRef.current = account.address; 
      }
    };
    run();
  }, [account?.address, setWlEligible, setCheckingWl]);

  // Calculated totals
  const totalCost = useMemo(() => {
    return (Object.entries(quantities) as [NftType, number][])
      .reduce((total, [type, qty]) => total + qty * Number((PASS_PRICES as any)[type]?.usd ?? 0), 0);
  }, [quantities]);

  const totalQuantity = useMemo(() => 
    Object.values(quantities).reduce((s, q) => s + q, 0), 
    [quantities]
  );

  const canMint = useMemo(() => {
    if (!isConnected || hasInsufficientGas) return false;
    if (totalQuantity === 0 || totalCost <= 0) return false;
    const picked = Object.entries(quantities).filter(([, q]) => q > 0);
    if (picked.length !== 1) return false;
    const [pickedType, pickedQty] = picked[0] as [NftType, number];
    const allowed = getMaxSelectableFor(pickedType, selectedChain);
    return allowed > 0 && pickedQty <= allowed;
  }, [isConnected, hasInsufficientGas, totalQuantity, totalCost, quantities, selectedChain, getMaxSelectableFor]);

  // Quantity change handler
  const handleQuantityChange = (type: NftType, value: number) => {
    const maxAllowed = getMaxSelectableFor(type, selectedChain);
    const newValue = Math.max(0, Math.min(value, maxAllowed));
    setQuantities(prev =>
      newValue > 0
        ? ({ seed: 0, tree: 0, solar: 0, compute: 0, [type]: newValue } as Record<NftType, number>)
        : { ...prev, [type]: newValue }
    );
  };

  // Error handling utilities
  function safeStringifyError(err: unknown) {
    try {
      if (err instanceof Error) {
        const plain: Record<string, unknown> = {};
        Object.getOwnPropertyNames(err).forEach((k) => (plain[k] = (err as any)[k]));
        if ((err as any).cause) plain.cause = safeStringifyError((err as any).cause);
        return JSON.stringify(plain);
      }
      return JSON.stringify(err);
    } catch {
      try { return String(err); } catch { return "Unstringifiable error"; }
    }
  }

  function extractErrorMessage(e: unknown): string {
    const any = e as Record<string, any> | undefined;
    const msg =
      any?.shortMessage || any?.message || any?.reason ||
      any?.error?.data?.message || any?.error?.message ||
      any?.data?.message || any?.details ||
      any?.cause?.shortMessage || any?.cause?.message || any?.cause?.reason;
    if (typeof msg === "string" && msg) return msg;
    return safeStringifyError(e);
  }

  const normalizeError = (e: unknown) => extractErrorMessage(e);

  // Transaction handling (keeping existing logic)
  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const short = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

  const requestApproveConfirmation = (amount: number, spender?: string, chainName?: string) =>
    new Promise<void>((resolve, reject) => {
      toast.custom((t) => (
        <div className="w-[360px] rounded-xl bg-neutral-900 text-white border border-white/10 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 text-blue-400 mt-0.5">🛡️</div>
            <div className="flex-1">
              <p className="font-semibold">Confirm USDT approval</p>
              <p className="text-xs text-white/70 mt-1">
                Request from <span className="font-medium">mint.agvprotocol.org</span>{chainName ? ` • ${chainName}` : ""}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-white/70">Spending cap</span>
                <span className="font-semibold">{amount.toFixed(2)} USDT</span>
              </div>
              {spender && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-white/60">Spender</span>
                  <span className="font-mono">{short(spender)}</span>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { toast.dismiss(t); reject(new Error("User cancelled")); }}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { toast.dismiss(t); resolve(); }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      ), { duration: Infinity });
    });

  // Transaction preparation and execution (keeping existing logic)
  const prepareTransactions = async () => {
    if (!account?.address) { 
      toast.error("Please connect your wallet to proceed with minting."); 
      throw new Error("Wallet not connected"); 
    }
    if (!canMint) { 
      toast.error("Please check your minting eligibility."); 
      throw new Error("Not eligible for minting"); 
    }

    const selectedTypes = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    if (selectedTypes.length === 0) throw new Error("Please select at least one NFT to mint");
    if (selectedTypes.length > 1) throw new Error("Please select only one NFT type at a time");
    const [selectedType, selectedQty] = selectedTypes[0] as [NftType, number];
    const nftType = selectedType;
    const quantity = selectedQty;
    if (quantity < 1) throw new Error("Quantity must be at least 1");

    const allowed = getMaxSelectableFor(nftType, selectedChain);
    if (allowed === 0 || quantity > allowed) {
      throw new Error("Selected quantity exceeds current minting cap.");
    }

    if (!isValidAddress(contractAddr)) { 
      const msg = `Missing/invalid NFT contract address for ${nftType} on chain ${selectedChain}`; 
      toast.error(msg); 
      throw new Error(msg); 
    }
    if (!isValidAddress(usdtAddr)) { 
      const msg = `Missing/invalid USDT address on chain ${selectedChain}`; 
      toast.error(msg); 
      throw new Error(msg); 
    }

    const localNft = getContract({ 
      client: thirdwebClient, 
      address: contractAddr, 
      chain: CHAINS[selectedChain].chain, 
      abi: getNftAbi(nftType) as any 
    });
    const localUsdt = getContract({ 
      client: thirdwebClient, 
      address: usdtAddr, 
      chain: CHAINS[selectedChain].chain, 
      abi: USDT_ABI 
    });

    if (fullKolId) { 
      const q = query(collection(db, "kols"), where("kolId", "==", fullKolId)); 
      await getDocs(q).catch(() => void 0); 
    }

    try {
      const target = CHAINS[selectedChain].chain;
      const currentId = activeChain?.id;
      const targetId = (target as any)?.id ?? parseInt(selectedChain, 10);
      if (!currentId || currentId !== targetId) await switchChain?.(target);
    } catch {
      // ignore; wallet can still prompt during tx
    }

    const unitPriceUsd = Number((PASS_PRICES as any)[nftType]?.usd ?? 0);
    const totalCostUsd = quantity * unitPriceUsd;
    const decimals = (typeof usdtDecimalsData === "number" ? usdtDecimalsData : undefined) ?? USDT_DECIMALS_FALLBACK[selectedChain];
    const amountToApprove = parseUnits(String(totalCostUsd), decimals);

    const approveTx = prepareContractCall({ 
      contract: localUsdt, 
      method: "approve", 
      params: [contractAddr, amountToApprove] 
    });
    const mintTx = prepareContractCall({ 
      contract: localNft, 
      method: "mint", 
      params: [BigInt(quantity), []] 
    });

    setPendingApprovalTx(approveTx);
    setPendingMintTx(mintTx);

    return { approveTx, mintTx, totalCostUsd, quantity, nftType };
  };

  const handleSpendingCapConfirm = async (txs?: {
    approveTx: ReturnType<typeof prepareContractCall>;
    mintTx: ReturnType<typeof prepareContractCall>;
  }) => {
    try {
      setProgressStage("approval");
      setCurrentStep("Approving USDT spending…");
      setMintProgress(30);
      toast.info("Please approve USDT spending in your wallet.");

      const approveToUse = txs?.approveTx ?? pendingApprovalTx;
      const mintToUse = txs?.mintTx ?? pendingMintTx;

      if (!approveToUse) throw new Error("Approval transaction not prepared");
      const approveRes = await sendTransaction({ transaction: approveToUse, account: account! });
      if (approveRes?.transactionHash) setTxHash(approveRes.transactionHash);

      const approveReceipt = await waitForReceipt({
        client: thirdwebClient,
        chain: chainInfo.chain,
        transactionHash: approveRes.transactionHash,
      });
      if (approveReceipt.status !== "success") throw new Error("Approval failed on-chain");

      toast.success("USDT spending approved. Proceeding with mint…");
      setProgressStage("mint");
      setCurrentStep("Executing mint transaction…");
      setMintProgress(60);

      if (!mintToUse) throw new Error("Mint transaction not prepared");
      const receipt = await sendAndConfirmTransaction({ transaction: mintToUse, account: account! });

      setProgressStage("confirming");
      setMintProgress(85);
      if (receipt?.transactionHash) setTxHash(receipt.transactionHash);

      await handleTransactionSuccess(receipt);
    } catch (error) {
      handleTransactionError(error);
      throw error;
    }
  };

  const handleTransactionSuccess = async (receipt: { transactionHash?: string } | null) => {
    setProgressStage("success"); 
    setCurrentStep("Minted successfully!"); 
    setMintProgress(100); 
    setIsMinting(false);
    const currentSelectedType = getSelectedNftType();
    const currentQuantity = quantities[currentSelectedType];
    toast.success(`Successfully minted ${currentQuantity} ${currentSelectedType}Pass NFT${currentQuantity > 1 ? "s" : ""}`);
    try {
      await recordSuccessfulMintStrict(db, fullKolId, { 
        address: account?.address!, 
        nftType: currentSelectedType, 
        quantity: currentQuantity, 
        chainId: selectedChain as any, 
        txHash: receipt?.transactionHash || txHash, 
        timestamp: new Date(), 
        mintType: "public" 
      });
      toast.success("Mint recorded successfully");
    } catch (error) {
      console.error("Error recording mint:", error);
      toast.error("NFT minted successfully but failed to update records (non-critical)");
    }
    setQuantities({ seed: 0, tree: 0, solar: 0, compute: 0});
    setTimeout(() => { 
      setShowProgressModal(false); 
      setProgressStage("approval"); 
      setTxHash(""); 
      setCurrentStep(""); 
      setMintProgress(0); 
    }, 1200);
  };

  const handleTransactionError = (err: unknown) => {
    const errorMessage = normalizeError(err);
    console.error("Transaction error:", err);
    setCurrentStep(`Error: ${errorMessage}`);
    setIsMinting(false);
    setMintProgress(0);
    setProgressStage("error");
    toast.error(`Transaction failed: ${errorMessage}`);
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);
      setMintProgress(10);
      setCurrentStep("Preparing transaction…");

      const prep = await prepareTransactions();
      setMintProgress(25);
      setCurrentStep("Awaiting your confirmation…");

      await requestApproveConfirmation(prep.totalCostUsd, contractAddr, CHAINS[selectedChain].name);

      await handleSpendingCapConfirm({ approveTx: prep.approveTx, mintTx: prep.mintTx });
    } catch (e) {
      if ((e as Error)?.message === "User cancelled") {
        toast.message("Approval cancelled");
      } else {
        toast.error(`Unable to proceed: ${normalizeError(e)}`);
      }
      setIsMinting(false);
      setMintProgress(0);
      setCurrentStep("");
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Main Content */}
      <div className="grid gap-4 sm:gap-8">
        {/* Minting Interface */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Chain Selection */}
          <ChainSelector
            chains={CHAINS}
            selectedChain={selectedChain}
            onChainSelect={setSelectedChain}
          />

          {/* Minting Mode */}
          <MintingModeSelector
            mintMode={mintMode}
            onModeChange={setMintMode}
          />

          {/* NFT Selection */}
          <NftSelection
            selectedChain={selectedChain}
            quantities={quantities}
            getMaxSelectableFor={getMaxSelectableFor}
            onQuantityChange={handleQuantityChange}
          />

          {/* KOL ID Input */}
          <ReferralInput
            kolDigits={kolDigits}
            kolLocked={kolLocked}
            onKolDigitsChange={setKolDigits}
          />

          {/* Order Summary */}
          <OrderSummary
            quantities={quantities}
            totalCost={totalCost}
            totalQuantity={totalQuantity}
            selectedChain={selectedChain}
            chains={CHAINS}
            isConnected={isConnected}
            usdtData={usdtData}
            nativeData={nativeData}
            gasInfo={gasInfo}
          />

          {/* Wallet Connection & Minting */}
          <WalletConnection
            isConnected={isConnected}
            hasInsufficientGas={hasInsufficientGas}
            isMinting={isMinting}
            currentStep={currentStep}
            mintProgress={mintProgress}
            canMint={canMint}
            onMint={handleMint}
            account={account}
            checkingWl={checkingWl}
            wlEligible={wlEligible}
          />
        </div>
      </div>

      {/* Modals */}
      <SpendingCapModal
        isOpen={showSpendingModal}
        onClose={handleSpendingCapClose}
        onConfirm={handleSpendingCapConfirm as any}
        spender={contractAddr ? `${contractAddr.slice(0, 6)}...${contractAddr.slice(-4)}` : ""}
        requestFrom="mint.agvprotocol.org"
        spendingCap={totalCost.toFixed(2)}
        tokenSymbol="USDT"
        networkFee="~"
      />

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
