"use client"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showSuccess, showInfo } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { ConfirmationDialogForEditor } from "./confirmation-dialog-for-editor"

interface BulkRetireModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProducts: any[]
  onSuccess: () => void
}

export function BulkRetireModal({ open, onOpenChange, selectedProducts, onSuccess }: BulkRetireModalProps) {
  const { state, addPendingRequest, addRecentActivity, updateInventory } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [isConfirmEditorOpen, setIsConfirmEditorOpen] = useState(false)


  const executeBulkRetire = () => {
    // Toast de progreso inmediato
    showInfo({
      title: "Procesando retiro masivo...",
      description: `Retirando ${selectedProducts.length} productos del inventario`
    })

    // Simular retiro masivo
    setTimeout(() => {
      setIsLoading(false)
      onOpenChange(false)
      setNotes("")

      let updatedInventory = [...state.inventoryData]
      selectedProducts.forEach((product) => {
        if (product.numeroSerie === null) {
          // For non-serialized, find the specific unit and mark it as retired
          const existingItemIndex = updatedInventory.findIndex(
            (item) => item.id === product.id && item.estado !== "Retirado", // Ensure we don't re-retire
          )
          if (existingItemIndex !== -1) {
            updatedInventory[existingItemIndex] = { ...updatedInventory[existingItemIndex], estado: "Retirado" }
          }
        } else {
          // For serialized, change the status of the specific item
          updatedInventory = updatedInventory.map((item) => {
            if (item.id === product.id) {
              return { ...item, estado: "Retirado" }
            }
            return item
          })
        }
      })
      updateInventory(updatedInventory)

      showSuccess({
        title: "Retiro masivo completado",
        description: `${selectedProducts.length} productos retirados del inventario`
      })
      addRecentActivity({
        type: "Retiro Masivo",
        description: `Se retiraron ${selectedProducts.length} productos`,
        date: new Date().toLocaleString(),
        details: {
          selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
          notes: notes,
        },
      })
      onSuccess()
    }, 1000)
  }

  const handleBulkRetire = async () => {
    setIsLoading(true)

    if (state.user?.rol === "Editor") {
      setIsConfirmEditorOpen(true)
      setIsLoading(false)
      return
    }

    executeBulkRetire()
  }

  const handleConfirmEditorAction = () => {
    addPendingRequest({
      type: "Retiro Masivo",
      details: {
        selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
        notes: notes,
      },
      requestedBy: state.user?.nombre || "Editor",
      date: new Date().toISOString(),
      status: "Pendiente",
      auditLog: [
        {
          event: "CREACIÓN",
          user: state.user?.nombre || "Editor",
          dateTime: new Date().toISOString(),
          description: `Solicitud de retiro masivo para ${selectedProducts.length} productos creada.`,
        },
      ],
    })
    showInfo({
      title: "Solicitud enviada",
      description: "Tu retiro masivo ha sido enviado a un administrador para aprobación."
    })
    onOpenChange(false)
    setNotes("")
    setIsConfirmEditorOpen(false)
    addRecentActivity({
      type: "Solicitud de Retiro Masivo",
      description: `Solicitud de retiro masivo para ${selectedProducts.length} productos enviada`,
      date: new Date().toLocaleString(),
      details: {
        selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
        notes: notes,
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Retirar Productos (Masivo)
            </DialogTitle>
            <DialogDescription>
              Marca {selectedProducts.length} producto(s) seleccionado(s) como retirados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo del retiro, observaciones, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleBulkRetire}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Retirar Productos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialogForEditor
        open={isConfirmEditorOpen}
        onOpenChange={setIsConfirmEditorOpen}
        onConfirm={handleConfirmEditorAction}
      />
    </>
  )
}
