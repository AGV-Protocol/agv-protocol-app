// app/api/rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  accruedToDate,
  DAY_MS,
  NftType,
  BASE_DAILY_RRGP,
  bonusFor,
} from "@/lib/rewards";

const NFT_TYPES = ["seed", "tree", "solar", "compute"] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const wallet = (searchParams.get("wallet") || "").toLowerCase();
    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const chainIdFilter = searchParams.get("chainId")
      ? Number(searchParams.get("chainId"))
      : undefined;

    const nftTypeParam = (searchParams.get("nftType") || "").toLowerCase();
    const nftTypeFilter = (NFT_TYPES as readonly string[]).includes(nftTypeParam)
      ? (nftTypeParam as NftType)
      : undefined;

    const includeWithdrawn =
      (searchParams.get("includeWithdrawn") || "false") === "true";

    // Read wallet-scoped items: /stakes/{wallet}/items
    const itemsRef = adminDb.collection("stakes").doc(wallet).collection("items");
    const snap = await itemsRef.get();

    const now = new Date();

    // ✅ Explicit empty response when there are no docs
    if (snap.empty) {
      return NextResponse.json(
        {
          wallet,
          asOf: now.toISOString(),
          totals: { accrued: 0, scheduled: 0, remaining: 0 },
          stakes: [],
        },
        { status: 200 }
      );
    }

    const effectiveItems = snap.docs
      .map((doc) => ({ id: doc.id, ref: doc.ref, data: doc.data() as any }))
      .filter(({ data }) => {
        if (!includeWithdrawn && data.status === "withdrawn") return false;
        if (typeof chainIdFilter === "number" && Number(data.chainId) !== chainIdFilter)
          return false;
        if (nftTypeFilter && String(data.nftType).toLowerCase() !== nftTypeFilter) return false;
        return true;
      });

    let totalAccrued = 0;
    let totalCap = 0;
    let updates = 0;

    const batch = adminDb.batch();

    const items = effectiveItems.flatMap(({ id, ref, data }) => {
      try {
        const nftTypeRaw = String(data.nftType || "").toLowerCase();
        const isKnownType = (NFT_TYPES as readonly string[]).includes(nftTypeRaw);
        const nftType = (isKnownType ? nftTypeRaw : "seed") as NftType; // fallback type for typing only

        const stakedAt: Date =
          data.stakedAt?.toDate?.() ??
          (data.stakedAt ? new Date(data.stakedAt) : new Date());
        const lockDays = Number(data.lockDays ?? 0);
        const amount = Number(data.amount ?? 1);

        const unlockAtObj: Date =
          data.unlockAt?.toDate?.() ??
          new Date(stakedAt.getTime() + lockDays * DAY_MS);

        // Safe lookups with fallbacks
        const baseDaily = Number(
          data.baseDaily ??
            (BASE_DAILY_RRGP as Record<string, number>)[nftType] ??
            0
        );
        const bonusMultiplier = Number(
          data.bonusMultiplier ?? bonusFor(lockDays) ?? 1
        );

        const result = accruedToDate({
          nftType: (isKnownType ? nftType : ("seed" as NftType)), // ensure function gets a valid enum
          amount,
          stakedAt,
          lockDays,
          now,
        });

        const scheduledTotal = Number(
          data.scheduledTotal ?? baseDaily * bonusMultiplier * lockDays * amount
        );

        totalAccrued += result.accrued;
        totalCap += scheduledTotal;

        const last: Date | undefined = data.lastAccruedAt?.toDate?.();
        const lastMs = last?.getTime?.() ?? stakedAt.getTime();
        const effectiveNow = new Date(Math.min(now.getTime(), unlockAtObj.getTime()));

        const shouldUpdate =
          effectiveNow.getTime() - lastMs >= DAY_MS ||
          Math.abs(Number(data.accruedSoFar ?? 0) - result.accrued) > 0.000001 ||
          data.scheduledTotal === undefined ||
          data.baseDaily === undefined ||
          data.bonusMultiplier === undefined;

        if (shouldUpdate) {
          const update: Record<string, any> = {
            accruedSoFar: result.accrued,
            lastAccruedAt: Timestamp.fromDate(effectiveNow),
            updatedAt: Timestamp.now(),
            baseDaily,
            bonusMultiplier,
            scheduledTotal,
          };

          if (effectiveNow.getTime() >= unlockAtObj.getTime() && data.status === "active") {
            update.status = "completed";
          }

          batch.update(ref, update);
          updates++;
        }

        return [
          {
            id,
            chainId: Number(data.chainId ?? 0),
            nftType,
            tokenId: data.tokenId ?? null,
            amount,
            stakedAt: stakedAt.toISOString(),
            unlockAt: unlockAtObj.toISOString(),
            lockDays,
            baseDaily,
            bonusMultiplier,
            scheduledTotal,
            accrued: result.accrued,
            daysCounted: result.daysCounted,
            status: data.status ?? "active",
            txHash: data.txHash ?? null,
            kolId: data.kolId ?? null,
          },
        ];
      } catch (e) {
        console.error("rewards: bad doc", id, e);
        return [];
      }
    });

    if (updates > 0) {
      await batch.commit();
    }

    items.sort((a, b) => (a.stakedAt < b.stakedAt ? 1 : -1));

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
      { status: 200 }
    );
  } catch (e: any) {
    console.error("rewards error", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to compute rewards" },
      { status: 500 }
    );
  }
}
