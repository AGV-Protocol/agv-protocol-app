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
async function logStake(address: string, chainKey: ChainKey, collectionType: "seed" | "tree" | "solar" | "compute", tokenIds: bigint[]) {
  try {
    await addDoc(collection(db, "stakes_v1"), {
      address,
      chain: chainKey,
      collection: collectionType,
      tokenIds: tokenIds.map((t) => t.toString()),
      at: Timestamp.now(),
      nft: NFT_CONTRACTS[chainKey][collectionType],
      stakeContract: STAKE_CONTRACTS[chainKey][collectionType],
    });
  } catch {}
}
async function logWithdraw(address: string, chainKey: ChainKey, collectionType: "seed" | "tree" | "solar" | "compute", tokenIds: bigint[]) {
  try {
    // delete matching stake docs (simple: best-effort)
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
  } catch {}
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
    } catch (err) {
      // ignore on fresh deploy with 0s
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
      toast.success("Staked!");
      await logStake(account.address, chainKey, selectedCollection, tokenIds);
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
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-800/20 backdrop-blur-xl border border-white/10 p-8 mb-8 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-blue-800/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
          <div className="relative z-10">
            <header className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  AGV Protocol Staking
                </h1>
                <p className="text-lg text-white/80 max-w-2xl">
                  Stake your <span className="font-semibold text-cyan-300">{selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)}</span> NFTs on{" "}
                  <span className="font-semibold text-blue-300">{CHAIN_CONFIG[chainKey].label}</span> to earn rewards. 
                  No lock-up period - withdraw anytime.
                </p>
                <div className="flex items-center gap-4 mt-4">
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
              <div className="hidden md:block">
                <ConnectButton client={client} />
              </div>
            </header>
          </div>
        </div>

        {/* Chain and Collection Selector */}
        <div className="space-y-6">
          {/* Chain Selection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Select Network
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["56", "42161", "137"] as ChainKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setChainKey(k)}
                  className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
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
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Select NFT Collection
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["seed", "tree", "solar", "compute"] as const).map((collection) => (
                <button
                  key={collection}
                  onClick={() => setSelectedCollection(collection)}
                  className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
                    selectedCollection === collection 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {collection === "seed" && "🌱"}
                      {collection === "tree" && "🌳"}
                      {collection === "solar" && "☀️"}
                      {collection === "compute" && "💻"}
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
}: {
  withdrawing: boolean;
  onWithdraw: (ids: bigint[]) => Promise<void>;
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

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Enter token IDs (e.g., 12, 44, 88)"
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
        <button
          onClick={() => onWithdraw(ids)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={withdrawing || ids.length === 0}
        >
          {withdrawing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Withdrawing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Withdraw
            </div>
          )}
        </button>
      </div>
      
      {ids.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-300 text-sm font-medium">
              {ids.length} token ID{ids.length > 1 ? 's' : ''} ready to withdraw: {ids.map(id => id.toString()).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
