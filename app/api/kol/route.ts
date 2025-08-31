import { NextResponse } from "next/server";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MintEvent {
  kolId?: string;
  address: string;
  nftType: "seed" | "tree" | "solar" | "compute";
  quantity: number;
  chainId: string;
  txHash: string;
  timestamp: Timestamp | Date | { seconds: number; nanoseconds: number };
}

interface KOL {
  kolId: string;
  name: string;
  walletAddress: string;
}

interface KOLStats {
  seed: number;
  tree: number;
  solar: number;
  compute: number;
  name: string;
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
    const kolStats: { [key: string]: KOLStats } = {};
    
    // Initialize stats for all KOLs
    kolData.forEach((kol) => {
      kolStats[kol.kolId] = { 
        seed: 0, 
        tree: 0, 
        solar: 0, 
        compute: 0, 
        name: kol.name 
      };
    });

    // Process mint events
    events.forEach((event) => {
      if (event.kolId && kolStats[event.kolId]) {
        const nftType = event.nftType;
        if (nftType in kolStats[event.kolId]) {
          kolStats[event.kolId][nftType] += event.quantity;
        }
      }
    });

    // Calculate total value for each KOL
    const nftPrices = { seed: 29, tree: 59, solar: 299, compute: 899 };
    
    // Format response
    const response = Object.entries(kolStats).map(([kolId, stats]) => {
      const totalMints = stats.seed + stats.tree + stats.solar + stats.compute;
      const totalValue = (stats.seed * nftPrices.seed) + 
                        (stats.tree * nftPrices.tree) + 
                        (stats.solar * nftPrices.solar) + 
                        (stats.compute * nftPrices.compute);

      return {
        kolId,
        name: stats.name,
        seed: stats.seed,
        tree: stats.tree,
        solar: stats.solar,
        compute: stats.compute,
        totalMints,
        totalValue,
      };
    }).sort((a, b) => b.totalValue - a.totalValue); // Sort by total value descending

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        totalKols: kolData.length,
        totalEvents: events.length,
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching KOL stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch KOL statistics",
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}