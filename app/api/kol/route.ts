import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MintEvent {
  kolId?: string;
  address: string;
  nftType: "seed" | "tree";
  quantity: number;
  chainId: string;
  txHash: string;
  timestamp: any;
}

interface KOL {
  kolId: string;
  name: string;
  walletAddress: string;
}

export async function GET() {
  try {
    // Fetch KOLs
    const kolSnapshot = await getDocs(collection(db, "kols"));
    const kolData: KOL[] = kolSnapshot.docs.map((doc) => doc.data() as KOL);

    // Fetch mint events
    const querySnapshot = await getDocs(collection(db, "mintEvents"));
    const events: MintEvent[] = querySnapshot.docs.map((doc) => doc.data() as MintEvent);

    // Aggregate stats by KOL
    const kolStats: { [key: string]: { seed: number; tree: number; name: string } } = {};
    kolData.forEach((kol) => {
      kolStats[kol.kolId] = { seed: 0, tree: 0, name: kol.name };
    });
    events.forEach((event) => {
      if (event.kolId && kolStats[event.kolId] && (event.nftType === "seed" || event.nftType === "tree")) {
        kolStats[event.kolId][event.nftType] += event.quantity;
      }
    });

    // Format response
    const response = Object.entries(kolStats).map(([kolId, stats]) => ({
      kolId,
      name: stats.name,
      seed: stats.seed,
      tree: stats.tree,
      total: stats.seed + stats.tree,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching KOL stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
