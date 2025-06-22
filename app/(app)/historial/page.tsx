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
import { Search, Filter, ArrowUpDown, Eye } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { ActivityDetailSheet } from "@/components/activity-detail-sheet"

export default function HistorialPage() {
  const { state } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    type: "Todos",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isActivityDetailSheetOpen, setIsActivityDetailSheetOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  const handleViewActivityDetails = (activity: any) => {
    setSelectedActivity(activity)
    setIsActivityDetailSheetOpen(true)
  }

  const filteredActivities = useMemo(() => {
    const filtered = state.recentActivities.filter((activity) => {
      const matchesSearch =
        activity.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.date?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filters.type === "Todos" || activity.type === filters.type

      return matchesSearch && matchesType
    })

    return filtered
  }, [state.recentActivities, searchTerm, filters])

  const sortedActivities = useMemo(() => {
    if (!sortConfig) {
      return filteredActivities
    }

    const sorted = [...filteredActivities].sort((a, b) => {
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
  }, [filteredActivities, sortConfig])

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

  const allActivityTypes = useMemo(() => {
    const types = new Set(state.recentActivities.map((a) => a.type).filter(Boolean))
    return ["Todos", ...Array.from(types).sort()]
  }, [state.recentActivities])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar actividad..."
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
              <DropdownMenuSubTrigger>Tipo de Actividad</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allActivityTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filters.type === type}
                      onCheckedChange={() => setFilters({ ...filters, type: type })}
                    >
                      {type}
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
              <TableHead onClick={() => requestSort("type")} className="cursor-pointer">
                Tipo
                {getSortIcon("type")}
              </TableHead>
              <TableHead onClick={() => requestSort("description")} className="cursor-pointer">
                Descripción
                {getSortIcon("description")}
              </TableHead>
              <TableHead onClick={() => requestSort("date")} className="cursor-pointer">
                Fecha y Hora
                {getSortIcon("date")}
              </TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No se encontraron actividades.
                </TableCell>
              </TableRow>
            ) : (
              sortedActivities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.type}</TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>
                    {activity.details && (
                      <Button variant="ghost" size="sm" onClick={() => handleViewActivityDetails(activity)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalles</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedActivity && (
        <ActivityDetailSheet
          open={isActivityDetailSheetOpen}
          onOpenChange={setIsActivityDetailSheetOpen}
          activity={selectedActivity}
        />
      )}
    </div>
  )
}
