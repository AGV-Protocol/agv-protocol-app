// app/api/rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { accruedToDate, DAY_MS, NftType } from "@/lib/rewards";

// GET /api/rewards?wallet=0x...
// Returns: per-stake computed state and an aggregated summary.
// Also lazily updates accruedSoFar/lastAccruedAt (idempotent).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || "").toLowerCase();
    if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

    const stakesSnap = await adminDb
      .collection("stakes")
      .where("wallet", "==", wallet)
      .orderBy("stakedAt", "desc")
      .get();

    const now = new Date();
    let totalAccrued = 0;
    let totalCap = 0;

    const batch = adminDb.batch();

    const items = stakesSnap.docs.map(doc => {
      const d = doc.data() as any;

      // Recompute accrual to "now" (clamped to unlockAt)
      const stakedAt = d.stakedAt.toDate() as Date;
      const lockDays = Number(d.lockDays);
      const result = accruedToDate({
        nftType: d.nftType as NftType,
        amount: Number(d.amount),
        stakedAt,
        lockDays,
        now,
      });

      totalAccrued += result.accrued;
      totalCap += result.cap;

      // Lazy update cache if it moved forward by at least 1 day
      const last = d.lastAccruedAt?.toDate?.() as Date | undefined;
      const lastMs = last?.getTime?.() ?? stakedAt.getTime();
      const unlockAt: Date = d.unlockAt.toDate();

      const effectiveNow = new Date(Math.min(now.getTime(), unlockAt.getTime()));
      const shouldUpdate = effectiveNow.getTime() - lastMs >= DAY_MS || Math.abs((d.accruedSoFar ?? 0) - result.accrued) > 0.000001;

      if (shouldUpdate) {
        batch.update(doc.ref, {
          accruedSoFar: result.accrued,
          lastAccruedAt: Timestamp.fromDate(effectiveNow),
          updatedAt: Timestamp.now(),
          ...(effectiveNow.getTime() >= unlockAt.getTime() && d.status === "active"
            ? { status: "completed" }
            : {}),
        });
      }

      return {
        id: doc.id,
        chainId: d.chainId,
        nftType: d.nftType,
        amount: d.amount,
        stakedAt: d.stakedAt.toDate().toISOString(),
        unlockAt: d.unlockAt.toDate().toISOString(),
        lockDays: d.lockDays,
        baseDaily: d.baseDaily,
        bonusMultiplier: d.bonusMultiplier,
        scheduledTotal: d.scheduledTotal,
        accrued: result.accrued,
        daysCounted: result.daysCounted,
        status: d.status,
        txHash: d.txHash,
        kolId: d.kolId ?? null,
      };
    });

    if (!stakesSnap.empty) await batch.commit();

    return NextResponse.json(
      {
        wallet,
        asOf: now.toISOString(),
        totals: {
          accrued: totalAccrued,
          scheduled: totalCap,
          remaining: Math.max(0, totalCap - totalAccrued),
        },
        stakes: items,
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to compute rewards" }, { status: 500 });
  }
}
