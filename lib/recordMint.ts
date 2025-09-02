// lib/recordMint.ts
import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type NftType = "seed" | "tree" | "solar" | "compute";

type RecordMintParams = {
  kolId: string;              // e.g. "AGV-KOL123456"
  address: string;            // buyer wallet
  nftType: NftType;
  quantity: number;           // > 0
  chainId: "56" | "137" | "42161" | string;
  txHash: string;             // on-chain tx hash
};

/**
 * Appends a successful mint to mintEvents/{kolId} (docId = kolId),
 * increments aggregates, and syncs kols (fast counters).
 *
 * - NO-OP if the same txHash already exists (idempotent).
 * - FAILS if mintEvents/{kolId} does not exist (so users cannot create new kolIds).
 * - Caps events to the latest 5000 per KOL.
 */
export async function recordSuccessfulMintStrict(p: RecordMintParams) {
  const qty = Math.max(1, Math.floor(p.quantity || 0));
  const mintRef = doc(db, "mintEvents", p.kolId);

  // Find the KOL profile doc (random docId) up-front so we can update it inside the txn.
  const kq = query(collection(db, "kols"), where("kolId", "==", p.kolId));
  const ks = await getDocs(kq);
  const kolDoc = ks.docs[0]; // expected exactly 1 created by Admin

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(mintRef);

    // If the mintEvents doc does not exist, abort: only Admins may create it.
    if (!snap.exists()) {
      throw new Error("Invalid KOL: kolId not found.");
    }

    const data = snap.data() || {};
    const events: any[] = Array.isArray(data.events) ? data.events : [];

    // Idempotency: skip if we already have this txHash (check recent subset for speed).
    const txLower = (p.txHash || "").toLowerCase();
    const recent = events.slice(-100); // check the last 100 quickly
    const dup = recent.some((e) => (e?.txHash || "").toLowerCase() === txLower);
    if (dup) return; // no-op

    // Append new event & cap to 500 total
    const newEvent = {
      address: p.address,
      nftType: p.nftType,
      quantity: qty,
      chainId: String(p.chainId),
      txHash: p.txHash,
      timestamp: serverTimestamp(),
    };

    // Build a fresh array to ensure deterministic cap
    const updatedEvents = [...events, newEvent];
    const cappedEvents =
      updatedEvents.length > 5000 ? updatedEvents.slice(updatedEvents.length - 5000) : updatedEvents;

    // Bump totals
    const prevSeed = Number(data.seed || 0);
    const prevTree = Number(data.tree || 0);
    const prevSolar = Number(data.solar || 0);
    const prevCompute = Number(data.compute || 0);

    // Per-chain nested bucket
    const perChain = (data.perChain || {}) as Record<string, any>;
    const chainBucket = (perChain[p.chainId] ||= {});
    const prevChainType = Number(chainBucket[p.nftType] || 0);

    // Write back the whole doc in the txn
    tx.update(mintRef, {
      // top-level counters
      seed: p.nftType === "seed" ? prevSeed + qty : prevSeed,
      tree: p.nftType === "tree" ? prevTree + qty : prevTree,
      solar: p.nftType === "solar" ? prevSolar + qty : prevSolar,
      compute: p.nftType === "compute" ? prevCompute + qty : prevCompute,

      // flatten perChain updates to keep structure consistent
      [`perChain.${p.chainId}.${p.nftType}`]: prevChainType + qty,

      // events (capped)
      events: cappedEvents,

      updatedAt: serverTimestamp(),
      kolId: p.kolId, // keep invariant (rules require kolId == docId)
    });

    // Update fast aggregates on the KOL profile if we found it
    if (kolDoc) {
      tx.update(kolDoc.ref, {
        [p.nftType]: increment(qty),
        updatedAt: serverTimestamp(),
      });
    }
  });
}
