"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/contexts/app-context"
import { ConfirmationDialogForEditor } from "./confirmation-dialog-for-editor"

interface AssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSuccess: () => void
}

export function AssignModal({ open, onOpenChange, product, onSuccess }: AssignModalProps) {
  const { state, updateInventoryItemStatus, addPendingRequest, addRecentActivity, updateInventory } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmEditorOpen, setIsConfirmEditorOpen] = useState(false)
  const [pendingActionDetails, setPendingActionDetails] = useState<any>(null)
  const { toast } = useToast()

  const availableQuantity =
    product?.numeroSerie === null
      ? state.inventoryData
          .filter(
            (item) => item.nombre === product.nombre && item.modelo === product.modelo && item.estado === "Disponible",
          )
          .reduce((sum, item) => sum + item.cantidad, 0)
      : 1 // For serialized, it's always 1 if available

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const assignedTo = formData.get("assignedTo") as string
    const notes = formData.get("notes") as string
    const quantity = product.numeroSerie === null ? Number.parseInt(formData.get("quantity") as string) : 1

    if (!assignedTo) {
      toast({
        title: "Error",
        description: "Por favor, ingresa a quién se asigna el producto.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (product.numeroSerie === null && quantity > availableQuantity) {
      toast({
        title: "Error de Cantidad",
        description: `Solo hay ${availableQuantity} unidades disponibles para asignar.`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const actionDetails = {
      type: "Asignación",
      productId: product.id,
      productName: product.nombre,
      productSerialNumber: product.numeroSerie,
      assignedTo,
      notes,
      quantity,
    }

    if (state.user?.rol === "Editor") {
      setPendingActionDetails(actionDetails)
      setIsConfirmEditorOpen(true)
      setIsLoading(false)
      return
    }

    executeAssignment(actionDetails)
  }

  const executeAssignment = (details: any) => {
    setTimeout(() => {
      if (details.productSerialNumber !== null) {
        // Serialized item
        updateInventoryItemStatus(details.productId, "Asignado", details.assignedTo)
      } else {
        // Non-serialized item: find and update available units
        let remainingToAssign = details.quantity
        const updatedInventory = state.inventoryData.map((item) => {
          if (
            item.nombre === details.productName &&
            item.modelo === details.productModel &&
            item.numeroSerie === null &&
            item.estado === "Disponible" &&
            remainingToAssign > 0
          ) {
            const qtyToTake = Math.min(item.cantidad, remainingToAssign)
            remainingToAssign -= qtyToTake
            return {
              ...item,
              cantidad: item.cantidad - qtyToTake,
              estado: item.cantidad - qtyToTake === 0 ? "Asignado" : item.estado,
            } // Mark as assigned if quantity becomes 0
          }
          return item
        })

        // Add new assigned entries for the non-serialized items
        if (details.quantity > 0) {
          const newAssignedItem = {
            id: Math.max(...state.inventoryData.map((item) => item.id)) + 1, // Generate new ID
            nombre: details.productName,
            marca: product.marca, // Assuming product has brand
            modelo: product.modelo,
            categoria: product.categoria,
            descripcion: product.descripcion,
            estado: "Asignado",
            cantidad: details.quantity,
            numeroSerie: null,
            fechaIngreso: product.fechaIngreso, // Keep original entry date
            usuario: details.assignedTo,
            fechaAsignacion: new Date().toISOString().split("T")[0],
            notasAsignacion: details.notes,
          }
          updatedInventory.push(newAssignedItem)
        }
        updateInventory(updatedInventory)
      }

      toast({
        title: "Producto asignado",
        description: `${details.productName} ha sido asignado a ${details.assignedTo}.`,
      })
      addRecentActivity({
        type: "Asignación",
        description: `${details.productName} asignado a ${details.assignedTo}`,
        date: new Date().toLocaleString(),
        details: {
          product: { id: details.productId, name: details.productName, serial: details.productSerialNumber },
          assignedTo: details.assignedTo,
          notes: details.notes,
          quantity: details.quantity,
        },
      })
      onSuccess()
      onOpenChange(false)
      setIsLoading(false)
    }, 1000)
  }

  const handleConfirmEditorAction = () => {
    addPendingRequest({
      type: pendingActionDetails.type,
      details: pendingActionDetails,
      requestedBy: state.user?.nombre || "Editor",
      date: new Date().toISOString(),
      status: "Pendiente",
      auditLog: [
        {
          event: "CREACIÓN",
          user: state.user?.nombre || "Editor",
          dateTime: new Date().toISOString(),
          description: `Solicitud de ${pendingActionDetails.type.toLowerCase()} creada.`,
        },
      ],
    })
    toast({
      title: "Solicitud enviada",
      description: `Tu solicitud de ${pendingActionDetails.type.toLowerCase()} ha sido enviada a un administrador para aprobación.`,
    })
    setIsConfirmEditorOpen(false)
    onOpenChange(false)
  }

  if (!product) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Producto</DialogTitle>
            <DialogDescription>Asigna "{product.nombre}" a un usuario o departamento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Asignar a</Label>
                <Input id="assignedTo" name="assignedTo" placeholder="Nombre del usuario o departamento" required />
              </div>
              {product.numeroSerie === null && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad a Asignar</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    defaultValue={1}
                    min={1}
                    max={availableQuantity}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Actualmente disponibles: {availableQuantity}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea id="notes" name="notes" placeholder="Notas adicionales sobre la asignación" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-hover">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asignar
              </Button>
            </DialogFooter>
          </form>
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
