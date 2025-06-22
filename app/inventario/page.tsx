"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Upload,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  ExternalLink,
  Edit,
  Eye,
  Copy,
  UserPlus,
  Trash2,
  Calendar,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AssignModal } from "@/components/assign-modal"
import { LendModal } from "@/components/lend-modal"
import { BulkEditModal } from "@/components/bulk-edit-modal"
import { BulkAssignModal } from "@/components/bulk-assign-modal"
import { BulkLendModal } from "@/components/bulk-lend-modal"
import { BulkRetireModal } from "@/components/bulk-retire-modal"
import { BrandCombobox } from "@/components/brand-combobox"
import { EmptyState } from "@/components/empty-state"
import { useApp } from "@/contexts/app-context"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { ActionMenu } from "@/components/action-menu"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

// Define all possible columns and their properties
const allColumns = [
  { id: "nombre", label: "Nombre", defaultVisible: true, sortable: true, fixed: "start" },
  { id: "marca", label: "Marca", defaultVisible: true, sortable: true },
  { id: "modelo", label: "Modelo", defaultVisible: true, sortable: true },
  { id: "numeroSerie", label: "N/S", defaultVisible: true, sortable: true },
  { id: "categoria", label: "Categoría", defaultVisible: true, sortable: true },
  { id: "estado", label: "Estado", defaultVisible: true, sortable: true },
  { id: "proveedor", label: "Proveedor", defaultVisible: false, sortable: true }, // New
  { id: "fechaAdquisicion", label: "Fecha Adquisición", defaultVisible: false, sortable: true }, // New
  { id: "contratoId", label: "Contrato ID", defaultVisible: false, sortable: true }, // New
  { id: "asignadoA", label: "Asignado A", defaultVisible: false, sortable: true }, // New (derived)
  { id: "fechaAsignacion", label: "Fecha Asignación", defaultVisible: false, sortable: true }, // New (derived)
  { id: "qty", label: "QTY", defaultVisible: true, sortable: false, fixed: "end" },
]

