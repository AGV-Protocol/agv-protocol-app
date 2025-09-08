"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ConnectButton,
  useActiveAccount,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
} from "thirdweb";
import { polygon, arbitrum, bsc } from "thirdweb/chains";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertTriangle, ArrowRightLeft, Lock, Unlock } from "lucide-react";

// --- Contract data ---
import { 
  NFT_CONTRACTS, 
  STAKE_CONTRACTS, 
  SEED_ABI, 
  TREE_ABI, 
  SOLAR_ABI, 
  COMPUTE_ABI, 
  STAKE_ABI,
  CHAINS
} from "@/lib/contracts";

// --- Firestore (optional; comment out if you don't want off-chain logs) ---
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ---------- CONFIG ----------
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Supported chains
type ChainKey = "56" | "42161" | "137";
const CHAIN_CONFIG: Record<ChainKey, { id: number; label: string; chain: any }> = {
  "56": { id: 56, label: "BSC", chain: bsc },
  "42161": { id: 42161, label: "Arbitrum", chain: arbitrum },
  "137": { id: 137, label: "Polygon", chain: polygon },
};

// ---------- Helper: build contracts for a chain ----------
function useContracts(chainKey: ChainKey, collectionType: "seed" | "tree" | "solar" | "compute" = "seed") {
  const chain = CHAIN_CONFIG[chainKey].chain;
  const nftAddress = NFT_CONTRACTS[chainKey][collectionType];
  const stakeAddress = STAKE_CONTRACTS[chainKey][collectionType];
  
  const nft = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: nftAddress,
        abi: (collectionType === "seed" ? SEED_ABI :
             collectionType === "tree" ? TREE_ABI :
             collectionType === "solar" ? SOLAR_ABI : COMPUTE_ABI) as any,
      }),
    [chainKey, collectionType, nftAddress]
  );

  const stake = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: stakeAddress,
        abi: STAKE_ABI as any,
      }),
    [chainKey, collectionType, stakeAddress]
  );

  return { nft, stake, chain };
}

// ---------- ERC-721 owner token discovery (robust fallback) ----------
async function fetchOwnedTokenIdsRobust(nftContract: any, owner: string): Promise<bigint[]> {
  // 1) Try Enumerable path: supportsInterface(0x780e9d63) then tokenOfOwnerByIndex
  try {
    const enumerable = await readContract({
      contract: nftContract,
      method: "function supportsInterface(bytes4 interfaceId) view returns (bool)",
      params: ["0x780e9d63"],
    });

    if (enumerable) {
      const bal: bigint = await readContract({
        contract: nftContract,
        method: "function balanceOf(address owner) view returns (uint256)",
        params: [owner],
      });
      const ids: bigint[] = [];
      for (let i = BigInt(0); i < bal; i++) {
        const id = await readContract({
          contract: nftContract,
          method: "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
          params: [owner, i],
        });
        ids.push(id as bigint);
      }
      return ids;
    }
  } catch {
    // ignore and fall through
  }

  // 2) If no Enumerable, ask user to input IDs (UI will show a manual input)
  return [];
}

