"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"

interface LendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSuccess: () => void
}

export function LendModal({ open, onOpenChange, product, onSuccess }: LendModalProps) {
  const { state, updateInventoryItemStatus, addRecentActivity, addPendingRequest } = useApp()
  const [lentToName, setLentToName] = useState("")
  const [lentToEmail, setLentToEmail] = useState("")
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setLentToName("")
      setLentToEmail("")
      setReturnDate(undefined)
      setIsLoading(false)
    }
  }, [open])

  const executeLend = () => {
    if (!product) return

    setIsLoading(true)
    setTimeout(() => {
      updateInventoryItemStatus(product.id, "Prestado")
      addRecentActivity({
        type: "Préstamo",
        description: `${product.nombre} prestado a ${lentToName}`,
        date: new Date().toLocaleString(),
        details: {
          product: { id: product.id, name: product.nombre, serial: product.numeroSerie },
          lentTo: lentToName,
          lentToEmail: lentToEmail,
          loanDate: new Date().toLocaleString(),
          returnDate: returnDate ? format(returnDate, "PPP") : "N/A",
        },
      })
      toast({
        title: "Préstamo registrado",
        description: `${product.nombre} ha sido prestado a ${lentToName}.`,
      })
      onSuccess()
      onOpenChange(false)
    }, 1000)
  }

  const handleLend = () => {
    if (!lentToName || !returnDate) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa el nombre del usuario y la fecha de devolución.",
        variant: "destructive",
      })
      return
    }

    if (state.user?.rol === "Editor") {
      addPendingRequest({
        type: "Préstamo",
        details: {
          productId: product.id,
          productName: product.nombre,
          productSerialNumber: product.numeroSerie,
          lentTo: lentToName,
          lentToEmail: lentToEmail,
          returnDate: returnDate ? format(returnDate, "PPP") : "N/A",
        },
        requestedBy: state.user?.nombre || "Editor",
        date: new Date().toISOString(),
        status: "Pendiente",
        auditLog: [
          {
            event: "CREACIÓN",
            user: state.user?.nombre || "Editor",
            dateTime: new Date().toISOString(),
            description: `Solicitud de préstamo para ${product.nombre} creada.`,
          },
        ],
      })
      toast({
        title: "Solicitud enviada",
        description: `Tu solicitud de préstamo para ${product.nombre} ha sido enviada a un administrador para aprobación.`,
      })
      onOpenChange(false)
      return
    }

    executeLend()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Prestar Artículo: {product?.nombre}</DialogTitle>
          <DialogDescription>Registra el préstamo de este artículo a un usuario.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lentToName">Nombre del Usuario *</Label>
            <Input
              id="lentToName"
              value={lentToName}
              onChange={(e) => setLentToName(e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lentToEmail">Correo Electrónico</Label>
            <Input
              id="lentToEmail"
              type="email"
              value={lentToEmail}
              onChange={(e) => setLentToEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="returnDate">Fecha de Devolución *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, "PPP") : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleLend} disabled={isLoading || !lentToName || !returnDate}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Préstamo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
