"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@/components/ui";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Trophy, Medal, Award } from "lucide-react";

interface MintEvent {
  kolId?: string;
  address: string;
  nftType: "seed" | "tree" | "solar" | "compute";
  quantity: number;
  chainId: string;
  txHash: string;
  timestamp: { seconds: number; nanoseconds: number } | Date;
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
  totalMints: number;
  totalValue: number;
}

export default function KOLDashboard() {
  const [mintEvents, setMintEvents] = useState<MintEvent[]>([]);
  const [kolStats, setKolStats] = useState<{ [key: string]: KOLStats }>({});
  const [kols, setKols] = useState<KOL[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch KOLs
        const kolSnapshot = await getDocs(collection(db, "kols"));
        const kolData: KOL[] = kolSnapshot.docs.map((doc) => doc.data() as KOL);
        setKols(kolData);

        // Fetch mint events
        const querySnapshot = await getDocs(collection(db, "mintEvents"));
        const events: MintEvent[] = querySnapshot.docs.map((doc) => doc.data() as MintEvent);
        setMintEvents(events);

        // Aggregate stats by KOL
        const stats: { [key: string]: KOLStats } = {};
        
        // Initialize stats for all KOLs
        kolData.forEach((kol) => {
          stats[kol.kolId] = { 
            seed: 0, 
            tree: 0, 
            solar: 0, 
            compute: 0, 
            name: kol.name,
            totalMints: 0,
            totalValue: 0
          };
        });

        // Calculate stats from mint events
        events.forEach((event) => {
          if (event.kolId && stats[event.kolId]) {
            const nftType = event.nftType;
            if (nftType in stats[event.kolId]) {
              stats[event.kolId][nftType] += event.quantity;
              stats[event.kolId].totalMints += event.quantity;
              
              // Calculate value based on NFT type
              const prices = { seed: 29, tree: 59, solar: 299, compute: 899 };
              stats[event.kolId].totalValue += prices[nftType] * event.quantity;
            }
          }
        });

        setKolStats(stats);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare data for AreaChart
  const chartData = Object.entries(kolStats).map(([kolId, stats]) => ({
    name: stats.name || kolId,
    seed: stats.seed,
    tree: stats.tree,
    solar: stats.solar,
    compute: stats.compute,
    total: stats.totalMints,
  }));

  // Prepare leaderboard data (sorted by total value)
  const leaderboardData = Object.entries(kolStats)
    .map(([kolId, stats]) => ({
      kolId,
      name: stats.name,
      totalMints: stats.totalMints,
      totalValue: stats.totalValue,
      seed: stats.seed,
      tree: stats.tree,
      solar: stats.solar,
      compute: stats.compute,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="font-bold text-lg">#{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Badge variant="default" className="bg-yellow-500">🏆 Champion</Badge>;
      case 1: return <Badge variant="secondary" className="bg-gray-500">🥈 Runner-up</Badge>;
      case 2: return <Badge variant="outline" className="border-amber-600">🥉 Third Place</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">KOL Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Total KOLs: {Object.keys(kolStats).length}
        </Badge>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            KOL Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>KOL Name</TableHead>
                <TableHead>KOL ID</TableHead>
                <TableHead className="text-center">Total Mints</TableHead>
                <TableHead className="text-center">Total Value</TableHead>
                <TableHead className="text-center">SeedPass</TableHead>
                <TableHead className="text-center">TreePass</TableHead>
                <TableHead className="text-center">SolarPass</TableHead>
                <TableHead className="text-center">ComputePass</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((kol, index) => (
                <TableRow key={kol.kolId} className={index < 3 ? "bg-muted/50" : ""}>
                  <TableCell className="flex items-center justify-center">
                    {getRankIcon(index)}
                  </TableCell>
                  <TableCell className="font-medium">{kol.name}</TableCell>
                  <TableCell className="font-mono text-sm">{kol.kolId}</TableCell>
                  <TableCell className="text-center font-semibold">{kol.totalMints}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">
                    ${kol.totalValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">{kol.seed}</TableCell>
                  <TableCell className="text-center">{kol.tree}</TableCell>
                  <TableCell className="text-center">{kol.solar}</TableCell>
                  <TableCell className="text-center">{kol.compute}</TableCell>
                  <TableCell>{getRankBadge(index)}</TableCell>
                </TableRow>
              ))}
              {leaderboardData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No KOL data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual KOL Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(kolStats).map(([kolId, stats]) => (
          <Card key={kolId} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{stats.name}</span>
                <Badge variant="outline" className="text-xs">
                  ID: {kolId}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                  <p className="text-xs text-muted-foreground">SeedPass</p>
                  <p className="font-semibold">{stats.seed}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                  <p className="text-xs text-muted-foreground">TreePass</p>
                  <p className="font-semibold">{stats.tree}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded">
                  <p className="text-xs text-muted-foreground">SolarPass</p>
                  <p className="font-semibold">{stats.solar}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded">
                  <p className="text-xs text-muted-foreground">ComputePass</p>
                  <p className="font-semibold">{stats.compute}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Mints:</span>
                  <span className="font-bold">{stats.totalMints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Value:</span>
                  <span className="font-bold text-green-600">${stats.totalValue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>KOL Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <AreaChart
                width={Math.max(600, chartData.length * 100)}
                height={400}
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'seed' ? 'SeedPass' : name === 'tree' ? 'TreePass' : name === 'solar' ? 'SolarPass' : 'ComputePass']}
                  labelFormatter={(label) => `KOL: ${label}`}
                />
                <Legend />
                <Area type="monotone" dataKey="seed" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="SeedPass" />
                <Area type="monotone" dataKey="tree" stackId="1" stroke="#10B981" fill="#10B981" name="TreePass" />
                <Area type="monotone" dataKey="solar" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="SolarPass" />
                <Area type="monotone" dataKey="compute" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" name="ComputePass" />
              </AreaChart>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{mintEvents.length}</p>
              <p className="text-sm text-muted-foreground">Total Mint Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Object.values(kolStats).reduce((sum, stats) => sum + stats.totalMints, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total NFTs Minted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${Object.values(kolStats).reduce((sum, stats) => sum + stats.totalValue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Value Generated</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{Object.keys(kolStats).length}</p>
              <p className="text-sm text-muted-foreground">Active KOLs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}