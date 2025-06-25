"use client"

import {
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSub,
} from "@/components/ui/dropdown-menu"
import { useState, useMemo } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { ActionMenu } from "@/components/action-menu"

export default function AsignadosPage() {
  const { state, dispatch, addRecentActivity } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    estado: "Todos",
    categoria: "Todas",
    marca: "Todas",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false)
  const [assignmentToReturn, setAssignmentToReturn] = useState<any>(null)

  const handleReturnAssignment = (assignment: any) => {
    setAssignmentToReturn(assignment)
    setIsReturnConfirmOpen(true)
  }

  const confirmReturn = () => {
    if (assignmentToReturn) {
      dispatch({ type: "RETURN_ASSIGNMENT", payload: assignmentToReturn.id })
      addRecentActivity({
        type: "Devolución de Asignación",
        description: `Producto ${assignmentToReturn.articulo} (N/S: ${
          assignmentToReturn.numeroSerie || "N/A"
        }) devuelto por ${assignmentToReturn.asignadoA}.`,
        date: new Date().toLocaleString(),
        details: {
          assignmentId: assignmentToReturn.id,
          productName: assignmentToReturn.articulo,
          assignedTo: assignmentToReturn.asignadoA,
        },
      })
      toast({
        title: "Asignación Devuelta",
        description: `El producto ${assignmentToReturn.articulo} ha sido devuelto al inventario.`,
      })
      setIsReturnConfirmOpen(false)
      setAssignmentToReturn(null)
    }
  }

  const filteredAssignments = useMemo(() => {
    const filtered = state.asignadosData.filter((assignment) => {
      const matchesSearch =
        (assignment.articulo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.numeroSerie || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.asignadoA || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.estado || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.fechaAsignacion || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesEstado = filters.estado === "Todos" || assignment.estado === filters.estado
      const matchesCategoria =
        filters.categoria === "Todas" ||
        (assignment.categoria && assignment.categoria.toLowerCase() === filters.categoria.toLowerCase())
      const matchesMarca =
        filters.marca === "Todas" ||
        (assignment.marca && assignment.marca.toLowerCase() === filters.marca.toLowerCase())

      return matchesSearch && matchesEstado && matchesCategoria && matchesMarca
    })

    return filtered
  }, [state.asignadosData, searchTerm, filters])

  const sortedAssignments = useMemo(() => {
    if (!sortConfig) {
      return filteredAssignments
    }

    const sorted = [...filteredAssignments].sort((a, b) => {
      const aValue = a[sortConfig.key] || ""
      const bValue = b[sortConfig.key] || ""

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
    return sorted
  }, [filteredAssignments, sortConfig])

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortConfig.direction === "ascending") {
      return <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const allCategories = useMemo(() => {
    const categories = new Set(state.asignadosData.map((p) => p.categoria).filter(Boolean))
    return ["Todas", ...Array.from(categories).sort()]
  }, [state.asignadosData])

  const allBrands = useMemo(() => {
    const brands = new Set(state.asignadosData.map((p) => p.marca).filter(Boolean))
    return ["Todas", ...Array.from(brands).sort()]
  }, [state.asignadosData])

  const allStatuses = useMemo(() => {
    const statuses = new Set(state.asignadosData.map((p) => p.estado).filter(Boolean))
    return ["Todos", ...Array.from(statuses).sort()]
  }, [state.asignadosData])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Artículos Asignados</h1>
        <Button onClick={() => console.log("Asignar Masivo clicked")}>Asignar Masivo</Button>
      </div>

      <div className="flex items-center gap-2">
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
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Estado</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.estado === status}
                      onCheckedChange={() => setFilters({ ...filters, estado: status })}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Categoría</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={filters.categoria === category}
                      onCheckedChange={() => setFilters({ ...filters, categoria: category })}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Marca</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allBrands.map((brand) => (
                    <DropdownMenuCheckboxItem
                      key={brand}
                      checked={filters.marca === brand}
                      onCheckedChange={() => setFilters({ ...filters, marca: brand })}
                    >
                      {brand}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("articulo")} className="cursor-pointer">
                Artículo
                {getSortIcon("articulo")}
              </TableHead>
              <TableHead onClick={() => requestSort("numeroSerie")} className="cursor-pointer">
                Número de Serie
                {getSortIcon("numeroSerie")}
              </TableHead>
              <TableHead onClick={() => requestSort("asignadoA")} className="cursor-pointer">
                Asignado A{getSortIcon("asignadoA")}
              </TableHead>
              <TableHead onClick={() => requestSort("fechaAsignacion")} className="cursor-pointer">
                Fecha Asignación
                {getSortIcon("fechaAsignacion")}
              </TableHead>
              <TableHead onClick={() => requestSort("estado")} className="cursor-pointer">
                Estado
                {getSortIcon("estado")}
              </TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron asignaciones.
                </TableCell>
              </TableRow>
            ) : (
              sortedAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.articulo}</TableCell>
                  <TableCell>{assignment.numeroSerie || "N/A"}</TableCell>
                  <TableCell>{assignment.asignadoA}</TableCell>
                  <TableCell>{assignment.fechaAsignacion}</TableCell>
                  <TableCell>
                    <StatusBadge status={assignment.estado} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      onReturn={() => handleReturnAssignment(assignment)}
                      product={assignment} // Pass assignment as product for generic ActionMenu
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialogForEditor
        open={isReturnConfirmOpen}
        onOpenChange={setIsReturnConfirmOpen}
        onConfirm={confirmReturn}
        title="Confirmar Devolución"
        description={`¿Estás seguro de que deseas devolver el producto "${assignmentToReturn?.articulo}" asignado a "${assignmentToReturn?.asignadoA}"?`}
      />
    </div>
  )
}
