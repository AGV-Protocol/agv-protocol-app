// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, getIdTokenResult, signInWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Trophy, Medal, Award, LogOut, ShieldCheck, LogIn, Trash2, Users, ExternalLink, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// --- thirdweb (on-chain totals) ---
import { createThirdwebClient, getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import type { CollectionKey } from "@/lib/contracts";
import { CHAINS, NFT_CONTRACTS, NFT_ABI } from "@/lib/contracts";

// ---------- Types ----------
type ChainId = "56" | "137" | "42161";

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
  timestamp: any; // Firestore Timestamp | Date | FieldValue
}

interface MintDoc {
  kolId: string; // equals doc id
  seed?: number;
  tree?: number;
  solar?: number;
  compute?: number;
  perChain?: Record<string, { seed?: number; tree?: number; solar?: number; compute?: number }>;
  events?: MintEventItem[];
  updatedAt?: any;
}

type UnlockMode = "team" | "kol";
type UiRole = "Admin" | "BD" | "Tech" | "Finance" | "Security" | "Other";
type RangeMode = "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "YTD" | "MONTHS_IN_YEAR";

// ---------- Helpers ----------
const NFT_PRICES = { seed: 29, tree: 59, solar: 299, compute: 899 } as const;
const formatPrice = (n: number) => `$${(n || 0).toLocaleString()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const n = (x: any) => (x ? Number(x) : 0);

function getWeekRange(base = new Date(), last = false) {
  const day = base.getDay();
  const diffToMon = (day + 6) % 7;
  const monday = startOfDay(addDays(base, last ? -diffToMon - 7 : -diffToMon));
  const sunday = addDays(monday, 6);
  return { start: monday, end: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999) };
}
function getMonthRange(base = new Date(), last = false) {
  const month = last ? base.getMonth() - 1 : base.getMonth();
  const year = base.getFullYear() + (month < 0 ? -1 : 0);
  const m = (month + 12) % 12;
  return { start: new Date(year, m, 1), end: new Date(year, m + 1, 0, 23, 59, 59, 999) };
}
function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K) {
  return arr.reduce((acc, cur) => {
    const k = key(cur);
    (acc[k] ||= []).push(cur);
    return acc;
  }, {} as Record<K, T[]>);
}
function toDate(ts: any) {
  if (!ts) return new Date();
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (ts instanceof Date) return ts;
  const seconds = ts?.seconds ?? 0;
  return new Date(seconds * 1000);
}
function makeKolId() {
  const num = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `AGV-KOL${num}`;
}
const uiSelectRoles: UiRole[] = ["Admin", "BD", "Tech", "Finance", "Security", "Other"];
const uiToClaimRole = (ui: UiRole) =>
  ui === "Admin" ? "admin" :
  ui === "BD" ? "bd" :
  ui === "Tech" ? "tech" :
  ui === "Finance" ? "finance" :
  ui === "Security" ? "security" : null;

const eqi = (a?: string | null, b?: string | null) =>
  (a ?? "").toString().trim().toLowerCase() === (b ?? "").toString().trim().toLowerCase();

const asStringArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p.map(String) : [val]; }
    catch { return [val]; }
  }
  return [];
};

// ---------- UI primitives ----------
const Card = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ background: "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>{title}</h3>
      {right}
    </div>
    <div style={{ padding: "1rem" }}>{children}</div>
  </div>
);
const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div style={{ backgroundColor: "#f9fafb", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", textAlign: "center" }}>
    <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{label}</div>
  </div>
);
const rankIcon = (i: number) =>
  i === 0 ? <Trophy style={{ height: 20, width: 20, color: "#f59e0b" }} /> :
  i === 1 ? <Medal style={{ height: 20, width: 20, color: "#9ca3af" }} /> :
  i === 2 ? <Award style={{ height: 20, width: 20, color: "#b45309" }} /> :
  <span style={{ fontWeight: 700 }}>#{i + 1}</span>;

// --- thirdweb client (admin) ---
const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});
function useNftContract(nft: keyof typeof NFT_ABI, chainId: ChainId) {
  return useMemo(() => {
    const addr = NFT_CONTRACTS[nft]?.[chainId];
    if (!addr) return null;
    return getContract({
      client: thirdwebClient,
      address: addr,
      chain: CHAINS[chainId].chain,
      abi: NFT_ABI[nft as CollectionKey],
    });
  }, [nft, chainId]);
}

// ---------- Component ----------
export default function AdminPage() {
  const router = useRouter();

  // --- Hooks (ALL hooks are declared BEFORE any conditional return) ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [authLoading, setAuthLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await getIdTokenResult(u, true);
        setClaims(token.claims || {});
      } else {
        setClaims({});
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Gate state
  const [unlockMode, setUnlockMode] = useState<UnlockMode>("team");
  const [uiRole, setUiRole] = useState<UiRole>("Tech");
  const [code, setCode] = useState("");
  const [kolDigits, setKolDigits] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(false);

  // Data state
  const [kols, setKols] = useState<KOL[]>([]);
  const [mintDocs, setMintDocs] = useState<MintDoc[]>([]);

  // Chart state
  const [rangeMode, setRangeMode] = useState<RangeMode>("THIS_WEEK");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // KOL creation form
  const [kolForm, setKolForm] = useState<{ name: string; walletAddress: string; email: string; target: string; }>({
    name: "", walletAddress: "", email: "", target: "",
  });
  const [referralLink, setReferralLink] = useState<string>("");

  // Pagination
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(0);

  // KOL creation state
  const [creatingKol, setCreatingKol] = useState(false);
  const [createKolState, setCreateKolState] = useState<"idle" | "success" | "error">("idle");

  // ---- Permissions helpers
  const hasAnyClaim = (...roles: string[]) => {
    const r = (claims?.roles ?? []) as string[];
    const single = (claims?.role ?? "") as string;
    const uiClaim = uiToClaimRole(uiRole) || "";
    return (Array.isArray(r) && roles.some((x) => r.includes(x))) || roles.includes(single) || roles.includes(uiClaim);
  };
  const canCreateKOL = hasAnyClaim("admin", "bd", "tech", "finance", "security");
  const canDeleteKOL = hasAnyClaim("admin");

  // ---- Thirdweb contracts & reads (hooks)
  const seed56 = useNftContract("seed", "56");
  const seed137 = useNftContract("seed", "137");
  const seed42161 = useNftContract("seed", "42161");
  const tree56 = useNftContract("tree", "56");
  const tree137 = useNftContract("tree", "137");
  const tree42161 = useNftContract("tree", "42161");
  const solar56 = useNftContract("solar", "56");
  const solar137 = useNftContract("solar", "137");
  const solar42161 = useNftContract("solar", "42161");
  const compute56 = useNftContract("compute", "56");
  const compute137 = useNftContract("compute", "137");
  const compute42161 = useNftContract("compute", "42161");

  const { data: seed56S } = useReadContract({ contract: seed56!, method: "totalSupply", params: [], queryOptions: { enabled: !!seed56 } });
  const { data: seed137S } = useReadContract({ contract: seed137!, method: "totalSupply", params: [], queryOptions: { enabled: !!seed137 } });
  const { data: seed42161S } = useReadContract({ contract: seed42161!, method: "totalSupply", params: [], queryOptions: { enabled: !!seed42161 } });

  const { data: tree56S } = useReadContract({ contract: tree56!, method: "totalSupply", params: [], queryOptions: { enabled: !!tree56 } });
  const { data: tree137S } = useReadContract({ contract: tree137!, method: "totalSupply", params: [], queryOptions: { enabled: !!tree137 } });
  const { data: tree42161S } = useReadContract({ contract: tree42161!, method: "totalSupply", params: [], queryOptions: { enabled: !!tree42161 } });

  const { data: solar56S } = useReadContract({ contract: solar56!, method: "totalSupply", params: [], queryOptions: { enabled: !!solar56 } });
  const { data: solar137S } = useReadContract({ contract: solar137!, method: "totalSupply", params: [], queryOptions: { enabled: !!solar137 } });
  const { data: solar42161S } = useReadContract({ contract: solar42161!, method: "totalSupply", params: [], queryOptions: { enabled: !!solar42161 } });

  const { data: compute56S } = useReadContract({ contract: compute56!, method: "totalSupply", params: [], queryOptions: { enabled: !!compute56 } });
  const { data: compute137S } = useReadContract({ contract: compute137!, method: "totalSupply", params: [], queryOptions: { enabled: !!compute137 } });
  const { data: compute42161S } = useReadContract({ contract: compute42161!, method: "totalSupply", params: [], queryOptions: { enabled: !!compute42161 } });

  // ---- Derived on-chain totals
  const onchainTotals = useMemo(() => ({
    seed: n(seed56S) + n(seed137S) + n(seed42161S),
    tree: n(tree56S) + n(tree137S) + n(tree42161S),
    solar: n(solar56S) + n(solar137S) + n(solar42161S),
    compute: n(compute56S) + n(compute137S) + n(compute42161S),
    perChain: {
      "56": { seed: n(seed56S), tree: n(tree56S), solar: n(solar56S), compute: n(compute56S) },
      "137": { seed: n(seed137S), tree: n(tree137S), solar: n(solar137S), compute: n(compute137S) },
      "42161": { seed: n(seed42161S), tree: n(tree42161S), solar: n(solar42161S), compute: n(compute42161S) },
    } as Record<ChainId, Record<"seed" | "tree" | "solar" | "compute", number>>,
  }), [
    seed56S, seed137S, seed42161S,
    tree56S, tree137S, tree42161S,
    solar56S, solar137S, solar42161S,
    compute56S, compute137S, compute42161S,
  ]);

  // ---- Data loaders (not hooks)
  const refreshData = async () => {
    const [ks, ms] = await Promise.all([getDocs(collection(db, "kols")), getDocs(collection(db, "mintEvents"))]);
    setKols(ks.docs.map((d) => {
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
    }));
    setMintDocs(ms.docs.map((d) => {
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
    }));
  };

  // ---- Actions (not hooks)
  const signInGoogle = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); toast.success("Signed in with Google"); }
    catch (e: any) { toast.error("Google sign-in failed", { description: e.message }); }
  };
  const signInEmail = async (email: string, password: string) => {
    try { await signInWithEmailAndPassword(auth, email, password); toast.success("Signed in"); }
    catch (e: any) { toast.error("Email sign-in failed", { description: e.message }); }
  };
  const doSignOut = async () => { await signOut(auth); setAccessGranted(false); };

  const verifyAccess = async () => {
    if (!code.trim()) return toast.error("Code required", { description: "Enter your team ID" });
    try {
      setChecking(true);
      if (!auth.currentUser) return toast.error("Sign-in required", { description: "Please sign in first" });

      const ref = doc(db, "allows", code.trim());
      const snap = await getDoc(ref);
      if (!snap.exists()) { setAccessGranted(false); return toast.error("Invalid code", { description: "No access record found" }); }
      const data = snap.data() || {};
      const roleField = data.role ? String(data.role) : "";
      const rolesField = asStringArray(data.roles);
      const claimLower = (uiToClaimRole(uiRole) ?? "").toLowerCase();

      const ok =
        roleField === "*" ||
        eqi(roleField, uiRole) || eqi(roleField, claimLower) ||
        rolesField.some((r: string) => eqi(r, uiRole) || eqi(r, claimLower));

      if (!ok) { setAccessGranted(false); return toast.error("Code not authorized", { description: `This code is not valid for ${uiRole}` }); }

      await refreshData();
      setAccessGranted(true);
      toast.success("Access granted");
    } catch (e: any) {
      toast.error("Check failed", { description: e.message });
    } finally {
      setChecking(false);
    }
  };

  const goToKolPage = () => {
    const digits = (kolDigits || "").replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) return toast.error("Enter 6 digits for KOL ID");
    router.push(`/kol/AGV-KOL${digits}`);
  };

    const createKOL = async () => {
    if (!auth.currentUser) return toast.error("Sign-in required");

    // Align UI with your Firestore rules: Admin-only
    if (!canCreateKOL) {
      return toast.error("Insufficient role", {
        description: "Only Admin can create KOLs.",
      });
    }

    const { name, walletAddress, email, target } = kolForm;
    if (!name || !walletAddress) {
      return toast.error("Name and Wallet are required");
    }

    try {
      // Refresh custom claims so rules see latest role
      await auth.currentUser.getIdToken(true);

      // Generate a unique kolId by probing mintEvents/{kolId}
      let kolId = makeKolId();
      for (let i = 0; i < 5; i++) {
        const mintRef = doc(db, "mintEvents", kolId);
        const exists = await getDoc(mintRef);
        if (!exists.exists()) break; // free to use
        kolId = makeKolId(); // regenerate on collision (very rare)
      }

      // Final safety check right before writing (avoid accidental overwrite)
      const mintRef = doc(db, "mintEvents", kolId);
      const already = await getDoc(mintRef);
      if (already.exists()) {
        throw new Error("KOL ID collision detected. Please try again.");
      }

      // 1) Create kols/{randomId} with kolId as a field
      await addDoc(collection(db, "kols"), {
        kolId,
        name,
        walletAddress,
        email: email || null,
        target: target ? Number(target) : 0,
        seed: 0,
        tree: 0,
        solar: 0,
        compute: 0,
        updatedAt: serverTimestamp(),
      } as KOL);

      // 2) Initialize mintEvents/{kolId} (docId = kolId). Firestore rules require body.kolId === docId.
      await setDoc(mintRef, {
        kolId,
        seed: 0,
        tree: 0,
        solar: 0,
        compute: 0,
        perChain: {},
        events: [],
        updatedAt: serverTimestamp(),
      } as MintDoc);

      await refreshData();

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/?kolId=${encodeURIComponent(kolId)}`;
      setReferralLink(link);

      toast.success("KOL created", { description: "Referral link generated" });
      setKolForm({ name: "", walletAddress: "", email: "", target: "" });
      setPage(0);
    } catch (e: any) {
      const msg =
        e?.code === "permission-denied"
          ? "Permission denied by Firestore rules. Only Admin can create KOLs."
          : e?.message || String(e);
      toast.error("Failed to create KOL", { description: msg });
    }
  };


  const deleteKOL = async (kolId: string) => {
    if (!canDeleteKOL) return toast.error("Only Admin can delete KOLs");
    try {
      const ks = await getDocs(collection(db, "kols"));
      const target = ks.docs.find((d) => (d.data() as any).kolId === kolId);
      if (!target) return toast.error("KOL not found");
      await deleteDoc(doc(db, "kols", target.id));
      setKols((prev) => prev.filter((k) => k.kolId !== kolId));
      setPage(0);
      toast.success("KOL deleted");
      // preserve mintEvents/{kolId} unless you want to purge
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    }
  };

  // ---------- Aggregations (ALL useMemo BEFORE any conditional return) ----------
  const leaderboard = useMemo(() => {
    const rows = kols.map((k) => {
      const seed = n(k.seed), tree = n(k.tree), solar = n(k.solar), compute = n(k.compute);
      const totalMints = seed + tree + solar + compute;
      const totalValue = seed * NFT_PRICES.seed + tree * NFT_PRICES.tree + solar * NFT_PRICES.solar + compute * NFT_PRICES.compute;
      return { kolId: k.kolId, name: k.name, seed, tree, solar, compute, totalMints, totalValue };
    });
    return rows.sort((a, b) => b.totalValue - a.totalValue);
  }, [kols]);

  const kolTotals = useMemo(() => {
    return kols.reduce((acc, k) => {
      acc.seed += n(k.seed);
      acc.tree += n(k.tree);
      acc.solar += n(k.solar);
      acc.compute += n(k.compute);
      return acc;
    }, { seed: 0, tree: 0, solar: 0, compute: 0 });
  }, [kols]);

  const kolPerChainTotals = useMemo(() => {
    const acc: Record<"seed"|"tree"|"solar"|"compute", Record<string, number>> = {
      seed: {}, tree: {}, solar: {}, compute: {}
    };
    for (const d of mintDocs) {
      const pc = d.perChain || {};
      Object.entries(pc).forEach(([chain, bucket]) => {
        acc.seed[chain] = (acc.seed[chain] || 0) + n((bucket as any).seed);
        acc.tree[chain] = (acc.tree[chain] || 0) + n((bucket as any).tree);
        acc.solar[chain] = (acc.solar[chain] || 0) + n((bucket as any).solar);
        acc.compute[chain] = (acc.compute[chain] || 0) + n((bucket as any).compute);
      });
    }
    return acc;
  }, [mintDocs]);

  const timeFiltered = useMemo(() => {
    const all: MintEventItem[] = [];
    for (const d of mintDocs) {
      const evs = Array.isArray(d.events) ? d.events : [];
      const sorted = [...evs].sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime());
      all.push(...sorted.slice(-500));
    }
    const seen = new Set<string>();
    const deduped = all.filter((e) => {
      const h = e.txHash?.toLowerCase();
      if (!h) return true;
      if (seen.has(h)) return false;
      seen.add(h);
      return true;
    });

    const now = new Date();
    let start = new Date(0), end = new Date();
    if (rangeMode === "THIS_WEEK") ({ start, end } = getWeekRange(now, false));
    if (rangeMode === "LAST_WEEK") ({ start, end } = getWeekRange(now, true));
    if (rangeMode === "THIS_MONTH") ({ start, end } = getMonthRange(now, false));
    if (rangeMode === "LAST_MONTH") ({ start, end } = getMonthRange(now, true));
    if (rangeMode === "YTD") { start = new Date(now.getFullYear(), 0, 1); end = now; }

    const filtered = deduped.filter((e) => {
      const d = toDate(e.timestamp);
      return rangeMode === "MONTHS_IN_YEAR" ? d.getFullYear() === selectedYear : d >= start && d <= end;
    });

    if (rangeMode === "MONTHS_IN_YEAR") {
      const byMonth = Array.from({ length: 12 }, (_, i) => ({
        label: new Date(selectedYear, i, 1).toLocaleString(undefined, { month: "short" }),
        ts: new Date(selectedYear, i, 1).getTime(),
        seed: 0, tree: 0, solar: 0, compute: 0,
      }));
      filtered.forEach((e) => {
        const d = toDate(e.timestamp);
        const idx = d.getMonth();
        byMonth[idx][e.nftType] += e.quantity;
      });
      return byMonth.sort((a, b) => a.ts - b.ts).map(({ ts, ...rest }) => rest);
    }

    const byDay = groupBy(filtered, (e) => startOfDay(toDate(e.timestamp)).toISOString());
    const rows = Object.entries(byDay).map(([iso, list]) => {
      const day = new Date(iso);
      const acc = { seed: 0, tree: 0, solar: 0, compute: 0 } as any;
      list.forEach((e) => { acc[e.nftType] += e.quantity; });
      return { label: day.toLocaleDateString(), ts: day.getTime(), ...acc };
    });
    return rows.sort((a, b) => a.ts - b.ts).map(({ ts, ...rest }) => rest);
  }, [mintDocs, rangeMode, selectedYear]);

  const totalEventsApprox = useMemo(
    () => mintDocs.reduce((s, d) => s + (Array.isArray(d.events) ? Math.min(d.events.length, 500) : 0), 0),
    [mintDocs]
  );

  // Pagination slice (useMemo to be consistent)
  const pageCount = Math.max(1, Math.ceil(kols.length / PAGE_SIZE));
  const visibleKols = useMemo(
    () => kols.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [kols, page]
  );

  // ---------- Early returns (AFTER ALL HOOKS) ----------
  if (authLoading || !isClient) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ height: 32, width: 32, borderRadius: "50%", border: "3px solid #93c5fd", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Card title="Sign in to Admin" right={<ShieldCheck size={18} color="#2563eb" />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={signInGoogle}
                style={{ padding: "0.9rem", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <LogIn size={16} /> Continue with Google
                </span>
              </button>
              <details>
                <summary style={{ cursor: "pointer", color: "#374151" }}>Sign in with Email/Password</summary>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  <input id="email" placeholder="email@domain.com" type="email" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }} />
                  <input id="pwd" placeholder="password" type="password" style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }} />
                  <button
                    onClick={() => {
                      const email = (document.getElementById("email") as HTMLInputElement)?.value || "";
                      const pwd = (document.getElementById("pwd") as HTMLInputElement)?.value || "";
                      if (!email || !pwd) return toast.error("Email & Password required");
                      signInEmail(email, pwd);
                    }}
                    style={{ padding: "0.9rem", borderRadius: 12, border: "1px solid #e5e7eb", background: "#111827", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Sign in
                  </button>
                </div>
              </details>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "32rem" }}>
          <Card
            title="Access"
            right={
              <button onClick={doSignOut} style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }} title="Sign out">
                <LogOut size={16} />
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 14, color: "#374151" }}>Access Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setUnlockMode("team")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: unlockMode === "team" ? "#111827" : "#fff",
                    color: unlockMode === "team" ? "#fff" : "#111827",
                    cursor: "pointer",
                  }}
                >
                  Team ID
                </button>
                <button
                  onClick={() => setUnlockMode("kol")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: unlockMode === "kol" ? "#111827" : "#fff",
                    color: unlockMode === "kol" ? "#fff" : "#111827",
                    cursor: "pointer",
                  }}
                >
                  KOL
                </button>
              </div>

              {unlockMode === "team" ? (
                <>
                  <label style={{ fontSize: 14, color: "#374151" }}>Select Role</label>
                  <select
                    value={uiRole}
                    onChange={(e) => setUiRole(e.target.value as UiRole)}
                    style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
                  >
                    {uiSelectRoles.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>

                  <label style={{ fontSize: 14, color: "#374151" }}>Enter Team ID</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. Team-Id"
                    style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
                  />
                  <button
                    onClick={verifyAccess}
                    disabled={checking}
                    style={{
                      marginTop: 8,
                      padding: "0.9rem",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: 0,
                      borderRadius: 12,
                      cursor: checking ? "wait" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {checking ? "Checking…" : "Unlock Dashboard"}
                  </button>
                </>
              ) : (
                <>
                  <label style={{ fontSize: 14, color: "#374151" }}>KOL ID (numbers only, 6 digits)</label>
                  <input
                    value={kolDigits}
                    onChange={(e) => setKolDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="e.g. 123456 (AGV-KOL123456)"
                    inputMode="numeric"
                    style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8, letterSpacing: 2 }}
                  />
                  <button
                    onClick={goToKolPage}
                    style={{ marginTop: 8, padding: "0.9rem", backgroundColor: "#111827", color: "#fff", border: 0, borderRadius: 12, cursor: "pointer", fontWeight: 700 }}
                  >
                    Go to KOL Page
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Metrics/consts for render ----------
  const totalMints = kolTotals.seed + kolTotals.tree + kolTotals.solar + kolTotals.compute;
  const totalValue =
    kolTotals.seed * NFT_PRICES.seed +
    kolTotals.tree * NFT_PRICES.tree +
    kolTotals.solar * NFT_PRICES.solar +
    kolTotals.compute * NFT_PRICES.compute;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ---------- Render ----------
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#e6f0fa", padding: 16 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1f2937" }}>AGV Protocol Admin Dashboard</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Signed in: <strong>{user?.email ?? user?.uid}</strong>
            </span>
            <span style={{ fontSize: 12, color: "#1f2937" }}>
              Selected Role: <strong>{uiRole}</strong>
            </span>
            <button
              onClick={doSignOut}
              style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* KOL Creator */}
        <Card
          title="KOL Registration & Referral"
          right={<span style={{ fontSize: 12, color: canCreateKOL ? "#059669" : "#b91c1c", fontWeight: 700 }}>{canCreateKOL ? "WRITE ENABLED" : "WRITE LOCKED"}</span>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14 }}>KOL Name</label>
              <input
                value={kolForm.name}
                onChange={(e) => setKolForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Full Name"
                style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
              <label style={{ fontSize: 14 }}>Wallet Address</label>
              <input
                value={kolForm.walletAddress}
                onChange={(e) => setKolForm((s) => ({ ...s, walletAddress: e.target.value }))}
                placeholder="0x…"
                style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14 }}>Email (optional)</label>
              <input
                value={kolForm.email}
                onChange={(e) => setKolForm((s) => ({ ...s, email: e.target.value }))}
                type="email"
                placeholder="yourname@mail.com"
                style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
              <label style={{ fontSize: 14 }}>Target (optional)</label>
              <input
                value={kolForm.target}
                onChange={(e) => setKolForm((s) => ({ ...s, target: e.target.value }))}
                type="number"
                placeholder="50"
                style={{ padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
            </div>
          </div>

        {/* Big centered button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button
            onClick={async () => {
              if (!canCreateKOL || creatingKol) return;
              setCreatingKol(true);
              setCreateKolState("idle");
              const ok = await createKOL();
              setCreateKolState(ok ? "success" : "error");
              setCreatingKol(false);
              // auto-reset the visual state after a short delay
              setTimeout(() => setCreateKolState("idle"), 2500);
            }}
            disabled={!canCreateKOL || creatingKol}
            aria-busy={creatingKol}
            style={{
              padding: "1rem 1.5rem",
              background:
                createKolState === "error"
                  ? "#dc2626" // red on error
                  : "#16a34a", // green default / success
              color: "#fff",
              borderRadius: 14,
              border: 0,
              fontWeight: 800,
              fontSize: "1rem",
              cursor: !canCreateKOL || creatingKol ? "not-allowed" : "pointer",
              minWidth: 260,
              opacity: !canCreateKOL ? 0.6 : 1,
              transition: "background 150ms ease, opacity 150ms ease",
            }}
          >
            {creatingKol
              ? "Creating…"
              : createKolState === "success"
              ? "Created"
              : createKolState === "error"
              ? "Not Created"
              : "Create & Generate KOL Link"}
          </button>
        </div>

        {/* Link & copy */}
        {referralLink && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a href={referralLink} style={{ color: "#2563eb", wordBreak: "break-all" }}>
              {referralLink}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                toast.success("Copied referral link");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0.5rem 0.7rem",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
              title="Copy referral link"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
        )}
        </Card>


       {/* KOL List */}
      <Card
        title="All KOL(Key Opinion Leaders) List"
        right={canDeleteKOL ? (<span style={{ fontSize: 12, color: "#b45309", fontWeight: 700 }}>Admin can delete KOLs</span>) : (<span style={{ fontSize: 12, color: "#6b7280" }}>View only</span>)}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ textAlign: "left", padding: 12 }}>KOL Name</th>
                <th style={{ textAlign: "left", padding: 12 }}>KOL ID</th>
                <th style={{ textAlign: "left", padding: 12 }}>Wallet Address</th>
                <th style={{ textAlign: "left", padding: 12 }}>Email</th>
                <th style={{ textAlign: "left", padding: 12 }}>Referral link</th>
                <th style={{ textAlign: "center", padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleKols.length > 0 ? (
                visibleKols.map((kol, i) => {
                  const id = kol?.kolId ?? "";
                  const name = kol?.name || "—";
                  const wallet = kol?.walletAddress || "—";
                  const email = kol?.email || "—";
                  const link = id
                    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?kolId=${encodeURIComponent(
                        id
                      )}`
                    : "";

                  return (
                    <tr key={id || `${wallet}-${i}`} style={{ borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                      <td style={{ padding: 12 }}>
                        {id ? (
                          <Link
                            href={`/kol/${id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              color: "#2563eb",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            {name}
                            <ExternalLink size={14} />
                          </Link>
                        ) : (
                          <span style={{ color: "#6b7280" }}>{name}</span>
                        )}
                      </td>

                      <td style={{ padding: 12, fontFamily: "monospace" }}>{id || "—"}</td>

                      <td
                        style={{
                          padding: 12,
                          fontFamily: "monospace",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={wallet}
                      >
                        {wallet}
                      </td>

                      <td
                        style={{
                          padding: 12,
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={email}
                      >
                        {email}
                      </td>

                      <td style={{ padding: 12 }}>
                        {link ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#2563eb", wordBreak: "break-all", textDecoration: "none" }}
                              title={link}
                            >
                              {link}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link);
                                toast.success("Referral link copied");
                              }}
                              title="Copy referral link"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "6px 8px",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: 12, textAlign: "center" }}>
                        {canDeleteKOL ? (
                          <button
                            onClick={() => deleteKOL(id)}
                            title="Delete KOL"
                            style={{
                              padding: "0.35rem 0.55rem",
                              borderRadius: 8,
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              cursor: "pointer",
                              color: "#dc2626",
                            }}
                            disabled={!id}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                    No KOLs created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom pagination (no shadcn) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: page === 0 ? "#f3f4f6" : "#fff",
              color: page === 0 ? "#9ca3af" : "#111827",
              cursor: page === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Page <strong>{page + 1}</strong> of <strong>{pageCount}</strong>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: page >= pageCount - 1 ? "#f3f4f6" : "#fff",
              color: page >= pageCount - 1 ? "#9ca3af" : "#111827",
              cursor: page >= pageCount - 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </Card>


        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }}>
          <Stat label="Approx. Recorded Events (last 500 per KOL)" value={totalEventsApprox} />
          <Stat label="Total NFTs Minted (KOL-linked)" value={totalMints} />
          <Stat label="Total Value Generated (KOL-linked)" value={formatPrice(totalValue)} />
          <Stat label="Active KOLs" value={kols.length} />
        </div>

        {/* On-chain totals */}
        <Card title="All Chains — On-chain Mint Totals (All mints)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            {(["seed", "tree", "solar", "compute"] as const).map((pass) => {
              const label = pass === "seed" ? "SeedPass" : pass === "tree" ? "TreePass" : pass === "solar" ? "SolarPass" : "ComputePass";
              const total = (onchainTotals as any)[pass] as number;
              return (
                <div key={`onchain-${pass}`} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#f9fafb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong>{label}</strong>
                    <span style={{ fontWeight: 800 }}>{total}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                    {(["56", "137", "42161"] as ChainId[]).map((cid) => (
                      <div key={`${pass}-${cid}`} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{cid === "56" ? "BNB" : cid === "137" ? "Polygon" : "Arbitrum"}</span>
                        <span>{onchainTotals.perChain[cid][pass]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KOL-linked totals */}
        <Card title="All Chains — Mint Totals (KOL-linked only)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            {(["seed", "tree", "solar", "compute"] as const).map((pass) => {
              const label = pass === "seed" ? "SeedPass" : pass === "tree" ? "TreePass" : pass === "solar" ? "SolarPass" : "ComputePass";
              const total = (kolTotals as any)[pass] as number;
              const chains = kolPerChainTotals[pass];
              return (
                <div key={pass} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#f9fafb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong>{label}</strong>
                    <span style={{ fontWeight: 800 }}>{total}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                    {Object.keys(chains).length === 0 ? (
                      <em>No mints</em>
                    ) : (
                      Object.entries(chains).map(([chain, qty]) => (
                        <div key={`${pass}-${chain}`} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ textTransform: "capitalize" }}>{chain}</span>
                          <span>{qty}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card title="KOL Leaderboard" right={<Users size={18} color="#2563eb" />}>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: 12 }}>Rank</th>
                  <th style={{ textAlign: "left", padding: 12 }}>KOL Name</th>
                  <th style={{ textAlign: "left", padding: 12 }}>KOL ID</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Total Mints</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Total Value</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Seed</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Tree</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Solar</th>
                  <th style={{ textAlign: "center", padding: 12 }}>Compute</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={`lb-${row.kolId}`} style={{ borderTop: "1px solid #e5e7eb", background: i < 3 ? "#f8fafc" : "#fff" }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{rankIcon(i)}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: 12, fontFamily: "monospace" }}>{row.kolId}</td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>{row.totalMints}</td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 800, color: "#059669" }}>{formatPrice(row.totalValue)}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>{row.seed}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>{row.tree}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>{row.solar}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>{row.compute}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Area Chart */}
        <Card
          title="NFTs Minted — Overview (KOL-linked, last 500 events/KOL)"
          right={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  ["THIS_WEEK", "This Week"],
                  ["LAST_WEEK", "Last Week"],
                  ["THIS_MONTH", "This Month"],
                  ["LAST_MONTH", "Last Month"],
                  ["YTD", "YTD"],
                  ["MONTHS_IN_YEAR", "Jan–Dec"],
                ] as [RangeMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRangeMode(key)}
                  style={{
                    padding: "0.4rem 0.7rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: rangeMode === key ? "#111827" : "#fff",
                    color: rangeMode === key ? "#fff" : "#111827",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {label}
                </button>
              ))}
              {rangeMode === "MONTHS_IN_YEAR" && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ padding: "0.4rem 0.7rem", border: "1px solid #e5e7eb", borderRadius: 8 }}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              )}
            </div>
          }
        >
          <div style={{ height: 360, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeFiltered} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

        <footer style={{ marginTop: "auto", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
          &copy; AGV Protocol {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
