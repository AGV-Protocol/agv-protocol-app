// app/kol/[kolId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { User, LogIn, LogOut, Copy, Wallet } from "lucide-react";

interface KOLDoc {
  kolId: string;
  name: string;
  walletAddress: string;
  email?: string;
  target?: number;
  createdAt?: any;
  // Aggregates stored in kols collection:
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
  chainId: string; // "56" | "137" | "42161"
  txHash?: string | null;
  timestamp: { seconds: number; nanoseconds: number } | Date | any;
}

interface MintDoc {
  kolId: string; // == document id
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  perChain?: Record<
    string,
    { seed?: number; tree?: number; solar?: number; compute?: number }
  >;
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
  // IMPORTANT: Folder name must be "app/kol/[kolId]/page.tsx"
  // so that the key below is exactly "kolId"
  const params = useParams();
  const kolId = (params?.kolId as string) || "";

  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [kol, setKol] = useState<KOLDoc | null>(null);
  const [events, setEvents] = useState<MintEvent[]>([]);
  const [filter, setFilter] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "DAILY"
  );
  const [loading, setLoading] = useState(true);

  // --- Auth gate (kept minimal; Admin restrictions live on the Admin page) ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // --- Fetch via API using Firebase ID token (never read Firestore directly here) ---
  useEffect(() => {
    if (!kolId || !authReady) return;

    // If not signed in, just stop loading and render the sign-in card
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

  // --- Stats: prefer counters on kols doc; fallback to event sums ---
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

  // --- Time series from events ---
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
        // MONTHLY
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

  // Avoid SSR/hydration mismatch by computing origin on client only
  const referralLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!kol?.kolId) return "";
    return `${window.location.origin}/?kolId=${encodeURIComponent(kol.kolId)}`;
  }, [kol?.kolId]);

  const signInGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      toast.error("Sign-in failed", { description: e.message });
    }
  };

  if (loading || !authReady) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading KOL dashboard…</p>
        </div>
      </div>
    );
  }

  // Not signed in yet → prompt to sign in
  if (!auth.currentUser) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sign in to view KOL: {kolId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You need to sign in to view this page.
              </p>
              <Button onClick={signInGoogle}>
                <LogIn className="h-4 w-4 mr-2" /> Continue with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!kol) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>KOL not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We couldn’t find a KOL with ID{" "}
                <span className="font-mono">{kolId}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">KOL Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{userEmail}</Badge>
          <Button variant="secondary" onClick={() => signOut(auth)}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">KOL Name</p>
            <p className="text-xl font-semibold">{kol.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">KOL ID</p>
            <p className="font-mono">{kol.kolId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Wallet</p>
            <p className="flex items-center gap-2 font-mono truncate">
              <Wallet className="h-4 w-4" /> {kol.walletAddress}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="font-semibold">{kol.target ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Mints</p>
            <p className="font-semibold">{stats.totalMints}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="font-bold text-green-600">
              ${stats.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-muted-foreground">Referral Link</p>
            <div className="flex gap-2">
              <Input readOnly value={referralLink} />
              <Button
                variant="outline"
                onClick={() => {
                  if (referralLink) {
                    navigator.clipboard.writeText(referralLink);
                    toast.success("Copied");
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area Chart controls */}
      <Card>
        <CardHeader>
          <CardTitle>NFTs Minted — {filter}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={filter === m ? "default" : "outline"}
                onClick={() => setFilter(m)}
              >
                {m}
              </Button>
            ))}
          </div>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="seed"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  name="SeedPass"
                />
                <Area
                  type="monotone"
                  dataKey="tree"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  name="TreePass"
                />
                <Area
                  type="monotone"
                  dataKey="solar"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  name="SolarPass"
                />
                <Area
                  type="monotone"
                  dataKey="compute"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  name="ComputePass"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent mint events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mints</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>NFT Type</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events
                .slice()
                .sort(
                  (a, b) =>
                    toDate(b.timestamp).getTime() -
                    toDate(a.timestamp).getTime()
                )
                .slice(0, 25)
                .map((e, i) => (
                  <TableRow key={`${e.txHash ?? "tx"}-${i}`}>
                    <TableCell>
                      {toDate(e.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {e.nftType}
                    </TableCell>
                    <TableCell className="text-center">
                      {e.quantity}
                    </TableCell>
                    <TableCell className="font-mono truncate">
                      {e.address}
                    </TableCell>
                    <TableCell className="font-mono truncate">
                      {e.txHash ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No mint events yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
