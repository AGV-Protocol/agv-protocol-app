"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
// import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Shield,
  LogOut,
  Menu,
  X,
  Wallet
} from "lucide-react"
import { useTranslations } from "@/hooks/useTranslations"
import { createLocalizedHref, isActiveNavItem } from "@/lib/locale-utils"

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
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "KOL Management",
    href: "/admin/kols",
    icon: Users,
  },
  {
    title: "Wallet Whitelist",
    href: "/admin/whitelist",
    icon: Wallet,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  // {
  //   title: "Activity",
  //   href: "/admin/activity",
  //   icon: Activity,
  // },
  // {
  //   title: "Settings",
  //   href: "/admin/settings",
  //   icon: Settings,
  // },
]

export function DashboardLayout({ 
  children, 
  user, 
  onSignOut, 
  className 
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const { locale } = useTranslations()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  
  // Determine active navigation item using locale-aware logic
  const getActiveItem = (href: string) => {
    return isActiveNavItem(pathname, href)
  }

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 transform border-r bg-background transition-transform duration-300 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Mobile Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = getActiveItem(item.href)
            const localizedHref = createLocalizedHref(item.href, locale)
            return (
              <Link
                key={item.href}
                href={localizedHref}
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
              const localizedHref = createLocalizedHref(item.href, locale)
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
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
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl hidden sm:block">AGV Protocol Admin</span>
                  <span className="font-bold text-lg sm:hidden">AGV Admin</span>
                </div>
              </div>
              
              {user && (
                <div className="flex items-center space-x-4">
                  {/* Desktop User Info */}
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                  </div>

                  {/* Mobile & Desktop User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
