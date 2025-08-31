"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

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

export default function KOLDashboard() {
  const [mintEvents, setMintEvents] = useState<MintEvent[]>([]);
  const [kolStats, setKolStats] = useState<{ [key: string]: { seed: number; tree: number; name: string } }>({});
  const [kols, setKols] = useState<KOL[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KOLs
        const kolSnapshot = await getDocs(collection(db, "kols"));
        const kolData: KOL[] = kolSnapshot.docs.map((doc) => doc.data() as KOL);
        setKols(kolData);

        // Fetch mint events
        const querySnapshot = await getDocs(collection(db, "mintEvents"));
        const events: MintEvent[] = querySnapshot.docs.map((doc) => doc.data() as MintEvent);
        setMintEvents(events);

        // Aggregate stats by KOL
        const stats: { [key: string]: { seed: number; tree: number; name: string } } = {};
        kolData.forEach((kol) => {
          stats[kol.kolId] = { seed: 0, tree: 0, name: kol.name };
        });
        events.forEach((event) => {
          if (event.kolId && stats[event.kolId] && (event.nftType === "seed" || event.nftType === "tree")) {
            stats[event.kolId][event.nftType] += event.quantity;
          }
        });
        setKolStats(stats);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Prepare data for AreaChart
  const chartData = Object.entries(kolStats).map(([kolId, stats]) => ({
    name: stats.name || kolId,
    seed: stats.seed,
    tree: stats.tree,
    total: stats.seed + stats.tree,
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">KOL Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Object.entries(kolStats).map(([kolId, stats]) => (
          <Card key={kolId}>
            <CardHeader>
              <CardTitle>KOL: {stats.name} (ID: {kolId})</CardTitle>
            </CardHeader>
            <CardContent>
              <p>SeedPass Mints: {stats.seed}</p>
              <p>TreePass Mints: {stats.tree}</p>
              <p>Total Mints: {stats.seed + stats.tree}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">KOL Performance</h2>
        <div style={{ width: "100%", height: "400px" }}>
          <AreaChart
            width={600}
            height={400}
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="seed" stackId="1" stroke="#FF6384" fill="#FF6384" />
            <Area type="monotone" dataKey="tree" stackId="1" stroke="#36A2EB" fill="#36A2EB" />
          </AreaChart>
        </div>
      </div>
    </div>
  );
}
