"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, Filter, ChevronLeft, ChevronRight, FileText, RotateCcw, Eye } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
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

const ITEMS_PER_PAGE = 10

export default function PrestamosPage() {
  const { state, updatePrestamos, updateInventory, addRecentActivity } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false)
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const { toast } = useToast()

  const filteredPrestamos = state.prestamosData.filter((prestamo) => {
    const matchesSearch =
      prestamo.articulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestamo.prestadoA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prestamo.numeroSerie && prestamo.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === "all" || prestamo.estado === filterStatus

    const returnDate = new Date(prestamo.fechaDevolucion)
    const matchesDate = !filterDate || returnDate.toDateString() === filterDate.toDateString()

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredPrestamos.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedPrestamos = filteredPrestamos.slice(startIndex, endIndex)

  const handleReturnProduct = (prestamo: any) => {
    setSelectedPrestamo(prestamo)
    setIsReturnConfirmOpen(true)
  }

  const confirmReturn = () => {
    if (!selectedPrestamo) return

    // Update prestamo status
    const updatedPrestamos = state.prestamosData.filter((p) => p.id !== selectedPrestamo.id)
    updatePrestamos(updatedPrestamos)

    // Update inventory item status
    let updatedInventory = [...state.inventoryData]
    if (selectedPrestamo.numeroSerie === null) {
      // For non-serialized, find an existing entry or create a new one for available
      const existingAvailableItemIndex = updatedInventory.findIndex(
        (item) =>
          item.nombre === selectedPrestamo.articulo &&
          item.modelo === selectedPrestamo.modelo && // Assuming model is available or can be derived
          item.numeroSerie === null &&
          item.estado === "Prestado", // Find the specific lent unit
      )

      if (existingAvailableItemIndex !== -1) {
        // Remove the specific lent unit entry
        updatedInventory.splice(existingAvailableItemIndex, 1)

        // Find or create an available entry for this non-serialized item
        const availableItemIndex = updatedInventory.findIndex(
          (item) =>
            item.nombre === selectedPrestamo.articulo &&
            item.modelo === selectedPrestamo.modelo &&
            item.numeroSerie === null &&
            item.estado === "Disponible",
        )

        if (availableItemIndex !== -1) {
          updatedInventory[availableItemIndex] = {
            ...updatedInventory[availableItemIndex],
            cantidad: updatedInventory[availableItemIndex].cantidad + 1,
          }
        } else {
          // If no available entry exists, create a new one
          const originalProduct = state.inventoryData.find(
            (item) =>
              item.nombre === selectedPrestamo.articulo &&
              item.modelo === selectedPrestamo.modelo &&
              item.numeroSerie === null,
          )
          if (originalProduct) {
            updatedInventory.push({
              ...originalProduct,
              id: Math.max(...state.inventoryData.map((item) => item.id)) + 1,
              estado: "Disponible",
              cantidad: 1,
            })
          }
        }
      }
    } else {
      // For serialized, change status back to Disponible
      updatedInventory = updatedInventory.map((item) => {
        if (item.numeroSerie === selectedPrestamo.numeroSerie) {
          return { ...item, estado: "Disponible" }
        }
        return item
      })
    }
    updateInventory(updatedInventory)

    toast({
      title: "Producto devuelto",
      description: `${selectedPrestamo?.articulo} ha sido marcado como devuelto.`,
    })
    addRecentActivity({
      type: "Devolución de Préstamo",
      description: `${selectedPrestamo?.articulo} devuelto por ${selectedPrestamo?.prestadoA}`,
      date: new Date().toLocaleString(),
      details: {
        product: { id: selectedPrestamo.id, name: selectedPrestamo.articulo, serial: selectedPrestamo.numeroSerie },
        returnedBy: selectedPrestamo.prestadoA,
      },
    })
    setIsReturnConfirmOpen(false)
    setSelectedPrestamo(null)
  }

  const handleViewDetails = (prestamo: any) => {
    setSelectedPrestamo(prestamo)
    setIsDetailSheetOpen(true)
  }

  if (state.prestamosData.length === 0 && !searchTerm && !filterStatus && !filterDate) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Préstamos</h1>
              <p className="text-muted-foreground">Gestiona los productos prestados a usuarios</p>
            </div>
          </div>
          <EmptyState
            title="No hay productos en préstamo"
            description="Todos los productos están en el inventario o asignados."
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Préstamos</h1>
          <p className="text-muted-foreground">Gestiona los productos prestados a usuarios</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar préstamos..."
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
                      <p className="text-sm text-muted-foreground">Filtra los préstamos por estado o fecha</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="filterStatus">Estado</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Vencido">Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="filterDate">Fecha Devolución</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "col-span-2 h-8 justify-start text-left font-normal",
                                !filterDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filterDate ? format(filterDate, "PPP") : <span>Selecciona una fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {paginatedPrestamos.length === 0 ? (
          <EmptyState
            title="No se encontraron préstamos"
            description="Intenta ajustar los filtros o términos de búsqueda."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead>N/S</TableHead>
                    <TableHead>Prestado A</TableHead>
                    <TableHead>Fecha Devolución</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPrestamos.map((prestamo) => (
                    <TableRow key={prestamo.id}>
                      <TableCell className="font-medium">{prestamo.articulo}</TableCell>
                      <TableCell className="font-mono text-sm">{prestamo.numeroSerie || "N/A"}</TableCell>
                      <TableCell>{prestamo.prestadoA}</TableCell>
                      <TableCell>{prestamo.fechaDevolucion}</TableCell>
                      <TableCell>
                        <StatusBadge status={prestamo.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(prestamo)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Detalles</span>
                          </Button>
                          {prestamo.estado !== "Vencido" && ( // Only allow return for active loans
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReturnProduct(prestamo)}
                              title="Marcar como Devuelto"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span className="sr-only">Marcar como Devuelto</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paginatedPrestamos.length} de {filteredPrestamos.length} préstamos
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

      {/* Confirmation Dialog for Return */}
      <AlertDialog open={isReturnConfirmOpen} onOpenChange={setIsReturnConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Devolución?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará "{selectedPrestamo?.articulo}" como devuelto y lo regresará al inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReturn} className="bg-primary hover:bg-primary-hover">
              Confirmar Devolución
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Préstamo
            </SheetTitle>
            <SheetDescription>Información completa del préstamo seleccionado</SheetDescription>
          </SheetHeader>
          {selectedPrestamo && (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{selectedPrestamo.articulo}</h3>

                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Número de Serie:</dt>
                    <dd className="text-sm font-mono">{selectedPrestamo.numeroSerie || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Prestado A:</dt>
                    <dd className="text-sm">{selectedPrestamo.prestadoA}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Fecha de Devolución:</dt>
                    <dd className="text-sm">{selectedPrestamo.fechaDevolucion}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Estado:</dt>
                    <dd>
                      <StatusBadge status={selectedPrestamo.estado} />
                    </dd>
                  </div>
                  {selectedPrestamo.estado === "Vencido" && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Días Vencido:</dt>
                      <dd className="text-sm text-red-600">{selectedPrestamo.diasVencido}</dd>
                    </div>
                  )}
                  {selectedPrestamo.estado === "Activo" && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Días Restantes:</dt>
                      <dd className="text-sm text-green-600">{selectedPrestamo.diasRestantes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
