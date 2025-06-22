"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Package,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  Handshake,
  UserCheck,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useApp } from "@/contexts/app-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge" // Asegúrate de que Badge esté importado

interface AppLayoutProps {
  children: React.ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  const { state, logout } = useApp() // Usa logout directamente del contexto
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Redirige al login si no hay usuario (simulación de autenticación)
  React.useEffect(() => {
    if (!state.user && pathname !== "/login") {
      router.push("/login")
    }
  }, [state.user, pathname, router])

  const userRole = state.user?.rol || "Visualizador"

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Administrador", "Editor", "Visualizador"],
    },
    { name: "Inventario", href: "/inventario", icon: Package, roles: ["Administrador", "Editor", "Visualizador"] },
    { name: "Asignados", href: "/asignados", icon: UserCheck, roles: ["Administrador", "Editor", "Visualizador"] },
    { name: "Préstamos", href: "/prestamos", icon: Handshake, roles: ["Administrador", "Editor", "Visualizador"] },
    { name: "Historial", href: "/historial", icon: History, roles: ["Administrador", "Editor", "Visualizador"] },
    { name: "Tareas Pendientes", href: "/tareas-pendientes", icon: ClipboardList, roles: ["Administrador", "Editor"] },
    { name: "Configuración", href: "/configuracion", icon: Settings, roles: ["Administrador"] },
    { name: "Mi Perfil", href: "/perfil", icon: User, roles: ["Administrador", "Editor", "Visualizador"] },
  ]

  const filteredNavigationItems = navigationItems.filter((item) => item.roles.includes(userRole))

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 sticky top-0">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span className="">GATI-C</span>
            </Link>
            <ThemeToggle className="ml-auto" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {filteredNavigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {item.name === "Tareas Pendientes" &&
                    state.pendingTasksData.filter((t) => t.status === "Pendiente").length > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {state.pendingTasksData.filter((t) => t.status === "Pendiente").length}
                      </Badge>
                    )}
                </Link>
              ))}
            </nav>
          </div>
          {/* User and Logout Section - Fixed at the bottom of the sidebar */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <div className="text-sm font-medium">
                {state.user?.nombre} ({state.user?.rol})
              </div>
            </div>
            <Button variant="secondary" className="w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
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
                  <Package className="h-6 w-6" />
                  <span className="sr-only">GATI-C</span>
                </Link>
                {filteredNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${
                      pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground"
                    } hover:text-foreground`}
                    onClick={() => setIsMobileMenuOpen(false)} // Cierra el menú al hacer clic
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {item.name === "Tareas Pendientes" &&
                      state.pendingTasksData.filter((t) => t.status === "Pendiente").length > 0 && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                          {state.pendingTasksData.filter((t) => t.status === "Pendiente").length}
                        </Badge>
                      )}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                <ThemeToggle />
                <div className="flex items-center gap-2 mt-4">
                  <User className="h-4 w-4" />
                  <div className="text-sm font-medium">
                    {state.user?.nombre} ({state.user?.rol})
                  </div>
                </div>
                <Button variant="secondary" className="w-full mt-2" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1 text-lg font-semibold">
            {navigationItems.find((item) => item.href === pathname)?.name || "GATI-C"}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
