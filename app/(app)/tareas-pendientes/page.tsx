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
import { Search, Filter, ArrowUpDown, Eye } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { EditTaskSheet } from "@/components/edit-task-sheet"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { TaskAuditLogSheet } from "@/components/task-audit-log-sheet"
import { ActionMenu } from "@/components/action-menu"

export default function TareasPendientesPage() {
  const { state, dispatch, addRecentActivity } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "Todos",
    type: "Todos",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [taskToApprove, setTaskToApprove] = useState<any>(null)
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [taskToReject, setTaskToReject] = useState<any>(null)
  const [isAuditLogSheetOpen, setIsAuditLogSheetOpen] = useState(false)

  const handleEditTask = (task: any) => {
    setSelectedTask(task)
    setIsEditSheetOpen(true)
  }

  const handleApproveTask = (task: any) => {
    setTaskToApprove(task)
    setIsApproveConfirmOpen(true)
  }

  const confirmApprove = () => {
    if (taskToApprove) {
      dispatch({ type: "APPROVE_TASK", payload: taskToApprove.id })
      addRecentActivity({
        type: "Aprobación de Tarea",
        description: `Tarea "${taskToApprove.details}" de tipo "${taskToApprove.type}" aprobada.`,
        date: new Date().toLocaleString(),
        details: { taskId: taskToApprove.id, taskType: taskToApprove.type, taskDetails: taskToApprove.details },
      })
      toast({
        title: "Tarea Aprobada",
        description: `La tarea "${taskToApprove.details}" ha sido aprobada.`,
      })
      setIsApproveConfirmOpen(false)
      setTaskToApprove(null)
    }
  }

  const handleRejectTask = (task: any) => {
    setTaskToReject(task)
    setIsRejectConfirmOpen(true)
  }

  const confirmReject = () => {
    if (taskToReject) {
      dispatch({ type: "REJECT_TASK", payload: taskToReject.id })
      addRecentActivity({
        type: "Rechazo de Tarea",
        description: `Tarea "${taskToReject.details}" de tipo "${taskToReject.type}" rechazada.`,
        date: new Date().toLocaleString(),
        details: { taskId: taskToReject.id, taskType: taskToReject.type, taskDetails: taskToReject.details },
      })
      toast({
        title: "Tarea Rechazada",
        description: `La tarea "${taskToReject.details}" ha sido rechazada.`,
      })
      setIsRejectConfirmOpen(false)
      setTaskToReject(null)
    }
  }

  const filteredTasks = useMemo(() => {
    const filtered = state.pendingTasksData.filter((task) => {
      const matchesSearch =
        (task.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.requestedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.dateRequested || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filters.status === "Todos" || task.status === filters.status
      const matchesType = filters.type === "Todos" || task.type === filters.type

      return matchesSearch && matchesStatus && matchesType
    })

    return filtered
  }, [state.pendingTasksData, searchTerm, filters])

  const sortedTasks = useMemo(() => {
    if (!sortConfig) {
      return filteredTasks
    }

    const sorted = [...filteredTasks].sort((a, b) => {
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
  }, [filteredTasks, sortConfig])

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

  const allTaskTypes = useMemo(() => {
    const types = new Set(state.pendingTasksData.map((t) => t.type).filter(Boolean))
    return ["Todos", ...Array.from(types).sort()]
  }, [state.pendingTasksData])

  const allTaskStatuses = useMemo(() => {
    const statuses = new Set(state.pendingTasksData.map((t) => t.status).filter(Boolean))
    return ["Todos", ...Array.from(statuses).sort()]
  }, [state.pendingTasksData])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tareas Pendientes</h1>
        <Button variant="outline" onClick={() => setIsAuditLogSheetOpen(true)}>
          <Eye className="mr-2 h-4 w-4" /> Ver Registro de Auditoría
        </Button>
      </div>

      <div className="flex items-center gap-2">
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
                  {allTaskStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.status === status}
                      onCheckedChange={() => setFilters({ ...filters, status: status })}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tipo</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allTaskTypes.map((type) => (
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
              <TableHead onClick={() => requestSort("details")} className="cursor-pointer">
                Detalles
                {getSortIcon("details")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer">
                Estado
                {getSortIcon("status")}
              </TableHead>
              <TableHead onClick={() => requestSort("requestedBy")} className="cursor-pointer">
                Solicitado Por
                {getSortIcon("requestedBy")}
              </TableHead>
              <TableHead onClick={() => requestSort("dateRequested")} className="cursor-pointer">
                Fecha Solicitud
                {getSortIcon("dateRequested")}
              </TableHead>
              <TableHead className="w-[150px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron tareas pendientes.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.type}</TableCell>
                  <TableCell>{task.details}</TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>{task.requestedBy}</TableCell>
                  <TableCell>{task.dateRequested}</TableCell>
                  <TableCell>
                    <ActionMenu
                      onEdit={() => handleEditTask(task)}
                      onApprove={() => handleApproveTask(task)}
                      onReject={() => handleRejectTask(task)}
                      task={task}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <EditTaskSheet
          open={isEditSheetOpen}
          onOpenChange={setIsEditSheetOpen}
          task={selectedTask}
          onUpdateTask={(updatedTask) => {
            dispatch({ type: "UPDATE_TASK", payload: updatedTask })
            addRecentActivity({
              type: "Edición de Tarea",
              description: `Tarea "${updatedTask.details}" de tipo "${updatedTask.type}" editada.`,
              date: new Date().toLocaleString(),
              details: { taskId: updatedTask.id, taskType: updatedTask.type, taskDetails: updatedTask.details },
            })
            toast({
              title: "Tarea Actualizada",
              description: `La tarea "${updatedTask.details}" ha sido actualizada.`,
            })
            setIsEditSheetOpen(false)
            setSelectedTask(null)
          }}
        />
      )}
      <ConfirmationDialogForEditor
        open={isApproveConfirmOpen}
        onOpenChange={setIsApproveConfirmOpen}
        onConfirm={confirmApprove}
        title="Confirmar Aprobación"
        description={`¿Estás seguro de que deseas aprobar la tarea "${taskToApprove?.details}"?`}
      />
      <ConfirmationDialogForEditor
        open={isRejectConfirmOpen}
        onOpenChange={setIsRejectConfirmOpen}
        onConfirm={confirmReject}
        title="Confirmar Rechazo"
        description={`¿Estás seguro de que deseas rechazar la tarea "${taskToReject?.details}"?`}
      />
      <TaskAuditLogSheet open={isAuditLogSheetOpen} onOpenChange={setIsAuditLogSheetOpen} />
    </div>
  )
}
