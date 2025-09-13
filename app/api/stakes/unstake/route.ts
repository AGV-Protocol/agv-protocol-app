// app/api/stakes/unstake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { accruedToDate, NftType } from "@/lib/rewards";

type Body = { id: string; unstakedAt?: string };

export async function POST(req: NextRequest) {
  try {
    const { id, unstakedAt } = (await req.json()) as Body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const ref = adminDb.collection("stakes").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
    const d = snap.data() as any;

    const asOf = unstakedAt ? new Date(unstakedAt) : new Date();

    const final = accruedToDate({
      nftType: d.nftType as NftType,
      amount: Number(d.amount),
      stakedAt: d.stakedAt.toDate(),
      lockDays: Number(d.lockDays),
      now: asOf,
    });

    await ref.update({
      accruedSoFar: final.accrued,
      lastAccruedAt: Timestamp.fromDate(asOf),
      status: "completed",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ id, finalAccrued: final.accrued }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
