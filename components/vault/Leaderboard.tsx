'use client';

import { useVaultStore } from '@/lib/vault/store';
import { formatNumber, formatLargeNumber, formatWalletAddress } from '@/lib/vault/math';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';

const rankIcons = {
  1: Trophy,
  2: Medal,
  3: Award
};

const rankColors = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600'
};

export function Leaderboard() {
  const { leaderboard, isLoading, refreshData } = useVaultStore();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 100 Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.rows.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 100 Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <Trophy className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Leaderboard Loading</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The leaderboard is being updated
              </p>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topRows = leaderboard.rows.slice(0, 100);
  const lastUpdated = new Date(leaderboard.asOf * 1000);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 100 Leaderboard
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topRows.map((row, index) => {
            const Icon = rankIcons[row.rank as keyof typeof rankIcons];
            const colorClass = rankColors[row.rank as keyof typeof rankColors];
            
            return (
              <div
                key={row.wallet}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  row.rank <= 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {Icon ? (
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                    ) : (
                      <span className={`text-sm font-semibold ${row.rank <= 10 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {row.rank}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-sm">
                    {formatWalletAddress(row.wallet)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatNumber(row.rggp, 2)} rGGP
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatLargeNumber(row.xp)} XP
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {topRows.length === 100 && (
          <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing top 100 of all participants
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
