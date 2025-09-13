// app/api/stakes/unstake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type Body =
  | { ids: string[] } // direct doc ids
  | {
      wallet: string;
      chainId: number | string;
      nftType: "seed" | "tree" | "solar" | "compute";
      tokenIds: string[];
    };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    const col = adminDb.collection("stakes");

    // If caller passed explicit doc IDs, delete those
    if ("ids" in body) {
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return NextResponse.json({ error: "ids must be non-empty" }, { status: 400 });
      }
      const batch = adminDb.batch();
      for (const id of body.ids) batch.delete(col.doc(id));
      await batch.commit();
      return NextResponse.json({ ok: true, deleted: body.ids.length }, { status: 200 });
    }

    // Otherwise compute IDs by tuple
    const wallet = body.wallet?.toLowerCase?.();
    const chainId = body.chainId;
    const nftType = body.nftType;
    const tokenIds = body.tokenIds;

    if (!wallet || !chainId || !nftType || !Array.isArray(tokenIds) || tokenIds.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const batch = adminDb.batch();
    for (const tokenId of tokenIds) {
      const id = `${chainId}:${wallet}:${nftType}:${tokenId}`.toLowerCase();
      batch.delete(col.doc(id));
    }
    await batch.commit();

    return NextResponse.json({ ok: true, deleted: tokenIds.length }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
