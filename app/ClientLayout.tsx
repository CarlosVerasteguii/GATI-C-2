"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { useApp } from "@/contexts/app-context"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  const protectedRoutes = [
    "/dashboard",
    "/inventario",
    "/prestamos",
    "/asignados",
    "/tareas-pendientes",
    "/historial",
    "/configuracion",
  ]

  useEffect(() => {
    // Check if the user is null AND the current path is a protected route
    if (!state.user && protectedRoutes.includes(pathname)) {
      router.push("/login")
    }
  }, [state.user, pathname, router, protectedRoutes])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
