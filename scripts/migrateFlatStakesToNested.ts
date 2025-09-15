// scripts/migrateFlatStakesToNested.ts
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

async function run() {
  const snap = await adminDb.collection("stakes").get();
  for (const d of snap.docs) {
    const id = d.id;
    // Skip wallet docs that already match 0x... shape (keep only flat ids with colons)
    if (!id.includes(":")) continue;

    const [chainIdStr, wallet, nftType, tokenId] = id.toLowerCase().split(":");
    if (!wallet?.startsWith("0x")) continue; // not a stake doc

    const data = d.data() as any;
    const chainId = Number(chainIdStr);

    const walletRef = adminDb.collection("stakes").doc(wallet);
    await walletRef.set({ wallet, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });

    const itemsRef = walletRef.collection("items").doc(`${chainId}:${nftType}:${tokenId}`);
    await itemsRef.set(
      {
        chainId,
        nftType,
        tokenId,
        amount: data.amount ?? 1,
        stakedAt: data.stakedAt ?? data.createdAt ?? Timestamp.now(),
        unlockAt: data.unlockAt,
        lockDays: data.lockDays,
        baseDaily: data.baseDaily,
        bonusMultiplier: data.bonusMultiplier,
        scheduledTotal: data.scheduledTotal,
        status: data.status ?? "active",
        accruedSoFar: data.accruedSoFar ?? 0,
        lastAccruedAt: data.lastAccruedAt ?? data.stakedAt ?? Timestamp.now(),
        txHash: data.txHash ?? null,
        kolId: data.kolId ?? null,
        createdAt: data.createdAt ?? Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // (optional) delete the flat doc:
    // await d.ref.delete();
  }

  console.log("Migration complete.");
}

run().catch(console.error);
