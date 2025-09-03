export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebaseAdmin";
import { requireAdmin } from "../_auth";

type Body = {
  name: string;
  walletAddress: string;
  email?: string | null;
  target?: number;
};

const makeKolId = () =>
  `AGV-KOL${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;

export async function POST(req: NextRequest) {
  try {
    const decoded = await requireAdmin(req);
    if (!decoded) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, walletAddress, email = null, target = 0 } = (await req.json()) as Body;
    if (!name || !walletAddress) {
      return NextResponse.json({ error: "Name and walletAddress are required" }, { status: 400 });
    }

    // unique-ish kolId (few tries)
    let kolId = makeKolId();
    for (let i = 0; i < 5; i++) {
      const snap = await adminDb.collection("kols").where("kolId", "==", kolId).limit(1).get();
      if (snap.empty) break;
      kolId = makeKolId();
    }

    await adminDb.collection("kols").add({
      kolId,
      name,
      walletAddress,
      email,
      target: Number(target) || 0,
      seed: 0,
      tree: 0,
      solar: 0,
      compute: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await adminDb.collection("mintEvents").doc(kolId).set(
      {
        kolId,
        seed: 0,
        tree: 0,
        solar: 0,
        compute: 0,
        perChain: {},
        events: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const originHeader = req.headers.get("origin");
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      originHeader ||
      ""; // fallback to empty (client will build its own link)
    const referralLink = base ? `${base}/?kolId=${encodeURIComponent(kolId)}` : null;

    return NextResponse.json({ kolId, referralLink }, { status: 200 });
  } catch (err: any) {
    console.error("create-kol error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
