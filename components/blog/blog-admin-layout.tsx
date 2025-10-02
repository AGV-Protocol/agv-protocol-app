"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from "@/components/layout/sidebar"
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
  FileText, 
  Plus, 
  Settings, 
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Edit,
  Eye
} from "lucide-react"

interface BlogAdminLayoutProps {
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
    title: "All Posts",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Create Post",
    href: "/admin/blog/create",
    icon: Plus,
  },
  {
    title: "Back to Dashboard",
    href: "/dashboard",
    icon: ArrowLeft,
  },
]

export function BlogAdminLayout({ 
  children, 
  user, 
  onSignOut, 
  className 
}: BlogAdminLayoutProps) {
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  
  // Determine active navigation item
  const getActiveItem = (href: string) => {
    if (href === "/admin/blog") {
      return pathname === "/admin/blog"
    }
    return pathname === href
  }

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4FACFE] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Blog Admin</h2>
                <p className="text-xs text-muted-foreground">Content Management</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNav>
              {navigation.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  isActive={getActiveItem(item.href)}
                  icon={item.icon}
                >
                  {item.title}
                </SidebarNavItem>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-background border-r">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#4FACFE] rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Blog Admin</h2>
                    <p className="text-xs text-muted-foreground">Content Management</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <nav className="space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        getActiveItem(item.href)
                          ? "bg-[#4FACFE]/10 text-[#4FACFE]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-background border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">Blog Management</h1>
                  <p className="text-sm text-muted-foreground">Manage your blog content</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || ""} alt={user.name || ""} />
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
                      <DropdownMenuItem onClick={onSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

