"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Package,
  LayoutDashboard,
  Users,
  History,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  Handshake,
  UserCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useApp } from "@/contexts/app-context"
import { ThemeToggle } from "@/components/theme-toggle"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state, setUser } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const handleLogout = () => {
    setUser(null)
    router.push("/login")
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Administrador", "Editor", "Lector"],
    },
    {
      name: "Inventario",
      href: "/inventario",
      icon: Package,
      roles: ["Administrador", "Editor", "Lector"],
    },
    {
      name: "Préstamos",
      href: "/prestamos",
      icon: Handshake,
      roles: ["Administrador", "Editor", "Lector"],
    },
    {
      name: "Asignados",
      href: "/asignados",
      icon: UserCheck,
      roles: ["Administrador", "Editor", "Lector"],
    },
    {
      name: "Tareas Pendientes",
      href: "/tareas-pendientes",
      icon: ClipboardList,
      roles: ["Administrador", "Editor"],
    },
    {
      name: "Historial",
      href: "/historial",
      icon: History,
      roles: ["Administrador", "Editor", "Lector"],
    },
    {
      name: "Configuración",
      href: "/configuracion",
      icon: Settings,
      roles: ["Administrador"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => state.user && item.roles.includes(state.user.rol))

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6 text-cfe-green" /> {/* Applied cfe-green */}
              <span className="text-lg">GATI-C</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                      isActive ? "bg-muted text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {state.user?.nombre} ({state.user?.rol})
                </span>
              </div>
              <ThemeToggle />
            </div>
            <Button variant="secondary" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
        {/* Header for Mobile and Desktop */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-6 w-6 text-cfe-green" /> {/* Applied cfe-green */}
                  <span className="sr-only">GATI-C</span>
                </Link>
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${
                        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                      } hover:text-foreground`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {state.user?.nombre} ({state.user?.rol})
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
                <Button variant="secondary" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:text-xl">
              {navItems.find((item) => item.href === pathname)?.name || "GATI-C"}
            </h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
