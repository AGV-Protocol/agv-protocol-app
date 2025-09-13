// app/api/stakes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  accruedToDate,
  baseDailyFor,
  bonusFor,
  normalizeLockDays,
  scheduledTotal,
  DAY_MS,
  NftType,
  ChainId,
} from "@/lib/rewards";

type Body = {
  wallet: string;
  chainId: ChainId;
  nftType: NftType;              // "seed" | "tree" | "solar" | "compute"
  amount: number;                // number of tokenIds
  lockDays: number;              // normalize to allowed set
  stakedAt?: string;             // ISO; default now
  tokenIds: string[];            // REQUIRED: we will write one doc per tokenId
  txHash?: string | null;
  kolId?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body.wallet || !body.chainId || !body.nftType || !body.lockDays || !Array.isArray(body.tokenIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (body.tokenIds.length < 1) {
      return NextResponse.json({ error: "tokenIds must be non-empty" }, { status: 400 });
    }

    const wallet = body.wallet.toLowerCase();
    const lockDays = normalizeLockDays(body.lockDays);
    const stakedAt = body.stakedAt ? new Date(body.stakedAt) : new Date();
    const unlockAt = new Date(stakedAt.getTime() + lockDays * DAY_MS);

    // reward fields (kept for your dashboards)
    const baseDaily = baseDailyFor(body.nftType);
    const bonus = bonusFor(lockDays);

    // create one stake doc per tokenId, deterministic ID so we can delete by tokenId
    const batch = adminDb.batch();
    const col = adminDb.collection("stakes");

    for (const tokenId of body.tokenIds) {
      const cap = scheduledTotal(body.nftType, 1, lockDays);
      const accr = accruedToDate({
        nftType: body.nftType,
        amount: 1,
        stakedAt,
        lockDays,
        now: stakedAt,
      });

      const id = `${body.chainId}:${wallet}:${body.nftType}:${tokenId}`.toLowerCase();
      const ref = col.doc(id);
      batch.set(ref, {
        wallet,
        chainId: body.chainId,
        nftType: body.nftType,
        tokenId,
        stakedAt: Timestamp.fromDate(stakedAt),
        unlockAt: Timestamp.fromDate(unlockAt),
        lockDays,
        baseDaily,
        bonusMultiplier: bonus,
        scheduledTotal: cap,
        accruedSoFar: accr.accrued,
        lastAccruedAt: Timestamp.fromDate(stakedAt),
        status: "active",
        txHash: body.txHash ?? null,
        kolId: body.kolId ?? null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, created: body.tokenIds.length }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create stakes" }, { status: 500 });
  }
}

// GET /api/stakes?wallet=0x... (list a wallet's stake rows)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || "").toLowerCase();
    if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

    const snap = await adminDb
      .collection("stakes")
      .where("wallet", "==", wallet)
      .orderBy("stakedAt", "desc")
      .get();

    const res = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ stakes: res }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to fetch" }, { status: 500 });
  }
}
