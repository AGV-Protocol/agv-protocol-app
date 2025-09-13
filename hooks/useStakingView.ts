// hooks/useStakingView.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  getContractEvents,
  readContract,
  prepareEvent,
} from "thirdweb";
import { transferEvent as erc721TransferEvent } from "thirdweb/extensions/erc721";
import { transferSingleEvent, transferBatchEvent } from "thirdweb/extensions/erc1155";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AGV_COLLECTIONS, type PassKind, type AgvCollection } from "@/lib/agv-config";

type OwnedBase = {
  chainId: number;
  collection: AgvCollection;
  tokenId: bigint;
  imageUrl: string;
  name?: string;
};
type Owned721 = OwnedBase & { standard: "ERC721" };
type Owned1155 = OwnedBase & { standard: "ERC1155"; amount: bigint };
export type OwnedNft = Owned721 | Owned1155;

const KIND_IMAGE: Record<PassKind, string> = {
  SEED: "/seedpass.jpg",
  TREE: "/treepass.jpg",
  SOLAR: "/solarpass.jpg",
  COMPUTE: "/computepass.jpg",
};

/* --------------------------- helpers --------------------------- */

async function anchorFromInitialized(contract: ReturnType<typeof getContract>) {
  try {
    const initializedEvt = prepareEvent({ signature: "event Initialized(uint64)" });
    const logs = await getContractEvents({
      contract,
      events: [initializedEvt],
      fromBlock: 0n,
      toBlock: "latest",
    });
    if (logs.length) return logs[0].blockNumber as bigint;
  } catch {}
  return 0n; // safe fallback, just slower
}

// 721 — fast path using ERC721Enumerable if present
async function owned721ViaEnumerable(
  c: AgvCollection,
  client: ReturnType<typeof createThirdwebClient>,
  owner: `0x${string}`
): Promise<bigint[] | null> {
  const nft = getContract({ client, chain: c.chain, address: c.address, abi: c.nftAbi });
  try {
    const bal = (await readContract({
      contract: nft,
      method: "function balanceOf(address) view returns (uint256)",
      params: [owner],
    })) as bigint;

    // try tokenOfOwnerByIndex on index 0; if it fails, enumerable not implemented
    if (bal === 0n) return [];
    await readContract({
      contract: nft,
      method: "function tokenOfOwnerByIndex(address,uint256) view returns(uint256)",
      params: [owner, 0n],
    });

    const ids: bigint[] = [];
    for (let i = 0n; i < bal; i++) {
      const id = (await readContract({
        contract: nft,
        method: "function tokenOfOwnerByIndex(address,uint256) view returns(uint256)",
        params: [owner, i],
      })) as bigint;
      ids.push(id);
    }
    return ids;
  } catch {
    return null; // not enumerable or call blocked → let caller fall back to events
  }
}

// 721 — fallback via Transfer logs
async function owned721ViaEvents(
  c: AgvCollection,
  client: ReturnType<typeof createThirdwebClient>,
  owner: `0x${string}`
) {
  const nft = getContract({ client, chain: c.chain, address: c.address, abi: c.nftAbi });
  const start = await anchorFromInitialized(nft);
  const [ins, outs] = await Promise.all([
    getContractEvents({
      contract: nft,
      events: [erc721TransferEvent({ to: owner })],
      fromBlock: start,
      toBlock: "latest",
    }),
    getContractEvents({
      contract: nft,
      events: [erc721TransferEvent({ from: owner })],
      fromBlock: start,
      toBlock: "latest",
    }),
  ]);

  const set = new Set<string>();
  for (const e of ins) set.add(e.args.tokenId.toString());
  for (const e of outs) set.delete(e.args.tokenId.toString());
  return Array.from(set).map((x) => BigInt(x));
}

