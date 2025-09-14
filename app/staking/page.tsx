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
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  setDoc,
  addDoc,
  updateDoc,
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

/** Countdown utils (used in Your Stakes section) */
function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
function Countdown({ unlockAtISO }: { unlockAtISO: string }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [unlockAtISO]);

  const unlock = new Date(unlockAtISO).getTime();
  const remaining = unlock - now;
  const unlocked = remaining <= 0;

  return (
    <div
      className={`mt-1 text-xs ${unlocked ? "text-green-300" : "text-yellow-300"}`}
      suppressHydrationWarning
      title={unlocked ? "Stake is unlocked" : "Time left until withdrawal"}
    >
      {unlocked ? "Unlocked" : `${formatRemaining(remaining)} left`}
    </div>
  );
}

/* ─────────────────────────── Config ─────────────────────────── */
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

type ChainKey = "56" | "42161" | "137";
const CHAIN_CONFIG: Record<
  ChainKey,
  { id: number; label: string; chain: any; fallbackImg: string }
> = {
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

/* ───────────── Reward calc (legacy rates for UI hints) ───────────── */
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

/* ───────────── Wallet-scoped Firestore helpers ───────────── */
const DAY_MS = 24 * 60 * 60 * 1000;

async function ensureStakeWalletDoc(wallet: string) {
  const id = wallet.toLowerCase();
  await setDoc(
    doc(db, "stakes", id),
    { wallet: id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
    { merge: true }
  );
}

/** Write one item per NFT into /stakes/{wallet}/items */
async function addWalletStakeItems(
  wallet: string,
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute",
  tokenIds: bigint[],
  lockDays: number
) {
  const walletId = wallet.toLowerCase();
  await ensureStakeWalletDoc(walletId);

  const chainId = CHAIN_CONFIG[chainKey].id;
  const itemsCol = collection(db, "stakes", walletId, "items");

  const stakedAt = new Date();
  const unlockAt = new Date(stakedAt.getTime() + lockDays * DAY_MS);

  const baseDaily = BASE_DAILY_RRGP[collectionType];
  const bonus = bonusFor(lockDays);
  const scheduledTotal = baseDaily * bonus * lockDays;

  for (const tokenId of tokenIds) {
    await addDoc(itemsCol, {
      chainId,
      nftType: collectionType,
      tokenId: tokenId.toString(),
      amount: 1,

      stakedAt: Timestamp.fromDate(stakedAt),
      unlockAt: Timestamp.fromDate(unlockAt),
      lockDays,

      baseDaily,
      bonusMultiplier: bonus,
      scheduledTotal,

      status: "active",
      accruedSoFar: 0,
      lastAccruedAt: Timestamp.fromDate(stakedAt),
      txHash: null,
      kolId: null,

      updatedAt: Timestamp.now(),
    });
  }

  await updateDoc(doc(db, "stakes", walletId), { updatedAt: Timestamp.now() });
}

/** Flip matching items to withdrawn */
async function markWalletStakesWithdrawn(
  wallet: string,
  chainKey: ChainKey,
  collectionType: "seed" | "tree" | "solar" | "compute",
  tokenIds: bigint[]
) {
  const walletId = wallet.toLowerCase();
  const chainId = CHAIN_CONFIG[chainKey].id;
  const ids = tokenIds.map(String);

  // Firestore 'in' is max 10 — chunk if needed
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  for (const batchIds of chunks) {
    const qSnap = await getDocs(
      query(
        collection(db, "stakes", walletId, "items"),
        where("chainId", "==", chainId),
        where("nftType", "==", collectionType),
        where("status", "==", "active"),
        where("tokenId", "in", batchIds)
      )
    );

    await Promise.all(
      qSnap.docs.map((d) =>
        updateDoc(d.ref, {
          status: "withdrawn",
          withdrawnAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      )
    );
  }

  await updateDoc(doc(db, "stakes", walletId), { updatedAt: Timestamp.now() });
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

  // Staking duration + local lock knowledge
  const [stakingDuration, setStakingDuration] = useState<number>(7);
  const [stakedTokensInfo, setStakedTokensInfo] = useState<
    Record<string, { stakedAt: number; duration: number }>
  >({});

  // Off-chain rewards summary
  const { data: rewardsData } = useOffChainRewards();

  // Moralis hook → current chain + collection
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

  // Local lock knowledge (used as a final guard before withdraw)
  async function refreshStakedTokensInfo() {
    if (!account?.address) return;
    try {
      const qSnap = await getDocs(
        query(
          collection(db, "stakes", account.address.toLowerCase(), "items"),
          where("chainId", "==", chainId),
          where("nftType", "==", selectedCollection),
          where("status", "==", "active")
        )
      );

      const info: Record<string, { stakedAt: number; duration: number }> = {};
      qSnap.forEach((d) => {
        const data = d.data() as any;
        const tokenId = String(data.tokenId);
        const stakedAt = data.stakedAt.toMillis() / 1000;
        const duration = Number(data.lockDays || 0);
        info[tokenId] = { stakedAt, duration };
      });

      setStakedTokensInfo(info);
    } catch (err) {
      console.error("Error fetching wallet-scoped staked info:", err);
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
      toast.loading("Approving (if needed)…");
      await ensureApproval();

      toast.dismiss();
      toast.loading("Staking on-chain…");
      const tx = await prepareContractCall({
        contract: stake,
        method: "stake",
        params: [tokenIds],
      });
      await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();

      // Wallet-scoped Firestore write
      toast.loading("Recording stake…");
      await addWalletStakeItems(
        account.address,
        chainKey,
        selectedCollection,
        tokenIds,
        stakingDuration
      );
      toast.dismiss();
      toast.success(`Staked for ${stakingDuration} day${stakingDuration > 1 ? "s" : ""}!`);

      setManualTokenId("");
      await refreshStats();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || "Stake failed");
    } finally {
      setStaking(false);
    }
  }

  async function handleWithdraw(tokenIds: bigint[]) {
    if (!account?.address) return toast.error("Connect wallet first");
    if (tokenIds.length === 0) return toast.error("Select at least one NFT to withdraw");

    // Final local guard using wallet-scoped items
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
      toast.loading("Withdrawing on-chain…");
      const tx = await prepareContractCall({
        contract: stake,
        method: "withdraw",
        params: [tokenIds],
      });
      await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();

      toast.loading("Updating records…");
      await markWalletStakesWithdrawn(
        account.address,
        chainKey,
        selectedCollection,
        tokenIds
      );
      toast.dismiss();
      toast.success("Withdrawn!");

      await refreshStats();
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

  // (Optional) Reward history placeholder (remove if unused)
  const [rewardHistory, setRewardHistory] = useState<
    Array<{ claimedAt: number; amount: number; tokenIds: string[] }>
  >([]);
  async function loadRewardHistory() {
    setRewardHistory([]);
  }
  useEffect(() => {
    loadRewardHistory();
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

        {/* Rewards Dashboard (summary) */}
        {account?.address && rewardsData && (
          <RewardsPanel
            rewardsData={rewardsData}
            selectedCollection={selectedCollection}
            stakingDuration={stakingDuration}
            claiming={false}
          />
        )}

        {/* NFTs (wallet + staked view) */}
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

        {/* Stake Flow (select token IDs) */}
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

        {/* Your Stakes (from /api/rewards) with live countdown */}
        {account?.address ? (
          <StakesFromRewards
            wallet={account.address}
            filterChainId={CHAIN_CONFIG[chainKey].id}
            filterCollection={selectedCollection}
          />
        ) : null}

        {/* Reward History (optional) */}
        {account?.address && rewardHistory.length > 0 && (
          <RewardHistory history={rewardHistory} selectedCollection={selectedCollection} />
        )}

        {/* Withdraw (wallet-scoped items) */}
        <WithdrawSection
          accountAddress={account?.address}
          chainKey={chainKey}
          selectedCollection={selectedCollection}
          withdrawing={withdrawing}
          onWithdraw={handleWithdraw}
        />
      </div>

      {/* Footer */}
      <Footer
        backgroundClass="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
        textColorClass="text-white"
      />
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
          Current wallet chain: <span className="text-blue-300">{activeChainName ?? "Not connected"}</span>
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
            onChange={(e) => setStakingDuration(Math.max(1, Number.parseInt(e.target.value) || 1))}
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
          <p className="text-green-300/80 text-sm mt-1">Earn rGGP credits 1:1 to GGP at token launch</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">{rewardsData.totals.accrued.toFixed(2)}</div>
          <div className="text-sm text-green-300/80">rGGP Available</div>
          <div className="text-xs text-green-300/60 mt-1">{rewardsData.totals.remaining.toFixed(2)} remaining</div>
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
              <span className="text-green-400 font-medium">{BASE_DAILY_RRGP[selectedCollection]} rGGP/day</span>
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
                onClick={() => toast.info("rGGP rewards will be claimable when GGP token launches!")}
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
                <div key={stake.id} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                      {stake.amount}x
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{stake.nftType.toUpperCase()} • {stake.lockDays} days</div>
                      <div className="text-white/60 text-xs">
                        {stake.baseDaily} rGGP/day × {stake.bonusMultiplier}x • {stake.daysCounted} days elapsed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium">{stake.accrued.toFixed(2)} rGGP</div>
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
            <span className="text-green-300 text-sm font-medium">{ownedUnstaked.length} Available</span>
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
            You don’t have any {selectedCollection} NFTs in your connected wallet on {CHAIN_CONFIG[chainKey].label}.
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
                      <div className="mt-2 px-2 py-1 rounded-lg bg-blue-500/20 text-xs text-blue-300">Staked</div>
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
          <p className="text-white/60 text-sm mt-1">Available for staking on {CHAIN_CONFIG[chainKey].label}</p>
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
                <p className="text-yellow-400 text-sm">{nftError}. You can still enter a token ID manually below.</p>
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
                  No {selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} NFTs detected in your wallet on{" "}
                  {CHAIN_CONFIG[chainKey].label}. You can still enter a token ID manually, or mint one first:
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

/* ───────────── Your Stakes section (from /api/rewards) ───────────── */

function StakesFromRewards({
  wallet,
  filterChainId,
  filterCollection,
}: {
  wallet: string;
  filterChainId: number;
  filterCollection: "seed" | "tree" | "solar" | "compute";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakes, setStakes] = useState<any[]>([]);

  useEffect(() => {
    if (!wallet) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/rewards?wallet=${wallet}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();

        const filtered = (json?.stakes || []).filter(
          (s: any) =>
            String(s.nftType) === filterCollection &&
            Number(s.chainId) === filterChainId &&
            (s.status === "active" || s.status === "completed")
        );
        setStakes(filtered);
      } catch (e: any) {
        console.error("StakesFromRewards error", e);
        setError("Failed to load your stakes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [wallet, filterChainId, filterCollection]);

  return (
    <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
      <h2 className="text-xl text-white font-semibold mb-4">Your Stakes</h2>

      {!wallet ? (
        <p className="text-white/60">Connect your wallet to view stakes.</p>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/60" />
          <p className="text-white/60 mt-2">Loading your stakes…</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 mx-auto text-yellow-400" />
          <p className="text-yellow-300 mt-2">{error}</p>
        </div>
      ) : stakes.length === 0 ? (
        <p className="text-white/60">No stakes found for this network and collection.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakes.map((s) => {
            const progress =
              s.scheduledTotal > 0 ? Math.min(100, (s.accrued / s.scheduledTotal) * 100) : 0;

            return (
              <div
                key={s.id}
                className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-medium capitalize">
                    {s.nftType} • {s.lockDays} days
                  </div>
                  <div className="text-xs text-white/60">Token #{s.tokenId ?? "—"}</div>
                </div>

                <div className="text-white/70 text-sm">
                  <div>Staked: {new Date(s.stakedAt).toLocaleDateString()}</div>
                  <div>Unlocks: {new Date(s.unlockAt).toLocaleDateString()}</div>
                  {/* LIVE COUNTDOWN */}
                  <Countdown unlockAtISO={s.unlockAt} />
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>Accrued</span>
                    <span>
                      {s.accrued.toFixed(2)} / {s.scheduledTotal.toFixed(2)} rGGP
                    </span>
                  </div>
                  <div className="h-2 rounded bg-white/10 overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-white/60">
                  Rate: {s.baseDaily} rGGP/day × {s.bonusMultiplier}x • Counted {s.daysCounted} days
                </div>
              </div>
            );
          })}
        </div>
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
        <p className="text-white/60 text-sm mt-1">Your recent reward claims for {selectedCollection} NFTs</p>
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
          <p className="text-white/60 text-sm">Showing 10 most recent claims. Total: {history.length} claims</p>
        </div>
      )}
    </div>
  );
}

/* ───────────── Withdraw Section (wallet-scoped /stakes/{wallet}/items) ───────────── */

function WithdrawSection({
  accountAddress,
  chainKey,
  selectedCollection,
  withdrawing,
  onWithdraw,
}: {
  accountAddress?: string;
  chainKey: ChainKey;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  withdrawing: boolean;
  onWithdraw: (ids: bigint[]) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type StakedCard = {
    tokenId: string;
    stakedAtSec: number;
    unlockAtSec: number;
    remainingDays: number;
    unlocked: boolean;
    imageUrl: string;
  };

  const [items, setItems] = useState<StakedCard[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const FALLBACK: Record<"seed" | "tree" | "solar" | "compute", string> = {
    seed: "/seedpass.jpg",
    tree: "/treepass.jpg",
    solar: "/solarpass.jpg",
    compute: "/computepass.jpg",
  };

  useEffect(() => {
    (async () => {
      setItems([]);
      setError(null);
      setSelected({});
      if (!accountAddress) return;

      setLoading(true);
      try {
        const qSnap = await getDocs(
          query(
            collection(db, "stakes", accountAddress.toLowerCase(), "items"),
            where("chainId", "==", CHAIN_CONFIG[chainKey].id),
            where("nftType", "==", selectedCollection),
            where("status", "==", "active")
          )
        );

        const now = Math.floor(Date.now() / 1000);
        const rows: StakedCard[] = [];

        qSnap.forEach((d) => {
          const data = d.data() as any;
          const stakedAtSec = data.stakedAt.toMillis() / 1000;
          const unlockAtSec = data.unlockAt.toMillis() / 1000;
          const remainingSec = Math.max(0, unlockAtSec - now);
          const remainingDays = remainingSec > 0 ? Math.ceil(remainingSec / (24 * 60 * 60)) : 0;
          const unlocked = remainingSec === 0;

          rows.push({
            tokenId: String(data.tokenId),
            stakedAtSec,
            unlockAtSec,
            remainingDays,
            unlocked,
            imageUrl: FALLBACK[selectedCollection],
          });
        });

        // sort: unlocked first, then by tokenId asc
        rows.sort(
          (a, b) => Number(b.unlocked) - Number(a.unlocked) || Number(a.tokenId) - Number(b.tokenId)
        );

        setItems(rows);
        setSelected(Object.fromEntries(rows.map((r) => [r.tokenId, false])));
      } catch (e) {
        console.error("WithdrawSection load error", e);
        setError("Failed to load staked NFTs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [accountAddress, chainKey, selectedCollection]);

  const unlockedItems = useMemo(() => items.filter((i) => i.unlocked), [items]);
  const lockedItems = useMemo(() => items.filter((i) => !i.unlocked), [items]);
  const pickedUnlocked = useMemo(
    () => unlockedItems.filter((i) => selected[i.tokenId]).map((i) => BigInt(i.tokenId)),
    [unlockedItems, selected]
  );

  const canWithdraw = pickedUnlocked.length > 0 && !withdrawing;

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Withdraw Staked NFTs
        </h3>
        <p className="text-white/60 text-sm mt-1">Select your staked NFTs. Only unlocked NFTs can be withdrawn.</p>
      </div>

      {!accountAddress ? (
        <div className="text-white/60">Connect your wallet to see staked NFTs.</div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/60" />
          <p className="text-white/60 mt-2">Loading staked NFTs…</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 mx-auto text-yellow-400" />
          <p className="text-yellow-300 mt-2">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-white/60">No active stakes found.</div>
      ) : (
        <>
          {/* Unlocked */}
          {unlockedItems.length > 0 && (
            <>
              <h4 className="text-white font-medium mb-3">Available to Withdraw</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                {unlockedItems.map((it) => {
                  const on = !!selected[it.tokenId];
                  return (
                    <button
                      key={it.tokenId}
                      onClick={() => setSelected((s) => ({ ...s, [it.tokenId]: !s[it.tokenId] }))}
                      className={`group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-300 ${
                        on
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white/5 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={it.imageUrl}
                          alt={`Token #${it.tokenId}`}
                          className="w-full aspect-square rounded-lg object-cover"
                          loading="lazy"
                        />
                        {on && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse" />}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-white font-semibold">#{it.tokenId}</div>
                        {on && <CheckCircle className="w-5 h-5 text-white" />}
                      </div>
                      <div className="text-xs text-white/70">Staked {new Date(it.stakedAtSec * 1000).toLocaleDateString()}</div>
                      <div className="text-xs text-green-300 mt-1">Unlocked</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Locked */}
          {lockedItems.length > 0 && (
            <>
              <h4 className="text-white font-medium mb-3">Locked (Not Yet Withdrawable)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {lockedItems.map((it) => (
                  <div
                    key={it.tokenId}
                    className="relative overflow-hidden rounded-xl p-3 text-left bg-white/5 border border-white/10 opacity-60 cursor-not-allowed"
                    title={`${it.remainingDays} day${it.remainingDays > 1 ? "s" : ""} remaining`}
                  >
                    <div className="relative">
                      <img
                        src={it.imageUrl}
                        alt={`Token #${it.tokenId}`}
                        className="w-full aspect-square rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-white font-semibold">#{it.tokenId}</div>
                      <Lock className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div className="text-xs text-white/70">Staked {new Date(it.stakedAtSec * 1000).toLocaleDateString()}</div>
                    <div className="text-xs text-yellow-300 mt-1">
                      {it.remainingDays} day{it.remainingDays > 1 ? "s" : ""} remaining
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action bar */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-white/70 text-sm">
              Selected:{" "}
              <span className="text-white font-medium">
                {pickedUnlocked.length} NFT{pickedUnlocked.length === 1 ? "" : "s"}
              </span>
            </div>
            <button
              onClick={() => onWithdraw(pickedUnlocked)}
              disabled={!canWithdraw}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Withdrawing…
                </span>
              ) : (
                `Withdraw ${pickedUnlocked.length || ""}`.trim()
              )}
            </button>
          </div>
        </>
      )}
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
