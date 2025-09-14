"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  User, 
  LogIn, 
  LogOut, 
  Copy, 
  Wallet, 
  Loader2,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AppNav } from "@/components/navigation/app-nav";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

interface KOLDoc {
  kolId: string;
  name: string;
  walletAddress: string;
  email?: string;
  target?: number;
  createdAt?: any;
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  updatedAt?: any;
}

interface MintEvent {
  address: string;
  nftType: "seed" | "tree" | "solar" | "compute";
  quantity: number;
  chainId: string;
  txHash?: string | null;
  timestamp: { seconds: number; nanoseconds: number } | Date | any;
}

interface MintDoc {
  kolId: string;
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  perChain?: Record<string, { seed?: number; tree?: number; solar?: number; compute?: number }>;
  events?: MintEvent[];
  updatedAt?: any;
}

const NFT_PRICES = {
  seed: 29,
  tree: 59,
  solar: 299,
  compute: 899,
} as const;

const toDate = (ts: any) =>
  typeof ts?.toDate === "function"
    ? ts.toDate()
    : ts instanceof Date
    ? ts
    : new Date((ts?.seconds ?? 0) * 1000);

export default function KOLPage() {
  const params = useParams();
  const kolId = (params?.kolId as string) || "";

  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [kol, setKol] = useState<KOLDoc | null>(null);
  const [events, setEvents] = useState<MintEvent[]>([]);
  const [filter, setFilter] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [loading, setLoading] = useState(true);

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Fetch KOL data
  useEffect(() => {
    if (!kolId || !authReady) return;

    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const token = await auth.currentUser!.getIdToken().catch(() => null);
        const res = await fetch(`/api/kol/${encodeURIComponent(kolId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e?.error || "Failed to fetch KOL data");
        }

        const data = (await res.json()) as {
          kol?: KOLDoc | null;
          mintDoc?: MintDoc | null;
        };

        const k = data?.kol ?? null;
        const md = data?.mintDoc ?? null;

        setKol(k);
        setEvents(Array.isArray(md?.events) ? (md!.events as MintEvent[]) : []);

        if (!k) toast.error("KOL not found");
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to load KOL data", { description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [kolId, authReady]);

  // Stats calculation
  const stats = useMemo(() => {
    const sumFromEvents = () => {
      const seed = events
        .filter((e) => e.nftType === "seed")
        .reduce((s, e) => s + (e.quantity || 0), 0);
      const tree = events
        .filter((e) => e.nftType === "tree")
        .reduce((s, e) => s + (e.quantity || 0), 0);
      const solar = events
        .filter((e) => e.nftType === "solar")
        .reduce((s, e) => s + (e.quantity || 0), 0);
      const compute = events
        .filter((e) => e.nftType === "compute")
        .reduce((s, e) => s + (e.quantity || 0), 0);
      return { seed, tree, solar, compute };
    };

    const agg =
      kol && (kol.seed ?? kol.tree ?? kol.solar ?? kol.compute) !== undefined
        ? {
            seed: Number(kol.seed ?? 0),
            tree: Number(kol.tree ?? 0),
            solar: Number(kol.solar ?? 0),
            compute: Number(kol.compute ?? 0),
          }
        : sumFromEvents();

    const totalMints = agg.seed + agg.tree + agg.solar + agg.compute;
    const totalValue =
      agg.seed * NFT_PRICES.seed +
      agg.tree * NFT_PRICES.tree +
      agg.solar * NFT_PRICES.solar +
      agg.compute * NFT_PRICES.compute;

    return { ...agg, totalMints, totalValue };
  }, [kol, events]);

  // Time series data
  const series = useMemo(() => {
    type Row = {
      _key: number;
      label: string;
      seed: number;
      tree: number;
      solar: number;
      compute: number;
    };
    const buckets = new Map<string, Row>();

    for (const e of events) {
      const d = toDate(e.timestamp);
      let keyDate: Date;

      if (filter === "DAILY") {
        keyDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      } else if (filter === "WEEKLY") {
        const monday = new Date(d);
        const day = d.getDay();
        monday.setDate(d.getDate() - ((day + 6) % 7));
        keyDate = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate()
        );
      } else {
        keyDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }

      const keyIso = keyDate.toISOString();
      const current =
        buckets.get(keyIso) ||
        ({
          _key: keyDate.getTime(),
          label:
            filter === "MONTHLY"
              ? keyDate.toLocaleString(undefined, {
                  month: "short",
                  year: "numeric",
                })
              : keyDate.toLocaleDateString(),
          seed: 0,
          tree: 0,
          solar: 0,
          compute: 0,
        } as Row);

      current[e.nftType] += e.quantity || 0;
      buckets.set(keyIso, current);
    }

    return Array.from(buckets.values()).sort((a, b) => a._key - b._key);
  }, [events, filter]);

  // Referral link
  const referralLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!kol?.kolId) return "";
    // Extract the 6-digit number from KOL ID for the referral link
    const digits = kol.kolId.match(/\d{6}/)?.[0] || "";
    return `${window.location.origin}/mint/${digits}`;
  }, [kol?.kolId]);

  const signInGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      toast.error("Sign-in failed", { description: e.message });
    }
  };

  const doSignOut = async () => {
    await signOut(auth);
  };

  // Loading state
  if (loading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading KOL dashboard..." />
      </div>
    );
  }

  // Not signed in
  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container py-24">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Sign in to view KOL: {kolId}</CardTitle>
                <CardDescription>
                  You need to sign in to view this KOL dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={signInGoogle} className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // KOL not found
  if (!kol) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav user={{ email: userEmail }} onSignOut={doSignOut} />
        <div className="container py-24">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>KOL not found</CardTitle>
                <CardDescription>
                  We couldn't find a KOL with ID {kolId}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main KOL dashboard
  return (
    <div className="min-h-screen bg-background">
      <AppNav 
        user={{ 
          email: userEmail,
          name: userEmail?.split('@')[0]
        }} 
        onSignOut={doSignOut} 
      />
      
      <div className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{kol.name}</h1>
                <p className="text-muted-foreground">KOL Dashboard</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {kol.kolId}
            </Badge>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Mints"
              value={stats.totalMints}
              description="NFTs minted"
              icon={Activity}
            />
            <StatCard
              title="Total Value"
              value={`$${stats.totalValue.toLocaleString()}`}
              description="Generated revenue"
              icon={DollarSign}
            />
            <StatCard
              title="Target"
              value={kol.target || 0}
              description="Minting target"
              icon={TrendingUp}
            />
            <StatCard
              title="Referrals"
              value={events.length}
              description="Referral events"
              icon={Users}
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">KOL Name</label>
                        <p className="text-lg font-semibold">{kol.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">KOL ID</label>
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{kol.kolId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded break-all">{kol.walletAddress}</p>
                      </div>
                      {kol.email && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-sm">{kol.email}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Link */}
                <Card>
                  <CardHeader>
                    <CardTitle>Referral Link</CardTitle>
                    <CardDescription>
                      Share this link to track referrals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        readOnly
                        value={referralLink}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-muted text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (referralLink) {
                            navigator.clipboard.writeText(referralLink);
                            toast.success("Copied referral link");
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={referralLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Referral Link
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* NFT Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>NFT Breakdown</CardTitle>
                  <CardDescription>
                    Detailed breakdown of minted NFTs by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      { type: "seed", name: "SeedPass", price: 29, color: "bg-blue-500" },
                      { type: "tree", name: "TreePass", price: 59, color: "bg-green-500" },
                      { type: "solar", name: "SolarPass", price: 299, color: "bg-yellow-500" },
                      { type: "compute", name: "ComputePass", price: 899, color: "bg-purple-500" },
                    ].map((nft) => {
                      const count = stats[nft.type as keyof typeof stats] as number;
                      const value = count * nft.price;
                      
                      return (
                        <div key={nft.type} className="p-4 border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${nft.color}`} />
                            <span className="font-medium">{nft.name}</span>
                          </div>
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground">
                            ${value.toLocaleString()} value
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Minting Analytics</span>
                    <div className="flex space-x-2">
                      {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((f) => (
                        <Button
                          key={f}
                          variant={filter === f ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </Button>
                      ))}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Track minting performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {series.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="seed" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="SeedPass" />
                          <Area type="monotone" dataKey="tree" stackId="1" stroke="#10B981" fill="#10B981" name="TreePass" />
                          <Area type="monotone" dataKey="solar" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="SolarPass" />
                          <Area type="monotone" dataKey="compute" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" name="ComputePass" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState
                      icon={BarChart3}
                      title="No analytics data"
                      description="Analytics will appear here once minting activity begins"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Minting Activity</CardTitle>
                  <CardDescription>
                    Latest minting events and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <div className="space-y-4">
                      {events
                        .slice()
                        .sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime())
                        .slice(0, 10)
                        .map((event, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-3 h-3 rounded-full ${
                                event.nftType === "seed" ? "bg-blue-500" :
                                event.nftType === "tree" ? "bg-green-500" :
                                event.nftType === "solar" ? "bg-yellow-500" : "bg-purple-500"
                              }`} />
                              <div>
                                <p className="font-medium capitalize">{event.nftType}Pass</p>
                                <p className="text-sm text-muted-foreground">
                                  {toDate(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Qty: {event.quantity}</p>
                              <p className="text-sm text-muted-foreground">
                                ${(event.quantity * NFT_PRICES[event.nftType]).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No activity yet"
                      description="Minting activity will appear here once users start minting through your referral link"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}