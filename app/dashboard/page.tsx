"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User as FirebaseUser,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Footer } from "@/components/layout/footer";

// Lazy load heavy dashboard components
const StatsOverview = lazy(() => import("@/components/dashboard/stats-overview").then(m => ({ default: m.StatsOverview })));
const KOLManagement = lazy(() => import("@/components/dashboard/kol-management").then(m => ({ default: m.KOLManagement })));
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  LogIn, 
  Mail, 
  ShieldCheck, 
  Users, 
  BarChart3,
  Activity,
  TrendingUp,
  Settings
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

type UnlockMode = "team" | "kol";
type UiRole = "Admin" | "BD" | "Tech" | "Finance" | "Security" | "Other";
type RangeMode = "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "YTD" | "MONTHS_IN_YEAR";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

// Constants
const NFT_PRICES = { seed: 29, tree: 59, solar: 299, compute: 899 } as const;
const formatPrice = (n: number) => `$${(n || 0).toLocaleString()}`;

const uiSelectRoles: UiRole[] = ["Admin", "BD", "Tech", "Finance", "Security", "Other"];

const uiToClaimRole = (ui: UiRole) =>
  ui === "Admin" ? "admin" :
  ui === "BD" ? "bd" :
  ui === "Tech" ? "tech" :
  ui === "Finance" ? "finance" :
  ui === "Security" ? "security" : null;