// ---------- Firestore helpers (optional) ----------
async function logStake(address: string, chainKey: ChainKey, collectionType: "seed" | "tree" | "solar" | "compute", tokenIds: bigint[], duration: number) {
  try {
    const stakedAt = Math.floor(Date.now() / 1000);
    const unlockTime = stakedAt + (duration * 24 * 60 * 60); // Convert days to seconds
    
    // Store individual token staking info
    for (const tokenId of tokenIds) {
      await addDoc(collection(db, "staking_positions"), {
        address,
        chain: chainKey,
        collection: collectionType,
        tokenId: tokenId.toString(),
        stakedAt: Timestamp.fromMillis(stakedAt * 1000),
        duration, // in days
        unlockTime: Timestamp.fromMillis(unlockTime * 1000),
        nft: NFT_CONTRACTS[chainKey][collectionType],
        stakeContract: STAKE_CONTRACTS[chainKey][collectionType],
        status: "active", // active, withdrawn
      });
    }
    
    // Also keep the original logging for backward compatibility
    await addDoc(collection(db, "stakes_v1"), {
      address,
      chain: chainKey,
      collection: collectionType,
      tokenIds: tokenIds.map((t) => t.toString()),
      at: Timestamp.now(),
      duration,
      unlockTime: Timestamp.fromMillis(unlockTime * 1000),
      nft: NFT_CONTRACTS[chainKey][collectionType],
      stakeContract: STAKE_CONTRACTS[chainKey][collectionType],
    });
  } catch (error) {
    console.error("Error logging stake to Firebase:", error);
  }
}
async function logWithdraw(address: string, chainKey: ChainKey, collectionType: "seed" | "tree" | "solar" | "compute", tokenIds: bigint[]) {
  try {
    // Update staking_positions to mark as withdrawn
    const positionsQuery = query(
      collection(db, "staking_positions"),
      where("address", "==", address),
      where("chain", "==", chainKey),
      where("collection", "==", collectionType),
      where("status", "==", "active")
    );
    const positionsSnap = await getDocs(positionsQuery);
    
    for (const docSnap of positionsSnap.docs) {
      const data = docSnap.data();
      if (tokenIds.map(String).includes(data.tokenId)) {
        await addDoc(collection(db, "staking_positions"), {
          ...data,
          status: "withdrawn",
          withdrawnAt: Timestamp.now(),
        });
      }
    }
    
    // Also keep the original logging for backward compatibility
    const q = query(
      collection(db, "stakes_v1"),
      where("address", "==", address),
      where("chain", "==", chainKey),
      where("collection", "==", collectionType)
    );
    const snap = await getDocs(q);
    const toRemove: any[] = [];
    snap.forEach((d) => {
      const arr = (d.data().tokenIds || []) as string[];
      const overlap = arr.some((a) => tokenIds.map(String).includes(a));
      if (overlap) toRemove.push(d.id);
    });
    await Promise.all(toRemove.map((id) => deleteDoc(doc(db, "stakes_v1", id))));
  } catch (error) {
    console.error("Error logging withdraw to Firebase:", error);
  }
}

