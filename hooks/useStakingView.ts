// hooks/useStakingView.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { resolveScheme } from "thirdweb/storage";
import { AGV_COLLECTIONS, type PassKind, type AgvCollection } from "@/lib/agv-config";

// thirdweb v5 helpers (indexer-backed)
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
import { getOwnedTokenIds } from "thirdweb/extensions/erc1155";

type Owned721 = {
  standard: "ERC721";
  chainId: number;
  collection: AgvCollection;
  tokenId: bigint;
  metadata?: any;
};

type Owned1155 = {
  standard: "ERC1155";
  chainId: number;
  collection: AgvCollection;
  tokenId: bigint;
  amount: bigint;
  metadata?: any;
};

export type OwnedNft = Owned721 | Owned1155;

type StakeView721 = {
  tokenIds: bigint[];
  unclaimed: bigint;
};

type StakeView1155 = {
  tokenIds: bigint[];
  amounts: bigint[];
  unclaimed: bigint;
};

const STAKING721_ABI = [
  {
    inputs: [{ internalType: "address", name: "staker", type: "address" }],
    name: "getStakeInfo",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const STAKING1155_ABI = [
  {
    inputs: [{ internalType: "address", name: "staker", type: "address" }],
    name: "getStakeInfo",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      { internalType: "uint256", name: "unclaimedRewards", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useStakingView(selected: PassKind) {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [owned, setOwned] = useState<OwnedNft[]>([]);
  const [stakedIds721, setStakedIds721] = useState<Record<string, bigint[]>>({}); // key: `${chainId}-${nftAddress}`
  const [stakedMap1155, setStakedMap1155] = useState<Record<string, { ids: bigint[]; amts: bigint[] }>>({});
  const [unclaimedTotal, setUnclaimedTotal] = useState<bigint>(0n);

  const client = useMemo(
    () => createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! }),
    []
  );

  const collections = useMemo(
    () => AGV_COLLECTIONS.filter((c) => c.kind === selected),
    [selected]
  );

  useEffect(() => {
    (async () => {
      if (!account?.address) {
        setOwned([]);
        setStakedIds721({});
        setStakedMap1155({});
        setUnclaimedTotal(BigInt(0));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1) OWNED (indexer-backed)
        const ownedResults = await Promise.all(
          collections.map(async (c) => {
            const nft = getContract({
              client,
              chain: c.chain,
              address: c.address,
              abi: c.nftAbi,
            });

            if (c.standard === "ERC721") {
              const nfts = await getOwnedNFTs({ contract: nft, owner: account.address });
              return nfts.map((n) => ({
                standard: "ERC721" as const,
                chainId: c.chain.id,
                collection: c,
                tokenId: BigInt(n.id),
                metadata: n.metadata,
              }));
            } else {
              // ERC1155: list owned token IDs & amounts
              const owned1155 = await getOwnedTokenIds({ contract: nft, owner: account.address });
              // getOwnedTokenIds returns { tokenId, balance } pairs (v5); if not, fetch per id via balanceOf
              return owned1155.map((o) => ({
                standard: "ERC1155" as const,
                chainId: c.chain.id,
                collection: c,
                tokenId: BigInt(o.tokenId),
                amount: BigInt(o.balance),
                metadata: o.metadata, // some indexers include metadata; if not, can fetch via uri()
              }));
            }
          })
        );

        const flatOwned = ownedResults.flat();
        setOwned(flatOwned);

        // 2) STAKED (read staking contracts)
        let unclaimedSum = 0n;

        const stakeReads = await Promise.all(
          collections.map(async (c) => {
            const staking = getContract({
              client,
              chain: c.chain,
              address: c.stakingAddress,
              abi: c.standard === "ERC721" ? STAKING721_ABI : STAKING1155_ABI,
            });

            if (c.standard === "ERC721") {
              const [ids, unclaimed] = (await readContract({
                contract: staking,
                method: "getStakeInfo",
                params: [account.address],
              })) as [bigint[], bigint];

              const key = `${c.chain.id}-${c.address.toLowerCase()}`;
              return { kind: "721" as const, key, ids, unclaimed };
            } else {
              const [ids, amts, unclaimed] = (await readContract({
                contract: staking,
                method: "getStakeInfo",
                params: [account.address],
              })) as [bigint[], bigint[], bigint];

              const key = `${c.chain.id}-${c.address.toLowerCase()}`;
              return { kind: "1155" as const, key, ids, amts, unclaimed };
            }
          })
        );

        const map721: Record<string, bigint[]> = {};
        const map1155: Record<string, { ids: bigint[]; amts: bigint[] }> = {};

        for (const s of stakeReads) {
          if (s.kind === "721") {
            map721[s.key] = s.ids;
            unclaimedSum += s.unclaimed;
          } else {
            map1155[s.key] = { ids: s.ids, amts: s.amts };
            unclaimedSum += s.unclaimed;
          }
        }

        setStakedIds721(map721);
        setStakedMap1155(map1155);
        setUnclaimedTotal(unclaimedSum);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [account?.address, client, collections]);

  // 3) Partition owned into staked vs unstaked
  const keyOf = (c: AgvCollection) => `${c.chain.id}-${c.address.toLowerCase()}`;

  const stakedOwned: OwnedNft[] = [];
  const unstakedOwned: OwnedNft[] = [];

  for (const it of owned) {
    const k = keyOf(it.collection);

    if (it.standard === "ERC721") {
      const staked = (stakedIds721[k] ?? []).some((id) => id === it.tokenId);
      (staked ? stakedOwned : unstakedOwned).push(it);
    } else {
      // 1155: staked if amount > 0 for that tokenId
      const entry = stakedMap1155[k];
      if (!entry) {
        unstakedOwned.push(it);
      } else {
        const idx = entry.ids.findIndex((x) => x === it.tokenId);
        const stakedAmt = idx >= 0 ? entry.amts[idx] : 0n;
        // If user owns 3 but staked 1, you could split. For simplicity, mark as staked if any > 0.
        const isStaked = stakedAmt > 0n;
        (isStaked ? stakedOwned : unstakedOwned).push(it);
      }
    }
  }

  return {
    loading,
    error,
    ownedAll: owned,
    ownedStaked: stakedOwned,
    ownedUnstaked: unstakedOwned,
    unclaimedTotal,
  };
}
