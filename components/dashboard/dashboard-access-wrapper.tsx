"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  LogIn, 
  Mail, 
  ShieldCheck
} from "lucide-react";

// Types
type UnlockMode = "team" | "kol";
type UiRole = "Admin" | "BD" | "Tech" | "Finance" | "Security" | "Other";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const uiSelectRoles: UiRole[] = ["Admin", "BD", "Tech", "Finance", "Security", "Other"];

const uiToClaimRole = (ui: UiRole) =>
  ui === "Admin" ? "admin" :
  ui === "BD" ? "bd" :
  ui === "Tech" ? "tech" :
  ui === "Finance" ? "finance" :
  ui === "Security" ? "security" : null;

interface DashboardAccessWrapperProps {
  children: React.ReactNode;
}

export function DashboardAccessWrapper({ children }: DashboardAccessWrapperProps) {
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

  useEffect(() => setIsClient(true), []);

  // Handle email link authentication
  useEffect(() => {
    const handleEmailLink = async () => {
      if (!isClient) return;
      
      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          // Get the email if available
          let email = window.localStorage.getItem('agv_email_for_signin');
          
          if (!email) {
            // If no email in localStorage, prompt user
            email = window.prompt('Please provide your email for confirmation');
          }
          
          if (email) {
            // Sign in with the email link
            const result = await signInWithEmailLink(auth, email, window.location.href);
            console.log('Email link sign-in successful:', result.user.email);
            toast.success('Successfully signed in with email link');
            
            // Clear the email from localStorage
            window.localStorage.removeItem('agv_email_for_signin');
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error: any) {
          console.error('Email link sign-in error:', error);
          toast.error('Email link sign-in failed', { description: error.message });
        }
      }
    };

    if (isClient) {
      handleEmailLink();
    }
  }, [isClient]);

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

  // Auth actions
  const signInGoogle = async () => {
    try {
      console.log("lggggggggggggggggin in")
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
    router.push('/');
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

  // Render the dashboard content
  return <>{children}</>;
}
