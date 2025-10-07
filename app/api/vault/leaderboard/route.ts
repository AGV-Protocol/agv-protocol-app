import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return mock leaderboard data - later this will be replaced with real data
    const mockLeaderboardData = {
      asOf: Math.floor(Date.now() / 1000),
      rows: Array.from({ length: 100 }, (_, i) => ({
        rank: i + 1,
        wallet: `0x${Math.random().toString(16).substr(2, 40)}`,
        rggp: Math.max(1000 - i * 10, 100) + Math.random() * 100,
        xp: Math.max(5000 - i * 50, 100) + Math.random() * 200
      }))
    };

    return NextResponse.json(mockLeaderboardData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