export default function DashboardPage() {
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [who, setWho] = useState<WhoAmI>({
    authed: false,
    email: null,
    isAdmin: false,
    isSuperAdmin: false,
  });

  // Email-link auth UI state
  const [emailForLink, setEmailForLink] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  // Gate state
  const [unlockMode, setUnlockMode] = useState<UnlockMode>("team");
  const [uiRole, setUiRole] = useState<UiRole>("Tech");
  const [code, setCode] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(false);

  // Data state
  const [kols, setKols] = useState<KOL[]>([]);
  const [mintDocs, setMintDocs] = useState<MintDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart state
  const [rangeMode, setRangeMode] = useState<RangeMode>("THIS_WEEK");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => setIsClient(true), []);

  // Auth state management
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch server-verified role
  useEffect(() => {
    (async () => {
      if (!auth.currentUser) {
        setWho({ authed: false, email: null, isAdmin: false, isSuperAdmin: false });
        return;
      }
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await fetch("/api/admin/whoami", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (data) setWho(data);
      } catch {
        setWho((s) => ({ ...s, isAdmin: false, isSuperAdmin: false }));
      }
    })();
  }, [user?.uid]);

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
    }
  };

  useEffect(() => {
    if (accessGranted) {
      refreshData();
    }
  }, [accessGranted]);

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

  // Auth actions
  const signInGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Signed in with Google");
    } catch (e: any) {
      toast.error("Google sign-in failed", { description: e.message });
    }
  };

  const sendMagicLink = async () => {
    const email = emailForLink.trim();
    if (!email) return toast.error("Enter your email");
    try {
      setSendingLink(true);
      const actionCodeSettings = {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("agv_email_for_signin", email);
      setLinkSentTo(email);
      toast.success("Magic link sent", { description: `Check ${email}` });
    } catch (e: any) {
      toast.error("Failed to send magic link", { description: e?.message });
    } finally {
      setSendingLink(false);
    }
  };

  const doSignOut = async () => {
    await signOut(auth);
    setAccessGranted(false);
  };

  const verifyAccess = async () => {
    if (!code.trim()) return toast.error("Code required");
    try {
      setChecking(true);
      if (!auth.currentUser) return toast.error("Sign-in required");

      const ref = doc(db, "allows", code.trim());
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setAccessGranted(false);
        return toast.error("Invalid code");
      }

      const data = snap.data() || {};
      const roleField = data.role ? String(data.role) : "";
      const rolesField = Array.isArray(data.roles) ? data.roles.map(String) : [];
      const claimLower = (uiToClaimRole(uiRole) ?? "").toLowerCase();

      const ok = 
        roleField === "*" ||
        roleField === uiRole ||
        roleField === claimLower ||
        rolesField.some((r: string) => r === uiRole || r === claimLower);

      if (!ok) {
        setAccessGranted(false);
        return toast.error("Code not authorized");
      }

      setAccessGranted(true);
      toast.success("Access granted");
    } catch (e: any) {
      toast.error("Check failed", { description: e.message });
    } finally {
      setChecking(false);
    }
  };

  // KOL actions
  const createKOL = async (data: { name: string; walletAddress: string; email?: string; target?: number }): Promise<boolean> => {
    if (!auth.currentUser) {
      toast.error("Sign-in required");
      return false;
    }
    if (!who.isAdmin) {
      toast.error("Insufficient permissions");
      return false;
    }

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/admin/create-kol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(responseData?.error || `Create failed (${res.status})`);

      await refreshData();
      return true;
    } catch (e: any) {
      console.error("Create KOL error:", e);
      toast.error("Failed to create KOL", { description: e?.message || String(e) });
      return false;
    }
  };

  const deleteKOL = async (kolId: string) => {
    if (!who.isAdmin) return toast.error("Only Admin can delete KOLs");
    try {
      if (!auth.currentUser) return toast.error("Sign-in required");
      const idToken = await auth.currentUser.getIdToken(true);

      const res = await fetch(`/api/admin/kol/${encodeURIComponent(kolId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      await refreshData();
      toast.success("KOL deleted");
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message || String(e) });
    }
  };

  // Loading state
  if (authLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Sign-in screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Sign in to Admin Dashboard</CardTitle>
            <CardDescription>
              Access the AGV Protocol admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={signInGoogle} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sign in with Email</label>
              <input
                type="email"
                placeholder="email@domain.com"
                value={emailForLink}
                onChange={(e) => setEmailForLink(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
              />
              <Button 
                onClick={sendMagicLink} 
                disabled={sendingLink}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendingLink ? "Sending..." : "Send magic link"}
              </Button>
            </div>

            {linkSentTo && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  Magic link sent to <strong>{linkSentTo}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access gate
  if (!accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Required</CardTitle>
            <CardDescription>
              Enter your access code to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Type</label>
              <div className="flex space-x-2">
                <Button
                  variant={unlockMode === "team" ? "default" : "outline"}
                  onClick={() => setUnlockMode("team")}
                  className="flex-1"
                >
                  Team ID
                </Button>
                <Button
                  variant={unlockMode === "kol" ? "default" : "outline"}
                  onClick={() => setUnlockMode("kol")}
                  className="flex-1"
                >
                  KOL
                </Button>
              </div>
            </div>

            {unlockMode === "team" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Role</label>
                  <select
                    value={uiRole}
                    onChange={(e) => setUiRole(e.target.value as UiRole)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    {uiSelectRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Team ID</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. Team-Id"
                    className="w-full px-3 py-2 border border-input rounded-md"
                  />
                </div>
              </>
            )}

            <Button 
              onClick={verifyAccess} 
              disabled={checking}
              className="w-full"
            >
              {checking ? "Checking..." : "Unlock Dashboard"}
            </Button>

            <Button 
              onClick={doSignOut} 
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  return (
    <DashboardLayout 
      user={{
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL
      }}
      onSignOut={doSignOut}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kols">KOLs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Welcome to the AGV Protocol admin dashboard
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner size="lg" text="Loading stats..." />}>
            <StatsOverview stats={stats} />
          </Suspense>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Activity}
                  title="No recent activity"
                  description="Activity will appear here as users interact with the platform"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={TrendingUp}
                  title="Performance metrics"
                  description="Performance charts and metrics will be displayed here"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kols">
          <KOLManagement
            kols={kols}
            onDeleteKOL={deleteKOL}
            onCreateKOL={createKOL}
            canCreateKOL={who.isAdmin}
            canDeleteKOL={who.isAdmin}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">
                Detailed analytics and insights
              </p>
            </div>
            <EmptyState
              icon={BarChart3}
              title="Analytics Dashboard"
              description="Advanced analytics and reporting features will be available here"
            />
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Performance</h2>
              <p className="text-muted-foreground">
                System performance and metrics
              </p>
            </div>
            <EmptyState
              icon={TrendingUp}
              title="Performance Metrics"
              description="Performance monitoring and optimization tools will be available here"
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground">
                Configure your dashboard preferences
              </p>
            </div>
            <EmptyState
              icon={Settings}
              title="Settings Panel"
              description="Configuration options and preferences will be available here"
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Footer */}
      <Footer />
    </DashboardLayout>
  );
}