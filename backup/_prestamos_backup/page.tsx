"use client"

import { DropdownMenuSubContent } from "@/components/ui/dropdown-menu"

import { DropdownMenuPortal } from "@/components/ui/dropdown-menu"

import { DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"

import { DropdownMenuSub } from "@/components/ui/dropdown-menu"

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

export default function PrestamosPage() {
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
  const [loanToReturn, setLoanToReturn] = useState<any>(null)

  const handleReturnLoan = (loan: any) => {
    setLoanToReturn(loan)
    setIsReturnConfirmOpen(true)
  }

  const confirmReturn = () => {
    if (loanToReturn) {
      dispatch({ type: "RETURN_LOAN", payload: loanToReturn.id })
      addRecentActivity({
        type: "Devolución de Préstamo",
        description: `Producto ${loanToReturn.articulo} (N/S: ${
          loanToReturn.numeroSerie || "N/A"
        }) devuelto por ${loanToReturn.prestadoA}.`,
        date: new Date().toLocaleString(),
        details: {
          loanId: loanToReturn.id,
          productName: loanToReturn.articulo,
          lentTo: loanToReturn.prestadoA,
        },
      })
      toast({
        title: "Préstamo Devuelto",
        description: `El producto ${loanToReturn.articulo} ha sido devuelto al inventario.`,
      })
      setIsReturnConfirmOpen(false)
      setLoanToReturn(null)
    }
  }

  const filteredLoans = useMemo(() => {
    const filtered = state.prestamosData.filter((loan) => {
      const matchesSearch =
        loan.articulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.prestadoA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.estado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.fechaPrestamo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.fechaDevolucion?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesEstado = filters.estado === "Todos" || loan.estado === filters.estado
      // Note: Prestamos data might not have 'categoria' or 'marca' directly,
      // you might need to link back to inventoryData if these filters are critical.
      const matchesCategoria =
        filters.categoria === "Todas" ||
        (loan.categoria && loan.categoria.toLowerCase() === filters.categoria.toLowerCase())
      const matchesMarca =
        filters.marca === "Todas" || (loan.marca && loan.marca.toLowerCase() === filters.marca.toLowerCase())

      return matchesSearch && matchesEstado && matchesCategoria && matchesMarca
    })

    return filtered
  }, [state.prestamosData, searchTerm, filters])

  const sortedLoans = useMemo(() => {
    if (!sortConfig) {
      return filteredLoans
    }

    const sorted = [...filteredLoans].sort((a, b) => {
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
  }, [filteredLoans, sortConfig])

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
    const categories = new Set(state.prestamosData.map((p) => p.categoria).filter(Boolean))
    return ["Todas", ...Array.from(categories).sort()]
  }, [state.prestamosData])

  const allBrands = useMemo(() => {
    const brands = new Set(state.prestamosData.map((p) => p.marca).filter(Boolean))
    return ["Todas", ...Array.from(brands).sort()]
  }, [state.prestamosData])

  const allStatuses = useMemo(() => {
    const statuses = new Set(state.prestamosData.map((p) => p.estado).filter(Boolean))
    return ["Todos", ...Array.from(statuses).sort()]
  }, [state.prestamosData])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Préstamos</h1>
        <Button onClick={() => console.log("Prestar Masivo clicked")}>Prestar Masivo</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por artículo, N/S, prestado a..."
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
              <TableHead onClick={() => requestSort("prestadoA")} className="cursor-pointer">
                Prestado A{getSortIcon("prestadoA")}
              </TableHead>
              <TableHead onClick={() => requestSort("fechaPrestamo")} className="cursor-pointer">
                Fecha Préstamo
                {getSortIcon("fechaPrestamo")}
              </TableHead>
              <TableHead onClick={() => requestSort("fechaDevolucion")} className="cursor-pointer">
                Fecha Devolución
                {getSortIcon("fechaDevolucion")}
              </TableHead>
              <TableHead onClick={() => requestSort("estado")} className="cursor-pointer">
                Estado
                {getSortIcon("estado")}
              </TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron préstamos.
                </TableCell>
              </TableRow>
            ) : (
              sortedLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.articulo}</TableCell>
                  <TableCell>{loan.numeroSerie || "N/A"}</TableCell>
                  <TableCell>{loan.prestadoA}</TableCell>
                  <TableCell>{loan.fechaPrestamo}</TableCell>
                  <TableCell>{loan.fechaDevolucion}</TableCell>
                  <TableCell>
                    <StatusBadge status={loan.estado} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      onReturn={() => handleReturnLoan(loan)}
                      product={loan} // Pass loan as product for generic ActionMenu
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
        description={`¿Estás seguro de que deseas devolver el producto "${loanToReturn?.articulo}" prestado a "${loanToReturn?.prestadoA}"?`}
      />
    </div>
  )
}
