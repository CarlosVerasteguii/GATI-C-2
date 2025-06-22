"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  ExternalLink,
  Package,
  UserCheck,
  FileText,
  Clock,
  Eye,
} from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { ActivityDetailSheet } from "@/components/activity-detail-sheet"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { state } = useApp()
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [isLoanDetailSheetOpen, setIsLoanDetailSheetOpen] = useState(false)
  const [isActivityDetailSheetOpen, setIsActivityDetailSheetOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [loanSheetType, setLoanSheetType] = useState<"overdue" | "expiring">("overdue")

  const totalProducts = state.inventoryData.length
  const availableProducts = state.inventoryData.filter((item) => item.estado === "Disponible").length
  const assignedProducts = state.asignadosData.filter((item) => item.estado === "Activo").length
  const lentProducts = state.prestamosData.filter((item) => item.estado === "Activo").length
  const retiredProducts = state.inventoryData.filter((item) => item.estado === "Retirado").length

  const pendingTasks = state.pendingTasksData.filter((task) => task.status === "Pendiente").length

  const prestamosVencidos = state.prestamosData.filter((p) => p.estado === "Vencido")
  const prestamosPorVencer = state.prestamosData.filter(
    (p) => p.estado === "Activo" && p.diasRestantes && p.diasRestantes <= 7,
  )

  const handleLoanClick = (loan: any, type: "overdue" | "expiring") => {
    setSelectedLoan(loan)
    setLoanSheetType(type)
    setIsLoanDetailSheetOpen(true)
  }

  const handleViewActivityDetails = (activity: any) => {
    setSelectedActivity(activity)
    setIsActivityDetailSheetOpen(true)
  }

  const inventoryDistribution = useMemo(() => {
    const total = totalProducts
    if (total === 0) {
      return {
        disponibles: { count: 0, percentage: 0, color: "bg-status-available" },
        asignados: { count: 0, percentage: 0, color: "bg-status-assigned" },
        prestados: { count: 0, percentage: 0, color: "bg-status-lent" },
        retirados: { count: 0, percentage: 0, color: "bg-status-retired" },
      }
    }

    return {
      disponibles: {
        count: availableProducts,
        percentage: (availableProducts / total) * 100,
        color: "bg-status-available",
      },
      asignados: {
        count: assignedProducts,
        percentage: (assignedProducts / total) * 100,
        color: "bg-status-assigned",
      },
      prestados: {
        count: lentProducts,
        percentage: (lentProducts / total) * 100,
        color: "bg-status-lent",
      },
      retirados: {
        count: retiredProducts,
        percentage: (retiredProducts / total) * 100,
        color: "bg-status-retired",
      },
    }
  }, [totalProducts, availableProducts, assignedProducts, lentProducts, retiredProducts])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema de inventario</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {availableProducts} disponibles, {retiredProducts} retirados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artículos Asignados</CardTitle>
            <UserCheck className="h-4 w-4 text-status-assigned" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedProducts}</div>
            <p className="text-xs text-muted-foreground">Actualmente en uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artículos Prestados</CardTitle>
            <FileText className="h-4 w-4 text-status-lent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lentProducts}</div>
            <p className="text-xs text-muted-foreground">En préstamo temporal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-status-maintenance" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Cargas y Retiros por procesar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de Alertas con Layout v5.0 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Préstamos Vencidos */}
        <Card className="cfe-border-left cfe-border-left-red">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-status-retired">
              <AlertTriangle className="h-5 w-5 text-status-retired" />
              Préstamos Vencidos ({prestamosVencidos.length})
            </CardTitle>
            <CardDescription>Productos que han superado su fecha de devolución</CardDescription>
          </CardHeader>
          <CardContent>
            {prestamosVencidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay préstamos vencidos.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prestamosVencidos.map((prestamo) => (
                  <div
                    key={prestamo.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                    onClick={() => handleLoanClick(prestamo, "overdue")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{prestamo.articulo}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Prestado a: {prestamo.prestadoA}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">N/S: {prestamo.numeroSerie || "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-status-retired text-white">
                        {prestamo.diasVencido} días
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Préstamos por Vencer */}
        <Card className="cfe-border-left cfe-border-left-yellow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-status-lent">
              <Calendar className="h-5 w-5 text-status-lent" />
              Préstamos por Vencer ({prestamosPorVencer.length})
            </CardTitle>
            <CardDescription>Productos que vencen en los próximos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            {prestamosPorVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay préstamos por vencer.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prestamosPorVencer.map((prestamo) => (
                  <div
                    key={prestamo.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                    onClick={() => handleLoanClick(prestamo, "expiring")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{prestamo.articulo}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Prestado a: {prestamo.prestadoA}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">N/S: {prestamo.numeroSerie || "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-status-lent text-white">
                        {prestamo.diasRestantes} días
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nueva Tarjeta: Resumen de Inventario por Estado - Mejorado */}
      <Card className="cfe-border-left cfe-border-left-green">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cfe-green">
            <Package className="h-5 w-5" />
            Distribución de Inventario por Estado
          </CardTitle>
          <CardDescription>Porcentaje y cantidad de productos en cada estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-6 w-full rounded-full overflow-hidden flex border border-gray-200 dark:border-gray-700">
              {Object.entries(inventoryDistribution).map(([key, data]) => (
                <div
                  key={key}
                  className={cn("h-full", data.color)}
                  style={{ width: `${data.percentage}%` }}
                  title={`${key}: ${data.count} (${data.percentage.toFixed(1)}%)`}
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-status-available"></div>
                <span className="text-xs font-medium">Disponibles: {inventoryDistribution.disponibles.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-status-assigned"></div>
                <span className="text-xs font-medium">Asignados: {inventoryDistribution.asignados.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-status-lent"></div>
                <span className="text-xs font-medium">Prestados: {inventoryDistribution.prestados.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-status-retired"></div>
                <span className="text-xs font-medium">Retirados: {inventoryDistribution.retirados.count}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>Últimas operaciones realizadas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {state.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {state.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                  onClick={() => handleViewActivityDetails(activity)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(activity.date).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="flex gap-1 items-center">
                    <ExternalLink className="h-3 w-3" />
                    <span>Ver</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para detalle de préstamos */}
      {/* Esto es un placeholder para mostrar cómo se vería, deberías crear los componentes reales */}
      <Sheet open={isLoanDetailSheetOpen} onOpenChange={setIsLoanDetailSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {loanSheetType === "overdue" ? "Préstamo Vencido" : "Préstamo por Vencer"}
            </SheetTitle>
            <SheetDescription>
              {selectedLoan ? `Detalles del préstamo para: ${selectedLoan.articulo}` : ''}
            </SheetDescription>
          </SheetHeader>
          {selectedLoan && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Producto</h4>
                    <p>{selectedLoan.articulo}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">N/S</h4>
                    <p>{selectedLoan.numeroSerie || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Prestado a</h4>
                  <p>{selectedLoan.prestadoA}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Fecha Préstamo</h4>
                    <p>
                      {new Date(selectedLoan.fechaPrestamo).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Fecha Devolución</h4>
                    <p>
                      {new Date(selectedLoan.fechaDevolucion).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                  <StatusBadge status={selectedLoan.estado} />
                </div>
                {selectedLoan.notas && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
                    <p className="text-sm">{selectedLoan.notas}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsLoanDetailSheetOpen(false)}>
                  Cerrar
                </Button>
                <Button>Registrar Devolución</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal para detalle de actividad */}
      <ActivityDetailSheet
        open={isActivityDetailSheetOpen}
        onOpenChange={setIsActivityDetailSheetOpen}
        activity={selectedActivity}
      />
    </div>
  )
}