// 1155 — balance netting via TransferSingle/Batch logs
async function owned1155ViaEvents(
  c: AgvCollection,
  client: ReturnType<typeof createThirdwebClient>,
  owner: `0x${string}`
) {
  const nft = getContract({ client, chain: c.chain, address: c.address, abi: c.nftAbi });
  const start = await anchorFromInitialized(nft);
  const [inS, inB, outS, outB] = await Promise.all([
    getContractEvents({ contract: nft, events: [transferSingleEvent({ to: owner })], fromBlock: start, toBlock: "latest" }),
    getContractEvents({ contract: nft, events: [transferBatchEvent({ to: owner })],   fromBlock: start, toBlock: "latest" }),
    getContractEvents({ contract: nft, events: [transferSingleEvent({ from: owner })],fromBlock: start, toBlock: "latest" }),
    getContractEvents({ contract: nft, events: [transferBatchEvent({ from: owner })], fromBlock: start, toBlock: "latest" }),
  ]);

  const bal = new Map<string, bigint>();

  // incoming
  for (const e of inS) {
    const id = BigInt(e.args.id.toString());
    const v = BigInt(e.args.value.toString());
    bal.set(id.toString(), (bal.get(id.toString()) ?? 0n) + v);
  }
  for (const e of inB) {
    const ids = e.args.ids.map((x: any) => BigInt(x.toString()));
    const vs  = e.args.values.map((x: any) => BigInt(x.toString()));
    for (let i = 0; i < ids.length; i++) {
      const k = ids[i].toString();
      bal.set(k, (bal.get(k) ?? 0n) + vs[i]);
    }
  }

  // outgoing
  for (const e of outS) {
    const id = BigInt(e.args.id.toString());
    const v = BigInt(e.args.value.toString());
    bal.set(id.toString(), (bal.get(id.toString()) ?? 0n) - v);
  }
  for (const e of outB) {
    const ids = e.args.ids.map((x: any) => BigInt(x.toString()));
    const vs  = e.args.values.map((x: any) => BigInt(x.toString()));
    for (let i = 0; i < ids.length; i++) {
      const k = ids[i].toString();
      bal.set(k, (bal.get(k) ?? 0n) - vs[i]);
    }
  }

  const result: { tokenId: bigint; amount: bigint }[] = [];
  for (const [k, v] of bal) if (v > 0n) result.push({ tokenId: BigInt(k), amount: v });
  return result;
}

/* ------------------------------ hook ------------------------------ */

export function useStakingView(args: { kind: PassKind; chainId: number }) {
  const account = useActiveAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [ownedUnstaked, setOwnedUnstaked] = useState<OwnedNft[]>([]);
  const [stakedFromDb, setStakedFromDb]   = useState<OwnedNft[]>([]);
  const [allCombined, setAllCombined]     = useState<OwnedNft[]>([]);

  const client = useMemo(
    () => createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! }),
    []
  );

  const collectionEntry = useMemo(
    () => AGV_COLLECTIONS.find((c) => c.kind === args.kind && c.chain.id === args.chainId),
    [args.kind, args.chainId]
  );

  useEffect(() => {
    (async () => {
      if (!account?.address || !collectionEntry) {
        setOwnedUnstaked([]); setStakedFromDb([]); setAllCombined([]); setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const c = collectionEntry;
        const imageUrl = KIND_IMAGE[c.kind];

        // 1) wallet-owned (try enumerable first, then events)
        let walletOwned: OwnedNft[] = [];

        if (c.standard === "ERC721") {
          const idsEnumerable = await owned721ViaEnumerable(c, client, account.address);
          const ids = idsEnumerable ?? (await owned721ViaEvents(c, client, account.address));
          walletOwned = ids.map<Owned721>((id) => ({
            standard: "ERC721",
            chainId: c.chain.id,
            collection: c,
            tokenId: id,
            imageUrl,
            name: c.kind,
          }));
        } else {
          const pairs = await owned1155ViaEvents(c, client, account.address);
          walletOwned = pairs.map<Owned1155>(({ tokenId, amount }) => ({
            standard: "ERC1155",
            chainId: c.chain.id,
            collection: c,
            tokenId,
            amount,
            imageUrl,
            name: c.kind,
          }));
        }

        // 2) staked strictly from Firestore `stakes` (one doc per tokenId)
        const nftTypeLower =
          c.kind === "SEED" ? "seed" : c.kind === "TREE" ? "tree" : c.kind === "SOLAR" ? "solar" : "compute";

        const qSnap = await getDocs(
          query(
            collection(db, "stakes"),
            where("wallet", "==", account.address.toLowerCase()),
            where("chainId", "==", args.chainId as any),
            where("nftType", "==", nftTypeLower),
            where("status", "==", "active")
          )
        );

        const stakedDocs = qSnap.docs.map((d) => d.data() as any);
        const staked: OwnedNft[] = stakedDocs
          .map((d) => d.tokenId as string)
          .filter(Boolean)
          .map((tid) => ({
            standard: "ERC721" as const, // UI purposes
            chainId: c.chain.id,
            collection: c,
            tokenId: BigInt(tid),
            imageUrl,
            name: c.kind,
          }));

        // 3) unstaked = walletOwned − staked
        const stakedSet = new Set(staked.map((x) => x.tokenId.toString()));
        const unstaked = walletOwned.filter((x) => !stakedSet.has(x.tokenId.toString()));

        setOwnedUnstaked(unstaked);
        setStakedFromDb(staked);
        setAllCombined([...staked, ...unstaked]);
      } catch (e: any) {
        console.error("useStakingView", e);
        setError("Failed to load NFTs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [account?.address, client, collectionEntry, args.chainId]);

  return { loading, error, ownedUnstaked, stakedFromDb, allCombined };
}
