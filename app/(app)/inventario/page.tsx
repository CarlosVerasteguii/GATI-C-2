"use client"

import { useState, useEffect, useReducer, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn, getAssignmentDetails, getColumnValue } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  User, FileText, File, Edit, Trash2, Plus, Search, MoreHorizontal, X,
  Package, Filter, CheckCircle, Clock, Calendar, ArrowDown, ArrowUp,
  ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Loader2,
  Upload, Download, Info, ChevronUp, PackagePlus, PackageMinus, ArrowUpDown
} from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { type InventoryItem } from "@/contexts/app-context"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { showError, showSuccess, showInfo } from "@/hooks/use-toast"
import DocumentManager from "@/components/document-manager"
import { QuickLoadModal } from "@/components/quick-load-modal"
import { QuickRetireModal } from "@/components/quick-retire-modal"

// Componentes propios
import { AssignModal } from "@/components/assign-modal"
import { LendModal } from "@/components/lend-modal"
import { BulkEditModal } from "@/components/bulk-edit-modal"
import { BulkAssignModal } from "@/components/bulk-assign-modal"
import { BulkLendModal } from "@/components/bulk-lend-modal"
import { BulkRetireModal } from "@/components/bulk-retire-modal"
import { BrandCombobox } from "@/components/brand-combobox"
import { EmptyState } from "@/components/empty-state"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { ActionMenu } from "@/components/action-menu"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useDebouncedSelector } from "@/hooks/use-debounced-store"
import { useFilterStore, useFilterUrlSync, type AdvancedFilters } from "@/lib/stores/filter-store"
import { useInventoryTableStore } from "@/lib/stores/inventory-table-store"
import { useModalsStore } from "@/lib/stores/modals-store"
import { useProductSelectionStore } from "@/lib/stores/product-selection-store"

// Definición de interfaces para tipar correctamente
interface AssignmentItem {
  numeroSerie: string
  estado: string
  asignadoA: string
  fechaAsignacion: string
}

interface AssignmentDetails {
  asignadoA: string | null
  fechaAsignacion: string | null
}

interface QtyBreakdown {
  total: number
  available: number
  unavailable: number
  assigned: number
  lent: number
  maintenance: number
  pendingRetire: number
}

interface PendingActionDetails {
  type: string
  productData?: any
  originalProductId?: number
  productId?: number
  productName?: string
  productSerialNumber?: string | null
}

interface ColumnDefinition {
  id: string
  label: string
  defaultVisible: boolean
  sortable: boolean
  fixed?: "start" | "end"
}

