"use client"

import type React from "react"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Wifi, KeyRound } from "lucide-react" // Import Wifi and KeyRound icons
import { useApp } from "@/contexts/app-context" // Import useApp

export default function PerfilPage() {
  const { state, updateUserInContext, addRecentActivity } = useApp() // Use app context
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simular actualización
    setTimeout(() => {
      setIsLoading(false)
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      })
      addRecentActivity({
        type: "Actualización de Perfil",
        description: "Contraseña de usuario actualizada",
        date: new Date().toLocaleString(),
      })
    }, 1000)
  }

  const handleAssignIp = () => {
    setIsLoading(true)
    // Simulate fetching current IP (in a real app, this would be from a server-side call or a client-side IP detection service)
    const simulatedIp = "192.168.1.100" // Placeholder IP
    setTimeout(() => {
      updateUserInContext(state.user?.id || 0, { trustedIp: simulatedIp })
      setIsLoading(false)
      toast({
        title: "IP de Confianza Asignada",
        description: `Tu IP actual (${simulatedIp}) ha sido asignada a tu perfil.`,
      })
      addRecentActivity({
        type: "Configuración de Perfil",
        description: `IP de confianza asignada: ${simulatedIp}`,
        date: new Date().toLocaleString(),
      })
    }, 1000)
  }

  const isEditorOrAdmin = state.user?.rol === "Editor" || state.user?.rol === "Administrador"

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
            <CardDescription>Información básica de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Nombre de Usuario</Label>
                <p className="text-sm mt-1">{state.user?.nombre}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Rol</Label>
                <p className="text-sm mt-1">{state.user?.rol}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Departamento</Label>
                <p className="text-sm mt-1">{state.user?.departamento || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Último Acceso</Label>
                <p className="text-sm mt-1">Hoy, 10:30 AM</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Estado</Label>
                <p className="text-sm mt-1 text-green-600">Activo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="focus:ring-2 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="focus:ring-2 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="focus:ring-2 focus:ring-primary transition-colors duration-200"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* IP de Confianza Card (Visible for Editor/Admin) */}
        {isEditorOrAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                IP de Confianza
              </CardTitle>
              <CardDescription>Configura una IP de confianza para acceso rápido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">IP Actual Asignada</Label>
                <p className="text-sm mt-1">{state.user?.trustedIp || "Ninguna"}</p>
              </div>
              <Button
                onClick={handleAssignIp}
                disabled={isLoading}
                className="bg-primary hover:bg-primary-hover transition-colors duration-200"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asignar esta IP a mi perfil
              </Button>
              <p className="text-xs text-muted-foreground">
                (Nota: En un entorno real, tu IP se detectaría automáticamente. Aquí es una simulación.)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
