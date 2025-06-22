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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { ConfirmationDialogForEditor } from "./confirmation-dialog-for-editor"

interface BulkAssignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProducts?: any[] // Made optional and will default to empty array
  onSuccess: () => void
}

const usuarios = [
  { id: 1, nombre: "Juan Pérez", departamento: "IT" },
  { id: 2, nombre: "María García", departamento: "Marketing" },
  { id: 3, nombre: "Carlos López", departamento: "Diseño" },
  { id: 4, nombre: "Ana Martínez", departamento: "Ventas" },
]

export function BulkAssignModal({ open, onOpenChange, selectedProducts = [], onSuccess }: BulkAssignModalProps) {
  const { state, addPendingRequest, addRecentActivity, updateInventory, updateAsignados } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [notes, setNotes] = useState("")
  const [isConfirmEditorOpen, setIsConfirmEditorOpen] = useState(false)
  const { toast } = useToast()

  const executeBulkAssign = () => {
    // Simulate assignment
    setTimeout(() => {
      setIsLoading(false)
      onOpenChange(false)
      setSelectedUser("")
      setNotes("")

      let updatedInventory = [...state.inventoryData]
      const assignedItems = []

      selectedProducts.forEach((product) => {
        if (product.numeroSerie === null) {
          // For non-serialized items, find the available quantity and decrement it
          const existingAvailableItemIndex = updatedInventory.findIndex(
            (item) => item.nombre === product.nombre && item.modelo === product.modelo && item.estado === "Disponible",
          )

          if (existingAvailableItemIndex !== -1) {
            const availableItem = updatedInventory[existingAvailableItemIndex]
            if (availableItem.cantidad > 0) {
              // Decrement available quantity
              updatedInventory[existingAvailableItemIndex] = {
                ...availableItem,
                cantidad: availableItem.cantidad - 1,
              }

              // Create a new entry for the assigned unit
              assignedItems.push({
                id: Math.max(...state.inventoryData.map((item) => item.id)) + 1 + assignedItems.length, // Unique ID
                nombre: product.nombre,
                marca: product.marca,
                modelo: product.modelo,
                categoria: product.categoria,
                estado: "Asignado",
                cantidad: 1,
                numeroSerie: null,
                fechaIngreso: product.fechaIngreso,
                descripcion: product.descripcion,
              })
            }
          }
        } else {
          // For serialized items, change the status of the specific item
          updatedInventory = updatedInventory.map((item) => {
            if (item.id === product.id) {
              return { ...item, estado: "Asignado" }
            }
            return item
          })
          assignedItems.push({
            id: Math.max(...state.asignadosData.map((item) => item.id)) + 1 + assignedItems.length,
            nombre: product.nombre,
            marca: product.marca,
            modelo: product.modelo,
            numeroSerie: product.numeroSerie,
            asignadoA: usuarios.find((u) => u.id.toString() === selectedUser)?.nombre || "Desconocido",
            fechaAsignacion: new Date().toISOString().split("T")[0],
            departamento: usuarios.find((u) => u.id.toString() === selectedUser)?.departamento || "Desconocido",
            descripcion: notes,
          })
        }
      })

      updateInventory(updatedInventory)
      updateAsignados([...state.asignadosData, ...assignedItems])

      toast({
        title: "Asignación masiva completada",
        description: `${selectedProducts.length} productos han sido asignados exitosamente.`,
      })
      addRecentActivity({
        type: "Asignación Masiva",
        description: `Se asignaron ${selectedProducts.length} productos a ${usuarios.find((u) => u.id.toString() === selectedUser)?.nombre}`,
        date: new Date().toLocaleString(),
        details: {
          selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
          assignedTo: usuarios.find((u) => u.id.toString() === selectedUser)?.nombre,
          notes: notes,
        },
      })
      onSuccess()
    }, 1000)
  }

  const handleBulkAssign = async () => {
    if (!selectedUser) return

    setIsLoading(true)

    if (state.user?.rol === "Editor") {
      setIsConfirmEditorOpen(true)
      setIsLoading(false)
      return
    }

    executeBulkAssign()
  }

  const handleConfirmEditorAction = () => {
    addPendingRequest({
      type: "Asignación Masiva",
      details: {
        selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
        assignedTo: usuarios.find((u) => u.id.toString() === selectedUser)?.nombre,
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
          description: `Solicitud de asignación masiva para ${selectedProducts.length} productos creada.`,
        },
      ],
    })
    toast({
      title: "Solicitud enviada",
      description: "Tu asignación masiva ha sido enviada a un administrador para aprobación.",
    })
    onOpenChange(false)
    setSelectedUser("")
    setNotes("")
    setIsConfirmEditorOpen(false)
    addRecentActivity({
      type: "Solicitud de Asignación Masiva",
      description: `Solicitud de asignación masiva para ${selectedProducts.length} productos enviada`,
      date: new Date().toLocaleString(),
      details: {
        selectedProductIds: selectedProducts.map((p) => ({ id: p.id, name: p.nombre, serial: p.numeroSerie })),
        assignedTo: usuarios.find((u) => u.id.toString() === selectedUser)?.nombre,
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
              <UserPlus className="h-5 w-5" />
              Asignar Productos (Masivo)
            </DialogTitle>
            <DialogDescription>
              Asigna {selectedProducts.length} producto(s) seleccionado(s) permanentemente a un usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario *</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} - {usuario.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo de la asignación, ubicación, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleBulkAssign}
              disabled={isLoading || !selectedUser}
              className="bg-primary hover:bg-primary-hover"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Productos
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
