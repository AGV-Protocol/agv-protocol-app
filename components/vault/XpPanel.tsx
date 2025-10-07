'use client';

import { useVaultStore } from '@/lib/vault/store';
import { formatNumber, formatLargeNumber } from '@/lib/vault/math';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, AlertTriangle, Target } from 'lucide-react';

export function XpPanel() {
  const { xp, isLoading, refreshData } = useVaultStore();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            XP Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!xp) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            XP Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Target className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No XP Data</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start earning XP by completing tasks on Zealy and TaskOn
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://zealy.io" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Zealy
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://taskon.xyz" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    TaskOn
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isStale = xp.asOf ? (Date.now() / 1000 - xp.asOf) > 7200 : false; // 2 hours
  const lastUpdated = xp.asOf ? new Date(xp.asOf * 1000) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
            XP Status
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* XP Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {formatLargeNumber(xp.xp)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total XP Points
          </div>
        </div>

        {/* XP Status */}
        <div className="flex items-center justify-center gap-2">
          <Badge 
            variant={isStale ? "destructive" : "secondary"}
            className={isStale ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" : ""}
          >
            {isStale ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Update Pending
              </>
            ) : (
              "Up to Date"
            )}
          </Badge>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}

        {/* XP Boost Info */}
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-1">
              XP Boost Active
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Your XP increases your daily rGGP yield
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="https://zealy.io" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Earn on Zealy
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="https://taskon.xyz" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Earn on TaskOn
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