export default function InventarioPage() {
  const {
    state,
    updateInventory,
    updateInventoryItemStatus,
    addPendingRequest,
    addRecentActivity,
    updatePendingTask,
    updateUserColumnPreferences,
  } = useApp()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "duplicate" | "process-carga">("add")
  const [isLoading, setIsLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [showImportProgress, setShowImportProgress] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [filterCategoria, setFilterCategoria] = useState(searchParams.get("categoria") || "")
  const [filterMarca, setFilterMarca] = useState(searchParams.get("marca") || "")
  const [filterEstado, setFilterEstado] = useState(searchParams.get("estado") || "")
  const [hasSerialNumber, setHasSerialNumber] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isBulkLendModalOpen, setIsBulkLendModalOpen] = useState(false)
  const [isBulkRetireModalOpen, setIsBulkRetireModalOpen] = useState(false)
  const [isConfirmEditorOpen, setIsConfirmEditorOpen] = useState(false)
  const [pendingActionDetails, setPendingActionDetails] = useState<any>(null)
  const [processingTaskId, setProcessingTaskId] = useState<number | null>(null)
  const [tempMarca, setTempMarca] = useState("")
  const [isProcessingUrlParam, setIsProcessingUrlParam] = useState(false)

  // Column visibility state, loaded from user preferences or default
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const userId = state.user?.id
    const pageId = "inventario"
    if (userId && state.userColumnPreferences[userId]?.[pageId]) {
      return state.userColumnPreferences[userId][pageId]
    }
    return allColumns.filter((col) => col.defaultVisible).map((col) => col.id)
  })

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const { toast } = useToast()

  // Handle URL params for processing tasks
  useEffect(() => {
    const processCargaTaskId = searchParams.get("processCargaTaskId")
    const highlightRetireTask = searchParams.get("highlightRetireTask")

    if (isProcessingUrlParam) return

    if (processCargaTaskId) {
      setIsProcessingUrlParam(true)
      const taskId = Number.parseInt(processCargaTaskId)
      const task = state.pendingTasksData.find((t) => t.id === taskId && t.type === "CARGA")
      if (task) {
        setSelectedProduct({
          nombre: task.details.productName,
          cantidad: task.details.quantity,
          numeroSerie: task.details.serialNumbers ? task.details.serialNumbers.join("\n") : null,
          marca: task.details.brand || "",
          modelo: task.details.model || "",
          categoria: task.details.category || "",
          descripcion: task.details.description || "",
        })
        setTempMarca(task.details.brand || "")
        setModalMode("process-carga")
        setHasSerialNumber(!!task.details.serialNumbers && task.details.serialNumbers.length > 0)
        setIsAddProductModalOpen(true)
        setProcessingTaskId(taskId)
        router.replace("/inventario", { scroll: false })
      }
      setTimeout(() => setIsProcessingUrlParam(false), 100)
    } else if (highlightRetireTask) {
      setIsProcessingUrlParam(true)
      const taskId = Number.parseInt(highlightRetireTask)
      const task = state.pendingTasksData.find((t) => t.id === taskId && t.type === "RETIRO")
      if (task && task.details.itemsImplicados) {
        setSelectedRowIds(task.details.itemsImplicados.map((item: any) => item.id))
        toast({
          title: "Tarea de Retiro Pendiente",
          description: `Artículos de la tarea #${taskId} seleccionados para completar el retiro.`,
        })
        router.replace("/inventario", { scroll: false })
      }
      setTimeout(() => setIsProcessingUrlParam(false), 100)
    }
  }, [searchParams, state.pendingTasksData, router, isProcessingUrlParam])

  // Actualizar URL con filtros
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (filterCategoria) params.set("categoria", filterCategoria)
    if (filterMarca) params.set("marca", filterMarca)
    if (filterEstado) params.set("estado", filterEstado)

    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(`/inventario${newUrl}`, { scroll: false })
  }, [searchTerm, filterCategoria, filterMarca, filterEstado, router])

  // Save column preferences when they change
  useEffect(() => {
    if (state.user?.id) {
      updateUserColumnPreferences(state.user.id, "inventario", visibleColumns)
    }
  }, [visibleColumns, state.user?.id, updateUserColumnPreferences])

  // Sorting logic
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  // Helper to get current assignee/assignment date for a serialized item
  const getAssignmentDetails = (item: any) => {
    if (item.numeroSerie) {
      const activeAssignment = state.asignadosData.find(
        (a) => a.numeroSerie === item.numeroSerie && a.estado === "Activo",
      )
      if (activeAssignment) {
        return {
          asignadoA: activeAssignment.asignadoA,
          fechaAsignacion: activeAssignment.fechaAsignacion,
        }
      }
    }
    return { asignadoA: null, fechaAsignacion: null }
  }

  // Filtrar y ordenar datos
  const sortedAndFilteredData = useMemo(() => {
    let data = state.inventoryData.filter((item) => {
      const matchesSearch =
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.numeroSerie && item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.proveedor && item.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) || // Search new fields
        (item.contratoId && item.contratoId.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategoria = !filterCategoria || filterCategoria === "all" || item.categoria === filterCategoria
      const matchesMarca = !filterMarca || filterMarca === "all" || item.marca === filterMarca
      const matchesEstado = !filterEstado || filterEstado === "all" || item.estado === filterEstado

      return matchesSearch && matchesCategoria && matchesMarca && matchesEstado
    })

    if (sortColumn) {
      data = [...data].sort((a, b) => {
        let aValue: any
        let bValue: any

        // Handle special cases for sorting derived columns
        if (sortColumn === "asignadoA") {
          aValue = getAssignmentDetails(a).asignadoA || ""
          bValue = getAssignmentDetails(b).asignadoA || ""
        } else if (sortColumn === "fechaAsignacion") {
          aValue = getAssignmentDetails(a).fechaAsignacion || ""
          bValue = getAssignmentDetails(b).fechaAsignacion || ""
        } else {
          aValue = a[sortColumn] || ""
          bValue = b[sortColumn] || ""
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }
        return 0
      })
    }
    return data
  }, [
    state.inventoryData,
    state.asignadosData, // Dependency for derived columns
    searchTerm,
    filterCategoria,
    filterMarca,
    filterEstado,
    sortColumn,
    sortDirection,
  ])

  // Paginación
  const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = sortedAndFilteredData.slice(startIndex, endIndex)

  const selectedProducts = state.inventoryData.filter((item) => selectedRowIds.includes(item.id))

  const handleRowSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRowIds((prev) => [...prev, id])
    } else {
      setSelectedRowIds((prev) => prev.filter((rowId) => rowId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(paginatedData.map((item) => item.id))
    } else {
      setSelectedRowIds([])
    }
  }

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product)
    setIsDetailSheetOpen(true)
  }

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setModalMode("edit")
    setHasSerialNumber(!!product.numeroSerie)
    setTempMarca(product.marca || "")
    setIsAddProductModalOpen(true)
  }

  const handleDuplicate = (product: any) => {
    setSelectedProduct({ ...product, id: null, codigo: "", nombre: `Copia de ${product.nombre}` })
    setModalMode("duplicate")
    setHasSerialNumber(!!product.numeroSerie)
    setTempMarca(product.marca || "")
    setIsAddProductModalOpen(true)
  }

  const handleMarkAsRetired = (product: any) => {
    setSelectedProduct(product)
    setIsConfirmDialogOpen(true)
  }

  const executeReactivate = (product: any) => {
    updateInventoryItemStatus(product.id, "Disponible")
    addRecentActivity({
      type: "Reactivación",
      description: `${product.nombre} reactivado`,
      date: new Date().toLocaleString(),
      details: { product: { id: product.id, name: product.nombre, serial: product.numeroSerie } },
    })
    toast({
      title: "Producto reactivado",
      description: `${product.nombre} ha sido reactivado y está disponible.`,
    })
  }

  const handleReactivate = (product: any) => {
    if (state.user?.rol === "Editor") {
      setPendingActionDetails({
        type: "Reactivación",
        productId: product.id,
        productName: product.nombre,
        productSerialNumber: product.numeroSerie,
      })
      setIsConfirmEditorOpen(true)
      return
    }
    executeReactivate(product)
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setModalMode("add")
    setHasSerialNumber(false)
    setTempMarca("")
    setIsAddProductModalOpen(true)
  }

  const executeSaveProduct = (productData: any) => {
    setTimeout(() => {
      setIsAddProductModalOpen(false)
      setIsLoading(false)

      if (modalMode === "edit" && selectedProduct) {
        updateInventory(
          state.inventoryData.map((item) => (item.id === selectedProduct.id ? { ...item, ...productData } : item)),
        )
        addRecentActivity({
          type: "Edición de Producto",
          description: `${productData.nombre} actualizado`,
          date: new Date().toLocaleString(),
          details: {
            productId: selectedProduct.id,
            oldData: state.inventoryData.find((item) => item.id === selectedProduct.id),
            newData: productData,
          },
        })
        toast({
          title: "Producto actualizado",
          description: "El producto ha sido actualizado exitosamente.",
        })
      } else {
        const newItems = []
        if (productData.numeroSerie && hasSerialNumber) {
          const serials = productData.numeroSerie.split("\n").filter(Boolean)
          let currentMaxId = Math.max(...state.inventoryData.map((item) => item.id))
          serials.forEach((serial: string) => {
            currentMaxId++
            newItems.push({
              ...productData,
              id: currentMaxId,
              cantidad: 1,
              numeroSerie: serial.trim(),
              fechaIngreso: new Date().toISOString().split("T")[0],
            })
          })
        } else {
          const newId = Math.max(...state.inventoryData.map((item) => item.id)) + 1
          newItems.push({
            ...productData,
            id: newId,
            fechaIngreso: new Date().toISOString().split("T")[0],
            numeroSerie: productData.numeroSerie ? productData.numeroSerie.trim() : null,
          })
        }
        updateInventory([...state.inventoryData, ...newItems])
        addRecentActivity({
          type: modalMode === "add" ? "Nuevo Producto" : "Duplicación de Producto",
          description: `${newItems.length} producto(s) ${modalMode === "add" ? "añadido(s)" : "duplicado(s)"}`,
          date: new Date().toLocaleString(),
          details: { newProducts: newItems },
        })
        toast({
          title: "Producto guardado",
          description: `Se han guardado ${newItems.length} producto(s) exitosamente.`,
        })
      }

      if (processingTaskId !== null) {
        updatePendingTask(processingTaskId, {
          status: "Finalizada",
          auditLog: [
            ...(state.pendingTasksData.find((t) => t.id === processingTaskId)?.auditLog || []),
            {
              event: "FINALIZACIÓN",
              user: state.user?.nombre || "Sistema",
              dateTime: new Date().toISOString(),
              description: `Tarea de carga procesada y producto añadido/actualizado en inventario.`,
            },
          ],
        })
        addRecentActivity({
          type: "Finalización de Tarea",
          description: `Tarea de carga #${processingTaskId} finalizada`,
          date: new Date().toLocaleString(),
          details: { taskId: processingTaskId, taskType: "CARGA" },
        })
        setProcessingTaskId(null)
      }
    }, 1000)
  }

  const handleSaveProduct = async () => {
    setIsLoading(true)
    const form = document.getElementById("product-form") as HTMLFormElement
    const formData = new FormData(form)
    const productData = {
      nombre: formData.get("nombre") as string,
      marca: tempMarca,
      modelo: formData.get("modelo") as string,
      categoria: formData.get("categoria") as string,
      descripcion: formData.get("descripcion") as string,
      estado: selectedProduct?.estado || "Disponible",
      cantidad: hasSerialNumber ? 1 : Number.parseInt(formData.get("cantidad") as string) || 1,
      numeroSerie: hasSerialNumber ? (formData.get("numerosSerie") as string) || null : null,
      proveedor: (formData.get("proveedor") as string) || null, // New
      fechaAdquisicion: (formData.get("fechaAdquisicion") as string) || null, // New
      contratoId: (formData.get("contratoId") as string) || null, // New
    }

    if (state.user?.rol === "Editor") {
      // Removed modalMode !== "process-carga" condition
      setPendingActionDetails({
        type:
          modalMode === "add"
            ? "Creación de Producto"
            : modalMode === "edit"
              ? "Edición de Producto"
              : "Duplicación de Producto",
        productData: productData,
        originalProductId: selectedProduct?.id,
      })
      setIsConfirmEditorOpen(true)
      setIsLoading(false)
      return
    }

    executeSaveProduct(productData)
  }

  const handleImportCSV = () => {
    setShowImportProgress(true)
    setImportProgress(0)

    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setShowImportProgress(false)
            setIsImportModalOpen(false)
            updateInventory(state.inventoryData) // Trigger re-render with current data
            toast({
              title: "Importación completada",
              description: "Se han importado 25 productos exitosamente.",
            })
            addRecentActivity({
              type: "Importación CSV",
              description: "Se importaron 25 productos",
              date: new Date().toLocaleString(),
              details: { count: 25 },
            })
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const executeRetirement = () => {
    updateInventoryItemStatus(selectedProduct.id, "Retirado")
    addRecentActivity({
      type: "Retiro de Producto",
      description: `${selectedProduct?.nombre} retirado`,
      date: new Date().toLocaleString(),
      details: {
        product: { id: selectedProduct.id, name: selectedProduct.nombre, serial: selectedProduct.numeroSerie },
      },
    })
    toast({
      title: "Producto retirado",
      description: `${selectedProduct?.nombre} ha sido marcado como retirado.`,
    })
    setIsConfirmDialogOpen(false) // Ensure dialog is closed
    setSelectedProduct(null) // Clear selected product
  }

  const confirmRetirement = () => {
    if (state.user?.rol === "Editor") {
      setPendingActionDetails({
        type: "Retiro de Producto",
        productId: selectedProduct.id,
        productName: selectedProduct.nombre,
        productSerialNumber: selectedProduct.numeroSerie,
      })
      setIsConfirmEditorOpen(true)
      return
    }
    executeRetirement()
  }

  const getModalTitle = () => {
    switch (modalMode) {
      case "add":
        return "Añadir Producto"
      case "edit":
        return "Editar Producto"
      case "duplicate":
        return "Duplicar Producto"
      case "process-carga":
        return "Procesar Tarea de Carga"
      default:
        return "Producto"
    }
  }

  const handleAssign = (product: any) => {
    setSelectedProduct(product)
    setIsAssignModalOpen(true)
  }

  const handleLend = (product: any) => {
    setSelectedProduct(product)
    setIsLendModalOpen(true)
  }

  const handleBulkSuccess = () => {
    setSelectedRowIds([])
    updateInventory(state.inventoryData) // Trigger re-render with current data
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
    setIsConfirmEditorOpen(false) // Ensure dialog is closed
    setIsAddProductModalOpen(false) // Close product modal if it was open
    setIsConfirmDialogOpen(false) // Close retirement confirmation if it was open
    setSelectedProduct(null) // Clear selected product
  }

  const isLector = state.user?.rol === "Visualizador" // Updated role name

  // Function to calculate available and unavailable quantities for non-serialized items
  const getNonSerializedQtyBreakdown = (item: any) => {
    if (item.numeroSerie !== null) return null

    let totalAvailable = 0
    let totalUnavailable = 0
    let assignedCount = 0
    let lentCount = 0
    let maintenanceCount = 0
    let pendingRetireCount = 0
    let totalInInventory = 0

    const allInstances = state.inventoryData.filter(
      (invItem) => invItem.nombre === item.nombre && invItem.modelo === item.modelo && invItem.numeroSerie === null,
    )

    allInstances.forEach((instance) => {
      if (instance.estado !== "Retirado") {
        totalInInventory += instance.cantidad
      }

      if (instance.estado === "Disponible") {
        totalAvailable += instance.cantidad
      } else if (instance.estado === "Asignado") {
        assignedCount += instance.cantidad
        totalUnavailable += instance.cantidad
      } else if (instance.estado === "Prestado") {
        lentCount += instance.cantidad
        totalUnavailable += instance.cantidad
      } else if (instance.estado === "En Mantenimiento") {
        // Updated status name
        maintenanceCount += instance.cantidad
        totalUnavailable += instance.cantidad
      } else if (instance.estado === "PENDIENTE_DE_RETIRO") {
        pendingRetireCount += instance.cantidad
        totalUnavailable += instance.cantidad
      }
    })

    return {
      total: totalInInventory,
      available: totalAvailable,
      unavailable: totalUnavailable,
      assigned: assignedCount,
      lent: lentCount,
      maintenance: maintenanceCount,
      pendingRetire: pendingRetireCount,
    }
  }

  // Get status-based color class for serialized items
  const getSerializedQtyColorClass = (status: string) => {
    switch (status) {
      case "Disponible":
        return "text-status-disponible"
      case "Prestado":
        return "text-status-prestado"
      case "Asignado":
        return "text-status-asignado"
      case "En Mantenimiento": // Updated status name
        return "text-status-mantenimiento"
      case "PENDIENTE_DE_RETIRO":
        return "text-status-pendiente-de-retiro"
      case "Retirado":
        return "text-status-retirado"
      default:
        return "text-muted-foreground"
    }
  }

  const canShowBulkActions = selectedRowIds.length > 0 && state.user?.rol !== "Visualizador" // Updated role name

  if (sortedAndFilteredData.length === 0 && !searchTerm && !filterCategoria && !filterMarca && !filterEstado) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
              <p className="text-muted-foreground">Gestiona todos los productos del sistema</p>
            </div>
            {!isLector && (
              <div className="flex gap-2">
                <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
                <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Producto
                </Button>
              </div>
            )}
          </div>
          <EmptyState
            title="No hay productos en el inventario"
            description="¡Es hora de añadir el primer producto al sistema!"
            action={!isLector ? { label: "Añadir Producto", onClick: handleAddProduct } : undefined}
          />
        </div>
      </AppLayout>
    )
  }

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }
    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  // Filter columns to display based on visibility state
  const displayedColumns = useMemo(() => {
    const fixedStart = allColumns.find((col) => col.fixed === "start")
    const fixedEnd = allColumns.find((col) => col.fixed === "end")
    const otherColumns = allColumns.filter((col) => visibleColumns.includes(col.id) && !col.fixed)

    // Ensure fixed columns are always present and in correct order
    let finalColumns = []
    if (fixedStart) finalColumns.push(allColumns.find((col) => col.fixed === "start")!)
    finalColumns = [...finalColumns, ...otherColumns]
    if (fixedEnd) finalColumns.push(allColumns.find((col) => col.fixed === "end")!)

    return finalColumns
  }, [visibleColumns])

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    const column = allColumns.find((col) => col.id === columnId)
    if (column?.fixed) return // Prevent toggling fixed columns

    setVisibleColumns((prev) => (checked ? [...prev, columnId] : prev.filter((id) => id !== columnId)))
  }

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
              <p className="text-muted-foreground">Gestiona todos los productos del sistema</p>
            </div>
            {!isLector && (
              <div className="flex gap-2">
                <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Button>
                <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Producto
                </Button>
              </div>
            )}
          </div>

          {/* Filters and Column Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filtros</h4>
                        <p className="text-sm text-muted-foreground">
                          Filtra los productos por categoría, marca o estado
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="filterCategoria">Categoría</Label>
                          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                            <SelectTrigger className="col-span-2 h-8">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {state.categorias.map((categoria) => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="filterMarca">Marca</Label>
                          <Select value={filterMarca} onValueChange={setFilterMarca}>
                            <SelectTrigger className="col-span-2 h-8">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {state.marcas.map((marca) => (
                                <SelectItem key={marca} value={marca}>
                                  {marca}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="filterEstado">Estado</Label>
                          <Select value={filterEstado} onValueChange={setFilterEstado}>
                            <SelectTrigger className="col-span-2 h-8">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="Disponible">Disponible</SelectItem>
                              <SelectItem value="Prestado">Prestado</SelectItem>
                              <SelectItem value="Asignado">Asignado</SelectItem>
                              <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                              <SelectItem value="Retirado">Retirado</SelectItem>
                              <SelectItem value="PENDIENTE_DE_RETIRO">Pendiente de Retiro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Columns className="mr-2 h-4 w-4" />
                      Columnas
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Mostrar Columnas</p>
                      {allColumns.map((column) => (
                        <div key={column.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-${column.id}`}
                            checked={visibleColumns.includes(column.id)}
                            onCheckedChange={(checked) => handleColumnToggle(column.id, checked as boolean)}
                            disabled={!!column.fixed} // Disable fixed columns
                          />
                          <label
                            htmlFor={`col-${column.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {column.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {canShowBulkActions && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{selectedRowIds.length} producto(s) seleccionado(s)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsBulkEditModalOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Selección
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsBulkAssignModalOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Asignar Selección
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsBulkLendModalOpen(true)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Prestar Selección
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsBulkRetireModalOpen(true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Retirar Selección
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          {sortedAndFilteredData.length === 0 ? (
            <EmptyState
              title="No se encontraron productos"
              description="Intenta ajustar los filtros o términos de búsqueda para encontrar lo que buscas."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {!isLector && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRowIds.length === paginatedData.length && paginatedData.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      {displayedColumns.map((column) => (
                        <TableHead
                          key={column.id}
                          className={cn(column.sortable && "cursor-pointer")}
                          onClick={() => column.sortable && handleSort(column.id)}
                        >
                          <div className="flex items-center">
                            {column.label} {column.sortable && <SortIcon columnId={column.id} />}
                          </div>
                        </TableHead>
                      ))}
                      {!isLector && <TableHead className="w-12">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => {
                      const isUnavailableForActions =
                        item.estado === "Prestado" || item.estado === "En Mantenimiento" || item.estado === "Asignado"
                      const isRetired = item.estado === "Retirado"
                      const isPendingRetire = item.estado === "PENDIENTE_DE_RETIRO"

                      const qtyBreakdown = getNonSerializedQtyBreakdown(item)
                      const assignmentDetails = getAssignmentDetails(item) // Get assignment details

                      const actions = [
                        {
                          label: "Ver Detalles",
                          onClick: () => handleViewDetails(item),
                          icon: Eye,
                        },
                        {
                          label: "Editar",
                          onClick: () => handleEdit(item),
                          disabled: isPendingRetire,
                          tooltip: isPendingRetire ? "No se puede editar un artículo pendiente de retiro." : undefined,
                          icon: Edit,
                        },
                        {
                          label: "Duplicar",
                          onClick: () => handleDuplicate(item),
                          disabled: isPendingRetire,
                          tooltip: isPendingRetire
                            ? "No se puede duplicar un artículo pendiente de retiro."
                            : undefined,
                          icon: Copy,
                        },
                        ...(isRetired
                          ? [
                              {
                                label: "Reactivar Artículo",
                                onClick: () => handleReactivate(item),
                                icon: RotateCcw,
                              },
                            ]
                          : [
                              {
                                label: "Asignar...",
                                onClick: () => handleAssign(item),
                                disabled: isUnavailableForActions || isPendingRetire,
                                tooltip:
                                  isUnavailableForActions || isPendingRetire
                                    ? "No se puede asignar un artículo en este estado."
                                    : undefined,
                                icon: UserPlus,
                              },
                              {
                                label: "Prestar...",
                                onClick: () => handleLend(item),
                                disabled: isUnavailableForActions || isPendingRetire,
                                tooltip:
                                  isUnavailableForActions || isPendingRetire
                                    ? "No se puede prestar un artículo en este estado."
                                    : undefined,
                                icon: Calendar,
                              },
                              {
                                label: "Marcar como Retirado",
                                onClick: () => handleMarkAsRetired(item),
                                destructive: true,
                                disabled: isUnavailableForActions || isPendingRetire,
                                tooltip:
                                  isUnavailableForActions || isPendingRetire
                                    ? "No se puede retirar un artículo en este estado."
                                    : undefined,
                                icon: Trash2,
                              },
                            ]),
                      ]

                      return (
                        <TableRow key={item.id}>
                          {!isLector && (
                            <TableCell>
                              <Checkbox
                                checked={selectedRowIds.includes(item.id)}
                                onCheckedChange={(checked) => handleRowSelect(item.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          {displayedColumns.map((column) => (
                            <TableCell
                              key={column.id}
                              className={cn(
                                column.id === "nombre" && "font-medium",
                                column.id === "numeroSerie" && "font-mono text-sm",
                              )}
                            >
                              {column.id === "nombre" && item.nombre}
                              {column.id === "marca" && item.marca}
                              {column.id === "modelo" && item.modelo}
                              {column.id === "numeroSerie" && (item.numeroSerie || "N/A")}
                              {column.id === "categoria" && item.categoria}
                              {column.id === "estado" && <StatusBadge status={item.estado} />}
                              {column.id === "proveedor" && (item.proveedor || "N/A")}
                              {column.id === "fechaAdquisicion" && (item.fechaAdquisicion || "N/A")}
                              {column.id === "contratoId" && (item.contratoId || "N/A")}
                              {column.id === "asignadoA" && (assignmentDetails.asignadoA || "N/A")}
                              {column.id === "fechaAsignacion" && (assignmentDetails.fechaAsignacion || "N/A")}
                              {column.id === "qty" &&
                                (item.numeroSerie !== null ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        className={cn("font-bold text-lg", getSerializedQtyColorClass(item.estado))}
                                      >
                                        1
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>1 {item.estado}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : qtyBreakdown ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-baseline gap-1">
                                        {qtyBreakdown.available === qtyBreakdown.total ? (
                                          <span className="qty-available">{qtyBreakdown.total}</span>
                                        ) : qtyBreakdown.available === 0 ? (
                                          <>
                                            <span className="qty-total">{qtyBreakdown.total}</span>
                                            <span className="qty-unavailable">{qtyBreakdown.unavailable}</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="qty-total">{qtyBreakdown.total}</span>
                                            <span className="qty-available">{qtyBreakdown.available}</span>
                                            <span className="qty-unavailable">{qtyBreakdown.unavailable}</span>
                                          </>
                                        )}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="p-3">
                                      <div className="space-y-2">
                                        <div className="font-bold text-foreground">
                                          Inventario Total: {qtyBreakdown.total}
                                        </div>
                                        <hr className="border-t border-gray-200" />
                                        <div className="space-y-1">
                                          <div className="text-status-disponible">
                                            Disponibles: {qtyBreakdown.available}
                                          </div>
                                          {qtyBreakdown.assigned > 0 && (
                                            <div className="text-status-asignado ml-4">
                                              Asignados: {qtyBreakdown.assigned}
                                            </div>
                                          )}
                                          {qtyBreakdown.lent > 0 && (
                                            <div className="text-status-prestado ml-4">
                                              Prestados: {qtyBreakdown.lent}
                                            </div>
                                          )}
                                          {qtyBreakdown.maintenance > 0 && (
                                            <div className="text-status-mantenimiento ml-4">
                                              Mantenimiento: {qtyBreakdown.maintenance}
                                            </div>
                                          )}
                                          {qtyBreakdown.pendingRetire > 0 && (
                                            <div className="text-status-pendiente-de-retiro ml-4">
                                              Pendientes de Retiro: {qtyBreakdown.pendingRetire}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  item.cantidad
                                ))}
                            </TableCell>
                          ))}
                          {!isLector && (
                            <TableCell>
                              <ActionMenu actions={actions} />
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {sortedAndFilteredData.length} productos
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal: Add/Edit/Duplicate Product */}
        <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getModalTitle()}</DialogTitle>
              <DialogDescription>
                {modalMode === "add" && "Completa la información del nuevo producto."}
                {modalMode === "edit" && "Modifica la información del producto."}
                {modalMode === "duplicate" && "Revisa y ajusta la información del producto duplicado."}
                {modalMode === "process-carga" && "Completa la información para procesar la carga."}
              </DialogDescription>
            </DialogHeader>
            <form
              id="product-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveProduct()
              }}
            >
              <div className="grid grid-cols-2 gap-6 py-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Producto *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      defaultValue={selectedProduct?.nombre || ""}
                      required
                      readOnly={modalMode === "process-carga"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca</Label>
                    <BrandCombobox
                      value={tempMarca}
                      onValueChange={setTempMarca}
                      placeholder="Selecciona o escribe una marca"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input id="modelo" name="modelo" defaultValue={selectedProduct?.modelo || ""} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select defaultValue={selectedProduct?.categoria || ""} name="categoria">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      defaultValue={selectedProduct?.descripcion || ""}
                      rows={3}
                      placeholder="Descripción opcional del producto"
                    />
                  </div>

                  {/* New fields */}
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Input id="proveedor" name="proveedor" defaultValue={selectedProduct?.proveedor || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaAdquisicion">Fecha de Adquisición</Label>
                    <Input
                      id="fechaAdquisicion"
                      name="fechaAdquisicion"
                      type="date"
                      defaultValue={selectedProduct?.fechaAdquisicion || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contratoId">ID de Contrato</Label>
                    <Input id="contratoId" name="contratoId" defaultValue={selectedProduct?.contratoId || ""} />
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hasSerial"
                        checked={hasSerialNumber}
                        onCheckedChange={setHasSerialNumber}
                        disabled={modalMode === "process-carga"}
                      />
                      <Label htmlFor="hasSerial" className="flex items-center gap-1">
                        Este artículo tiene número de serie
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Activa esta opción si cada unidad del producto tiene un número de serie único que debe ser
                              rastreado individualmente.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    {!hasSerialNumber ? (
                      <div className="space-y-2">
                        <Label htmlFor="cantidad">Cantidad</Label>
                        <Input
                          id="cantidad"
                          name="cantidad"
                          type="number"
                          defaultValue={selectedProduct?.cantidad || "1"}
                          min="1"
                          readOnly={modalMode === "process-carga"}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="numerosSerie" className="flex items-center gap-1">
                          Números de Serie
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ingrese un número de serie por línea para crear múltiples artículos individuales</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Textarea
                          id="numerosSerie"
                          name="numerosSerie"
                          rows={4}
                          defaultValue={selectedProduct?.numeroSerie || ""}
                          placeholder="Ingrese un número de serie por línea&#10;Ejemplo:&#10;SN123456789&#10;SN987654321"
                          readOnly={modalMode === "edit" || modalMode === "process-carga"}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-hover">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: Import CSV */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar desde CSV
              </DialogTitle>
              <DialogDescription>Selecciona un archivo CSV para importar productos al inventario.</DialogDescription>
            </DialogHeader>
            {!showImportProgress ? (
              <div className="grid gap-4 py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="csvFile">Archivo CSV</Label>
                  <Input id="csvFile" type="file" accept=".csv" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>El archivo debe contener las columnas: nombre, marca, modelo, categoría, descripción.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Progreso de importación</Label>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{importProgress}% completado</p>
                </div>
              </div>
            )}
            {!showImportProgress && (
              <DialogFooter>
                <Button onClick={handleImportCSV} className="bg-primary hover:bg-primary-hover">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Retirement */}
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción marcará "{selectedProduct?.nombre}" como retirado. El producto no estará disponible para
                préstamos futuros.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRetirement} className="bg-destructive hover:bg-destructive/90">
                Sí, retirar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Product Detail Sheet */}
        <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detalle del Producto
              </SheetTitle>
              <SheetDescription>Información completa del producto seleccionado</SheetDescription>
            </SheetHeader>
            {selectedProduct && (
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{selectedProduct.nombre}</h3>

                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Marca:</dt>
                      <dd className="text-sm">{selectedProduct.marca}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Modelo:</dt>
                      <dd className="text-sm">{selectedProduct.modelo}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Categoría:</dt>
                      <dd className="text-sm">{selectedProduct.categoria}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Número de Serie:</dt>
                      <dd className="text-sm font-mono">{selectedProduct.numeroSerie || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Estado:</dt>
                      <dd>
                        <StatusBadge status={selectedProduct.estado} />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Proveedor:</dt> {/* New */}
                      <dd className="text-sm">{selectedProduct.proveedor || "N/A"}</dd> {/* New */}
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Fecha de Adquisición:</dt> {/* New */}
                      <dd className="text-sm">{selectedProduct.fechaAdquisicion || "N/A"}</dd> {/* New */}
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">ID de Contrato:</dt> {/* New */}
                      <dd className="text-sm">{selectedProduct.contratoId || "N/A"}</dd> {/* New */}
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Fecha de Ingreso:</dt>
                      <dd className="text-sm">{selectedProduct.fechaIngreso}</dd>
                    </div>
                    {selectedProduct.descripcion && (
                      <div className="pt-2 border-t">
                        <dt className="text-sm font-medium text-muted-foreground mb-1">Descripción:</dt>
                        <dd className="text-sm">{selectedProduct.descripcion}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/search?q=${encodeURIComponent(selectedProduct.nombre)}`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buscar en Google
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Modals */}
        <AssignModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          product={selectedProduct}
          onSuccess={updateInventory}
        />

        <LendModal
          open={isLendModalOpen}
          onOpenChange={setIsLendModalOpen}
          product={selectedProduct}
          onSuccess={updateInventory}
        />

        <BulkEditModal
          open={isBulkEditModalOpen}
          onOpenChange={setIsBulkEditModalOpen}
          selectedProductIds={selectedRowIds}
          onSuccess={handleBulkSuccess}
        />

        <BulkAssignModal
          open={isBulkAssignModalOpen}
          onOpenChange={setIsBulkAssignModalOpen}
          selectedProducts={selectedProducts}
          onSuccess={handleBulkSuccess}
        />

        <BulkLendModal
          open={isBulkLendModalOpen}
          onOpenChange={setIsBulkLendModalOpen}
          selectedProducts={selectedProducts}
          onSuccess={handleBulkSuccess}
        />

        <BulkRetireModal
          open={isBulkRetireModalOpen}
          onOpenChange={setIsBulkRetireModalOpen}
          selectedProducts={selectedProducts}
          onSuccess={handleBulkSuccess}
        />

        <ConfirmationDialogForEditor
          open={isConfirmEditorOpen}
          onOpenChange={setIsConfirmEditorOpen}
          onConfirm={handleConfirmEditorAction}
        />
      </TooltipProvider>
    </AppLayout>
  )
}
