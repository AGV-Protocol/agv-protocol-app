import * as React from "react"
import { cn } from "@/lib/utils"
import { AppNav } from "@/components/navigation/app-nav"
import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from "@/components/layout/sidebar"
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  Activity
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    email?: string | null
    name?: string | null
    avatar?: string | null
  }
  onSignOut?: () => void
  className?: string
}

const navigation = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "KOL Management",
    href: "/dashboard?tab=kols",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/dashboard?tab=analytics",
    icon: BarChart3,
  },
  {
    title: "Performance",
    href: "/dashboard?tab=performance",
    icon: TrendingUp,
  },
  {
    title: "Activity",
    href: "/dashboard?tab=activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/dashboard?tab=settings",
    icon: Settings,
  },
]

export function DashboardLayout({ 
  children, 
  user, 
  onSignOut, 
  className 
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <AppNav user={user} onSignOut={onSignOut} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar className="hidden lg:flex">
          <SidebarHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNav>
              {navigation.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarNavItem>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
