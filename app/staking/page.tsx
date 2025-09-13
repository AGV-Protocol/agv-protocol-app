// app/staking/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/footer";
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
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  Unlock,
  Coins,
  Gift,
  Zap,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// Contracts / ABIs
import {
  NFT_CONTRACTS,
  STAKE_CONTRACTS,
  SEED_ABI,
  TREE_ABI,
  SOLAR_ABI,
  COMPUTE_ABI,
  STAKE_ABI,
  REWARD_RATES,
} from "@/lib/contracts";

// Rewards (off-chain dashboard)
import { useOffChainRewards } from "@/hooks/useOffChainRewards";
import { BASE_DAILY_RRGP, bonusFor } from "@/lib/rewards";

// Moralis-backed hook
import { useStakingView } from "@/hooks/useStakingView";

// Firestore
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

/* ─────────────────────────── Helpers ─────────────────────────── */
function toGateway(u?: string) {
  if (!u) return undefined;
  if (u.startsWith("ipfs://")) return u.replace(/^ipfs:\/\//, "https://ipfscdn.io/ipfs/");
  return u.replace(/^https?:\/\/ipfs\.io\/ipfs\//i, "https://ipfscdn.io/ipfs/");
}
function getImageSrc(nft: { imageUrl?: string }, fallback?: string) {
  return toGateway(nft?.imageUrl) || fallback;
}

/* ─────────────────────────── Config ─────────────────────────── */
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

type ChainKey = "56" | "42161" | "137";
const CHAIN_CONFIG: Record<ChainKey, { id: number; label: string; chain: any; fallbackImg: string }> = {
  "56": { id: 56, label: "BSC", chain: bsc, fallbackImg: "/seedpass.jpg" },
  "42161": { id: 42161, label: "Arbitrum", chain: arbitrum, fallbackImg: "/seedpass.jpg" },
  "137": { id: 137, label: "Polygon", chain: polygon, fallbackImg: "/seedpass.jpg" },
};

function useContracts(
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute" = "seed"
) {
  const chain = CHAIN_CONFIG[chainKey].chain;
  const nftAddress = NFT_CONTRACTS[chainKey][collectionType];
  const stakeAddress = STAKE_CONTRACTS[chainKey][collectionType];

  const nft = useMemo(
    () =>
      getContract({
        client,
        chain,
        address: nftAddress,
        abi:
          (collectionType === "seed"
            ? SEED_ABI
            : collectionType === "tree"
            ? TREE_ABI
            : collectionType === "solar"
            ? SOLAR_ABI
            : COMPUTE_ABI) as any,
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

/* ───────────── Reward calc (used in tables & claim logs) ───────────── */
function calculateRewards(
  stakedAt: number,
  duration: number,
  collectionType: "seed" | "tree" | "solar" | "compute",
  lastClaimedAt?: number
): { totalRewards: number; dailyRate: number; canClaim: boolean } {
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = lastClaimedAt || stakedAt;
  const elapsedTime = currentTime - startTime;
  const totalStakingTime = duration * 24 * 60 * 60;

  const dailyRate = REWARD_RATES[collectionType];
  const elapsedDays = Math.min(elapsedTime / (24 * 60 * 60), totalStakingTime / (24 * 60 * 60));
  const totalRewards = elapsedDays * dailyRate;

  const canClaim = elapsedTime >= 24 * 60 * 60; // ≥ 1 day
  return { totalRewards: Math.max(0, totalRewards), dailyRate, canClaim };
}

/* ───────────── Firestore logging helpers (used) ───────────── */
async function logStake(
  address: string,
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute",
  tokenIds: bigint[],
  duration: number
) {
  try {
    const stakedAt = Math.floor(Date.now() / 1000);
    const unlockTime = stakedAt + duration * 24 * 60 * 60;

    for (const tokenId of tokenIds) {
      await addDoc(collection(db, "staking_positions"), {
        address,
        chain: chainKey,
        collection: collectionType,
        tokenId: tokenId.toString(),
        stakedAt: Timestamp.fromMillis(stakedAt * 1000),
        duration,
        unlockTime: Timestamp.fromMillis(unlockTime * 1000),
        nft: NFT_CONTRACTS[chainKey][collectionType],
        stakeContract: STAKE_CONTRACTS[chainKey][collectionType],
        status: "active",
        lastClaimedAt: null,
        totalClaimed: 0,
      });
    }

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

async function claimRewards(
  address: string,
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute",
  tokenIds: bigint[]
) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    let totalClaimedAmount = 0;

    const positionsQuery = query(
      collection(db, "staking_positions"),
      where("address", "==", address),
      where("chain", "==", chainKey),
      where("collection", "==", collectionType),
      where("status", "==", "active")
    );

    const positionsSnap = await getDocs(positionsQuery);
    const positionsToUpdate: Array<{
      docId: string;
      newTotalClaimed: number;
      newLastClaimedAt: number;
    }> = [];

    for (const docSnap of positionsSnap.docs) {
      const data = docSnap.data();
      if (tokenIds.map(String).includes(data.tokenId)) {
        const stakedAt = data.stakedAt.toMillis() / 1000;
        const lastClaimedAt = data.lastClaimedAt ? data.lastClaimedAt.toMillis() / 1000 : stakedAt;
        const duration = data.duration;

        const rewardInfo = calculateRewards(stakedAt, duration, collectionType, lastClaimedAt);
        if (rewardInfo.totalRewards > 0) {
          totalClaimedAmount += rewardInfo.totalRewards;
          positionsToUpdate.push({
            docId: docSnap.id,
            newTotalClaimed: (data.totalClaimed || 0) + rewardInfo.totalRewards,
            newLastClaimedAt: currentTime,
          });
        }
      }
    }

    for (const update of positionsToUpdate) {
      await addDoc(collection(db, "staking_positions"), {
        ...positionsSnap.docs.find((d) => d.id === update.docId)?.data(),
        lastClaimedAt: Timestamp.fromMillis(update.newLastClaimedAt * 1000),
        totalClaimed: update.newTotalClaimed,
        status: "active",
      });
    }

    await addDoc(collection(db, "reward_claims"), {
      address,
      chain: chainKey,
      collection: collectionType,
      tokenIds: tokenIds.map(String),
      claimedAmount: totalClaimedAmount,
      claimedAt: Timestamp.fromMillis(currentTime * 1000),
      transactionHash: null,
    });

    return totalClaimedAmount;
  } catch (error) {
    console.error("Error claiming rewards:", error);
    throw error;
  }
}

async function logWithdraw(
  address: string,
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute",
  tokenIds: bigint[]
) {
  try {
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

    const q2 = query(
      collection(db, "stakes_v1"),
      where("address", "==", address),
      where("chain", "==", chainKey),
      where("collection", "==", collectionType)
    );
    const snap = await getDocs(q2);
    const toRemove: string[] = [];
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

/* ─────────────────────────── Page ─────────────────────────── */
export default function StakingPage() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const [chainKey, setChainKey] = useState<ChainKey>("56");
  const [selectedCollection, setSelectedCollection] =
    useState<"seed" | "tree" | "solar" | "compute">("seed");
  const { nft, stake } = useContracts(chainKey, selectedCollection);

  const [manualTokenId, setManualTokenId] = useState("");
  const [staking, setStaking] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Staking duration + local lock knowledge
  const [stakingDuration, setStakingDuration] = useState<number>(7);
  const [stakedTokensInfo, setStakedTokensInfo] = useState<
    Record<string, { stakedAt: number; duration: number; lastClaimedAt?: number; totalClaimed?: number }>
  >({});

  // Off-chain rewards widget (if you use it)
  const { data: rewardsData } = useOffChainRewards();

  // Moralis hook → directly scoped to current chain + collection
  const chainId = CHAIN_CONFIG[chainKey].id;
  const { loading: nftLoading, error: nftError, ownedUnstaked, ownedStaked } = useStakingView({
    chainId,
    collection: selectedCollection,
  });

  // Chain mismatch hint
  useEffect(() => {
    if (!activeChain?.id) return;
    if (activeChain.id !== chainId) {
      // optionally show a banner; we switch when user acts
    }
  }, [activeChain, chainId]);

  async function ensureChain() {
    if (activeChain?.id !== chainId) {
      try {
        await switchChain(CHAIN_CONFIG[chainKey].chain);
        toast.success(`Switched to ${CHAIN_CONFIG[chainKey].label}`);
      } catch {
        toast.error(`Please switch to ${CHAIN_CONFIG[chainKey].label} to continue`);
        throw new Error("wrong chain");
      }
    }
  }

  const [stakedCount, setStakedCount] = useState<bigint>(0n);
  async function refreshStats() {
    if (!account?.address) return;
    try {
      const info = (await readContract({
        contract: stake,
        method: "getStakeInfo",
        params: [account.address],
      })) as [bigint, bigint];
      setStakedCount(info[0]);
      await refreshStakedTokensInfo();
    } catch {
      // ignore if contract not initialized yet
    }
  }

  async function refreshStakedTokensInfo() {
    if (!account?.address) return;
    try {
      const positionsQuery = query(
        collection(db, "staking_positions"),
        where("address", "==", account.address),
        where("chain", "==", chainKey),
        where("collection", "==", selectedCollection),
        where("status", "==", "active")
      );

      const positionsSnap = await getDocs(positionsQuery);
      const stakingInfo: Record<
        string,
        { stakedAt: number; duration: number; lastClaimedAt?: number; totalClaimed?: number }
      > = {};

      positionsSnap.forEach((doc) => {
        const data = doc.data();
        const tokenId = data.tokenId;
        const stakedAt = data.stakedAt.toMillis() / 1000;
        const duration = data.duration;
        const lastClaimedAt = data.lastClaimedAt ? data.lastClaimedAt.toMillis() / 1000 : undefined;
        const totalClaimed = data.totalClaimed || 0;
        stakingInfo[tokenId] = { stakedAt, duration, lastClaimedAt, totalClaimed };
      });

      setStakedTokensInfo(stakingInfo);
    } catch (err) {
      console.error("Error fetching staked tokens info:", err);
    }
  }

  useEffect(() => {
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
      toast.success(`Staked for ${stakingDuration} day${stakingDuration > 1 ? "s" : ""}!`);

      await logStake(account.address, chainKey, selectedCollection, tokenIds, stakingDuration);

      // (Optional) mirror to your own API for off-chain rewards
      try {
        await fetch("/api/stakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: account.address,
            chainId: chainKey,
            nftType: selectedCollection,
            amount: tokenIds.length,
            tokenIds: tokenIds.map((id) => id.toString()),
            lockDays: stakingDuration,
            stakedAt: new Date().toISOString(),
          }),
        });
      } catch (apiError) {
        console.error("Failed to record stake in API:", apiError);
      }

      setManualTokenId("");
      refreshStats();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || "Stake failed");
    } finally {
      setStaking(false);
    }
  }

  async function handleClaimRewards(tokenIds: bigint[]) {
    if (!account?.address) return toast.error("Connect wallet first");
    if (tokenIds.length === 0) return toast.error("Select tokens to claim rewards from");

    try {
      setClaiming(true);
      toast.loading("Claiming rewards...");
      const claimedAmount = await claimRewards(
        account.address,
        chainKey,
        selectedCollection,
        tokenIds
      );
      toast.dismiss();
      toast.success(`Successfully claimed ${claimedAmount.toFixed(2)} AGV rewards!`);
      await refreshStakedTokensInfo();
      await loadRewardHistory();
      refreshStats();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.message || "Failed to claim rewards");
    } finally {
      setClaiming(false);
    }
  }

  async function handleWithdraw(tokenIds: bigint[]) {
    if (!account?.address) return toast.error("Connect wallet first");
    if (tokenIds.length === 0) return toast.error("Provide tokenId(s) to withdraw");

    // Local lock check via Firebase info
    const currentTime = Math.floor(Date.now() / 1000);
    const lockedTokens: string[] = [];
    for (const tokenId of tokenIds) {
      const tokenInfo = stakedTokensInfo[tokenId.toString()];
      if (tokenInfo) {
        const elapsedTime = currentTime - tokenInfo.stakedAt;
        const requiredTime = tokenInfo.duration * 24 * 60 * 60;
        if (elapsedTime < requiredTime) {
          const remainingDays = Math.ceil((requiredTime - elapsedTime) / (24 * 60 * 60));
          lockedTokens.push(`${tokenId.toString()} (${remainingDays}d remaining)`);
        }
      }
    }
    if (lockedTokens.length > 0) {
      toast.error(`Locked: ${lockedTokens.join(", ")}`);
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
      await logWithdraw(account.address, chainKey, selectedCollection, tokenIds);
      refreshStats();
      setManualTokenId("");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || "Withdraw failed");
    } finally {
      setWithdrawing(false);
    }
  }

  // Reward UI helper
  const dailyRewardHint = useMemo(() => {
    const baseRate = BASE_DAILY_RRGP[selectedCollection];
    const bonus = bonusFor(stakingDuration);
    const totalRate = baseRate * bonus;
    return `${totalRate.toFixed(1)} rGGP / day (${baseRate} × ${bonus}x bonus)`;
  }, [selectedCollection, stakingDuration]);

  const presetDurations = [7, 14, 30, 90, 180, 365, 730];
  const handlePresetClick = (days: number) => setStakingDuration(days);

  // Stakes table + claims history from Firestore
  const [stakes, setStakes] = useState<
    {
      tokenId: string;
      stakedAt: number;
      duration: number;
      reward: string;
      totalClaimed: number;
      availableRewards: number;
    }[]
  >([]);
  const [rewardHistory, setRewardHistory] = useState<
    Array<{ claimedAt: number; amount: number; tokenIds: string[] }>
  >([]);

  async function loadStakes() {
    if (!account?.address) return;
    const q = query(
      collection(db, "staking_positions"),
      where("address", "==", account.address),
      where("chain", "==", chainKey),
      where("collection", "==", selectedCollection),
      where("status", "==", "active")
    );
    const snap = await getDocs(q);
    const list: {
      tokenId: string;
      stakedAt: number;
      duration: number;
      reward: string;
      totalClaimed: number;
      availableRewards: number;
    }[] = [];

    snap.forEach((doc) => {
      const data = doc.data();
      const stakedAtSec = data.stakedAt.toMillis() / 1000;
      const lastClaimedAt = data.lastClaimedAt ? data.lastClaimedAt.toMillis() / 1000 : undefined;
      const totalClaimed = data.totalClaimed || 0;
      const rewardInfo = calculateRewards(
        stakedAtSec,
        data.duration,
        selectedCollection,
        lastClaimedAt
      );

      list.push({
        tokenId: data.tokenId,
        stakedAt: data.stakedAt.toMillis(),
        duration: data.duration,
        reward: `${REWARD_RATES[selectedCollection]} AGV/day`,
        totalClaimed,
        availableRewards: rewardInfo.totalRewards,
      });
    });

    setStakes(list);
  }

  async function loadRewardHistory() {
    if (!account?.address) return;
    try {
      const historyQuery = query(
        collection(db, "reward_claims"),
        where("address", "==", account.address),
        where("chain", "==", chainKey),
        where("collection", "==", selectedCollection)
      );
      const historySnap = await getDocs(historyQuery);
      const history: Array<{ claimedAt: number; amount: number; tokenIds: string[] }> = [];
      historySnap.forEach((doc) => {
        const data = doc.data();
        history.push({
          claimedAt: data.claimedAt.toMillis(),
          amount: data.claimedAmount,
          tokenIds: data.tokenIds,
        });
      });
      history.sort((a, b) => b.claimedAt - a.claimedAt);
      setRewardHistory(history);
    } catch (error) {
      console.error("Error loading reward history:", error);
    }
  }

  useEffect(() => {
    loadStakes();
    loadRewardHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address, chainKey, selectedCollection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-blue-500/10">
          <div className="relative z-10">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  AGV Protocol Staking
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl">
                  Stake your{" "}
                  <span className="font-semibold text-cyan-300">
                    {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)}
                  </span>{" "}
                  NFTs on{" "}
                  <span className="font-semibold text-blue-300">
                    {CHAIN_CONFIG[chainKey].label}
                  </span>{" "}
                  to earn rewards. Set a lock period (min 1 day).
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

        {/* Network & Collection */}
        <div className="space-y-6">
          <SelectorPanel
            chainKey={chainKey}
            setChainKey={setChainKey}
            activeChainName={activeChain?.name}
            selectedCollection={selectedCollection}
            setSelectedCollection={setSelectedCollection}
          />
        </div>

        {/* Staking Duration */}
        <DurationPanel
          stakingDuration={stakingDuration}
          setStakingDuration={setStakingDuration}
          presetDurations={presetDurations}
          handlePresetClick={handlePresetClick}
        />

        {/* Stats */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Staking Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Staked NFTs"
              value={stakedCount.toString()}
              subtitle="Currently staked"
              icon={<Lock className="w-6 h-6 text-white" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Available Rewards"
              value={rewardsData?.totals?.accrued?.toFixed(2) || "0.00"}
              subtitle="rGGP ready to claim"
              icon={<Coins className="w-6 h-6 text-white" />}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              title="Daily Rewards"
              value={dailyRewardHint}
              subtitle="Per NFT staked"
              icon={<ArrowRightLeft className="w-6 h-6 text-white" />}
              gradient="from-blue-500 to-cyan-500"
            />
          </div>
        </div>

        {/* Rewards Dashboard */}
        {account?.address && rewardsData && (
          <RewardsPanel
            rewardsData={rewardsData}
            selectedCollection={selectedCollection}
            stakingDuration={stakingDuration}
            claiming={claiming}
          />
        )}

        {/* NFTs */}
        {account?.address && (
          <NftPanel
            nftLoading={nftLoading}
            nftError={nftError}
            ownedUnstaked={ownedUnstaked}
            ownedStaked={ownedStaked}
            selectedCollection={selectedCollection}
            chainKey={chainKey}
          />
        )}

        {/* Legacy Stake Flow (select token IDs) */}
        <LegacyStakeSection
          account={account}
          chainKey={chainKey}
          selectedCollection={selectedCollection}
          nftLoading={nftLoading}
          nftError={nftError}
          ownedUnstaked={ownedUnstaked}
          staking={staking}
          handleStake={handleStake}
          manualTokenId={manualTokenId}
          setManualTokenId={setManualTokenId}
        />

        {/* Stakes Table */}
        {account?.address ? (
          <StakesTable
            stakes={stakes}
            claiming={claiming}
            handleClaimRewards={handleClaimRewards}
          />
        ) : null}

        {/* Reward History */}
        {account?.address && rewardHistory.length > 0 && (
          <RewardHistory history={rewardHistory} selectedCollection={selectedCollection} />
        )}

        {/* Withdraw */}
        <WithdrawSection
          withdrawing={withdrawing}
          onWithdraw={handleWithdraw}
          stakedTokensInfo={stakedTokensInfo}
        />
      </div>
      
      {/* Footer */}
      <Footer backgroundClass="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" textColorClass="text-white" />
    </div>
  );
}

/* ───────────────────────── Subcomponents ───────────────────────── */

function SelectorPanel({
  chainKey,
  setChainKey,
  activeChainName,
  selectedCollection,
  setSelectedCollection,
}: {
  chainKey: ChainKey;
  setChainKey: (k: ChainKey) => void;
  activeChainName?: string;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  setSelectedCollection: (v: "seed" | "tree" | "solar" | "compute") => void;
}) {
  return (
    <>
      {/* Chain */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
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
              <div className="flex items-center justify-between text-white">
                <div className="text-left">
                  <div className="font-semibold">{CHAIN_CONFIG[k].label}</div>
                  <div className="text-xs opacity-70">Chain ID: {k}</div>
                </div>
                {chainKey === k && <CheckCircle className="w-5 h-5 text-white" />}
              </div>
              {chainKey === k && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 text-sm tracking-wide text-white/70">
          Current wallet chain:{" "}
          <span className="text-blue-300">{activeChainName ?? "Not connected"}</span>
        </div>
      </div>

      {/* Collection */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
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
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
              }`}
            >
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg overflow-hidden bg-white/10">
                  <img
                    src={`/${collection}pass.jpg`}
                    alt={`${collection}Pass NFT`}
                    className="w-full h-full object-cover"
                    loading="lazy"
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
    </>
  );
}

function DurationPanel({
  stakingDuration,
  setStakingDuration,
  presetDurations,
  handlePresetClick,
}: {
  stakingDuration: number;
  setStakingDuration: (n: number) => void;
  presetDurations: number[];
  handlePresetClick: (n: number) => void;
}) {
  return (
    <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        Select Staking Duration
      </h3>
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="text-white/80 text-sm font-medium block">Quick Select:</label>
          <div className="flex flex-wrap gap-2">
            {presetDurations.map((days) => (
              <button
                key={days}
                onClick={() => handlePresetClick(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  stakingDuration === days
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                    : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20"
                }`}
              >
                {days} day{days > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="duration" className="text-white/80 text-sm font-medium">
            Duration (days):
          </label>
          <input
            id="duration"
            type="number"
            min="1"
            max="730"
            value={stakingDuration}
            onChange={(e) =>
              setStakingDuration(Math.max(1, Number.parseInt(e.target.value) || 1))
            }
            className="w-20 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-center"
          />
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-purple-300" />
            <span className="text-purple-300 text-sm font-medium">Lock Period</span>
          </div>
          <p className="text-white/70 text-xs">
            Your NFTs will be locked for{" "}
            <span className="font-semibold text-purple-300">
              {stakingDuration} day{stakingDuration > 1 ? "s" : ""}
            </span>
            . You cannot withdraw until this period ends.
          </p>
        </div>
      </div>
    </div>
  );
}

function RewardsPanel({
  rewardsData,
  selectedCollection,
  stakingDuration,
  claiming,
}: {
  rewardsData: any;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  stakingDuration: number;
  claiming: boolean;
}) {
  return (
    <div className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-400" />
            rGGP Rewards Dashboard
          </h3>
          <p className="text-green-300/80 text-sm mt-1">
            Earn rGGP credits 1:1 to GGP at token launch
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">
            {rewardsData.totals.accrued.toFixed(2)}
          </div>
          <div className="text-sm text-green-300/80">rGGP Available</div>
          <div className="text-xs text-green-300/60 mt-1">
            {rewardsData.totals.remaining.toFixed(2)} remaining
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Collection</span>
              <span className="text-white font-medium capitalize">{selectedCollection}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Base Rate</span>
              <span className="text-green-400 font-medium">
                {BASE_DAILY_RRGP[selectedCollection]} rGGP/day
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Bonus Multiplier</span>
              <span className="text-yellow-400 font-medium">{bonusFor(stakingDuration)}x</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Active Stakes</span>
              <span className="text-white font-medium">{rewardsData.stakes.length}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {rewardsData.totals.accrued.toFixed(2)} rGGP
              </div>
              <div className="text-sm text-white/60 mb-4">Ready to Claim</div>
              <button
                onClick={() =>
                  toast.info("rGGP rewards will be claimable when GGP token launches!")
                }
                className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={rewardsData.totals.accrued <= 0}
              >
                {claiming ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4" />
                    Claim All Rewards
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {rewardsData.stakes.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3">Active Stakes & Rewards</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rewardsData.stakes.map((stake: any) => (
                <div
                  key={stake.id}
                  className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                      {stake.amount}x
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {stake.nftType.toUpperCase()} • {stake.lockDays} days
                      </div>
                      <div className="text-white/60 text-xs">
                        {stake.baseDaily} rGGP/day × {stake.bonusMultiplier}x • {stake.daysCounted} days
                        elapsed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium">
                      {stake.accrued.toFixed(2)} rGGP
                    </div>
                    <div className="text-xs text-white/60">
                      {stake.accrued.toFixed(2)}/{stake.scheduledTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NftPanel({
  nftLoading,
  nftError,
  ownedUnstaked,
  ownedStaked,
  selectedCollection,
  chainKey,
}: {
  nftLoading: boolean;
  nftError: string | null;
  ownedUnstaked: any[];
  ownedStaked: any[];
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  chainKey: ChainKey;
}) {
  const noneFound = !nftLoading && !nftError && ownedUnstaked.length === 0 && ownedStaked.length === 0;
  const fallback = `/${selectedCollection}pass.jpg`;

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Your {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs
          </h3>
          <p className="text-white/60 text-sm mt-1">Wallet (unstaked) • Firestore (staked)</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30">
            <span className="text-green-300 text-sm font-medium">
              {ownedUnstaked.length} Available
            </span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <span className="text-blue-300 text-sm font-medium">{ownedStaked.length} Staked</span>
          </div>
        </div>
      </div>

      {nftLoading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/60" />
          <p className="text-white/60 mt-2">Loading NFTs...</p>
        </div>
      )}

      {nftError && (
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 mx-auto text-yellow-400" />
          <p className="text-yellow-300 mt-2">Error loading NFTs: {nftError}</p>
        </div>
      )}

      {/* Mint CTA when none */}
      {noneFound && (
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white/60" />
          </div>
          <h4 className="text-white font-medium mb-2">No AGV NFTs Found</h4>
          <p className="text-white/60 text-sm mb-4">
            You don’t have any {selectedCollection} NFTs in your connected wallet on{" "}
            {CHAIN_CONFIG[chainKey].label}.
          </p>
          <Link
            href="/mint"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium transition-all"
          >
            Mint your first NFT
          </Link>
        </div>
      )}

      {!nftLoading && !nftError && !noneFound && (
        <div className="space-y-6">
          {/* Unstaked */}
          {ownedUnstaked.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-green-400" />
                Available to Stake ({ownedUnstaked.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ownedUnstaked.map((nft) => {
                  const img = getImageSrc(nft, fallback);
                  return (
                    <div
                      key={`${nft.collection.address}-${nft.tokenId.toString()}`}
                      className="rounded-xl p-4 bg-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300"
                    >
                      <div className="text-xs opacity-60 mb-2">
                        {nft.standard} • Chain {nft.chainId}
                      </div>
                      {img ? (
                        <img
                          className="rounded-lg mb-2 w-full aspect-square object-cover"
                          src={img}
                          alt={nft?.name ?? ""}
                          loading="lazy"
                        />
                      ) : (
                        <div className="rounded-lg mb-2 w-full aspect-square bg-white/10" />
                      )}
                      <div className="text-sm font-medium text-white">
                        Token #{nft.tokenId.toString()}
                        {"amount" in nft && nft.amount ? ` · x${nft.amount.toString()}` : ""}
                      </div>
                      <div className="text-xs text-white/60 mt-1">{nft.name ?? "AGV NFT"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Staked */}
          {ownedStaked.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                Currently Staked ({ownedStaked.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ownedStaked.map((nft) => {
                  const img = getImageSrc(nft, fallback);
                  return (
                    <div
                      key={`${nft.collection.address}-${nft.tokenId.toString()}`}
                      className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/30"
                    >
                      <div className="text-xs opacity-60 mb-2">
                        {nft.standard} • Chain {nft.chainId}
                      </div>
                      {img ? (
                        <img
                          className="rounded-lg mb-2 w-full aspect-square object-cover"
                          src={img}
                          alt={nft?.name ?? ""}
                          loading="lazy"
                        />
                      ) : (
                        <div className="rounded-lg mb-2 w-full aspect-square bg-white/10" />
                      )}
                      <div className="text-sm font-medium text-white">
                        Token #{nft.tokenId.toString()}
                        {"amount" in nft && nft.amount ? ` · x${nft.amount.toString()}` : ""}
                      </div>
                      <div className="text-xs text-white/60 mt-1">{nft.name ?? "AGV NFT"}</div>
                      <div className="mt-2 px-2 py-1 rounded-lg bg-blue-500/20 text-xs text-blue-300">
                        Staked
                      </div>
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

function LegacyStakeSection({
  account,
  chainKey,
  selectedCollection,
  nftLoading,
  nftError,
  ownedUnstaked,
  staking,
  handleStake,
  manualTokenId,
  setManualTokenId,
}: {
  account: any;
  chainKey: ChainKey;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  nftLoading: boolean;
  nftError: string | null;
  ownedUnstaked: any[];
  staking: boolean;
  handleStake: (ids: bigint[]) => Promise<void>;
  manualTokenId: string;
  setManualTokenId: (s: string) => void;
}) {
  const showMintCta = !nftLoading && !nftError && ownedUnstaked.length === 0;

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Your {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Available for staking on {CHAIN_CONFIG[chainKey].label}
          </p>
        </div>
        <div className="text-sm text-white/60">Detected via indexer</div>
      </div>

      {account?.address ? (
        <>
          {nftLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/60" />
              <p className="text-white/60 mt-2">Loading NFTs...</p>
            </div>
          ) : nftError ? (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-1">Error loading NFTs</h4>
                <p className="text-yellow-400 text-sm">
                  {nftError}. You can still enter a token ID manually below.
                </p>
              </div>
            </div>
          ) : ownedUnstaked.length > 0 ? (
            <OwnedTokensList
              ids={ownedUnstaked.map((nft) => nft.tokenId)}
              onStake={async (ids) => {
                await handleStake(ids);
              }}
              staking={staking}
            />
          ) : (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-yellow-300 font-medium mb-1">No NFTs found</h4>
                <p className="text-yellow-400 text-sm">
                  No{" "}
                  {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs
                  detected in your wallet on {CHAIN_CONFIG[chainKey].label}. You can still enter a
                  token ID manually, or mint one first:
                </p>
                {showMintCta && (
                  <div className="mt-3">
                    <Link
                      href="/mint"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium transition-all"
                    >
                      Mint an NFT
                    </Link>
                  </div>
                )}
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
  );
}

function StakesTable({
  stakes,
  claiming,
  handleClaimRewards,
}: {
  stakes: {
    tokenId: string;
    stakedAt: number;
    duration: number;
    reward: string;
    totalClaimed: number;
    availableRewards: number;
  }[];
  claiming: boolean;
  handleClaimRewards: (ids: bigint[]) => Promise<void>;
}) {
  return (
    <div className="mt-8 bg-white/5 rounded-xl border border-white/10 p-6">
      <h2 className="text-xl text-white font-semibold mb-4">Your Stakes</h2>
      {stakes.length > 0 ? (
        <table className="w-full text-sm text-left text-white/80">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2">Token ID</th>
              <th className="py-2">Date Staked</th>
              <th className="py-2">Duration (days)</th>
              <th className="py-2">Daily Rate</th>
              <th className="py-2">Available</th>
              <th className="py-2">Claimed</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {stakes.map((s, i) => (
              <tr key={i} className="border-b border-white/10">
                <td className="py-2 font-medium">#{s.tokenId}</td>
                <td className="py-2 text-white/80">{new Date(s.stakedAt).toLocaleDateString()}</td>
                <td className="py-2 text-white/80">{s.duration}</td>
                <td className="py-2 text-green-400 font-medium">{s.reward}</td>
                <td className="py-2 text-green-300 font-medium">
                  {s.availableRewards.toFixed(2)} AGV
                </td>
                <td className="py-2 text-white/60">{s.totalClaimed.toFixed(2)} AGV</td>
                <td className="py-2">
                  <button
                    onClick={() => handleClaimRewards([BigInt(s.tokenId)])}
                    className="px-3 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={claiming || s.availableRewards <= 0}
                  >
                    {s.availableRewards > 0 ? "Claim" : "None"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-white/60">No active stakes found.</p>
      )}
    </div>
  );
}

function RewardHistory({
  history,
  selectedCollection,
}: {
  history: Array<{ claimedAt: number; amount: number; tokenIds: string[] }>;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
}) {
  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" />
          Reward Claim History
        </h3>
        <p className="text-white/60 text-sm mt-1">
          Your recent reward claims for {selectedCollection} NFTs
        </p>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {history.slice(0, 10).map((claim, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-white font-medium">Claimed {claim.amount.toFixed(2)} AGV</div>
                <div className="text-white/60 text-sm">
                  Tokens: {claim.tokenIds.join(", ")} • {new Date(claim.claimedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-green-400 font-bold text-lg">+{claim.amount.toFixed(2)}</div>
              <div className="text-white/60 text-xs">AGV</div>
            </div>
          </div>
        ))}
      </div>

      {history.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            Showing 10 most recent claims. Total: {history.length} claims
          </p>
        </div>
      )}
    </div>
  );
}

function WithdrawSection({
  withdrawing,
  onWithdraw,
  stakedTokensInfo,
}: {
  withdrawing: boolean;
  onWithdraw: (ids: bigint[]) => Promise<void>;
  stakedTokensInfo: Record<string, { stakedAt: number; duration: number }>;
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

  const lockedTokens = ids.filter((id) => getTokenStatus(id)?.locked);
  const availableTokens = ids.filter((id) => !getTokenStatus(id)?.locked);

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Withdraw Staked NFTs
        </h3>
        <p className="text-white/60 text-sm mt-1">
          Enter token IDs you previously staked to withdraw them back to your wallet
        </p>
      </div>

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
            className="px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                    {availableTokens.length} token{availableTokens.length > 1 ? "s" : ""} ready to
                    withdraw: {availableTokens.map((id) => id.toString()).join(", ")}
                  </span>
                </div>
              </div>
            )}

            {lockedTokens.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">
                    {lockedTokens.length} token{lockedTokens.length > 1 ? "s" : ""} still locked
                  </span>
                </div>
                <div className="space-y-1">
                  {lockedTokens.map((tokenId) => {
                    const status = getTokenStatus(tokenId);
                    return (
                      <div key={tokenId.toString()} className="text-yellow-200 text-xs">
                        Token {tokenId.toString()}: {status?.remainingDays} day
                        {status?.remainingDays && status.remainingDays > 1 ? "s" : ""} remaining
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
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
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${
              gradient || "from-gray-500 to-gray-600"
            } shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300`}
          >
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
              {value}
            </div>
            {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
          </div>
        </div>
        <div className="text-white/80 font-medium group-hover:text-white transition-colors duration-300">
          {title}
        </div>
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
              onClick={() => setSelected((prev) => ({ ...prev, [key]: !prev[key] }))}
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
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </>
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
              <p className="text-white/60 text-sm">
                {picked.length} NFT{picked.length > 1 ? "s" : ""} selected
              </p>
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
                `Stake ${picked.length} NFT${picked.length > 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
