"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Info, HelpCircle, Loader2, PackageMinus, PackagePlus } from "lucide-react"
import { showError, showSuccess, showInfo } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { QuickLoadModal } from "@/components/quick-load-modal"
import { QuickRetireModal } from "@/components/quick-retire-modal" // New QuickRetireModal
import { AccessRequestModal } from "@/components/access-request-modal"
import { HelpModal } from "@/components/help-modal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isQuickLoadModalOpen, setIsQuickLoadModalOpen] = useState(false)
  const [isQuickRetireModalOpen, setIsQuickRetireModalOpen] = useState(false)
  const [isAccessRequestModalOpen, setIsAccessRequestModalOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false) // Added back for the About dialog
  const [isLoading, setIsLoading] = useState(false)

  const { state, setUser, addRecentActivity } = useApp()
  const router = useRouter()


  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (state.user) {
      router.push("/dashboard")
    }
  }, [state.user, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)

    // Debugging: Log current users data and entered credentials
    console.log("Attempting login with:", { username, password })
    console.log(
      "Available users:",
      state.usersData.map((u) => ({ nombre: u.nombre, rol: u.rol, password: u.password })),
    )

    const foundUser = state.usersData.find(
      (user) => user.nombre.toLowerCase() === username.toLowerCase() && user.password === password, // Check password
    )

    if (foundUser) {
      setUser(foundUser)
      addRecentActivity({
        type: "Inicio de Sesión",
        description: `Usuario ${foundUser.nombre} (${foundUser.rol}) ha iniciado sesión.`,
        date: new Date().toLocaleString(),
        details: { userId: foundUser.id, userName: foundUser.nombre, userRole: foundUser.rol },
      })
      showSuccess({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${foundUser.nombre}!`
      })
      router.push("/dashboard")
    } else {
      showError({
        title: "Error de inicio de sesión",
        description: "Credenciales incorrectas. Por favor, inténtalo de nuevo."
      })
    }

    setIsLoading(false)
  }

  // Determine if quick actions should be available (e.g., for trusted IPs or specific roles)
  // For demo, let's make it available if any user is logged in or if a specific trusted user exists
  const simulatedCurrentIp = "192.168.1.100"
  const trustedUserForQuickActions = state.usersData.find((user) => user.trustedIp === simulatedCurrentIp)
  const showQuickActions = !!trustedUserForQuickActions

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-cfe-green">GATI-C</CardTitle>
              <div className="flex gap-2 items-center">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAboutOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Acerca de GATI-C"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHelpOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Ayuda"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-2 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" onClick={() => setIsAccessRequestModalOpen(true)} className="text-sm">
            ¿No tienes cuenta? Solicitar Acceso
          </Button>
        </div>

        {/* Quick Actions Card for Trusted IP */}
        {showQuickActions && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            {" "}
            {/* Added dark mode styles */}
            <CardHeader>
              <CardTitle className="text-lg">
                Acciones Rápidas para {trustedUserForQuickActions?.nombre || "Usuario Rápido"}
              </CardTitle>
              <CardDescription>Realiza cargas o retiros sin iniciar sesión completa.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setIsQuickLoadModalOpen(true)}>
                <PackagePlus className="mr-2 h-4 w-4" />
                Registrar Carga Rápida
              </Button>
              <Button variant="outline" onClick={() => setIsQuickRetireModalOpen(true)}>
                <PackageMinus className="mr-2 h-4 w-4" />
                Registrar Retiro Rápido
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Easter Egg - About Dialog */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-status-maintenance" />
              Acerca de GATI-C
            </DialogTitle>
            <DialogDescription>Sistema de Gestión de Activos Tecnológicos e Inventario - CFE</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Versión</h4>
              <p className="text-sm text-muted-foreground">v11.0 - Edición CFE</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Desarrollado para</h4>
              <p className="text-sm text-muted-foreground">Comisión Federal de Electricidad (CFE)</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Características</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gestión integral de inventario</li>
                <li>• Control de préstamos y asignaciones</li>
                <li>• Flujo de tareas pendientes</li>
                <li>• Auditoría completa de actividades</li>
                <li>• Interfaz optimizada para CFE</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Soporte</h4>
              <p className="text-sm text-muted-foreground">Para soporte técnico, contacta al departamento de TI.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AccessRequestModal open={isAccessRequestModalOpen} onOpenChange={setIsAccessRequestModalOpen} />
      <HelpModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      {showQuickActions && (
        <>
          <QuickLoadModal open={isQuickLoadModalOpen} onOpenChange={setIsQuickLoadModalOpen} />
          <QuickRetireModal open={isQuickRetireModalOpen} onOpenChange={setIsQuickRetireModalOpen} />
        </>
      )}
    </div>
  )
}
