// hooks/useStakingView.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Your on-chain contract map (must exist)
import { NFT_CONTRACTS } from "@/lib/contracts";

type ChainKey = "56" | "42161" | "137";
type Collection = "seed" | "tree" | "solar" | "compute";

export type OwnedNft = {
  chainId: number;
  tokenAddress: string; // lowercased
  tokenId: bigint;
  standard: "ERC721" | "ERC1155";
  collection: { address: string }; // minimal, the UI uses .address for key
  imageUrl?: string;
  name?: string | null;
  amount?: bigint; // for 1155 (not strictly needed for staking-by-id)
};

function chainIdToKey(chainId: number): ChainKey | null {
  if (chainId === 56) return "56";
  if (chainId === 42161) return "42161";
  if (chainId === 137) return "137";
  return null;
}
function toHexChain(chainId: number) {
  return "0x" + chainId.toString(16);
}
function toGateway(u?: string | null) {
  if (!u) return undefined;
  if (u.startsWith("ipfs://")) return u.replace(/^ipfs:\/\//, "https://ipfscdn.io/ipfs/");
  return u.replace(/^https?:\/\/ipfs\.io\/ipfs\//i, "https://ipfscdn.io/ipfs/");
}

export function useStakingView(params: { chainId: number; collection: Collection }) {
  const { chainId, collection } = params;
  const account = useActiveAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ownedUnstaked, setOwnedUnstaked] = useState<OwnedNft[]>([]);
  const [ownedStaked, setOwnedStaked] = useState<OwnedNft[]>([]);

  const chainKey = useMemo(() => chainIdToKey(chainId), [chainId]);

  // Resolve the AGV contract address for this chain+collection
  const agvAddress = useMemo(() => {
    if (!chainKey) return null;
    const addr = NFT_CONTRACTS[chainKey]?.[collection];
    return addr ? addr.toLowerCase() : null;
  }, [chainKey, collection]);

  // 1) Load wallet NFTs via Moralis → filter to AGV contract
  useEffect(() => {
    let active = true;
    (async () => {
      setError(null);
      setOwnedUnstaked([]);
      if (!account?.address || !chainId || !agvAddress) return;

      setLoading(true);
      try {
        const url = new URL("/api/wallet-nfts", window.location.origin);
        url.searchParams.set("address", account.address);
        url.searchParams.set("chain", toHexChain(chainId)); // e.g., "0x38"

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed to fetch wallet NFTs (${res.status})`);
        }
        const data = (await res.json()) as {
          items: Array<{
            tokenAddress: string;
            tokenIdStr: string;
            contractType?: "ERC721" | "ERC1155";
            imageUrl?: string | null;
            name?: string | null;
          }>;
        };

        const items = (data?.items ?? [])
          .filter((n) => n?.tokenAddress?.toLowerCase() === agvAddress)
          .map<OwnedNft>((n) => ({
            chainId,
            tokenAddress: n.tokenAddress.toLowerCase(),
            tokenId: BigInt(n.tokenIdStr || "0"),
            standard: (n.contractType as any) === "ERC1155" ? "ERC1155" : "ERC721",
            collection: { address: agvAddress },
            imageUrl: toGateway(n.imageUrl || undefined),
            name: n.name ?? null,
          }));

        if (active) setOwnedUnstaked(items);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load wallet NFTs");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [account?.address, chainId, agvAddress]);

  // 2) Load currently staked tokens for this wallet from Firestore
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!account?.address || !chainKey || !agvAddress) {
        setOwnedStaked([]);
        return;
      }

      try {
        // We store active stakes per tokenId in `staking_positions`
        const qSnap = await getDocs(
          query(
            collection(db, "staking_positions"),
            where("address", "==", account.address),
            where("chain", "==", chainKey),
            where("collection", "==", collection),
            where("status", "==", "active")
          )
        );

        const staked: OwnedNft[] = qSnap.docs.map((d) => {
          const tokenId = BigInt(String(d.data().tokenId));
          return {
            chainId,
            tokenAddress: agvAddress,
            tokenId,
            standard: "ERC721", // UI only needs the id to withdraw/claim
            collection: { address: agvAddress },
            imageUrl: undefined,
            name: collection.toUpperCase(),
          };
        });

        if (!cancelled) setOwnedStaked(staked);
      } catch {
        if (!cancelled) setOwnedStaked([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address, chainId, chainKey, collection, agvAddress]);

  // 3) Subtract staked from wallet list to get *true* unstaked
  const stakedSet = useMemo(
    () => new Set(ownedStaked.map((x) => x.tokenId.toString())),
    [ownedStaked]
  );
  const trueUnstaked = useMemo(
    () => ownedUnstaked.filter((x) => !stakedSet.has(x.tokenId.toString())),
    [ownedUnstaked, stakedSet]
  );

  return {
    loading,
    error,
    ownedUnstaked: trueUnstaked,
    ownedStaked,
  };
}
