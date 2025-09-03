import { NextRequest, NextResponse } from "next/server";
import { tryVerify, isAdminClaim, isSuperAdminEmail } from "../_auth";

export async function GET(req: NextRequest) {
  const decoded = await tryVerify(req);
  const email = decoded?.email ?? null;
  const isAdmin = !!decoded && isAdminClaim(decoded);
  const isSuperAdmin = !!decoded && isSuperAdminEmail(email);

  return NextResponse.json({
    authed: !!decoded,
    email,
    isAdmin,
    isSuperAdmin,
    claims: {
      role: decoded?.role ?? null,
      roles: Array.isArray(decoded?.roles) ? decoded!.roles : [],
      admin: decoded?.admin === true,
    },
  });
}
