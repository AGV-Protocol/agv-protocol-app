// app/api/stakes/record/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { BASE_DAILY_RRGP, bonusFor, DAY_MS } from "@/lib/rewards";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = String(body.wallet || "").toLowerCase();
    const chainId = Number(body.chainId);
    const nftType = String(body.collectionType || "").toLowerCase() as
      | "seed" | "tree" | "solar" | "compute";
    const tokenIds = (body.tokenIds || []).map((t: any) => String(t));
    const lockDays = Number(body.lockDays || 0);

    if (!wallet || !chainId || !nftType || !tokenIds.length || lockDays < 1) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const stakedAt = body.stakedAt ? new Date(body.stakedAt) : new Date();
    const unlockAt = new Date(stakedAt.getTime() + lockDays * DAY_MS);

    const baseDaily = BASE_DAILY_RRGP[nftType];
    const bonusMultiplier = bonusFor(lockDays);
    const scheduledTotal = baseDaily * bonusMultiplier * lockDays;

    const batch = adminDb.batch();

    const walletDoc = adminDb.collection("stakes").doc(wallet);
    batch.set(
      walletDoc,
      { wallet, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
      { merge: true }
    );

    // Idempotent per-token doc id
    for (const tokenId of tokenIds) {
      const itemId = `${chainId}:${nftType}:${tokenId}`;
      const itemRef = walletDoc.collection("items").doc(itemId);
      batch.set(
        itemRef,
        {
          chainId,
          nftType,
          tokenId,
          amount: 1,

          stakedAt: Timestamp.fromDate(stakedAt),
          unlockAt: Timestamp.fromDate(unlockAt),
          lockDays,

          baseDaily,
          bonusMultiplier,
          scheduledTotal,

          status: "active",
          accruedSoFar: 0,
          lastAccruedAt: Timestamp.fromDate(stakedAt),
          txHash: body.txHash ?? null,
          kolId: body.kolId ?? null,

          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return NextResponse.json({ ok: true, count: tokenIds.length });
  } catch (e: any) {
    console.error("stakes/record error", e);
    return NextResponse.json({ error: e?.message || "Failed to record stake" }, { status: 500 });
  }
}
