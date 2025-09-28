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
} from "@/lib/contracts";

// Rewards (off-chain dashboard)
import { useOffChainRewards } from "@/hooks/useOffChainRewards";
import { BASE_DAILY_RRGP, bonusFor } from "@/lib/rewards";

// Indexer-backed hook (new source of truth for owned/staked NFTs)
import { useStakingView } from "@/hooks/useStakingView";

// Translation
import { useTranslations } from '../TranslationProvider';

/* ─────────────────────────── Helpers ─────────────────────────── */
function toGateway(u?: string) {
  if (!u) return undefined;
  if (u.startsWith("ipfs://")) return u.replace(/^ipfs:\/\//, "https://ipfscdn.io/ipfs/");
  return u.replace(/^https?:\/\/ipfs\.io\/ipfs\//i, "https://ipfscdn.io/ipfs/");
}
function getImageSrc(nft: { imageUrl?: string }, fallback?: string) {
  return toGateway(nft?.imageUrl) || fallback;
}

// One-shot remaining string (no live interval updates)
function formatRemainingOnce(unlockAtISO: string) {
  const now = Date.now();
  const unlock = new Date(unlockAtISO).getTime();
  const remaining = unlock - now;
  if (remaining <= 0) return "Unlocked";
  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function postJSON<T>(url: string, body: any, method: "POST" | "PATCH" = "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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

/* ─────────────────────────── Page ─────────────────────────── */
export default function StakingPage() {
  const t = useTranslations('staking');
  const tCommon = useTranslations('common');
  
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const [chainKey, setChainKey] = useState<ChainKey>("56");
  const [selectedCollection, setSelectedCollection] =
    useState<"seed" | "tree" | "solar" | "compute">("seed");
  const { nft, stake } = useContracts(chainKey, selectedCollection);

  const [staking, setStaking] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Staking duration (minimum 7 days)
  const [stakingDuration, setStakingDuration] = useState<number>(7);

  // Selection state (lifted) for legacy rewards preview
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelection = () => setSelectedIds([]);

  // Off-chain rewards summary
  const { data: rewardsData, refetch: refetchRewards } = useOffChainRewards();

  // Indexer hook → current chain + collection
  const chainId = CHAIN_CONFIG[chainKey].id;
  const { loading: nftLoading, error: nftError, ownedUnstaked, ownedStaked, refetch: refetchStakingView } = useStakingView({
    chainId,
    collection: selectedCollection,
  });

  // Chain mismatch hint
  useEffect(() => {
    if (!activeChain?.id) return;
    if (activeChain.id !== chainId) {
      // display-only hint; actual switch happens on action
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
    } catch {
      // ignore if contract not initialized yet
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
    if (!account?.address) return toast.error(t('connectWalletFirst'));
    if (tokenIds.length === 0) return toast.error(t('selectAtLeastOne'));
    if (stakingDuration < 7) return toast.error(t('minimumDuration'));

    try {
      await ensureChain();
      setStaking(true);
      toast.loading(t('approving'));
      await ensureApproval();

      toast.dismiss();
      toast.loading(t('stakingOnChain'));
      const tx = await prepareContractCall({
        contract: stake,
        method: "stake",
        params: [tokenIds],
      });
      const receipt = await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();

      // Record stakes via API (no client Firestore writes)
      toast.loading(t('recordingStake'));
      await postJSON<{ ok: boolean }>(
        "/api/stakes",
        {
          wallet: account.address,
          chainId,
          nftType: selectedCollection,
          tokenIds: tokenIds.map(String),
          lockDays: stakingDuration,
          txHash: (receipt as any)?.transactionHash ?? null,
        },
        "POST"
      );
      toast.dismiss();
      toast.success(t('stakeSuccess', { duration: stakingDuration, plural: stakingDuration > 1 ? 's' : '' }));

      clearSelection();
      await Promise.all([refreshStats(), refetchRewards?.(), refetchStakingView?.()]);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || t('stakeFailed'));
    } finally {
      setStaking(false);
    }
  }

  async function handleWithdraw(tokenIds: bigint[]) {
    if (!account?.address) return toast.error(t('connectWalletFirst'));
    if (tokenIds.length === 0) return toast.error(t('selectAtLeastOneWithdraw'));

    try {
      await ensureChain();
      setWithdrawing(true);
      toast.loading(t('withdrawingOnChain'));
      const tx = await prepareContractCall({
        contract: stake,
        method: "withdraw",
        params: [tokenIds],
      });
      const receipt = await sendAndConfirmTransaction({ transaction: tx, account: account! });
      toast.dismiss();

      // Mark withdrawn via API (no client Firestore writes)
      toast.loading(t('updatingRecords'));
      await postJSON<{ ok: boolean }>(
        "/api/stakes/withdraw",
        {
          wallet: account.address,
          chainId,
          nftType: selectedCollection,
          tokenIds: tokenIds.map(String),
          txHash: (receipt as any)?.transactionHash ?? null,
        },
        "PATCH"
      );
      toast.dismiss();
      toast.success(t('withdrawSuccess'));

      await Promise.all([refreshStats(), refetchRewards?.(), refetchStakingView?.()]);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err?.shortMessage || err?.message || t('withdrawFailed'));
    } finally {
      setWithdrawing(false);
    }
  }

  // Reward preview (legacy logic) — recomputes as user selects NFTs & changes duration
  const rewardPreview = useMemo(() => {
    const count = selectedIds.length;
    const base = BASE_DAILY_RRGP[selectedCollection] || 0;
    const mult = bonusFor(stakingDuration) || 1;
    const perNftDaily = base * mult;
    const totalDaily = perNftDaily * count;
    const scheduledTotal = totalDaily * stakingDuration; // simple linear schedule
    return { count, base, mult, perNftDaily, totalDaily, scheduledTotal };
  }, [selectedIds, selectedCollection, stakingDuration]);

  // Overview card helper
  const dailyRewardHint = useMemo(() => {
    const baseRate = BASE_DAILY_RRGP[selectedCollection];
    const b = bonusFor(stakingDuration);
    const totalRate = baseRate * b;
    return `${totalRate.toFixed(1)} rGGP / day (${baseRate} × ${b}x bonus)`;
  }, [selectedCollection, stakingDuration]);

  const presetDurations = [7, 14, 30, 90, 180, 365, 730];
  const handlePresetClick = (days: number) => setStakingDuration(days);

  // Build list of unstaked tokenIds as strings for selection grid
  const unstakedIds: string[] = useMemo(
    () => (ownedUnstaked || []).map((n) => n.tokenId?.toString?.() ?? String(n.tokenId)),
    [ownedUnstaked]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-blue-500/10">
          <div className="relative z-10">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl">
                  {t('description')}
                </p>
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
            t={t}
          />
        </div>

        {/* Staking Duration */}
        <DurationPanel
          stakingDuration={stakingDuration}
          setStakingDuration={setStakingDuration}
          presetDurations={presetDurations}
          handlePresetClick={handlePresetClick}
          t={t}
        />

        {/* Stats */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            {t('overview')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title={t('stakedNFTs')}
              value={stakedCount.toString()}
              subtitle={t('currentlyStaked')}
              icon={<Lock className="w-6 h-6 text-white" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              title={t('availableRewards')}
              value={rewardsData?.totals?.accrued?.toFixed(2) || "0.00"}
              subtitle={t('readyToClaim')}
              icon={<Coins className="w-6 h-6 text-white" />}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              title={t('dailyRewards')}
              value={dailyRewardHint}
              subtitle={t('perNFTStaked')}
              icon={<ArrowRightLeft className="w-6 h-6 text-white" />}
              gradient="from-blue-500 to-cyan-500"
            />
          </div>
        </div>

        {/* Rest of the component... */}
        <Footer
          backgroundClass="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
          textColorClass="text-white"
        />
      </div>
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
  t,
}: {
  chainKey: ChainKey;
  setChainKey: (k: ChainKey) => void;
  activeChainName?: string;
  selectedCollection: "seed" | "tree" | "solar" | "compute";
  setSelectedCollection: (v: "seed" | "tree" | "solar" | "compute") => void;
  t: (key: string) => string;
}) {
  return (
    <>
      {/* Chain */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          {t('selectNetwork')}
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 text-sm tracking-wide text-white/70">
          {t('currentWalletChain')}: <span className="text-blue-300">{activeChainName ?? t('notConnected')}</span>
        </div>
      </div>

      {/* Collection */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          {t('selectNFTCollection')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {["seed", "tree", "solar", "compute"].map((collection) => (
            <button
              key={collection}
              onClick={() => setSelectedCollection(collection as any)}
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20" />
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
  t,
}: {
  stakingDuration: number;
  setStakingDuration: (n: number) => void;
  presetDurations: number[];
  handlePresetClick: (n: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        {t('selectStakingDuration')}
      </h3>
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="text-white/80 text-sm font-medium block">{t('quickSelect')}:</label>
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
                {days} {t('day')}{days > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="duration" className="text-white/80 text-sm font-medium">
            {t('durationDays')}:
          </label>
          <input
            id="duration"
            type="number"
            min="7"
            max="730"
            value={stakingDuration}
            onChange={(e) => setStakingDuration(Math.max(7, Number.parseInt(e.target.value) || 7))}
            className="w-20 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-center"
          />
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-purple-300" />
            <span className="text-purple-300 text-sm font-medium">{t('lockPeriod')}</span>
          </div>
          <p className="text-white/70 text-xs">
            {t('lockPeriodDescription', { duration: stakingDuration, plural: stakingDuration > 1 ? 's' : '' })}
          </p>
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
    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 group transition-all duration-300">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${
              gradient || "from-gray-500 to-gray-600"
            } shadow-lg transition-all duration-300`}
          >
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{value}</div>
            {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
          </div>
        </div>
        <div className="text-white/80 font-medium">{title}</div>
      </div>
    </div>
  );
}


