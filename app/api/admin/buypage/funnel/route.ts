import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Get the start of "today" based on 11am UTC
 * If current time is before 11am UTC, "today" starts at 11am UTC yesterday
 * If current time is after 11am UTC, "today" starts at 11am UTC today
 */
function getTodayStart(): Date {
  const now = new Date();
  const todayAt11am = new Date(now);
  todayAt11am.setUTCHours(11, 0, 0, 0);
  
  if (now < todayAt11am) {
    // Before 11am UTC today, so "today" started at 11am UTC yesterday
    todayAt11am.setUTCDate(todayAt11am.getUTCDate() - 1);
  }
  
  return todayAt11am;
}

export async function GET(req: NextRequest) {
  const decoded = await requireAdmin(req);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStart = getTodayStart();
    const todayStartISO = todayStart.toISOString();

    // Fetch all data in parallel
    const [
      analyticsEventsSnapshot,
      usersSnapshot,
      purchasesSnapshot,
      stakingEventsSnapshot,
      walletConnectionsSnapshot,
    ] = await Promise.all([
      adminDb.collection("analytics_events").get(),
      adminDb.collection("users").get(),
      adminDb.collection("purchases").get(),
      adminDb.collection("staking_events").get(),
      adminDb.collection("wallet_connections").get(),
    ]);

    // Process analytics events (page visits)
    const analyticsEvents = analyticsEventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        eventType: data.eventType,
        timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toISOString() || ''),
      };
    });

    // Count page visits
    const claimPageVisitsTotal = analyticsEvents.filter(e => e.eventType === 'claim_page_visit').length;
    const claimPageVisitsToday = analyticsEvents.filter(e => 
      e.eventType === 'claim_page_visit' && e.timestamp >= todayStartISO
    ).length;

    const buyPageVisitsTotal = analyticsEvents.filter(e => e.eventType === 'buy_page_visit').length;
    const buyPageVisitsToday = analyticsEvents.filter(e => 
      e.eventType === 'buy_page_visit' && e.timestamp >= todayStartISO
    ).length;

    const stakingPageVisitsTotal = analyticsEvents.filter(e => e.eventType === 'staking_page_visit').length;
    const stakingPageVisitsToday = analyticsEvents.filter(e => 
      e.eventType === 'staking_page_visit' && e.timestamp >= todayStartISO
    ).length;

    // Process users
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        createdAt: data.createdAt || '',
        isActivated: data.isActivated || false,
        activationTime: data.activationTime || '',
        hasClaimed: data.hasClaimed || false,
        claimTime: data.claimTime || '',
      };
    });

    // Process wallet connections (first-time connections)
    const walletConnections = walletConnectionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toISOString() || ''),
      };
    });

    // Wallets connected (first-time connections from wallet_connections collection)
    const walletsConnectedTotal = walletConnections.length;
    const walletsConnectedToday = walletConnections.filter(w => w.timestamp >= todayStartISO).length;

    // Wallets activated
    const walletsActivatedTotal = users.filter(u => u.isActivated).length;
    const walletsActivatedToday = users.filter(u => 
      u.isActivated && u.activationTime >= todayStartISO
    ).length;

    // Claims success
    const claimsSuccessTotal = users.filter(u => u.hasClaimed).length;
    const claimsSuccessToday = users.filter(u => 
      u.hasClaimed && u.claimTime >= todayStartISO
    ).length;

    // Process purchases
    const purchases = purchasesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toISOString() || ''),
        isKolReferral: data.isKolReferral || false,
      };
    });

    // Purchases success
    const purchasesSuccessTotal = purchases.length;
    const purchasesSuccessToday = purchases.filter(p => p.timestamp >= todayStartISO).length;

    // Referral purchases
    const referralPurchasesTotal = purchases.filter(p => p.isKolReferral).length;
    const referralPurchasesToday = purchases.filter(p => 
      p.isKolReferral && p.timestamp >= todayStartISO
    ).length;

    // Process staking events
    const stakingEvents = stakingEventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toISOString() || ''),
      };
    });

    // Stakes success
    const stakesSuccessTotal = stakingEvents.length;
    const stakesSuccessToday = stakingEvents.filter(s => s.timestamp >= todayStartISO).length;

    return NextResponse.json({
      success: true,
      data: {
        todayStartsAt: todayStartISO,
        claimFunnel: {
          claimPageVisits: { today: claimPageVisitsToday, total: claimPageVisitsTotal },
          walletsConnected: { today: walletsConnectedToday, total: walletsConnectedTotal },
          walletsActivated: { today: walletsActivatedToday, total: walletsActivatedTotal },
          claimsSuccess: { today: claimsSuccessToday, total: claimsSuccessTotal },
        },
        buyFunnel: {
          buyPageVisits: { today: buyPageVisitsToday, total: buyPageVisitsTotal },
          purchasesSuccess: { today: purchasesSuccessToday, total: purchasesSuccessTotal },
        },
        referrals: {
          referralPurchases: { today: referralPurchasesToday, total: referralPurchasesTotal },
        },
        stakingFunnel: {
          stakingPageVisits: { today: stakingPageVisitsToday, total: stakingPageVisitsTotal },
          stakesSuccess: { today: stakesSuccessToday, total: stakesSuccessTotal },
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching funnel data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch funnel data" },
      { status: 500 }
    );
  }
}

