"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Users, 
  Wallet,
  CheckCircle,
  TrendingUp,
  ShoppingCart,
  Link2,
  Coins,
  Eye
} from "lucide-react";

interface FunnelMetric {
  today: number;
  total: number;
}

interface FunnelData {
  todayStartsAt: string;
  claimFunnel: {
    claimPageVisits: FunnelMetric;
    walletsConnected: FunnelMetric;
    walletsActivated: FunnelMetric;
    claimsSuccess: FunnelMetric;
  };
  buyFunnel: {
    buyPageVisits: FunnelMetric;
    purchasesSuccess: FunnelMetric;
  };
  referrals: {
    referralPurchases: FunnelMetric;
  };
  stakingFunnel: {
    stakingPageVisits: FunnelMetric;
    stakesSuccess: FunnelMetric;
  };
}

function MetricRow({ 
  label, 
  icon: Icon, 
  today, 
  total 
}: { 
  label: string; 
  icon: React.ElementType; 
  today: number; 
  total: number; 
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right min-w-[80px]">
          <p className="text-2xl font-bold">{today.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}

export default function FunnelPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FunnelData | null>(null);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/admin/buypage/funnel", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch funnel data");
      }

      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching funnel data:", error);
      toast.error("Failed to load funnel data", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const doSignOut = async () => {
    await auth.signOut();
  };

  const formatTodayStart = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <DashboardLayout
      user={{
        email: auth.currentUser?.email,
        name: auth.currentUser?.displayName,
        avatar: auth.currentUser?.photoURL,
      }}
      onSignOut={doSignOut}
    >
      <div className="space-y-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Activity Funnel</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Track user activity from page visits to conversions
          </p>
          {data?.todayStartsAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Today started at: {formatTodayStart(data.todayStartsAt)} (11am UTC)
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Claim Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Claim Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <MetricRow
                  label="ClaimPage Visits"
                  icon={Eye}
                  today={data.claimFunnel.claimPageVisits.today}
                  total={data.claimFunnel.claimPageVisits.total}
                />
                <MetricRow
                  label="Wallets Connected"
                  icon={Wallet}
                  today={data.claimFunnel.walletsConnected.today}
                  total={data.claimFunnel.walletsConnected.total}
                />
                <MetricRow
                  label="Wallets Activated"
                  icon={Users}
                  today={data.claimFunnel.walletsActivated.today}
                  total={data.claimFunnel.walletsActivated.total}
                />
                <MetricRow
                  label="Claims Success"
                  icon={CheckCircle}
                  today={data.claimFunnel.claimsSuccess.today}
                  total={data.claimFunnel.claimsSuccess.total}
                />
              </CardContent>
            </Card>

            {/* Buy Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  Buy Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <MetricRow
                  label="BuyPage Visits"
                  icon={Eye}
                  today={data.buyFunnel.buyPageVisits.today}
                  total={data.buyFunnel.buyPageVisits.total}
                />
                <MetricRow
                  label="Purchases Success"
                  icon={TrendingUp}
                  today={data.buyFunnel.purchasesSuccess.today}
                  total={data.buyFunnel.purchasesSuccess.total}
                />
              </CardContent>
            </Card>

            {/* Referrals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple-500" />
                  Referrals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <MetricRow
                  label="Referral Purchases"
                  icon={Link2}
                  today={data.referrals.referralPurchases.today}
                  total={data.referrals.referralPurchases.total}
                />
              </CardContent>
            </Card>

            {/* Staking Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  Staking Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <MetricRow
                  label="StakingPage Visits"
                  icon={Eye}
                  today={data.stakingFunnel.stakingPageVisits.today}
                  total={data.stakingFunnel.stakingPageVisits.total}
                />
                <MetricRow
                  label="Stakes Success"
                  icon={Coins}
                  today={data.stakingFunnel.stakesSuccess.today}
                  total={data.stakingFunnel.stakesSuccess.total}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
