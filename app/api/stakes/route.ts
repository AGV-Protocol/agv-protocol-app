// app/api/stakes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { accruedToDate, baseDailyFor, bonusFor, normalizeLockDays, scheduledTotal, DAY_MS, NftType, ChainId } from "@/lib/rewards";

type Body = {
  wallet: string;
  chainId: ChainId;
  nftType: NftType;
  amount: number;
  lockDays: number;        // one of 7,30,90,180,365,730 (we'll normalize)
  stakedAt?: string;       // ISO; default now
  tokenIds?: string[];
  txHash?: string;
  kolId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    // Basic validation
    if (!body.wallet || !body.chainId || !body.nftType || !body.amount || !body.lockDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (body.amount < 1) {
      return NextResponse.json({ error: "Amount must be >= 1" }, { status: 400 });
    }

    const wallet = body.wallet.toLowerCase();
    const lockDays = normalizeLockDays(body.lockDays);
    const stakedAt = body.stakedAt ? new Date(body.stakedAt) : new Date();
    const unlockAt = new Date(stakedAt.getTime() + lockDays * DAY_MS);

    const baseDaily = baseDailyFor(body.nftType);
    const bonus = bonusFor(lockDays);
    const cap = scheduledTotal(body.nftType, body.amount, lockDays);

    // Initial accrued (0 full days elapsed at creation)
    const initAccrual = accruedToDate({
      nftType: body.nftType,
      amount: body.amount,
      stakedAt,
      lockDays,
      now: stakedAt,
    });

    const doc = {
      wallet,
      chainId: body.chainId,
      nftType: body.nftType,
      amount: body.amount,
      tokenIds: body.tokenIds ?? [],
      txHash: body.txHash ?? null,
      kolId: body.kolId ?? null,
      stakedAt: Timestamp.fromDate(stakedAt),
      unlockAt: Timestamp.fromDate(unlockAt),
      lockDays,
      baseDaily,
      bonusMultiplier: bonus,
      scheduledTotal: cap,
      accruedSoFar: initAccrual.accrued,
      lastAccruedAt: Timestamp.fromDate(stakedAt),
      status: "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Suggested ID: chain:wallet:tx or fallback to auto ID
    const collection = adminDb.collection("stakes");
    const id = body.txHash
      ? `${body.chainId}:${wallet}:${body.txHash}`.toLowerCase()
      : undefined;

    const ref = id ? collection.doc(id) : collection.doc();
    await ref.set(doc, { merge: false });

    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create stake" }, { status: 500 });
  }
}

// Optional: list a wallet's stakes (raw, without recalculation)
// GET /api/stakes?wallet=0x...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || "").toLowerCase();
    if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

    const snap = await adminDb.collection("stakes").where("wallet", "==", wallet).orderBy("stakedAt", "desc").get();
    const res = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ stakes: res }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to fetch" }, { status: 500 });
  }
}
