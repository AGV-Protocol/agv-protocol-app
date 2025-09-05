import * as React from "react"
import { StatCard } from "@/components/ui/stat-card"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Zap,
  Globe
} from "lucide-react"

interface StatsOverviewProps {
  stats: {
    totalKols: number
    totalMints: number
    totalValue: number
    activeKols: number
    totalEvents: number
    onchainTotals: {
      seed: number
      tree: number
      solar: number
      compute: number
    }
  }
  className?: string
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
      <StatCard
        title="Total KOLs"
        value={stats.totalKols}
        description="Registered KOLs"
        icon={Users}
      />
      
      <StatCard
        title="Total Mints"
        value={stats.totalMints}
        description="NFTs minted"
        icon={Activity}
      />
      
      <StatCard
        title="Total Value"
        value={`$${stats.totalValue.toLocaleString()}`}
        description="Generated revenue"
        icon={DollarSign}
      />
      
      <StatCard
        title="Active KOLs"
        value={stats.activeKols}
        description="Currently active"
        icon={TrendingUp}
      />
      
      <StatCard
        title="Events Recorded"
        value={stats.totalEvents}
        description="Mint events"
        icon={Zap}
      />
      
      <StatCard
        title="On-chain Total"
        value={Object.values(stats.onchainTotals).reduce((a, b) => a + b, 0)}
        description="All chains combined"
        icon={Globe}
      />
    </div>
  )
}
