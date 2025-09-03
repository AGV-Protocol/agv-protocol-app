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
import { User, LogIn, LogOut, Copy, Wallet, Loader2 } from "lucide-react";

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

  // ---------- Styled helpers ----------
  const Card: React.FC<{ title?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "1rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {(title || right) && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>{title}</div>
          {right}
        </div>
      )}
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );

  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontSize: ".875rem", color: "#6b7280", marginBottom: ".25rem" }}>{children}</p>
  );

  const Mono: React.FC<{ children: React.ReactNode; truncate?: boolean }> = ({ children, truncate }) => (
    <span style={{ fontFamily: "monospace", whiteSpace: truncate ? "nowrap" : undefined, overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined }}>
      {children}
    </span>
  );

  const SolidButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
    <button
      {...rest}
      style={{
        backgroundColor: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "0.5rem",
        padding: ".5rem .8rem",
        cursor: "pointer",
        fontWeight: "medium",
        ...style,
      }}
    >
      {children}
    </button>
  );

  const OutlineButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...rest }) => (
    <button
      {...rest}
      style={{
        background: "transparent",
        color: "#111827",
        border: "1px solid #d1d5db",
        borderRadius: "0.5rem",
        padding: ".45rem .8rem",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );

  const ToggleButton: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        padding: ".35rem .75rem",
        borderRadius: ".5rem",
        border: "1px solid #e5e7eb",
        backgroundColor: active ? "#111827" : "#f1f5f9",
        color: active ? "#fff" : "#111827",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  // ---------- Screens ----------
  if (loading || !authReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#e6f0fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".75rem",
            width: "100%",
            maxWidth: "28rem",
          }}
        >
          <Loader2 style={{ height: 28, width: 28, color: "#2563eb", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#374151" }}>Loading KOL dashboard…</p>
        </div>
      </div>
    );
  }

  // Not signed in yet → prompt to sign in
  if (!auth.currentUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <Card
            title={<h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>Sign in to view KOL: {kolId}</h2>}
          >
            <p style={{ fontSize: ".9rem", color: "#6b7280", marginBottom: ".75rem" }}>
              You need to sign in to view this page.
            </p>
            <SolidButton onClick={signInGoogle}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}>
                <LogIn size={16} /> Continue with Google
              </span>
            </SolidButton>
          </Card>
        </div>
      </div>
    );
  }

  if (!kol) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "32rem" }}>
          <Card title={<h2 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>KOL not found</h2>}>
            <p style={{ color: "#6b7280" }}>
              We couldn’t find a KOL with ID <Mono>{kolId}</Mono>.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Main ----------
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", display: "grid", gap: "1rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: ".25rem .25rem",
          }}
        >
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827" }}>KOL Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <span
              style={{
                border: "1px solid #d1d5db",
                padding: ".25rem .5rem",
                borderRadius: "9999px",
                fontSize: ".875rem",
                color: "#374151",
                background: "#fff",
              }}
              title={userEmail ?? ""}
            >
              {userEmail}
            </span>
            <OutlineButton onClick={() => signOut(auth)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
                <LogOut size={16} /> Sign out
              </span>
            </OutlineButton>
          </div>
        </div>

        {/* Profile Card */}
        <Card
          title={
            <>
              <User size={18} />
              <span style={{ fontWeight: 700 }}>Profile</span>
            </>
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            {/* Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
              <div>
                <Label>KOL Name</Label>
                <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>{kol.name}</p>
              </div>
              <div>
                <Label>KOL ID</Label>
                <Mono>{kol.kolId}</Mono>
              </div>
              <div>
                <Label>Wallet</Label>
                <p style={{ display: "flex", alignItems: "center", gap: ".4rem", margin: 0 }}>
                  <Wallet size={16} />
                  <Mono truncate>{kol.walletAddress}</Mono>
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
              <div>
                <Label>Target</Label>
                <p style={{ fontWeight: 600 }}>{kol.target ?? 0}</p>
              </div>
              <div>
                <Label>Total Mints</Label>
                <p style={{ fontWeight: 600 }}>{stats.totalMints}</p>
              </div>
              <div>
                <Label>Total Value</Label>
                <p style={{ fontWeight: 700, color: "#059669" }}>
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Referral */}
            <div>
              <Label>Referral Link</Label>
              <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                <input
                  readOnly
                  value={referralLink}
                  style={{
                    flex: 1,
                    padding: ".6rem .75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: ".5rem",
                    outline: "none",
                  }}
                />
                <OutlineButton
                  onClick={() => {
                    if (referralLink) {
                      navigator.clipboard.writeText(referralLink);
                      toast.success("Copied");
                    }
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
                    <Copy size={16} /> Copy
                  </span>
                </OutlineButton>
              </div>
            </div>
          </div>
        </Card>

        {/* Area Chart */}
        <Card
          title={<span style={{ fontWeight: 700 }}>NFTs Minted — {filter}</span>}
          right={
            <div style={{ display: "flex", gap: ".5rem" }}>
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((m) => (
                <ToggleButton key={m} active={filter === m} onClick={() => setFilter(m)}>
                  {m}
                </ToggleButton>
              ))}
            </div>
          }
        >
          <div style={{ height: 360, width: "100%" }}>
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
        </Card>

        {/* Recent Mints */}
        <Card title={<span style={{ fontWeight: 700 }}>Recent Mints</span>}>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: ".925rem",
              }}
            >
              <thead>
                <tr>
                  {["Date", "NFT Type", "Qty", "Wallet", "Tx"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 2 ? "center" : "left",
                        color: "#374151",
                        fontWeight: 600,
                        padding: ".75rem",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#f9fafb",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events
                  .slice()
                  .sort(
                    (a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime()
                  )
                  .slice(0, 25)
                  .map((e, i) => (
                    <tr key={`${e.txHash ?? "tx"}-${i}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: ".75rem", color: "#374151" }}>
                        {toDate(e.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: ".75rem", textTransform: "capitalize", color: "#374151" }}>
                        {e.nftType}
                      </td>
                      <td style={{ padding: ".75rem", textAlign: "center", color: "#111827" }}>
                        {e.quantity}
                      </td>
                      <td style={{ padding: ".75rem", color: "#111827", maxWidth: 240 }}>
                        <Mono truncate>{e.address}</Mono>
                      </td>
                      <td style={{ padding: ".75rem", color: "#6b7280", maxWidth: 240 }}>
                        <Mono truncate>{e.txHash ?? "—"}</Mono>
                      </td>
                    </tr>
                  ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      No mint events yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
