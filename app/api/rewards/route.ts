// app/api/rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { accruedToDate, DAY_MS, NftType } from "@/lib/rewards";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || "").toLowerCase();
    if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

    // If you’re waiting on the index, temporarily remove orderBy to avoid 500s:
    // const stakesSnap = await adminDb.collection("stakes").where("wallet","==",wallet).get();

    const stakesSnap = await adminDb
      .collection("stakes")
      .where("wallet", "==", wallet)
      .orderBy("stakedAt", "desc")
      .get();

    const now = new Date();
    let totalAccrued = 0;
    let totalCap = 0;

    const batch = adminDb.batch();

    const items = stakesSnap.docs.flatMap((doc) => {
      try {
        const d = doc.data() as any;

        const stakedAt: Date = d.stakedAt?.toDate?.() ?? new Date(d.stakedAt || Date.now());
        const lockDays = Number(d.lockDays ?? 0);
        const nftType = String(d.nftType || "").toLowerCase() as NftType;

        // Compute accrual snapshot
        const result = accruedToDate({
          nftType,
          amount: Number(d.amount ?? 1),
          stakedAt,
          lockDays,
          now,
        });

        totalAccrued += result.accrued;
        totalCap += result.cap;

        // Derive unlockAt if missing
        const unlockAtObj: Date =
          d.unlockAt?.toDate?.() ??
          new Date(stakedAt.getTime() + lockDays * DAY_MS);

        // Lazy update if moved >= 1 day or values drifted
        const last = d.lastAccruedAt?.toDate?.() as Date | undefined;
        const lastMs = last?.getTime?.() ?? stakedAt.getTime();
        const effectiveNow = new Date(Math.min(now.getTime(), unlockAtObj.getTime()));
        const shouldUpdate =
          effectiveNow.getTime() - lastMs >= DAY_MS ||
          Math.abs((d.accruedSoFar ?? 0) - result.accrued) > 0.000001;

        if (shouldUpdate) {
          batch.update(doc.ref, {
            accruedSoFar: result.accrued,
            lastAccruedAt: Timestamp.fromDate(effectiveNow),
            updatedAt: Timestamp.now(),
            ...(effectiveNow.getTime() >= unlockAtObj.getTime() && d.status === "active"
              ? { status: "completed" }
              : {}),
          });
        }

        return [{
          id: doc.id,
          chainId: Number(d.chainId ?? 0),
          nftType,
          amount: Number(d.amount ?? 1),
          stakedAt: stakedAt.toISOString(),
          unlockAt: unlockAtObj.toISOString(),
          lockDays,
          baseDaily: Number(d.baseDaily ?? 0),
          bonusMultiplier: Number(d.bonusMultiplier ?? 1),
          scheduledTotal: Number(d.scheduledTotal ?? result.cap),
          accrued: result.accrued,
          daysCounted: result.daysCounted,
          status: d.status ?? "active",
          txHash: d.txHash ?? null,
          kolId: d.kolId ?? null,
        }];
      } catch (e) {
        // Skip any bad doc instead of failing the whole response
        console.error("rewards: bad doc", doc.id, e);
        return [];
      }
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
    console.error("rewards error", e);
    return NextResponse.json({ error: e?.message ?? "Failed to compute rewards" }, { status: 500 });
  }
}