// ---------- Main Page ----------
export default function StakingPage() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const [chainKey, setChainKey] = useState<ChainKey>("56");
  const [selectedCollection, setSelectedCollection] = useState<"seed" | "tree" | "solar" | "compute">("seed");
  const { nft, stake, chain } = useContracts(chainKey, selectedCollection);

  const [loadingOwned, setLoadingOwned] = useState(false);
  const [ownedIds, setOwnedIds] = useState<bigint[]>([]);
  const [manualTokenId, setManualTokenId] = useState("");

  const [staking, setStaking] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // read staked count / rewards
  const [stakedCount, setStakedCount] = useState<bigint>(BigInt(0));
  const [pendingRewards, setPendingRewards] = useState<bigint>(BigInt(0));
  const [timeUnit, setTimeUnit] = useState<bigint>(BigInt(86400));
  const [rewardsPerUnit, setRewardsPerUnit] = useState<bigint>(BigInt(0));

  // Staking duration state
  const [stakingDuration, setStakingDuration] = useState<number>(1); // Minimum 1 day
  const [stakedTokensInfo, setStakedTokensInfo] = useState<Record<string, { stakedAt: number; duration: number }>>({});

  // Ensure wallet chain matches tab
  useEffect(() => {
    if (!activeChain?.id) return;
    const want = CHAIN_CONFIG[chainKey].id;
    if (activeChain.id !== want) {
      // no auto switch unless user clicks; just show hint
    }
  }, [activeChain, chainKey]);

  async function ensureChain() {
    const want = CHAIN_CONFIG[chainKey].id;
    if (activeChain?.id !== want) {
      try {
        await switchChain(CHAIN_CONFIG[chainKey].chain);
        toast.success(`Switched to ${CHAIN_CONFIG[chainKey].label}`);
      } catch {
        toast.error(`Please switch to ${CHAIN_CONFIG[chainKey].label} to continue`);
        throw new Error("wrong chain");
      }
    }
  }

  async function refreshOwned() {
    if (!account?.address) return;
    setLoadingOwned(true);
    try {
      const ids = await fetchOwnedTokenIdsRobust(nft, account.address);
      setOwnedIds(ids);
      if (ids.length === 0) {
        toast.info("Could not enumerate NFTs automatically. You can input a token ID manually.");
      }
    } finally {
      setLoadingOwned(false);
    }
  }

  async function refreshStats() {
    if (!account?.address) return;
    try {
      const info = (await readContract({
        contract: stake,
        method: "getStakeInfo",
        params: [account.address],
      })) as [bigint, bigint];
      setStakedCount(info[0]);
      setPendingRewards(info[1]);

      const tu = (await readContract({
        contract: stake,
        method: "timeUnit",
        params: [],
      })) as bigint;
      const rpu = (await readContract({
        contract: stake,
        method: "rewardsPerUnitTime",
        params: [],
      })) as bigint;

      setTimeUnit(tu);
      setRewardsPerUnit(rpu);

      // Fetch staked tokens information
      await refreshStakedTokensInfo();
    } catch (err) {
      // ignore on fresh deploy with 0s
    }
  }

  async function refreshStakedTokensInfo() {
    if (!account?.address) return;
    try {
      const stakedTokens = (await readContract({
        contract: stake,
        method: "getStakedTokens",
        params: [account.address],
      })) as bigint[];

      // Fetch staking info from Firebase
      const positionsQuery = query(
        collection(db, "staking_positions"),
        where("address", "==", account.address),
        where("chain", "==", chainKey),
        where("collection", "==", selectedCollection),
        where("status", "==", "active")
      );
      
      const positionsSnap = await getDocs(positionsQuery);
      const stakingInfo: Record<string, { stakedAt: number; duration: number }> = {};
      
      positionsSnap.forEach((doc) => {
        const data = doc.data();
        const tokenId = data.tokenId;
        const stakedAt = data.stakedAt.toMillis() / 1000; // Convert to seconds
        const duration = data.duration;
        
        stakingInfo[tokenId] = {
          stakedAt,
          duration
        };
      });
      
      // If no Firebase data found, try to migrate from localStorage (one-time migration)
      if (Object.keys(stakingInfo).length === 0) {
        await migrateFromLocalStorage();
        // Retry fetching from Firebase after migration
        const retrySnap = await getDocs(positionsQuery);
        retrySnap.forEach((doc) => {
          const data = doc.data();
          const tokenId = data.tokenId;
          const stakedAt = data.stakedAt.toMillis() / 1000;
          const duration = data.duration;
          
          stakingInfo[tokenId] = {
            stakedAt,
            duration
          };
        });
      }
      
      setStakedTokensInfo(stakingInfo);
    } catch (err) {
      console.error("Error fetching staked tokens info:", err);
    }
  }

  // One-time migration function from localStorage to Firebase
  async function migrateFromLocalStorage() {
    if (!account?.address) return;
    
    try {
      const storageKey = `staking_info_${account.address}_${chainKey}_${selectedCollection}`;
      const storedInfo = localStorage.getItem(storageKey);
      
      if (storedInfo) {
        const localStakingInfo = JSON.parse(storedInfo);
        
        // Migrate each token to Firebase
        for (const [tokenId, info] of Object.entries(localStakingInfo)) {
          const { stakedAt, duration } = info as { stakedAt: number; duration: number };
          const unlockTime = stakedAt + (duration * 24 * 60 * 60);
          
          await addDoc(collection(db, "staking_positions"), {
            address: account.address,
            chain: chainKey,
            collection: selectedCollection,
            tokenId,
            stakedAt: Timestamp.fromMillis(stakedAt * 1000),
            duration,
            unlockTime: Timestamp.fromMillis(unlockTime * 1000),
            nft: NFT_CONTRACTS[chainKey][selectedCollection],
            stakeContract: STAKE_CONTRACTS[chainKey][selectedCollection],
            status: "active",
            migrated: true, // Flag to indicate this was migrated
          });
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem(storageKey);
        console.log("Successfully migrated staking data from localStorage to Firebase");
      }
    } catch (error) {
      console.error("Error migrating from localStorage:", error);
    }
  }

  useEffect(() => {
    refreshOwned();
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address, chainKey, selectedCollection]);

  async function ensureApproval() {
    const owner = account!.address!;
    const operator = STAKE_CONTRACTS[chainKey][selectedCollection];
    const approved: boolean = (await readContract({
      contract: nft,
      method: "function isApprovedForAll(address owner, address operator) view returns (bool)",
      params: [owner, operator],
    })) as boolean;

    if (!approved) {
      const tx = await prepareContractCall({
        contract: nft,
        method: "function setApprovalForAll(address operator, bool approved)",
        params: [operator, true],
      });
      await sendAndConfirmTransaction({ transaction: tx, account: account! });
    }
  }

  async function handleStake(tokenIds: bigint[]) {
    if (!account?.address) return toast.error("Connect wallet first");
    if (tokenIds.length === 0) return toast.error("Select or input at least one tokenId");
    if (stakingDuration < 1) return toast.error("Staking duration must be at least 1 day");

    try {
      await ensureChain();
      setStaking(true);
      toast.loading("Approving (if needed) …");
      await ensureApproval();
      toast.dismiss();
      toast.loading("Staking…");
      const tx = await prepareContractCall({
        contract: stake,
        method: "stake",
        params: [tokenIds],
      });
      await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();
      toast.success(`Staked for ${stakingDuration} day${stakingDuration > 1 ? 's' : ''}!`);
      
      // Store staking information in Firebase
      await logStake(account.address, chainKey, selectedCollection, tokenIds, stakingDuration);
      setOwnedIds((prev) => prev.filter((id) => !tokenIds.includes(id)));
      setManualTokenId("");
      refreshStats();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || "Stake failed");
    } finally {
      setStaking(false);
    }
  }

  async function handleWithdraw(tokenIds: bigint[]) {
    if (!account?.address) return toast.error("Connect wallet first");
    if (tokenIds.length === 0) return toast.error("Provide tokenId(s) to withdraw");

    // Check if staking duration has elapsed for all tokens using Firebase data
    const currentTime = Math.floor(Date.now() / 1000);
    const lockedTokens: string[] = [];
    
    // Check each token against Firebase staking info
    for (const tokenId of tokenIds) {
      const tokenInfo = stakedTokensInfo[tokenId.toString()];
      if (tokenInfo) {
        const elapsedTime = currentTime - tokenInfo.stakedAt;
        const requiredTime = tokenInfo.duration * 24 * 60 * 60; // Convert days to seconds
        
        if (elapsedTime < requiredTime) {
          const remainingTime = requiredTime - elapsedTime;
          const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60));
          lockedTokens.push(`${tokenId.toString()} (${remainingDays} day${remainingDays > 1 ? 's' : ''} remaining)`);
        }
      }
    }
    
    if (lockedTokens.length > 0) {
      toast.error(`Cannot withdraw tokens: ${lockedTokens.join(', ')}. Staking duration not yet completed.`);
      return;
    }

    try {
      await ensureChain();
      setWithdrawing(true);
      toast.loading("Withdrawing…");
      const tx = await prepareContractCall({
        contract: stake,
        method: "withdraw",
        params: [tokenIds],
      });
      await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();
      toast.success("Withdrawn!");
      
      // Update Firebase to mark tokens as withdrawn
      await logWithdraw(account.address, chainKey, selectedCollection, tokenIds);
      refreshStats();
      // You may also push IDs back to owned list
      setOwnedIds((prev) => Array.from(new Set([...prev, ...tokenIds])));
      setManualTokenId("");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || "Withdraw failed");
    } finally {
      setWithdrawing(false);
    }
  }

  const dailyRewardHint = useMemo(() => {
    // If rewardsPerUnit is 0, on-chain rewards are off — show 0/day.
    if (rewardsPerUnit === BigInt(0)) return "0 (on-chain rewards off)";
    // Convert per timeUnit to per day (rough hint)
    const perSec = Number(rewardsPerUnit) / Number(timeUnit || BigInt(1));
    const perDay = perSec * 86400;
    return `${perDay.toFixed(4)} / day (contract)`;
  }, [rewardsPerUnit, timeUnit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-blue-800/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
          <div className="relative z-10">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  AGV Protocol Staking
        </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl">
                  Stake your <span className="font-semibold text-cyan-300">{selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)}</span> NFTs on{" "}
                  <span className="font-semibold text-blue-300">{CHAIN_CONFIG[chainKey].label}</span> to earn rewards. 
                  Set your staking duration (minimum 1 day) - tokens are locked until the period expires.
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-300 font-medium">Live Staking</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-blue-300 font-medium">Secure</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-cyan-300 font-medium">Multi-Chain</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <ConnectButton client={client} />
              </div>
            </header>
          </div>
      </div>

        {/* Chain and Collection Selector */}
        <div className="space-y-4 sm:space-y-6">
      {/* Chain Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Select Network
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {(["56", "42161", "137"] as ChainKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setChainKey(k)}
                  className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                    chainKey === k 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-semibold">{CHAIN_CONFIG[k].label}</div>
                      <div className="text-xs opacity-70">Chain ID: {k}</div>
                    </div>
                    {chainKey === k && (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {chainKey === k && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-white/60">
              Current wallet chain: <span className="text-blue-300">{activeChain?.name ?? "Not connected"}</span>
            </div>
          </div>
          
          {/* Collection Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Select NFT Collection
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(["seed", "tree", "solar", "compute"] as const).map((collection) => (
                <button
                  key={collection}
                  onClick={() => setSelectedCollection(collection)}
                  className={`group relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                    selectedCollection === collection 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg overflow-hidden bg-white/10">
                      <img 
                        src={`/${collection}pass.jpg`}
                        alt={`${collection}Pass NFT`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-semibold text-sm">
                      {collection.charAt(0).toUpperCase() + collection.slice(1)}
                    </div>
                  </div>
                  {selectedCollection === collection && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
                  </div>
                </div>

        {/* Staking Duration Selection */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            Select Staking Duration
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="duration" className="text-white/80 text-sm font-medium">
                Duration (days):
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                max="365"
                value={stakingDuration}
                onChange={(e) => setStakingDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-center"
              />
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-purple-300" />
                <span className="text-purple-300 text-sm font-medium">Lock Period</span>
              </div>
              <p className="text-white/70 text-xs">
                Your NFTs will be locked for <span className="font-semibold text-purple-300">{stakingDuration} day{stakingDuration > 1 ? 's' : ''}</span>. 
                You cannot withdraw them until this period expires.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Staking Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Staked NFTs"
              value={stakedCount.toString()}
              subtitle="Currently staked"
              icon={<Lock className="w-6 h-6" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Pending Rewards"
              value={pendingRewards.toString()}
              subtitle="Available to claim"
              icon={<CheckCircle className="w-6 h-6" />}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              title="Daily Rewards"
              value={dailyRewardHint}
              subtitle="Per NFT staked"
              icon={<ArrowRightLeft className="w-6 h-6" />}
              gradient="from-blue-500 to-cyan-500"
            />
          </div>
        </div>

        {/* NFT Staking Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Your {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs
              </h3>
              <p className="text-white/60 text-sm mt-1">Available for staking on {CHAIN_CONFIG[chainKey].label}</p>
            </div>
            <button
              onClick={refreshOwned}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-all duration-300 disabled:opacity-50"
              disabled={loadingOwned}
            >
              {loadingOwned ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refreshing...
                </div>
              ) : (
                "Refresh"
              )}
            </button>
          </div>

        {account?.address ? (
          <>
            {ownedIds.length > 0 ? (
              <OwnedTokensList
                ids={ownedIds}
                onStake={async (ids) => { await handleStake(ids); }}
                staking={staking}
              />
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-300 font-medium mb-1">Auto-detection failed</h4>
                  <p className="text-white/70 text-sm">
                    Could not automatically detect your {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs. 
                    If your contract doesn't implement ERC721Enumerable, enter a token ID manually:
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Manual Token ID Entry</h4>
              <div className="flex gap-3">
                <input
                  value={manualTokenId}
                  onChange={(e) => setManualTokenId(e.target.value)}
                  placeholder="Enter token ID (e.g., 123)"
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={() => {
                    const id = manualTokenId.trim();
                    if (!id) return;
                    handleStake([BigInt(id)]);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={staking || !manualTokenId.trim()}
                >
                  {staking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Staking...
                    </div>
                  ) : (
                    "Stake NFT"
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white/60" />
            </div>
            <h4 className="text-white font-medium mb-2">Connect Your Wallet</h4>
            <p className="text-white/60 text-sm">Connect your wallet to view and stake your NFTs</p>
            <div className="mt-4">
              <ConnectButton client={client} />
            </div>
          </div>
        )}
        </div>

        {/* Withdraw Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Withdraw Staked NFTs
            </h3>
            <p className="text-white/60 text-sm mt-1">
              Enter token IDs you previously staked to withdraw them back to your wallet
            </p>
          </div>
          <WithdrawBox
            withdrawing={withdrawing}
            onWithdraw={async (ids) => { await handleWithdraw(ids); }}
            stakedTokensInfo={stakedTokensInfo}
            chainKey={chainKey}
            selectedCollection={selectedCollection}
            account={account}
          />
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-1">Important Information</h4>
              <p className="text-white/70 text-sm">
                On-chain rewards may be disabled (rate = 0) during the preview phase. 
                Your UI can still show off-chain rGGP credits from Firestore logging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient || 'from-gray-500 to-gray-600'} shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300`}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">{value}</div>
            {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
          </div>
        </div>
        <div className="text-white/80 font-medium group-hover:text-white transition-colors duration-300">{title}</div>
      </div>
    </div>
  );
}

function OwnedTokensList({
  ids,
  onStake,
  staking,
}: {
  ids: bigint[];
  onStake: (ids: bigint[]) => Promise<void>;
  staking: boolean;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // reset selection when ids change
    const next: Record<string, boolean> = {};
    ids.forEach((id) => (next[id.toString()] = false));
    setSelected(next);
  }, [ids]);

  const picked = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => BigInt(k));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {ids.map((id) => {
          const key = id.toString();
          const isOn = !!selected[key];
          return (
            <button
              key={key}
              onClick={() =>
                setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                isOn 
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25" 
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              <div className="relative z-10">
                <div className="text-xs opacity-70 mb-1">Token ID</div>
                <div className="text-lg font-semibold">{key}</div>
              </div>
              {isOn && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
              )}
              {isOn && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  </div>
              )}
            </button>
          );
        })}
                  </div>

      {picked.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Selected for Staking</h4>
              <p className="text-white/60 text-sm">{picked.length} NFT{picked.length > 1 ? 's' : ''} selected</p>
                  </div>
            <button
              onClick={() => onStake(picked)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={staking || picked.length === 0}
            >
              {staking ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Staking...
                </div>
              ) : (
                `Stake ${picked.length} NFT${picked.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawBox({
  withdrawing,
  onWithdraw,
  stakedTokensInfo,
  chainKey,
  selectedCollection,
  account,
}: {
  withdrawing: boolean;
  onWithdraw: (ids: bigint[]) => Promise<void>;
  stakedTokensInfo: Record<string, { stakedAt: number; duration: number }>;
  chainKey: ChainKey;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  account: any;
}) {
  const [raw, setRaw] = useState("");

  function parseIds(input: string): bigint[] {
    return input
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => BigInt(s));
  }

  const ids = parseIds(raw);

  // Check staking status for each token
  const getTokenStatus = (tokenId: bigint) => {
    const tokenInfo = stakedTokensInfo[tokenId.toString()];
    if (!tokenInfo) return null;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedTime = currentTime - tokenInfo.stakedAt;
    const requiredTime = tokenInfo.duration * 24 * 60 * 60;
    const remainingTime = requiredTime - elapsedTime;
    
    if (remainingTime > 0) {
      const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60));
      return { locked: true, remainingDays };
    }
    
    return { locked: false, remainingDays: 0 };
  };

  const lockedTokens = ids.filter(id => {
    const status = getTokenStatus(id);
    return status?.locked;
  });

  const availableTokens = ids.filter(id => {
    const status = getTokenStatus(id);
    return !status?.locked;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Enter token IDs (e.g., 12, 44, 88)"
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <button
          onClick={() => onWithdraw(availableTokens)}
          className="px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          disabled={withdrawing || availableTokens.length === 0}
        >
          {withdrawing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Withdrawing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Withdraw Available
            </div>
          )}
        </button>
      </div>
      
      {ids.length > 0 && (
        <div className="space-y-3">
          {availableTokens.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">
                  {availableTokens.length} token{availableTokens.length > 1 ? 's' : ''} ready to withdraw: {availableTokens.map(id => id.toString()).join(', ')}
                </span>
              </div>
            </div>
          )}
          
          {lockedTokens.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium">
                  {lockedTokens.length} token{lockedTokens.length > 1 ? 's' : ''} still locked
                </span>
              </div>
              <div className="space-y-1">
                {lockedTokens.map(tokenId => {
                  const status = getTokenStatus(tokenId);
                  return (
                    <div key={tokenId.toString()} className="text-yellow-200 text-xs">
                      Token {tokenId.toString()}: {status?.remainingDays} day{status?.remainingDays && status.remainingDays > 1 ? 's' : ''} remaining
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
