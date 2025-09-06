"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export default function AnalyticsPage() {
  const [who, setWho] = useState<WhoAmI>({
    authed: false,
    email: null,
    isAdmin: false,
    isSuperAdmin: false,
  });

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
  }, []);

  const doSignOut = async () => {
    await auth.signOut();
  };

  return (
    <DashboardLayout 
      user={{
        email: auth.currentUser?.email,
        name: auth.currentUser?.displayName,
        avatar: auth.currentUser?.photoURL
      }}
      onSignOut={doSignOut}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed analytics and insights for your platform
          </p>
        </div>
        
        <EmptyState
          icon={BarChart3}
          title="Analytics Dashboard"
          description="Advanced analytics and reporting features will be available here"
        />
      </div>
    </DashboardLayout>
  );
}
