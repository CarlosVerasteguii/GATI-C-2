"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, ArrowUpDown, XCircle, Eye, Undo2 } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import type { Assignment, InventoryItem } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { ActivityDetailSheet } from "@/components/activity-detail-sheet"
import { BulkAssignModal } from "@/components/bulk-assign-modal"
import { BulkLendModal } from "@/components/bulk-lend-modal"
import { BulkRetireModal } from "@/components/bulk-retire-modal"
import { BulkEditModal } from "@/components/bulk-edit-modal"
import { AssignModal } from "@/components/assign-modal"
import { LendModal } from "@/components/lend-modal"
import { RetireProductModal } from "@/components/retire-product-modal"
import { EditProductModal } from "@/components/edit-product-modal" // Import the new modal

export default function AsignadosPage() {
  const {
    state,
    updateAssignmentStatus,
    addRecentActivity,
    updateInventory,
    addInventoryItem,
    removeAssignment,
    updateInventoryItem,
  } = useApp()
  const { asignadosData, user, inventoryData } = state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("Todos")
  const [sortBy, setSortBy] = useState<keyof Assignment>("fechaAsignacion")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [actionType, setActionType] = useState<"return" | "retire">("return")
  const { toast } = useToast()
  const [isActivityDetailSheetOpen, setIsActivityDetailSheetOpen] = useState(false)
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<any>(null)

  // Modals for individual actions
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [productToAssign, setProductToAssign] = useState<InventoryItem | null>(null)
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [productToLend, setProductToLend] = useState<InventoryItem | null>(null)
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false)
  const [productToRetire, setProductToRetire] = useState<InventoryItem | null>(null)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<InventoryItem | null>(null)

  // Modals for bulk actions
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isBulkLendModalOpen, setIsBulkLendModalOpen] = useState(false)
  const [isBulkRetireModalOpen, setIsBulkRetireModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [selectedProductIdsForBulk, setSelectedProductIdsForBulk] = useState<number[]>([])

  const canPerformActions = user?.rol === "Administrador" || user?.rol === "Editor"

  const filteredAsignados = useMemo(() => {
    const filtered = asignadosData.filter((assignment) => {
      const matchesSearch =
        assignment.articuloNombre
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) || // Added ?.
        assignment.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) || // Added ?.
        assignment.asignadoA?.toLowerCase().includes(searchTerm.toLowerCase()) || // Added ?.
        assignment.estado?.toLowerCase().includes(searchTerm.toLowerCase()) // Added ?.

      const matchesStatus = filterStatus === "Todos" || assignment.estado === filterStatus

      return matchesSearch && matchesStatus
    })

    // Sorting logic
    filtered.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      // Fallback for mixed types or nulls
      return 0
    })

    return filtered
  }, [asignadosData, searchTerm, filterStatus, sortBy, sortDirection])

  const handleSort = (column: keyof Assignment) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handleReturnProduct = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setActionType("return")
    setIsConfirmationDialogOpen(true)
  }

  const handleRetireProduct = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setActionType("retire")
    setIsConfirmationDialogOpen(true)
  }

  const confirmAction = () => {
    if (!selectedAssignment) return

    const currentUser = user?.nombre || "Sistema"
    const currentDateTime = new Date().toLocaleString()

    if (actionType === "return") {
      // Find the original inventory item
      const originalInventoryItem = inventoryData.find(
        (item) => item.id === selectedAssignment.articuloId && item.numeroSerie === selectedAssignment.numeroSerie,
      )

      if (originalInventoryItem) {
        // If it's a serialized item, change its status back to "Disponible"
        if (originalInventoryItem.numeroSerie !== null) {
          updateInventoryItem(originalInventoryItem.id, { estado: "Disponible" })
        } else {
          // If it's a non-serialized item, increment its quantity in the "Disponible" entry
          const availableItemIndex = inventoryData.findIndex(
            (item) =>
              item.nombre === originalInventoryItem.nombre &&
              item.modelo === originalInventoryItem.modelo &&
              item.numeroSerie === null &&
              item.estado === "Disponible",
          )

          if (availableItemIndex !== -1) {
            const updatedInventory = [...inventoryData]
            updatedInventory[availableItemIndex] = {
              ...updatedInventory[availableItemIndex],
              cantidad: updatedInventory[availableItemIndex].cantidad + selectedAssignment.cantidad,
            }
            updateInventory(updatedInventory)
          } else {
            // If no "Disponible" entry exists for this non-serialized item, create one
            addInventoryItem({
              ...originalInventoryItem,
              id: Math.max(...inventoryData.map((item) => item.id)) + 1, // New ID for the returned quantity
              estado: "Disponible",
              cantidad: selectedAssignment.cantidad,
              numeroSerie: null, // Ensure it's null for non-serialized
            })
          }
        }
      }

      // Mark the assignment as "Retornado"
      updateAssignmentStatus(selectedAssignment.id, "Retornado")

      addRecentActivity({
        type: "Devolución de Asignación",
        description: `"${selectedAssignment.articuloNombre}" (SN: ${selectedAssignment.numeroSerie || "N/A"}) devuelto por "${selectedAssignment.asignadoA}".`,
        date: currentDateTime,
        details: {
          assignmentId: selectedAssignment.id,
          productName: selectedAssignment.articuloNombre,
          serialNumber: selectedAssignment.numeroSerie,
          assignedTo: selectedAssignment.asignadoA,
          returnedBy: currentUser,
        },
      })
      toast({
        title: "Producto Retornado",
        description: `"${selectedAssignment.articuloNombre}" ha sido marcado como retornado.`,
      })
    } else if (actionType === "retire") {
      // Find the original inventory item
      const originalInventoryItem = inventoryData.find(
        (item) => item.id === selectedAssignment.articuloId && item.numeroSerie === selectedAssignment.numeroSerie,
      )

      if (originalInventoryItem) {
        // If it's a serialized item, change its status to "Retirado"
        if (originalInventoryItem.numeroSerie !== null) {
          updateInventoryItem(originalInventoryItem.id, { estado: "Retirado" })
        } else {
          // If it's a non-serialized item, remove the assigned quantity and add a "Retirado" entry
          // This assumes the assigned item itself represents the quantity to be retired
          const newRetiredItem: InventoryItem = {
            ...originalInventoryItem,
            id: Math.max(...inventoryData.map((item) => item.id)) + 1, // New ID for the retired quantity
            estado: "Retirado",
            cantidad: selectedAssignment.cantidad, // Retire the assigned quantity
            numeroSerie: null, // Ensure it's null for non-serialized
            motivoRetiro: "Retirado desde Asignados", // Default reason
            fechaRetiro: new Date().toISOString().split("T")[0],
          }
          addInventoryItem(newRetiredItem)
        }
      }

      // Mark the assignment as "Retirado"
      updateAssignmentStatus(selectedAssignment.id, "Retirado")

      addRecentActivity({
        type: "Retiro desde Asignación",
        description: `"${selectedAssignment.articuloNombre}" (SN: ${selectedAssignment.numeroSerie || "N/A"}) retirado desde asignación.`,
        date: currentDateTime,
        details: {
          assignmentId: selectedAssignment.id,
          productName: selectedAssignment.articuloNombre,
          serialNumber: selectedAssignment.numeroSerie,
          assignedTo: selectedAssignment.asignadoA,
          retiredBy: currentUser,
        },
      })
      toast({
        title: "Producto Retirado",
        description: `"${selectedAssignment.articuloNombre}" ha sido marcado como retirado.`,
      })
    }
    setIsConfirmationDialogOpen(false)
    setSelectedAssignment(null)
  }

  const handleViewActivityDetails = (details: any) => {
    setSelectedActivityDetails(details)
    setIsActivityDetailSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artículos Asignados</h1>
        {canPerformActions && (
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkAssignModalOpen(true)}>Asignar Masivo</Button>
            <Button onClick={() => setIsBulkLendModalOpen(true)}>Prestar Masivo</Button>
            <Button onClick={() => setIsBulkRetireModalOpen(true)}>Retirar Masivo</Button>
            <Button onClick={() => setIsBulkEditModalOpen(true)}>Editar Masivo</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por artículo, N/S, asignado a..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-background pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Estado: {filterStatus}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus("Todos")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Activo")}>Activo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Retornado")}>Retornado</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Retirado")}>Retirado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("articuloNombre")}>
                  Artículo
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("numeroSerie")}>
                  Número de Serie
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("asignadoA")}>
                  Asignado A
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("fechaAsignacion")}>
                  Fecha Asignación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("estado")}>
                  Estado
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAsignados.length > 0 ? (
              filteredAsignados.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.articuloNombre}</TableCell>
                  <TableCell>{assignment.numeroSerie || "N/A"}</TableCell>
                  <TableCell>{assignment.asignadoA}</TableCell>
                  <TableCell>{new Date(assignment.fechaAsignacion).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={assignment.estado} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {assignment.estado === "Activo" && canPerformActions && (
                          <>
                            <DropdownMenuItem onClick={() => handleReturnProduct(assignment)}>
                              <Undo2 className="mr-2 h-4 w-4" />
                              Marcar como Retornado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRetireProduct(assignment)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Retirar Producto
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleViewActivityDetails(assignment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <EmptyState
                    title="No hay artículos asignados"
                    description="No se encontraron asignaciones que coincidan con los criterios de búsqueda."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialogForEditor
        isOpen={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        onConfirm={confirmAction}
        title={actionType === "return" ? "¿Confirmar Devolución?" : "¿Confirmar Retiro?"}
        description={
          actionType === "return"
            ? `¿Estás seguro de que deseas marcar "${selectedAssignment?.articuloNombre}" como retornado? Esto lo devolverá al inventario.`
            : `¿Estás seguro de que deseas retirar "${selectedAssignment?.articuloNombre}" del inventario? Esta acción es irreversible.`
        }
        confirmButtonText={actionType === "return" ? "Sí, Retornar" : "Sí, Retirar"}
        cancelButtonText="No, Cancelar"
      />

      {selectedActivityDetails && (
        <ActivityDetailSheet
          open={isActivityDetailSheetOpen}
          onOpenChange={setIsActivityDetailSheetOpen}
          activity={selectedActivityDetails}
        />
      )}

      {/* Modals for individual actions (if needed, currently handled by dropdown) */}
      {isAssignModalOpen && productToAssign && (
        <AssignModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          product={productToAssign}
          onSuccess={() => {}}
        />
      )}
      {isLendModalOpen && productToLend && (
        <LendModal
          open={isLendModalOpen}
          onOpenChange={setIsLendModalOpen}
          product={productToLend}
          onSuccess={() => {}}
        />
      )}
      {isRetireModalOpen && productToRetire && (
        <RetireProductModal
          open={isRetireModalOpen}
          onOpenChange={setIsRetireModalOpen}
          product={productToRetire}
          onSuccess={() => {}}
        />
      )}
      {isEditProductModalOpen && productToEdit && (
        <EditProductModal
          open={isEditProductModalOpen}
          onOpenChange={setIsEditProductModalOpen}
          product={productToEdit}
          onSuccess={() => {}}
        />
      )}

      {/* Bulk Action Modals */}
      <BulkAssignModal
        open={isBulkAssignModalOpen}
        onOpenChange={setIsBulkAssignModalOpen}
        selectedProducts={[]} // Pass selected products from a selection mechanism
        onSuccess={() => {}}
      />
      <BulkLendModal
        open={isBulkLendModalOpen}
        onOpenChange={setIsBulkLendModalOpen}
        selectedProducts={[]} // Pass selected products from a selection mechanism
        onSuccess={() => {}}
      />
      <BulkRetireModal
        open={isBulkRetireModalOpen}
        onOpenChange={setIsBulkRetireModalOpen}
        selectedProducts={[]} // Pass selected products from a selection mechanism
        onSuccess={() => {}}
      />
      <BulkEditModal
        open={isBulkEditModalOpen}
        onOpenChange={setIsBulkEditModalOpen}
        selectedProductIds={[]} // Pass selected product IDs from a selection mechanism
        onSuccess={() => {}}
      />
    </div>
  )
}
