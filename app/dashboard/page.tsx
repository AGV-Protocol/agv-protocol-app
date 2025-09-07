"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PerformanceCharts } from "@/components/dashboard/performance-charts";
import { OverviewChart } from "@/components/dashboard/charts/overview-chart";
import { PerformanceChart } from "@/components/dashboard/charts/performance-chart";
import { DistributionChart } from "@/components/dashboard/charts/distribution-chart";
import { TrendsChart } from "@/components/dashboard/charts/trends-chart";
import { RealTimeRefresh } from "@/components/dashboard/real-time-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Activity,
  TrendingUp
} from "lucide-react";

// Types
interface KOL {
  kolId: string;
  name: string;
  walletAddress: string;
  email?: string | null;
  target?: number;
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  updatedAt?: any;
}

interface MintEventItem {
  address: string;
  nftType: "seed" | "tree" | "solar" | "compute";
  quantity: number;
  chainId: string;
  txHash?: string | null;
  timestamp: any;
}

interface MintDoc {
  kolId: string;
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  perChain?: Record<string, { seed?: number; tree?: number; solar?: number; compute?: number }>;
  events?: MintEventItem[];
  updatedAt?: any;
}

type RangeMode = "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "YTD" | "MONTHS_IN_YEAR";

// Constants
const NFT_PRICES = { seed: 29, tree: 59, solar: 299, compute: 899 } as const;
const formatPrice = (n: number) => `$${(n || 0).toLocaleString()}`;

export default function DashboardPage() {
  // Data state
  const [kols, setKols] = useState<KOL[]>([]);
  const [mintDocs, setMintDocs] = useState<MintDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Chart state
  const [rangeMode, setRangeMode] = useState<RangeMode>("THIS_WEEK");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Data loading
  const refreshData = async () => {
    try {
      setLoading(true);
      const [ks, ms] = await Promise.all([
        getDocs(collection(db, "kols")),
        getDocs(collection(db, "mintEvents")),
      ]);
      
      setKols(
        ks.docs.map((d) => {
          const v = d.data() as any;
          return {
            kolId: v.kolId,
            name: v.name ?? "",
            walletAddress: v.walletAddress ?? "",
            email: v.email ?? null,
            target: Number(v.target ?? 0),
            seed: Number(v.seed ?? 0),
            tree: Number(v.tree ?? 0),
            solar: Number(v.solar ?? 0),
            compute: Number(v.compute ?? 0),
            updatedAt: v.updatedAt ?? null,
          } as KOL;
        })
      );
      
      setMintDocs(
        ms.docs.map((d) => {
          const v = d.data() as any;
          return {
            kolId: d.id,
            seed: Number(v.seed ?? 0),
            tree: Number(v.tree ?? 0),
            solar: Number(v.solar ?? 0),
            compute: Number(v.compute ?? 0),
            perChain: v.perChain ?? {},
            events: Array.isArray(v.events) ? v.events : [],
            updatedAt: v.updatedAt ?? null,
          } as MintDoc;
        })
      );
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const kolTotals = kols.reduce(
      (acc, k) => {
        acc.seed += Number(k.seed ?? 0);
        acc.tree += Number(k.tree ?? 0);
        acc.solar += Number(k.solar ?? 0);
        acc.compute += Number(k.compute ?? 0);
        return acc;
      },
      { seed: 0, tree: 0, solar: 0, compute: 0 }
    );

    const totalMints = kolTotals.seed + kolTotals.tree + kolTotals.solar + kolTotals.compute;
    const totalValue = 
      kolTotals.seed * NFT_PRICES.seed +
      kolTotals.tree * NFT_PRICES.tree +
      kolTotals.solar * NFT_PRICES.solar +
      kolTotals.compute * NFT_PRICES.compute;

    const totalEventsApprox = mintDocs.reduce(
      (s, d) => s + (Array.isArray(d.events) ? Math.min(d.events.length, 500) : 0),
      0
    );

    return {
      totalKols: kols.length,
      totalMints,
      totalValue,
      activeKols: kols.filter(k => (k.seed ?? 0) + (k.tree ?? 0) + (k.solar ?? 0) + (k.compute ?? 0) > 0).length,
      totalEvents: totalEventsApprox,
      onchainTotals: { seed: 0, tree: 0, solar: 0, compute: 0 }, // Placeholder
    };
  }, [kols, mintDocs]);

  const doSignOut = async () => {
    await auth.signOut();
  };

  if (loading) {
    return (
      <DashboardLayout 
        user={{
          email: auth.currentUser?.email,
          name: auth.currentUser?.displayName,
          avatar: auth.currentUser?.photoURL
        }}
        onSignOut={doSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  // Main dashboard
  return (
    <DashboardLayout 
      user={{
        email: auth.currentUser?.email,
        name: auth.currentUser?.displayName,
        avatar: auth.currentUser?.photoURL
      }}
      onSignOut={doSignOut}
    >
      <div className="space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome to the AGV Protocol admin dashboard
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <RealTimeRefresh
              onRefresh={refreshData}
              isRefreshing={loading}
              lastUpdated={lastUpdated || undefined}
              autoRefresh={autoRefresh}
              onToggleAutoRefresh={setAutoRefresh}
            />
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner size="lg" text="Loading stats..." />}>
          <StatsOverview stats={stats} />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2 w-full">
          {/* Left Column - Traditional Leaderboard */}
          <div className="order-2 lg:order-1 w-full min-w-0">
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading leaderboard..." />}>
              <Leaderboard kols={kols} />
            </Suspense>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="order-1 lg:order-2 w-full min-w-0">
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading activity..." />}>
              <RecentActivity
                mintEvents={mintDocs.flatMap(doc => doc.events || [])}
                kols={kols}
              />
            </Suspense>
          </div>
        </div>

        {/* Analytics Charts Row */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Performance Analytics</h2>
            <p className="text-muted-foreground">
              Detailed insights and visualizations of KOL performance
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {/* Overview Chart */}
            <div className="order-1">
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading overview..." />}>
                <OverviewChart kols={kols} />
              </Suspense>
            </div>

            {/* Distribution Chart */}
            <div className="order-2">
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading distribution..." />}>
                <DistributionChart kols={kols} />
              </Suspense>
            </div>
            {/* Performance Chart */}
            <div className="order-3">
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading performance..." />}>
                <PerformanceChart kols={kols} />
              </Suspense>
            </div>
            {/* Trends Chart */}
            <div className="order-4">
              <Suspense fallback={<LoadingSpinner size="sm" text="Loading trends..." />}>
                <TrendsChart kols={kols} />
              </Suspense>
            </div>
          </div>
        </div>


        {/* Performance Charts */}
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading performance charts..." />}>
          <PerformanceCharts 
            kols={kols} 
            mintEvents={mintDocs.flatMap(doc => doc.events || [])}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}