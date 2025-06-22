"use client"

import { useState, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { ActivityDetailSheet } from "@/components/activity-detail-sheet"
import { Label } from "@/components/ui/label"

const ITEMS_PER_PAGE = 10

export default function HistorialPage() {
  const { state } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [isActivityDetailSheetOpen, setIsActivityDetailSheetOpen] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc") // Default to desc for date

  // Sorting logic
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection(column === "date" ? "desc" : "asc") // Default date to desc
    }
  }

  const sortedAndFilteredActivities = useMemo(() => {
    let activities = state.recentActivities.filter((activity) => {
      const matchesSearch =
        activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.details?.product?.name &&
          activity.details.product.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Search in product name
        (activity.details?.assignedTo &&
          activity.details.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) || // Search in assignedTo
        (activity.details?.lentTo && activity.details.lentTo.toLowerCase().includes(searchTerm.toLowerCase())) // Search in lentTo

      const matchesType = filterType === "all" || activity.type === filterType

      const activityDate = new Date(activity.date)
      const matchesDate = !filterDate || activityDate.toDateString() === filterDate.toDateString()

      return matchesSearch && matchesType && matchesDate
    })

    if (sortColumn) {
      activities = [...activities].sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortColumn === "date") {
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
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
    return activities
  }, [state.recentActivities, searchTerm, filterType, filterDate, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedAndFilteredActivities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedActivities = sortedAndFilteredActivities.slice(startIndex, endIndex)

  const uniqueActivityTypes = Array.from(new Set(state.recentActivities.map((activity) => activity.type)))

  const handleViewDetails = (activity: any) => {
    setSelectedActivity(activity)
    setIsActivityDetailSheetOpen(true)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }
    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Actividad</h1>
          <p className="text-muted-foreground">Revisa todas las acciones y movimientos registrados en el sistema</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar actividad..."
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
                      <p className="text-sm text-muted-foreground">Filtra la actividad por tipo o fecha</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="filterType">Tipo</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueActivityTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="filterDate">Fecha</Label>
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
        {sortedAndFilteredActivities.length === 0 ? (
          <EmptyState
            title="No se encontró actividad"
            description="Intenta ajustar los filtros o términos de búsqueda."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                      <div className="flex items-center">
                        Tipo <SortIcon column="type" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                      <div className="flex items-center">
                        Descripción <SortIcon column="description" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                      <div className="flex items-center">
                        Fecha y Hora <SortIcon column="date" />
                      </div>
                    </TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActivities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <StatusBadge status={activity.type} />
                      </TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>{activity.date}</TableCell>
                      <TableCell>
                        {activity.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(activity)}
                            title="Ver Detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
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
            Mostrando {paginatedActivities.length} de {sortedAndFilteredActivities.length} actividades
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

      {/* Activity Detail Sheet with Diff */}
      {selectedActivity && (
        <ActivityDetailSheet
          open={isActivityDetailSheetOpen}
          onOpenChange={setIsActivityDetailSheetOpen}
          activity={selectedActivity}
        />
      )}
    </AppLayout>
  )
}