// Define all possible columns and their properties
const allColumns: ColumnDefinition[] = [
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
  const { state, dispatch: appDispatch } = useApp()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Definir los estados especiales para filtros
  const specialStates = [
    { value: 'equipos-criticos', label: 'Equipos Críticos' },
    { value: 'proximos-vencer-garantia', label: 'Próximos a Vencer Garantía' },
    { value: 'sin-documentos', label: 'Sin Documentos' },
    { value: 'adquisicion-reciente', label: 'Adquisición Reciente' }
  ]

  // Definir los estados de mantenimiento para filtros
  const estadosMantenimiento = [
    { value: 'requiere', label: 'Requiere Mantenimiento' },
    { value: 'programado', label: 'Mantenimiento Programado' },
    { value: 'reciente', label: 'Mantenimiento Reciente' }
  ]

  // Añadir el estado para las columnas visibles
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Inicializar con las columnas que tienen defaultVisible = true
    return allColumns.filter(col => col.defaultVisible).map(col => col.id)
  })

  // Obtener estados y acciones del store de tabla de inventario
  const {
    tempMarca, setTempMarca,
    activeFormTab, setActiveFormTab,
    processingTaskId, setProcessingTaskId,
    sortColumn, sortDirection, setSortColumn, setSortDirection,
    selectedRowIds, toggleRowSelection, selectAllRows, clearRowSelection,
    isMaintenanceModalOpen, setIsMaintenanceModalOpen,
    maintenanceDetails, setMaintenanceDetails,
    selectedFiles, setSelectedFiles,
    uploadingFiles, setUploadingFiles,
    attachedDocuments, setAttachedDocuments,
    retirementDetails, setRetirementDetails, resetRetirementDetails
  } = useInventoryTableStore()

  // Obtener estados y acciones del store de modales
  const {
    isAddProductModalOpen, setIsAddProductModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isDetailSheetOpen, setIsDetailSheetOpen,
    isConfirmDialogOpen, setIsConfirmDialogOpen,
    isConfirmEditorOpen, setIsConfirmEditorOpen,
    isAssignModalOpen, setIsAssignModalOpen,
    isLendModalOpen, setIsLendModalOpen,
    isQuickLoadModalOpen, setIsQuickLoadModalOpen,
    isQuickRetireModalOpen, setIsQuickRetireModalOpen,
    modalMode, setModalMode,
    pendingActionDetails, setPendingActionDetails
  } = useModalsStore()

  // Obtener estados y acciones del store de selección de productos
  const {
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    selectedProduct, setSelectedProduct,
    isLoading, setIsLoading,
    importProgress, setImportProgress,
    showImportProgress, setShowImportProgress,
    resetImportProgress
  } = useProductSelectionStore()

  // Definir el reducer local para manejar acciones específicas del componente
  const inventoryReducer = (state: any, action: any) => {
    switch (action.type) {
      case "REFRESH_INVENTORY":
        // Esta acción simplemente desencadena una actualización del estado local
        return { ...state, lastRefresh: Date.now() };
      default:
        return state;
    }
  };

  // Usar useReducer para manejar acciones locales
  const [localState, dispatch] = useReducer(inventoryReducer, { lastRefresh: Date.now() });

  // El itemsPerPage ahora se maneja en el store de selección de productos

  // Estados de filtro migrados a Zustand
  // Estado para filtros avanzados usando el hook personalizado
  const defaultAdvancedFilters: AdvancedFilters = {
    fechaDesde: null,
    fechaHasta: null,
    diasEnOperacion: null,
    documentos: null,
    estadosEspeciales: [],
    rangoValor: [null, null],
    ubicaciones: [],
    estadoMantenimiento: null,
  }

  // Obtener estados y acciones de la tienda Zustand
  const {
    searchTerm,
    filterCategoria,
    filterMarca,
    filterEstado,
    hasSerialNumber,
    advancedFilters,
    showAdvancedFilters,
    setSearchTerm: setStoreSearchTerm,
    setFilterCategoria: setStoreFilterCategoria,
    setFilterMarca: setStoreFilterMarca,
    setFilterEstado: setStoreFilterEstado,
    setHasSerialNumber: setStoreHasSerialNumber,
    setShowAdvancedFilters,
    updateAdvancedFilters,
    resetAdvancedFilters,
    resetAllFilters,
    syncWithUrl
  } = useFilterStore()

  // Extraer ubicaciones disponibles del inventario
  const ubicacionesDisponibles = useMemo(() => {
    // Extraer todas las ubicaciones y filtrar valores undefined/null
    const allLocations = state.inventoryData
      .map(item => item.ubicacion)
      .filter(ubicacion => ubicacion) as string[];

    // Devolver ubicaciones únicas ordenadas alfabéticamente
    return [...new Set(allLocations)].sort();
  }, [state.inventoryData]);

  // Sincronización con URL
  const { updateUrl } = useFilterUrlSync(router, pathname)

  // Usar debounce para el término de búsqueda
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebouncedSelector(
    () => useFilterStore.getState().searchTerm,
    setStoreSearchTerm,
    300
  )

  // Sincronizar con URL al montar el componente
  useEffect(() => {
    syncWithUrl(searchParams)
  }, [searchParams, syncWithUrl])

  // Actualizar URL cuando cambian los filtros
  useEffect(() => {
    updateUrl(true)
  }, [searchTerm, filterCategoria, filterMarca, filterEstado, hasSerialNumber, advancedFilters, updateUrl])

  // Función para manejar cambios en los filtros de estado especial
  const handleSpecialStateChange = (value: string) => {
    updateAdvancedFilters({
      estadosEspeciales: advancedFilters.estadosEspeciales.includes(value)
        ? advancedFilters.estadosEspeciales.filter(state => state !== value)
        : [...advancedFilters.estadosEspeciales, value]
    })
  }

  // Aplicar filtros avanzados a los resultados
  const applyAdvancedFilters = (items: InventoryItem[]) => {
    let filtered = [...items]

    // Filtrar por fechaAdquisicion
    if (advancedFilters.fechaDesde) {
      filtered = filtered.filter(item =>
        item.fechaAdquisicion &&
        new Date(item.fechaAdquisicion) >= advancedFilters.fechaDesde!
      )
    }

    if (advancedFilters.fechaHasta) {
      filtered = filtered.filter(item =>
        item.fechaAdquisicion &&
        new Date(item.fechaAdquisicion) <= advancedFilters.fechaHasta!
      )
    }

    // Filtrar por documentos adjuntos
    if (advancedFilters.documentos !== null) {
      filtered = filtered.filter(item => {
        const hasDocuments = item.documentosAdjuntos && item.documentosAdjuntos.length > 0
        return advancedFilters.documentos ? hasDocuments : !hasDocuments
      })
    }

    // Aplicar filtros de estados especiales
    if (advancedFilters.estadosEspeciales.length > 0) {
      const today = new Date()

      filtered = filtered.filter(item => {
        // Verificar cada estado especial seleccionado
        return advancedFilters.estadosEspeciales.some(state => {
          switch (state) {
            case 'equipos-criticos':
              // Ejemplo: consideramos críticos los equipos con costo > 5000
              return item.costo && item.costo > 5000

            case 'proximos-vencer-garantia':
              if (!item.garantia) return false

              // Convertir garantía a fecha (formato esperado: YYYY-MM-DD)
              const garantiaDate = new Date(item.garantia)
              const diffTime = garantiaDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              return diffDays > 0 && diffDays <= 30

            case 'sin-documentos':
              return !item.documentosAdjuntos || item.documentosAdjuntos.length === 0

            case 'adquisicion-reciente':
              if (!item.fechaAdquisicion) return false

              const adquisicionDate = new Date(item.fechaAdquisicion)
              const diffTimeAdq = today.getTime() - adquisicionDate.getTime()
              const diffDaysAdq = Math.ceil(diffTimeAdq / (1000 * 60 * 60 * 24))
              return diffDaysAdq <= 30

            default:
              return false
          }
        })
      })
    }

    // FASE 2: Filtrar por rango de valor/costo
    const [minValue, maxValue] = advancedFilters.rangoValor
    if (minValue !== null) {
      filtered = filtered.filter(item => item.costo !== undefined && item.costo >= minValue)
    }

    if (maxValue !== null) {
      filtered = filtered.filter(item => item.costo !== undefined && item.costo <= maxValue)
    }

    // FASE 2: Filtrar por ubicación
    if (advancedFilters.ubicaciones.length > 0) {
      filtered = filtered.filter(item =>
        item.ubicacion && advancedFilters.ubicaciones.includes(item.ubicacion)
      )
    }

    // FASE 2: Filtrar por estado de mantenimiento
    if (advancedFilters.estadoMantenimiento) {
      const today = new Date()

      switch (advancedFilters.estadoMantenimiento) {
        case 'requiere':
          // Criterio: última fecha de mantenimiento > 180 días o sin registro
          filtered = filtered.filter(item => {
            if (!item.historialMantenimiento || item.historialMantenimiento.length === 0) return true

            // Ordenar historial por fecha más reciente
            const sortedHistory = [...item.historialMantenimiento].sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )

            const lastMaintDate = new Date(sortedHistory[0].date)
            const diffDays = Math.ceil((today.getTime() - lastMaintDate.getTime()) / (1000 * 60 * 60 * 24))
            return diffDays > 180
          })
          break

        case 'programado':
          // Filtra equipos con mantenimiento programado (estado específico)
          filtered = filtered.filter(item => item.mantenimiento === "programado")
          break

        case 'reciente':
          // Mantenimiento en los últimos 60 días
          filtered = filtered.filter(item => {
            if (!item.historialMantenimiento || item.historialMantenimiento.length === 0) return false

            const sortedHistory = [...item.historialMantenimiento].sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )

            const lastMaintDate = new Date(sortedHistory[0].date)
            const diffDays = Math.ceil((today.getTime() - lastMaintDate.getTime()) / (1000 * 60 * 60 * 24))
            return diffDays <= 60
          })
          break
      }
    }

    return filtered
  }

  // Filtrar y ordenar datos
  const sortedAndFilteredData = useMemo(() => {
    let data = state.inventoryData.filter((item) => {
      const matchesSearch = searchTerm === "" || (
        (item.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.marca?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.modelo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.numeroSerie && item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.proveedor && item.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.contratoId && item.contratoId.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      const matchesCategoria = !filterCategoria || filterCategoria === "all" || item.categoria === filterCategoria
      const matchesMarca = !filterMarca || filterMarca === "all" || item.marca === filterMarca
      const matchesEstado = !filterEstado || filterEstado === "all" || item.estado === filterEstado
      const matchesSerial = !hasSerialNumber || !!item.numeroSerie

      return matchesSearch && matchesCategoria && matchesMarca && matchesEstado && matchesSerial
    })

    // Aplicar filtros avanzados
    data = applyAdvancedFilters(data)

    if (sortColumn) {
      data = [...data].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        // Handle special cases for sorting derived columns
        if (sortColumn === "asignadoA") {
          aValue = getAssignmentDetails(a).asignadoA || ""
          bValue = getAssignmentDetails(b).asignadoA || ""
        } else if (sortColumn === "fechaAsignacion") {
          aValue = getAssignmentDetails(a).fechaAsignacion || ""
          bValue = getAssignmentDetails(b).fechaAsignacion || ""
        } else {
          aValue = getColumnValue(a, sortColumn);
          bValue = getColumnValue(b, sortColumn);
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
    state.asignadosData,
    searchTerm,
    filterCategoria,
    filterMarca,
    filterEstado,
    hasSerialNumber,
    sortColumn,
    sortDirection,
    advancedFilters
  ])

  // Paginación
  const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedAndFilteredData.slice(startIndex, endIndex)

  const selectedProducts = state.inventoryData.filter((item) => selectedRowIds.includes(item.id))

  const handleRowSelect = (id: number, checked: boolean) => {
    toggleRowSelection(id, checked)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllRows(paginatedData.map((item) => item.id))
    } else {
      clearRowSelection()
    }
  }

  const handleViewDetails = (product: InventoryItem) => {
    setSelectedProduct(product)
    setIsDetailSheetOpen(true)
  }

  const handleEdit = (product: InventoryItem) => {
    setSelectedProduct(product)
    setModalMode("edit")
    setStoreHasSerialNumber(!!product.numeroSerie)
    setTempMarca(product.marca)
    setIsAddProductModalOpen(true)
  }

  const handleDuplicate = (product: InventoryItem) => {
    setSelectedProduct(product)
    setModalMode("duplicate")
    setStoreHasSerialNumber(!!product.numeroSerie)
    setTempMarca(product.marca)
    setIsAddProductModalOpen(true)
  }

  const handleMarkAsRetired = (product: InventoryItem) => {
    setSelectedProduct(product)
    setIsConfirmDialogOpen(true)
  }

  const executeReactivate = (product: InventoryItem) => {
    appDispatch({
      type: 'UPDATE_INVENTORY_ITEM_STATUS',
      payload: { id: product.id, status: "Disponible" }
    })
    appDispatch({
      type: 'ADD_RECENT_ACTIVITY',
      payload: {
        type: "Reactivación",
        description: `${product.nombre} reactivado`,
        date: new Date().toLocaleString(),
        details: { product: { id: product.id, name: product.nombre, serial: product.numeroSerie } },
      }
    })
    showSuccess({
      title: "Producto reactivado",
      description: `${product.nombre} ha sido reactivado y está disponible.`,
    })
  }

  const handleReactivate = (product: InventoryItem) => {
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
    setStoreHasSerialNumber(false)
    setTempMarca("")
    setIsAddProductModalOpen(true)
  }

  const executeSaveProduct = (productData: Partial<InventoryItem>) => {
    // Toast de autoguardado inmediato
    showInfo({
      title: "Guardando cambios...",
      description: "Sincronizando datos con el servidor"
    })

    // Simulation logic remains the same
    setTimeout(() => {
      let newInventory = [...state.inventoryData]

      if (modalMode === "add") {
        // Add new product
        const newId = Math.max(...state.inventoryData.map((item) => item.id)) + 1
        const newProduct = {
          id: newId,
          fechaIngreso: new Date().toISOString().split("T")[0],
          ...productData,
        } as InventoryItem

        newInventory = [...state.inventoryData, newProduct]
        showSuccess({
          title: "Producto añadido",
          description: `${productData.nombre} ha sido añadido al inventario exitosamente.`,
        })
        appDispatch({
          type: 'ADD_RECENT_ACTIVITY',
          payload: {
            type: "Creación de Producto",
            description: `Producto "${productData.nombre}" creado`,
            date: new Date().toLocaleString(),
            details: newProduct,
          }
        })
      } else if (modalMode === "edit") {
        // Edit existing product
        const originalProduct = state.inventoryData.find((item) => item.id === selectedProduct?.id)
        newInventory = state.inventoryData.map((item) =>
          item.id === selectedProduct?.id
            ? {
              ...item,
              ...productData,
            }
            : item,
        )

        // Toast mejorado con información de cambios
        showSuccess({
          title: "Producto actualizado",
          description: `Cambios guardados para "${productData.nombre || originalProduct?.nombre}"`
        })
        appDispatch({
          type: 'ADD_RECENT_ACTIVITY',
          payload: {
            type: "Edición de Producto",
            description: `Producto "${productData.nombre || originalProduct?.nombre}" actualizado`,
            date: new Date().toLocaleString(),
            details: { originalProduct, updatedProduct: productData },
          }
        })
      } else if (modalMode === "duplicate") {
        // Duplicate product
        const newId = Math.max(...state.inventoryData.map((item) => item.id)) + 1
        const duplicatedProduct = {
          ...productData,
          id: newId,
          estado: "Disponible" as const,
          numeroSerie: null, // Reset serial number for duplicated items
          fechaIngreso: new Date().toISOString().split("T")[0],
        } as InventoryItem

        newInventory = [...state.inventoryData, duplicatedProduct]
        showSuccess({
          title: "Producto duplicado",
          description: `Se ha creado una copia de "${productData.nombre}".`,
        })
        appDispatch({
          type: 'ADD_RECENT_ACTIVITY',
          payload: {
            type: "Duplicación de Producto",
            description: `Producto "${productData.nombre}" duplicado`,
            date: new Date().toLocaleString(),
            details: duplicatedProduct,
          }
        })
      } else if (modalMode === "process-carga") {
        // Process pending task
        if (processingTaskId) {
          const task = state.tareasData.find((t) => t.id === processingTaskId)
          if (!task) return

          const newId = Math.max(...state.inventoryData.map((item) => item.id)) + 1
          const newProduct = {
            id: newId,
            nombre: task.details.productName,
            marca: task.details.brand || "Sin marca",
            modelo: task.details.model || "Sin modelo",
            categoria: task.details.category || "Sin categoría",
            descripcion: task.details.description || "",
            estado: "Disponible" as const,
            cantidad: task.details.quantity,
            numeroSerie: task.details.serialNumbers?.[0] || null,
            fechaIngreso: new Date().toISOString().split("T")[0],
            proveedor: task.details.proveedor || null,
            fechaAdquisicion: task.details.fechaAdquisicion || null,
            contratoId: task.details.contratoId || null,
          } as InventoryItem

          newInventory = [...state.inventoryData, newProduct]

          // Remove the processed task
          const updatedTasks = state.tareasData.filter((t) => t.id !== processingTaskId)
          appDispatch({
            type: 'UPDATE_PENDING_TASK',
            payload: {
              id: processingTaskId,
              updates: {
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
              }
            }
          })

          showSuccess({
            title: "Tarea procesada exitosamente",
            description: `El producto "${task.details.productName}" ha sido añadido al inventario.`,
          })
          appDispatch({
            type: 'ADD_RECENT_ACTIVITY',
            payload: {
              type: "Procesamiento de Tarea",
              description: `Tarea #${processingTaskId} procesada: "${task.details.productName}" añadido`,
              date: new Date().toLocaleString(),
              details: { taskId: processingTaskId, newProduct },
            }
          })
        }
      }

      appDispatch({
        type: 'UPDATE_INVENTORY',
        payload: newInventory
      })
      setIsAddProductModalOpen(false)
      setSelectedProduct(null)
      setProcessingTaskId(null)
      setIsLoading(false)
      setModalMode("add")
      setActiveFormTab("basic")
      setTempMarca("")
      setStoreHasSerialNumber(false)
      // Clear form data after successful save
      const form = document.getElementById("product-form") as HTMLFormElement
      if (form) {
        form.reset()
      }
    }, 1200) // Ligeramente más tiempo para mostrar el progreso
  }

  const handleSaveProduct = async () => {
    setIsLoading(true)
    const form = document.getElementById("product-form") as HTMLFormElement
    const formData = new FormData(form)

    // Verificar campos obligatorios independientemente de la pestaña activa
    const nombre = formData.get("nombre") as string || selectedProduct?.nombre
    const marca = tempMarca || selectedProduct?.marca
    const modelo = formData.get("modelo") as string || selectedProduct?.modelo
    const categoria = formData.get("categoria") as string || selectedProduct?.categoria

    if (!nombre || !marca || !modelo || !categoria) {
      showError({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos obligatorios (Nombre, Marca, Modelo y Categoría).",
      })
      setIsLoading(false)
      // Cambiar a la pestaña básica si hay campos faltantes
      setActiveFormTab("basic")
      return
    }

    const productData = {
      nombre: nombre,
      marca: marca,
      modelo: modelo,
      categoria: categoria,
      descripcion: formData.get("descripcion") as string,
      estado: selectedProduct?.estado || "Disponible",
      cantidad: hasSerialNumber ? 1 : Number.parseInt(formData.get("cantidad") as string) || 1,
      numeroSerie: hasSerialNumber ? (formData.get("numerosSerie") as string) || null : null,
      proveedor: (formData.get("proveedor") as string) || null,
      fechaAdquisicion: (formData.get("fechaAdquisicion") as string) || null,
      contratoId: (formData.get("contratoId") as string) || null,
      costo: formData.get("costo") ? parseFloat(formData.get("costo") as string) : undefined,
      garantia: (formData.get("garantia") as string) || undefined,
      vidaUtil: (formData.get("vidaUtil") as string) || undefined
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
            appDispatch({ type: 'UPDATE_INVENTORY', payload: state.inventoryData }) // Trigger re-render with current data
            showSuccess({
              title: "Importación completada",
              description: "Se han importado 25 productos exitosamente.",
            })
            appDispatch({
              type: 'ADD_RECENT_ACTIVITY',
              payload: {
                type: "Importación CSV",
                description: "Se importaron 25 productos",
                date: new Date().toLocaleString(),
                details: { count: 25 },
              }
            })
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const executeRetirement = () => {
    // Validar que se haya seleccionado un motivo
    if (!retirementDetails.reason) {
      showError({
        title: "Error",
        description: "Debe seleccionar un motivo para el retiro.",
      })
      return
    }

    appDispatch({
      type: 'UPDATE_INVENTORY_ITEM_STATUS',
      payload: { id: selectedProduct!.id, status: "Retirado" }
    })
    appDispatch({
      type: 'ADD_RECENT_ACTIVITY',
      payload: {
        type: "Retiro de Producto",
        description: `${selectedProduct?.nombre} retirado por ${retirementDetails.reason}`,
        date: new Date().toLocaleString(),
        details: {
          product: { id: selectedProduct!.id, name: selectedProduct!.nombre, serial: selectedProduct!.numeroSerie },
          retirementDetails: retirementDetails
        },
      }
    })
    showSuccess({
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

  const handleAssign = (product: InventoryItem) => {
    setSelectedProduct(product)
    setIsAssignModalOpen(true)
  }

  const handleLend = (product: InventoryItem) => {
    setSelectedProduct(product)
    setIsLendModalOpen(true)
  }

  const handleBulkSuccess = () => {
    setSelectedRowIds([])
    // Usar dispatch local para refrescar el inventario
    dispatch({ type: "REFRESH_INVENTORY" })
  }

  const handleConfirmEditorAction = () => {
    if (pendingActionDetails) {
      appDispatch({
        type: 'ADD_PENDING_REQUEST',
        payload: {
          id: Math.floor(Math.random() * 1000),
          type: pendingActionDetails.type as any, // Cast para evitar errores de tipo
          requestedBy: state.user?.nombre || "Editor",
          date: new Date().toISOString(),
          status: "Pendiente",
          details: pendingActionDetails,
        }
      });

      appDispatch({
        type: 'ADD_RECENT_ACTIVITY',
        payload: {
          type: "Solicitud",
          description: `Solicitud de ${pendingActionDetails.type.toLowerCase()} enviada a administrador`,
          date: new Date().toLocaleString(),
          details: pendingActionDetails,
        }
      });

      setIsConfirmEditorOpen(false)

      if (pendingActionDetails.type === "Asignación") {
        setIsAssignModalOpen(false)
      } else if (pendingActionDetails.type === "Préstamo") {
        setIsLendModalOpen(false)
      }
    }
  }

  const isLector = state.user?.rol === "Lector" // Corregido según PRD

  // Function to calculate available and unavailable quantities for non-serialized items
  const getNonSerializedQtyBreakdown = (item: InventoryItem): QtyBreakdown | null => {
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

  const canShowBulkActions = selectedRowIds.length > 0 && state.user?.rol !== "Lector" // Corregido según PRD

  // Función para manejar el cambio a estado de mantenimiento
  const handleMaintenanceState = (product: InventoryItem) => {
    setMaintenanceDetails({
      provider: "",
      notes: "",
      productId: product.id
    })
    setIsMaintenanceModalOpen(true)
  }

  // Función para ejecutar el cambio de estado a mantenimiento
  const executeMaintenanceChange = () => {
    // Obtener el producto
    const producto = state.inventoryData.find((p) => p.id === maintenanceDetails.productId)

    if (!producto) {
      showError("No se encontró el producto.")
      return
    }

    // Actualizar el estado del producto a "En Mantenimiento"
    appDispatch({
      type: "UPDATE_INVENTORY_ITEM_STATUS",
      payload: {
        id: maintenanceDetails.productId,
        status: "En Mantenimiento"
      }
    })

    // Registrar en el historial de mantenimiento
    const mantenimiento = {
      provider: maintenanceDetails.provider,
      notes: maintenanceDetails.notes,
      date: new Date().toISOString().split('T')[0]
    }

    // Cerrar el modal
    setMaintenanceDetails({
      provider: "",
      notes: "",
      productId: 0
    })
    setIsMaintenanceModalOpen(false)

    // Mostrar notificación de éxito
    showSuccess(`${producto.nombre} enviado a mantenimiento correctamente.`)

    // Registrar actividad
    appDispatch({
      type: "ADD_RECENT_ACTIVITY",
      payload: {
        type: "Mantenimiento",
        description: `${state.user?.nombre} envió ${producto.nombre} a mantenimiento con ${maintenanceDetails.provider}`,
        date: new Date().toISOString(),
        details: mantenimiento
      }
    })
  }

  // Función simulada para subir documentos
  const handleFileUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showError({
        title: "Error",
        description: "Seleccione al menos un archivo para subir.",
      });
      return;
    }

    // Simulación de subida
    setUploadingFiles(true);

    setTimeout(() => {
      const newDocs = Array.from(selectedFiles).map(file => ({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString().split('T')[0]
      }));

      setAttachedDocuments(prev => [...prev, ...newDocs]);
      setSelectedFiles(null);
      setUploadingFiles(false);

      showSuccess({
        title: "Documentos subidos",
        description: `Se han subido ${newDocs.length} documento(s) correctamente.`
      });
    }, 2000);
  };

  // Asegurarse de que localState.lastRefresh se use como dependencia para refrescar datos
  useEffect(() => {
    // Aquí podrías realizar alguna acción cuando se refresca el inventario
    // Por ejemplo, actualizar filtros, resetear selecciones, etc.
  }, [localState.lastRefresh]);

  const allCategories = useMemo(() => {
    const categories = new Set((state.inventoryData || []).map((p) => p.categoria).filter(Boolean))
    return ["Todas", ...Array.from(categories).sort()]
  }, [state.inventoryData])

  const allBrands = useMemo(() => {
    const brands = new Set((state.inventoryData || []).map((p) => p.marca).filter(Boolean))
    return ["Todas", ...Array.from(brands).sort()]
  }, [state.inventoryData])

  const allStatuses = useMemo(() => {
    const statuses = new Set((state.inventoryData || []).map((p) => p.estado).filter(Boolean))
    return ["Todos", ...Array.from(statuses).sort()]
  }, [state.inventoryData])

  if (sortedAndFilteredData.length === 0 && !searchTerm && !filterCategoria && !filterMarca && !filterEstado) {
    return (
      <EmptyState
        title="No hay productos en el inventario"
        description="Comienza añadiendo productos a tu inventario."
        action={
          <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary-hover">
            <Plus className="mr-2 h-4 w-4" />
            Añadir Producto
          </Button>
        }
      />
    )
  }

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }
    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  // Función para manejar el clic en una columna para ordenar
  const handleSortClick = (columnId: string) => {
    if (sortColumn === columnId) {
      // Si ya está ordenado por esta columna, cambiar la dirección
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Si es una nueva columna, establecerla como columna de ordenamiento
      setSortColumn(columnId)
    }
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

  const handleViewModeChange = (mode: "table" | "cards") => {
    if (viewMode !== mode) {
      setViewMode(mode)
    }
  }

  const filteredProducts = useMemo(() => {
    return (state.inventoryData || []).filter((product) => {
      const matchesSearch = searchTerm === "" || (
        (product.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.marca?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.modelo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (product.numeroSerie && product.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.proveedor && product.proveedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.contratoId && product.contratoId.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      const matchesCategoria = !filterCategoria || filterCategoria === "all" || product.categoria === filterCategoria
      const matchesMarca = !filterMarca || filterMarca === "all" || product.marca === filterMarca
      const matchesEstado = !filterEstado || filterEstado === "all" || product.estado === filterEstado

      return matchesSearch && matchesCategoria && matchesMarca && matchesEstado
    })
  }, [searchTerm, filterCategoria, filterMarca, filterEstado, state.inventoryData])

  // Modificar el renderizado para incluir los filtros avanzados
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">Inventario</h1>

      {/* Filtros básicos y acciones principales */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en inventario..."
              value={searchTerm}
              onChange={(e) => setDebouncedSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvancedFilters ? "rotate-180" : "")} />
          </Button>

          {(searchTerm || filterCategoria || filterMarca || filterEstado || hasSerialNumber ||
            advancedFilters.fechaDesde || advancedFilters.fechaHasta ||
            advancedFilters.documentos !== null || advancedFilters.estadosEspeciales.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restablecer</span>
              </Button>
            )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsQuickLoadModalOpen(true)}
            variant="outline"
            size="lg"
          >
            <PackagePlus className="mr-2 h-5 w-5" />
            Carga Rápida
          </Button>
          <Button
            onClick={() => setIsQuickRetireModalOpen(true)}
            variant="outline"
            size="lg"
          >
            <PackageMinus className="mr-2 h-5 w-5" />
            Retiro Rápido
          </Button>
          <Button
            onClick={handleAddProduct}
            className="bg-primary hover:bg-primary-hover"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Añadir Producto
          </Button>
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {showAdvancedFilters && (
        <Card className="mb-6 border border-border">
          <CardContent className="p-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Filtros Básicos</TabsTrigger>
                <TabsTrigger value="valuation">Valoración y Estado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filtro de rango de fechas de adquisición */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rango de Fechas de Adquisición</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !advancedFilters.fechaDesde && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {advancedFilters.fechaDesde ? (
                              format(advancedFilters.fechaDesde, "PP", { locale: es })
                            ) : (
                              <span>Desde</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={advancedFilters.fechaDesde || undefined}
                            onSelect={(date) => updateAdvancedFilters({ fechaDesde: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !advancedFilters.fechaHasta && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {advancedFilters.fechaHasta ? (
                              format(advancedFilters.fechaHasta, "PP", { locale: es })
                            ) : (
                              <span>Hasta</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={advancedFilters.fechaHasta || undefined}
                            onSelect={(date) => updateAdvancedFilters({ fechaHasta: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {advancedFilters.fechaDesde && advancedFilters.fechaHasta && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-muted-foreground"
                          onClick={() => updateAdvancedFilters({ fechaDesde: null, fechaHasta: null })}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Limpiar fechas</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Filtro de documentos */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Documentos Adjuntos</Label>
                    <Select
                      value={advancedFilters.documentos === null ? "todos" : advancedFilters.documentos ? "con" : "sin"}
                      onValueChange={(value) => {
                        if (value === "todos") {
                          updateAdvancedFilters({ documentos: null })
                        } else {
                          updateAdvancedFilters({ documentos: value === "con" })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="con">Con documentos</SelectItem>
                        <SelectItem value="sin">Sin documentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtros de Estados Especiales */}
                  <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                    <Label className="text-sm font-medium">Estados Especiales</Label>
                    <div className="grid grid-cols-1 gap-2 border rounded-md p-2 max-h-[120px] overflow-y-auto">
                      {specialStates.map((state) => (
                        <div key={state.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`state-${state.value}`}
                            checked={advancedFilters.estadosEspeciales.includes(state.value)}
                            onCheckedChange={() => handleSpecialStateChange(state.value)}
                          />
                          <div>
                            <label
                              htmlFor={`state-${state.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {state.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{state.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FASE 2: Filtro de ubicación */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ubicación</Label>
                    {ubicacionesDisponibles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 border rounded-md p-2 max-h-[120px] overflow-y-auto">
                        {ubicacionesDisponibles.map((ubicacion) => (
                          <div key={ubicacion} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ubicacion-${ubicacion}`}
                              checked={advancedFilters.ubicaciones.includes(ubicacion)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateAdvancedFilters(prev => ({
                                    ...prev,
                                    ubicaciones: [...prev.ubicaciones, ubicacion]
                                  }))
                                } else {
                                  updateAdvancedFilters(prev => ({
                                    ...prev,
                                    ubicaciones: prev.ubicaciones.filter(u => u !== ubicacion)
                                  }))
                                }
                              }}
                            />
                            <label
                              htmlFor={`ubicacion-${ubicacion}`}
                              className="text-sm font-medium leading-none"
                            >
                              {ubicacion}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No hay ubicaciones registradas</div>
                    )}
                  </div>

                  {/* FASE 2: Filtro de estado de mantenimiento */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Estado de Mantenimiento</Label>
                    <Select
                      value={advancedFilters.estadoMantenimiento || "todos"}
                      onValueChange={(value) => {
                        updateAdvancedFilters({
                          estadoMantenimiento: value === "todos" ? null : value
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {estadosMantenimiento.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* FASE 2: Pestaña de filtros de valoración y estado */}
              <TabsContent value="valuation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro de rango de costo/valor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rango de Valor</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Valor mínimo"
                          min={0}
                          value={advancedFilters.rangoValor[0] === null ? "" : advancedFilters.rangoValor[0]}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value)
                            updateAdvancedFilters(prev => ({
                              ...prev,
                              rangoValor: [value, prev.rangoValor[1]]
                            }))
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Valor máximo"
                          min={0}
                          value={advancedFilters.rangoValor[1] === null ? "" : advancedFilters.rangoValor[1]}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value)
                            updateAdvancedFilters(prev => ({
                              ...prev,
                              rangoValor: [prev.rangoValor[0], value]
                            }))
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtro de estado de mantenimiento */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Estado de Mantenimiento</Label>
                    <Select
                      value={advancedFilters.estadoMantenimiento || "todos"}
                      onValueChange={(value) => {
                        updateAdvancedFilters({
                          estadoMantenimiento: value === "todos" ? null : value
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {estadosMantenimiento.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Filtros aplicados */}
            {(advancedFilters.fechaDesde || advancedFilters.fechaHasta ||
              advancedFilters.documentos !== null ||
              advancedFilters.estadosEspeciales.length > 0 ||
              advancedFilters.rangoValor[0] !== null ||
              advancedFilters.rangoValor[1] !== null ||
              advancedFilters.ubicaciones.length > 0 ||
              advancedFilters.estadoMantenimiento !== null) && (
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm font-medium mb-2">Filtros aplicados:</div>
                  <div className="flex flex-wrap gap-2">
                    {advancedFilters.fechaDesde && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>Desde: {format(advancedFilters.fechaDesde, "PP", { locale: es })}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters({ fechaDesde: null })}
                        />
                      </Badge>
                    )}

                    {advancedFilters.fechaHasta && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>Hasta: {format(advancedFilters.fechaHasta, "PP", { locale: es })}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters({ fechaHasta: null })}
                        />
                      </Badge>
                    )}

                    {advancedFilters.documentos !== null && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>{advancedFilters.documentos ? "Con documentos" : "Sin documentos"}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters({ documentos: null })}
                        />
                      </Badge>
                    )}

                    {advancedFilters.estadosEspeciales.map(stateValue => {
                      const state = specialStates.find(s => s.value === stateValue);
                      return state && (
                        <Badge key={stateValue} variant="outline" className="flex items-center gap-1">
                          <span>{state.label}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleSpecialStateChange(stateValue)}
                          />
                        </Badge>
                      );
                    })}

                    {/* FASE 2: Mostrar filtros aplicados de valor */}
                    {advancedFilters.rangoValor[0] !== null && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>Valor mín: ${advancedFilters.rangoValor[0]}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters(prev => ({
                            ...prev,
                            rangoValor: [null, prev.rangoValor[1]]
                          }))}
                        />
                      </Badge>
                    )}

                    {advancedFilters.rangoValor[1] !== null && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>Valor máx: ${advancedFilters.rangoValor[1]}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters(prev => ({
                            ...prev,
                            rangoValor: [prev.rangoValor[0], null]
                          }))}
                        />
                      </Badge>
                    )}

                    {/* FASE 2: Mostrar ubicaciones seleccionadas */}
                    {advancedFilters.ubicaciones.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>
                          {advancedFilters.ubicaciones.length === 1
                            ? `Ubicación: ${advancedFilters.ubicaciones[0]}`
                            : `${advancedFilters.ubicaciones.length} ubicaciones`
                          }
                        </span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters(prev => ({ ...prev, ubicaciones: [] }))}
                        />
                      </Badge>
                    )}

                    {/* FASE 2: Mostrar estado de mantenimiento */}
                    {advancedFilters.estadoMantenimiento && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <span>
                          {estadosMantenimiento.find(e => e.value === advancedFilters.estadoMantenimiento)?.label}
                        </span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => updateAdvancedFilters(prev => ({ ...prev, estadoMantenimiento: null }))}
                        />
                      </Badge>
                    )}

                    {/* Botón para limpiar todos los filtros */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetAllFilters}
                      className="flex items-center gap-1 ml-auto"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restablecer todos</span>
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
