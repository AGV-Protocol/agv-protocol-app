import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { requireAdmin, isSuperAdminEmail } from "../../_auth";

export async function POST(req: NextRequest) {
  const requester = await requireAdmin(req);
  if (!requester || !isSuperAdminEmail(requester.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, action = "grant" } = (await req.json()) as {
    email: string;
    action?: "grant" | "revoke";
  };

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const user = await adminAuth.getUserByEmail(email);
  const existing = user.customClaims || {};
  const rolesArr = Array.isArray(existing.roles) ? existing.roles.map(String) : [];

  const next = { ...existing };

  if (action === "grant") {
    next.admin = true;
    next.role = "admin";
    next.roles = Array.from(new Set([...rolesArr, "admin"]));
  } else {
    next.admin = false;
    next.roles = rolesArr.filter((r) => r.toLowerCase() !== "admin");
    if ((next.role || "").toLowerCase() === "admin") delete next.role;
  }

  await adminAuth.setCustomUserClaims(user.uid, next);
  await adminAuth.revokeRefreshTokens(user.uid);

  return NextResponse.json({ ok: true, email, claims: next });
}
