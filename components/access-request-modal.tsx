"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showError, showSuccess, showInfo } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"
import { useApp } from "@/contexts/app-context"

interface AccessRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccessRequestModal({ open, onOpenChange }: AccessRequestModalProps) {
  const { updateSolicitudes, addRecentActivity } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    justification: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular envío de solicitud
    setTimeout(() => {
      setIsLoading(false)
      onOpenChange(false)
      setFormData({ name: "", email: "", justification: "" })
      const newRequest = {
        id: Math.floor(Math.random() * 100000), // Simple ID generation
        nombre: formData.name,
        email: formData.email,
        justificacion: formData.justification,
        fecha: new Date().toISOString().split("T")[0],
        estado: "Pendiente" as const,
      }
      updateSolicitudes((prev) => [...(prev || []), newRequest])
      showSuccess({
        title: "Solicitud Enviada",
        description: "Tu solicitud de acceso ha sido enviada para revisión."
      })
      addRecentActivity({
        type: "Solicitud de Acceso",
        description: `Nueva solicitud de acceso de ${formData.name}`,
        date: new Date().toLocaleString(),
        details: { name: formData.name, email: formData.email, justification: formData.justification },
      })
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Solicitar Acceso
          </DialogTitle>
          <DialogDescription>Completa el formulario para solicitar acceso al sistema de inventario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="justification">Justificación *</Label>
              <Textarea
                id="justification"
                value={formData.justification}
                onChange={(e) => setFormData((prev) => ({ ...prev, justification: e.target.value }))}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
