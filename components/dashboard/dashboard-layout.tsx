"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  Activity,
  LogOut
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
    href: "/dashboard/kols",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Performance",
    href: "/dashboard/performance",
    icon: TrendingUp,
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardLayout({ 
  children, 
  user, 
  onSignOut, 
  className 
}: DashboardLayoutProps) {
  const pathname = usePathname()
  
  // Determine active navigation item
  const getActiveItem = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname === href
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Admin Panel</span>
            </div>
          </div>
          
          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = getActiveItem(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-primary/10 hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    {
                      "bg-primary text-primary-foreground shadow-sm": isActive,
                      "text-muted-foreground": !isActive,
                    }
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4",
                    {
                      "text-primary-foreground": isActive,
                      "text-muted-foreground": !isActive,
                    }
                  )} />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">AGV Protocol Admin</span>
              </div>
              
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium">{user.name || user.email}</p>
                    </div>
                  </div>
                  {onSignOut && (
                    <Button variant="ghost" size="sm" onClick={onSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
