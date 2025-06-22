"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/contexts/app-context"
import { useToast } from "@/hooks/use-toast"
import { Lock, User, Mail, Shield, Wifi } from "lucide-react"

export default function ProfilePage() {
  const { state, dispatch, addRecentActivity } = useApp()
  const { toast } = useToast()

  const currentUser = state.user

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isPasswordChangeLoading, setIsPasswordChangeLoading] = useState(false)

  const [newIpAddress, setNewIpAddress] = useState(currentUser?.trustedIp || "")
  const [isIpUpdateLoading, setIsIpUpdateLoading] = useState(false)

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsPasswordChangeLoading(true)

    if (currentPassword !== currentUser.password) {
      toast({
        title: "Error al cambiar contraseña",
        description: "La contraseña actual es incorrecta.",
        variant: "destructive",
      })
      setIsPasswordChangeLoading(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error al cambiar contraseña",
        description: "La nueva contraseña y la confirmación no coinciden.",
        variant: "destructive",
      })
      setIsPasswordChangeLoading(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error al cambiar contraseña",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      setIsPasswordChangeLoading(false)
      return
    }

    dispatch({
      type: "UPDATE_USER_PASSWORD",
      payload: { userId: currentUser.id, newPassword: newPassword },
    })
    addRecentActivity({
      type: "Cambio de Contraseña",
      description: `Contraseña del usuario ${currentUser.nombre} (${currentUser.rol}) cambiada.`,
      date: new Date().toLocaleString(),
      details: { userId: currentUser.id, userName: currentUser.nombre },
    })
    toast({
      title: "Contraseña Actualizada",
      description: "Tu contraseña ha sido cambiada exitosamente.",
    })

    setCurrentPassword("")
    setNewPassword("")
    setConfirmNewPassword("")
    setIsPasswordChangeLoading(false)
  }

  const handleIpUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsIpUpdateLoading(true)

    // Basic IP validation (can be more robust)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (newIpAddress && !ipRegex.test(newIpAddress)) {
      toast({
        title: "Error al actualizar IP",
        description: "Formato de dirección IP inválido.",
        variant: "destructive",
      })
      setIsIpUpdateLoading(false)
      return
    }

    dispatch({
      type: "UPDATE_USER_IP",
      payload: { userId: currentUser.id, newIp: newIpAddress },
    })
    addRecentActivity({
      type: "Actualización de IP Confiable",
      description: `IP confiable del usuario ${currentUser.nombre} (${currentUser.rol}) actualizada a ${newIpAddress || "N/A"}.`,
      date: new Date().toLocaleString(),
      details: { userId: currentUser.id, userName: currentUser.nombre, newIp: newIpAddress },
    })
    toast({
      title: "IP Confiable Actualizada",
      description: "La dirección IP confiable ha sido actualizada exitosamente.",
    })

    setIsIpUpdateLoading(false)
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Cargando información del usuario...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona la información de tu cuenta y preferencias.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Información del Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información Personal
            </CardTitle>
            <CardDescription>Detalles de tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <p className="text-lg font-medium">{currentUser.nombre}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-lg font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {currentUser.email}
              </p>
            </div>
            <div>
              <Label>Rol</Label>
              <p className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {currentUser.rol}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPasswordChangeLoading}>
                {isPasswordChangeLoading ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Asignar IP Confiable (Solo para Administradores/Editores) */}
        {(currentUser.rol === "Administrador" || currentUser.rol === "Editor") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                IP Confiable
              </CardTitle>
              <CardDescription>Asigna una dirección IP para acciones rápidas sin iniciar sesión.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIpUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trusted-ip">Dirección IP Confiable</Label>
                  <Input
                    id="trusted-ip"
                    type="text"
                    placeholder="Ej. 192.168.1.100"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Deja vacío para deshabilitar la IP confiable.</p>
                </div>
                <Button type="submit" className="w-full" disabled={isIpUpdateLoading}>
                  {isIpUpdateLoading ? "Actualizando..." : "Actualizar IP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
