"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, ArrowUpDown, CheckCircle, XCircle, Eye, Edit } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import type { PendingTask, InventoryItem, Assignment, Loan } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/empty-state"
import { TaskAuditLogSheet } from "@/components/task-audit-log-sheet"
import { EditTaskSheet } from "@/components/edit-task-sheet"
import { AssignModal } from "@/components/assign-modal"
import { LendModal } from "@/components/lend-modal"
import { QuickLoadModal } from "@/components/quick-load-modal"
import { RetireProductModal } from "@/components/retire-product-modal"

export default function TareasPendientesPage() {
  const {
    state,
    updatePendingTask,
    addRecentActivity,
    updateInventory,
    addAssignment,
    addLoan,
    removeInventoryItem,
    addInventoryItem,
    updateInventoryItem,
  } = useApp()
  const { pendingTasksData, user, inventoryData, asignadosData, prestamosData } = state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("Pendiente")
  const [filterType, setFilterType] = useState("Todos")
  const [sortBy, setSortBy] = useState<keyof PendingTask>("creationDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PendingTask | null>(null)
  const [actionType, setActionType] = useState<"approve" | "cancel">("approve")
  const { toast } = useToast()
  const [isAuditLogSheetOpen, setIsAuditLogSheetOpen] = useState(false)
  const [isEditTaskSheetOpen, setIsEditTaskSheetOpen] = useState(false)

  // Modals for task types
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [isQuickLoadModalOpen, setIsQuickLoadModalOpen] = useState(false)
  const [isRetireProductModalOpen, setIsRetireProductModalOpen] = useState(false)

  const canApproveOrCancel = user?.rol === "Administrador" || user?.rol === "Editor"

  const filteredTasks = useMemo(() => {
    const filtered = pendingTasksData.filter((task) => {
      const matchesSearch =
        task.type
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) || // Added ?.
        task.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) || // Added ?.
        task.details?.productName?.toLowerCase().includes(searchTerm.toLowerCase() || "") || // Added || ''
        task.details?.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase() || "") || // Added || ''
        task.details?.lentToName?.toLowerCase().includes(searchTerm.toLowerCase() || "") || // Added || ''
        task.details?.reason?.toLowerCase().includes(searchTerm.toLowerCase() || "") // Added || ''

      const matchesStatus = filterStatus === "Todos" || task.status === filterStatus

      const matchesType = filterType === "Todos" || task.type === filterType

      return matchesSearch && matchesStatus && matchesType
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
  }, [pendingTasksData, searchTerm, filterStatus, filterType, sortBy, sortDirection])

  const handleSort = (column: keyof PendingTask) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handleApproveTask = (task: PendingTask) => {
    setSelectedTask(task)
    setActionType("approve")
    setIsConfirmationDialogOpen(true)
  }

  const handleCancelTask = (task: PendingTask) => {
    setSelectedTask(task)
    setActionType("cancel")
    setIsConfirmationDialogOpen(true)
  }

  const handleViewAuditLog = (task: PendingTask) => {
    setSelectedTask(task)
    setIsAuditLogSheetOpen(true)
  }

  const handleEditTask = (task: PendingTask) => {
    setSelectedTask(task)
    setIsEditTaskSheetOpen(true)
  }

  const confirmAction = () => {
    if (!selectedTask) return

    const currentUser = user?.nombre || "Sistema"
    const currentDateTime = new Date().toLocaleString()

    if (actionType === "approve") {
      const newInventory = [...inventoryData]
      const newAsignados = [...asignadosData]
      const newPrestamos = [...prestamosData]

      switch (selectedTask.type) {
        case "CARGA":
          const newId = Math.max(...inventoryData.map((item) => item.id)) + 1
          const newItem: InventoryItem = {
            id: newId,
            nombre: selectedTask.details.productName,
            marca: selectedTask.details.brand,
            modelo: selectedTask.details.model,
            categoria: selectedTask.details.category,
            descripcion: selectedTask.details.description,
            estado: "Disponible",
            cantidad: selectedTask.details.quantity,
            numeroSerie:
              selectedTask.details.serialNumbers && selectedTask.details.serialNumbers.length > 0
                ? selectedTask.details.serialNumbers[0]
                : null,
            fechaIngreso: new Date().toISOString().split("T")[0],
          }
          addInventoryItem(newItem)
          addRecentActivity({
            type: "Carga de Producto",
            description: `Se aprobó la carga de "${selectedTask.details.productName}" (Cantidad: ${selectedTask.details.quantity}).`,
            date: currentDateTime,
            details: selectedTask.details,
          })
          break
        case "RETIRO":
          selectedTask.details.itemsImplicados.forEach((itemToRetire: any) => {
            const itemIndex = newInventory.findIndex(
              (inv) => inv.id === itemToRetire.originalId && inv.numeroSerie === itemToRetire.serial,
            )
            if (itemIndex !== -1) {
              newInventory[itemIndex] = {
                ...newInventory[itemIndex],
                estado: "Retirado",
                motivoRetiro: selectedTask.details.reason,
                fechaRetiro: new Date().toISOString().split("T")[0],
              }
            }
          })
          updateInventory(newInventory)
          addRecentActivity({
            type: "Retiro de Producto",
            description: `Se aprobó el retiro de "${selectedTask.details.itemsImplicados[0]?.name || "Múltiples artículos"}" por "${selectedTask.details.reason}".`,
            date: currentDateTime,
            details: selectedTask.details,
          })
          break
        case "ASIGNACION":
          const assignedItem = inventoryData.find(
            (item) =>
              item.id === selectedTask.details.productId &&
              item.numeroSerie === selectedTask.details.productSerialNumber,
          )
          if (assignedItem) {
            updateInventoryItem(assignedItem.id, { estado: "Asignado" })
            const newAssignment: Assignment = {
              id: Math.max(...asignadosData.map((a) => a.id), 0) + 1,
              articuloId: assignedItem.id,
              articuloNombre: assignedItem.nombre,
              numeroSerie: assignedItem.numeroSerie,
              asignadoA: selectedTask.details.assignedTo,
              fechaAsignacion: new Date().toISOString().split("T")[0],
              estado: "Activo",
              notas: selectedTask.details.notes,
              registradoPor: currentUser,
            }
            addAssignment(newAssignment)
            addRecentActivity({
              type: "Asignación de Producto",
              description: `Se aprobó la asignación de "${assignedItem.nombre}" (SN: ${assignedItem.numeroSerie || "N/A"}) a "${selectedTask.details.assignedTo}".`,
              date: currentDateTime,
              details: selectedTask.details,
            })
          }
          break
        case "PRESTAMO":
          const lentItem = inventoryData.find(
            (item) =>
              item.id === selectedTask.details.productId &&
              item.numeroSerie === selectedTask.details.productSerialNumber,
          )
          if (lentItem) {
            updateInventoryItem(lentItem.id, { estado: "Prestado" })
            const newLoan: Loan = {
              id: Math.max(...prestamosData.map((p) => p.id), 0) + 1,
              articuloId: lentItem.id,
              articulo: lentItem.nombre,
              numeroSerie: lentItem.numeroSerie,
              prestadoA: selectedTask.details.lentToName,
              fechaPrestamo: new Date().toISOString().split("T")[0],
              fechaDevolucion: selectedTask.details.returnDate,
              estado: "Activo",
              diasRestantes: Math.ceil(
                (new Date(selectedTask.details.returnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
              ),
              notas: selectedTask.details.notes,
              registradoPor: currentUser,
            }
            addLoan(newLoan)
            addRecentActivity({
              type: "Préstamo de Producto",
              description: `Se aprobó el préstamo de "${lentItem.nombre}" (SN: ${lentItem.numeroSerie || "N/A"}) a "${selectedTask.details.lentToName}".`,
              date: currentDateTime,
              details: selectedTask.details,
            })
          }
          break
        case "Reactivación":
          const reactivatedItem = inventoryData.find(
            (item) =>
              item.id === selectedTask.details.productId &&
              item.numeroSerie === selectedTask.details.productSerialNumber,
          )
          if (reactivatedItem) {
            updateInventoryItem(reactivatedItem.id, { estado: "Disponible" })
            addRecentActivity({
              type: "Reactivación de Producto",
              description: `Se aprobó la reactivación de "${reactivatedItem.nombre}" (SN: ${reactivatedItem.numeroSerie || "N/A"}).`,
              date: currentDateTime,
              details: selectedTask.details,
            })
          }
          break
        case "Creación de Producto":
          const newProduct: InventoryItem = {
            id: Math.max(...inventoryData.map((item) => item.id), 0) + 1,
            nombre: selectedTask.details.nombre,
            marca: selectedTask.details.marca,
            modelo: selectedTask.details.modelo,
            categoria: selectedTask.details.categoria,
            descripcion: selectedTask.details.descripcion,
            estado: "Disponible",
            cantidad: selectedTask.details.cantidad,
            numeroSerie: selectedTask.details.numeroSerie,
            fechaIngreso: new Date().toISOString().split("T")[0],
          }
          addInventoryItem(newProduct)
          addRecentActivity({
            type: "Creación de Producto",
            description: `Se aprobó la creación del producto "${newProduct.nombre}".`,
            date: currentDateTime,
            details: selectedTask.details,
          })
          break
        case "Edición de Producto":
          updateInventoryItem(selectedTask.details.id, selectedTask.details.updates)
          addRecentActivity({
            type: "Edición de Producto",
            description: `Se aprobó la edición del producto "${selectedTask.details.updates.nombre || selectedTask.details.id}".`,
            date: currentDateTime,
            details: selectedTask.details,
          })
          break
        case "Duplicación de Producto":
          const duplicatedItem: InventoryItem = {
            ...selectedTask.details.originalProduct,
            id: Math.max(...inventoryData.map((item) => item.id), 0) + 1,
            numeroSerie: selectedTask.details.newSerialNumber || null,
            fechaIngreso: new Date().toISOString().split("T")[0],
          }
          addInventoryItem(duplicatedItem)
          addRecentActivity({
            type: "Duplicación de Producto",
            description: `Se aprobó la duplicación del producto "${duplicatedItem.nombre}".`,
            date: currentDateTime,
            details: selectedTask.details,
          })
          break
        default:
          break
      }

      updatePendingTask(selectedTask.id, {
        status: "Finalizada",
        auditLog: [
          ...(selectedTask.auditLog || []),
          {
            event: "APROBACIÓN",
            user: currentUser,
            dateTime: currentDateTime,
            description: `Tarea aprobada por ${currentUser}.`,
          },
        ],
      })
      toast({
        title: "Tarea Aprobada",
        description: `La tarea de ${selectedTask.type?.toLowerCase()} ha sido aprobada.`, // Added ?.
      })
    } else if (actionType === "cancel") {
      updatePendingTask(selectedTask.id, {
        status: "Cancelada",
        auditLog: [
          ...(selectedTask.auditLog || []),
          {
            event: "CANCELACIÓN",
            user: currentUser,
            dateTime: currentDateTime,
            description: `Tarea cancelada por ${currentUser}.`,
          },
        ],
      })
      addRecentActivity({
        type: "Cancelación de Tarea",
        description: `La tarea de ${selectedTask.type?.toLowerCase()} (ID: ${selectedTask.id}) fue cancelada.`, // Added ?.
        date: currentDateTime,
        details: { taskId: selectedTask.id, taskType: selectedTask.type, cancelledBy: currentUser },
      })
      toast({
        title: "Tarea Cancelada",
        description: `La tarea de ${selectedTask.type?.toLowerCase()} ha sido cancelada.`, // Added ?.
      })
    }
    setIsConfirmationDialogOpen(false)
    setSelectedTask(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tareas Pendientes</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar tarea..."
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
            <DropdownMenuItem onClick={() => setFilterStatus("Pendiente")}>Pendiente</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Finalizada")}>Finalizada</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Cancelada")}>Cancelada</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tipo: {filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType("Todos")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("CARGA")}>Carga</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("RETIRO")}>Retiro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("ASIGNACION")}>Asignación</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("PRESTAMO")}>Préstamo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("Reactivación")}>Reactivación</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("Creación de Producto")}>
              Creación de Producto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("Edición de Producto")}>
              Edición de Producto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("Duplicación de Producto")}>
              Duplicación de Producto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("type")}>
                  Tipo
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Detalles</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("createdBy")}>
                  Solicitado Por
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("creationDate")}>
                  Fecha Creación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("status")}>
                  Estado
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.type}</TableCell>
                  <TableCell>
                    {task.type === "CARGA" &&
                      `Carga de ${task.details?.productName || ""} (x${task.details?.quantity || 0})`}
                    {task.type === "RETIRO" &&
                      `Retiro de ${task.details?.itemsImplicados?.[0]?.name || "múltiples artículos"}`}
                    {task.type === "ASIGNACION" &&
                      `Asignación de ${task.details?.productName || ""} a ${task.details?.assignedTo || ""}`}
                    {task.type === "PRESTAMO" &&
                      `Préstamo de ${task.details?.productName || ""} a ${task.details?.lentToName || ""}`}
                    {task.type === "Reactivación" && `Reactivación de ${task.details?.productName || ""}`}
                    {task.type === "Creación de Producto" && `Creación de ${task.details?.nombre || ""}`}
                    {task.type === "Edición de Producto" &&
                      `Edición de ${task.details?.updates?.nombre || task.details?.id || ""}`}
                    {task.type === "Duplicación de Producto" &&
                      `Duplicación de ${task.details?.originalProduct?.nombre || ""}`}
                  </TableCell>
                  <TableCell>{task.createdBy}</TableCell>
                  <TableCell>{new Date(task.creationDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
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
                        <DropdownMenuItem onClick={() => handleViewAuditLog(task)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Auditoría
                        </DropdownMenuItem>
                        {task.status === "Pendiente" && canApproveOrCancel && (
                          <>
                            <DropdownMenuItem onClick={() => handleApproveTask(task)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelTask(task)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        {task.status === "Pendiente" && canApproveOrCancel && (
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Tarea
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <EmptyState
                    title="No hay tareas pendientes"
                    description="No se encontraron tareas que coincidan con los criterios de búsqueda."
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
        title={actionType === "approve" ? "¿Confirmar Aprobación?" : "¿Confirmar Cancelación?"}
        description={
          actionType === "approve"
            ? `¿Estás seguro de que deseas aprobar la tarea de ${selectedTask?.type?.toLowerCase()}? Esta acción actualizará el inventario.`
            : `¿Estás seguro de que deseas cancelar la tarea de ${selectedTask?.type?.toLowerCase()}? Esta acción no se puede deshacer.`
        }
        confirmButtonText={actionType === "approve" ? "Sí, Aprobar" : "Sí, Cancelar"}
        cancelButtonText="No, Mantener"
      />

      {selectedTask && (
        <TaskAuditLogSheet
          open={isAuditLogSheetOpen}
          onOpenChange={setIsAuditLogSheetOpen}
          auditLog={selectedTask.auditLog || []}
          taskType={selectedTask.type || "Desconocido"}
        />
      )}

      {selectedTask && (
        <EditTaskSheet
          open={isEditTaskSheetOpen}
          onOpenChange={setIsEditTaskSheetOpen}
          task={selectedTask}
          onSave={(updatedDetails) => {
            updatePendingTask(selectedTask.id, {
              details: updatedDetails,
              auditLog: [
                ...(selectedTask.auditLog || []),
                {
                  event: "EDICIÓN",
                  user: user?.nombre || "Desconocido",
                  dateTime: new Date().toLocaleString(),
                  description: `Tarea editada por ${user?.nombre || "Desconocido"}.`,
                },
              ],
            })
            toast({
              title: "Tarea Actualizada",
              description: "Los detalles de la tarea han sido guardados.",
            })
          }}
        />
      )}

      {/* Modals for specific task types, if needed for direct action */}
      {selectedTask?.type === "ASIGNACION" && (
        <AssignModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          initialProductId={selectedTask.details.productId}
          initialSerialNumber={selectedTask.details.productSerialNumber}
          initialAssignedTo={selectedTask.details.assignedTo}
          initialNotes={selectedTask.details.notes}
        />
      )}
      {selectedTask?.type === "PRESTAMO" && (
        <LendModal
          open={isLendModalOpen}
          onOpenChange={setIsLendModalOpen}
          initialProductId={selectedTask.details.productId}
          initialSerialNumber={selectedTask.details.productSerialNumber}
          initialLentTo={selectedTask.details.lentToName}
          initialReturnDate={selectedTask.details.returnDate}
          initialNotes={selectedTask.details.notes}
        />
      )}
      {selectedTask?.type === "CARGA" && (
        <QuickLoadModal
          open={isQuickLoadModalOpen}
          onOpenChange={setIsQuickLoadModalOpen}
          initialProductName={selectedTask.details.productName}
          initialQuantity={selectedTask.details.quantity}
          initialBrand={selectedTask.details.brand}
          initialModel={selectedTask.details.model}
          initialCategory={selectedTask.details.category}
          initialDescription={selectedTask.details.description}
          initialProveedor={selectedTask.details.proveedor}
          initialFechaAdquisicion={selectedTask.details.fechaAdquisicion}
          initialContratoId={selectedTask.details.contratoId}
          initialHasSerialNumber={
            selectedTask.details.serialNumbers !== null && selectedTask.details.serialNumbers.length > 0
          }
        />
      )}
      {selectedTask?.type === "RETIRO" && (
        <RetireProductModal
          open={isRetireProductModalOpen}
          onOpenChange={setIsRetireProductModalOpen}
          initialProductId={selectedTask.details.productId}
          initialSerialNumber={selectedTask.details.productSerialNumber}
          initialRetireReason={selectedTask.details.reason}
          initialNotes={selectedTask.details.notes}
        />
      )}
    </div>
  )
}
