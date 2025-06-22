"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, UserPlus, Edit, Trash2, Eye, PlusCircle, Save, X } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import type { User, AccessRequest, PendingActionRequest } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { TaskAuditLogSheet } from "@/components/task-audit-log-sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function ConfiguracionPage() {
  const {
    state,
    updateAccessRequestStatus,
    updatePendingActionRequests,
    updateUserInUsersData,
    addRecentActivity,
    updateUserColumnPreferences,
    updateSolicitudes,
    updatePendingTask,
    updateInventory,
    updateAssignmentStatus, // Updated from updateAsignados
    updateLoanStatus, // Updated from updatePrestamos
    updateAsignados,
    updatePrestamos,
  } = useApp()
  const { solicitudesAcceso, pendingActionRequests, usersData, user, categorias, marcas, retirementReasons } = state
  const { toast } = useToast()

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | PendingActionRequest | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete">("approve")
  const [requestType, setRequestType] = useState<"access" | "action">("access")
  const [isAuditLogSheetOpen, setIsAuditLogSheetOpen] = useState(false)

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<User["rol"]>("Visualizador")
  const [newUserPassword, setNewUserPassword] = useState("")

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false)
  const [attributeType, setAttributeType] = useState<"categoria" | "marca" | "motivoRetiro">("categoria")
  const [newAttributeValue, setNewAttributeValue] = useState("")
  const [editingAttribute, setEditingAttribute] = useState<{ type: string; value: string } | null>(null)

  const [isColumnCustomizationModalOpen, setIsColumnCustomizationModalOpen] = useState(false)
  const [selectedPageForColumns, setSelectedPageForColumns] = useState("inventario")
  const [columnPreferences, setColumnPreferences] = useState<{ id: string; label: string; visible: boolean }[]>([])

  const canManageUsers = user?.rol === "Administrador"
  const canManageAttributes = user?.rol === "Administrador"
  const canManageColumnPreferences = user?.rol === "Administrador" || user?.rol === "Editor"

  const handleAccessRequestAction = (request: AccessRequest, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setActionType(action)
    setRequestType("access")
    setIsConfirmationDialogOpen(true)
  }

  const handlePendingActionRequestAction = (request: PendingActionRequest, action: "approve" | "reject" | "delete") => {
    setSelectedRequest(request)
    setActionType(action)
    setRequestType("action")
    setIsConfirmationDialogOpen(true)
  }

  const confirmAction = () => {
    if (!selectedRequest) return

    const currentUser = user?.nombre || "Sistema"
    const currentDateTime = new Date().toLocaleString()

    if (requestType === "access") {
      const accessRequest = selectedRequest as AccessRequest
      updateAccessRequestStatus(accessRequest.id, actionType === "approve" ? "Aprobada" : "Rechazada")
      addRecentActivity({
        type: `Solicitud de Acceso ${actionType === "approve" ? "Aprobada" : "Rechazada"}`,
        description: `Solicitud de acceso para ${accessRequest.nombre || ""} (${accessRequest.email || ""}) ha sido ${actionType === "approve" ? "aprobada" : "rechazada"}.`,
        date: currentDateTime,
        details: { requestId: accessRequest.id, userName: accessRequest.nombre, status: actionType },
      })
      toast({
        title: `Solicitud ${actionType === "approve" ? "Aprobada" : "Rechazada"}`,
        description: `La solicitud de acceso de ${accessRequest.nombre || ""} ha sido ${actionType === "approve" ? "aprobada" : "rechazada"}.`,
      })
    } else if (requestType === "action") {
      const actionRequest = selectedRequest as PendingActionRequest
      if (actionType === "delete") {
        const updatedRequests = pendingActionRequests.filter((req) => req.id !== actionRequest.id)
        updatePendingActionRequests(updatedRequests)
        addRecentActivity({
          type: `Solicitud de Acción Eliminada`,
          description: `La solicitud de acción de tipo "${actionRequest.type || ""}" (ID: ${actionRequest.id}) ha sido eliminada.`,
          date: currentDateTime,
          details: { requestId: actionRequest.id, requestType: actionRequest.type, deletedBy: currentUser },
        })
        toast({
          title: "Solicitud Eliminada",
          description: `La solicitud de acción ha sido eliminada.`,
        })
      } else {
        const updatedRequests = pendingActionRequests.map((req) =>
          req.id === actionRequest.id ? { ...req, status: actionType === "approve" ? "Aprobada" : "Rechazada" } : req,
        )
        updatePendingActionRequests(updatedRequests)
        addRecentActivity({
          type: `Solicitud de Acción ${actionType === "approve" ? "Aprobada" : "Rechazada"}`,
          description: `La solicitud de acción de tipo "${actionRequest.type || ""}" (ID: ${actionRequest.id}) ha sido ${actionType === "approve" ? "aprobada" : "rechazada"}.`,
          date: currentDateTime,
          details: { requestId: actionRequest.id, requestType: actionRequest.type, status: actionType },
        })
        toast({
          title: `Solicitud ${actionType === "approve" ? "Aprobada" : "Rechazada"}`,
          description: `La solicitud de acción ha sido ${actionType === "approve" ? "aprobada" : "rechazada"}.`,
        })
      }
    }
    setIsConfirmationDialogOpen(false)
    setSelectedRequest(null)
  }

  const handleAddOrEditUser = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit)
      setNewUserName(userToEdit.nombre || "")
      setNewUserEmail(userToEdit.email || "")
      setNewUserRole(userToEdit.rol)
      setNewUserPassword(userToEdit.password || "") // Pre-fill password if exists
    } else {
      setEditingUser(null)
      setNewUserName("")
      setNewUserEmail("")
      setNewUserRole("Visualizador")
      setNewUserPassword("")
    }
    setIsUserModalOpen(true)
  }

  const saveUser = () => {
    if (!newUserName || !newUserEmail || !newUserRole || !newUserPassword) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios.",
        variant: "destructive",
      })
      return
    }

    if (editingUser) {
      // Edit existing user
      updateUserInUsersData(editingUser.id, {
        nombre: newUserName,
        email: newUserEmail,
        rol: newUserRole,
        password: newUserPassword,
      })
      addRecentActivity({
        type: "Edición de Usuario",
        description: `Usuario "${editingUser.nombre || ""}" editado a "${newUserName}".`,
        date: new Date().toLocaleString(),
        details: { userId: editingUser.id, oldName: editingUser.nombre, newName: newUserName, editedBy: user?.nombre },
      })
      toast({ title: "Usuario Actualizado", description: `El usuario ${newUserName} ha sido actualizado.` })
    } else {
      // Add new user
      const newId = Math.max(...usersData.map((u) => u.id), 0) + 1
      const newUser: User = {
        id: newId,
        nombre: newUserName,
        email: newUserEmail,
        rol: newUserRole,
        password: newUserPassword,
      }
      updateUserInUsersData(0, newUser) // Pass 0 or a placeholder, the reducer will add it
      addRecentActivity({
        type: "Creación de Usuario",
        description: `Nuevo usuario "${newUserName}" (${newUserRole}) creado.`,
        date: new Date().toLocaleString(),
        details: { userId: newId, userName: newUserName, userRole: newUserRole, createdBy: user?.nombre },
      })
      toast({ title: "Usuario Creado", description: `El usuario ${newUserName} ha sido creado.` })
    }
    setIsUserModalOpen(false)
  }

  const handleAddOrEditAttribute = (type: "categoria" | "marca" | "motivoRetiro", valueToEdit?: string) => {
    setAttributeType(type)
    if (valueToEdit) {
      setEditingAttribute({ type, value: valueToEdit })
      setNewAttributeValue(valueToEdit)
    } else {
      setEditingAttribute(null)
      setNewAttributeValue("")
    }
    setIsAttributeModalOpen(true)
  }

  const saveAttribute = () => {
    if (!newAttributeValue.trim()) {
      toast({
        title: "Error",
        description: "El valor del atributo no puede estar vacío.",
        variant: "destructive",
      })
      return
    }

    let updatedList: string[] = []
    let attributeName = ""

    switch (attributeType) {
      case "categoria":
        updatedList = [...categorias]
        attributeName = "categoría"
        break
      case "marca":
        updatedList = [...marcas]
        attributeName = "marca"
        break
      case "motivoRetiro":
        updatedList = [...retirementReasons]
        attributeName = "motivo de retiro"
        break
      default:
        return
    }

    if (editingAttribute) {
      // Edit existing attribute
      const index = updatedList.indexOf(editingAttribute.value)
      if (index !== -1) {
        updatedList[index] = newAttributeValue.trim()
        toast({
          title: "Atributo Actualizado",
          description: `La ${attributeName} ha sido actualizada.`,
        })
        addRecentActivity({
          type: `Edición de ${attributeName}`,
          description: `La ${attributeName} "${editingAttribute.value || ""}" fue editada a "${newAttributeValue.trim()}".`,
          date: new Date().toLocaleString(),
          details: {
            type: attributeName,
            oldValue: editingAttribute.value,
            newValue: newAttributeValue.trim(),
            editedBy: user?.nombre,
          },
        })
      }
    } else {
      // Add new attribute
      if (updatedList.includes(newAttributeValue.trim())) {
        toast({
          title: "Error",
          description: `La ${attributeName} "${newAttributeValue.trim()}" ya existe.`,
          variant: "destructive",
        })
        return
      }
      updatedList.push(newAttributeValue.trim())
      toast({
        title: "Atributo Añadido",
        description: `Nueva ${attributeName} añadida.`,
      })
      addRecentActivity({
        type: `Adición de ${attributeName}`,
        description: `Nueva ${attributeName} "${newAttributeValue.trim()}" añadida.`,
        date: new Date().toLocaleString(),
        details: { type: attributeName, newValue: newAttributeValue.trim(), addedBy: user?.nombre },
      })
    }

    // This part needs to be handled by the context if these lists are part of the global state
    // For now, we'll simulate the update. In a real app, you'd have `updateCategories`, `updateBrands`, etc.
    // For the demo, we'll just close the modal and rely on the toast.
    setIsAttributeModalOpen(false)
  }

  const handleDeleteAttribute = (type: "categoria" | "marca" | "motivoRetiro", valueToDelete: string) => {
    // This would also need a confirmation dialog in a real app
    let updatedList: string[] = []
    let attributeName = ""

    switch (type) {
      case "categoria":
        updatedList = categorias.filter((cat) => cat !== valueToDelete)
        attributeName = "categoría"
        break
      case "marca":
        updatedList = marcas.filter((mar) => mar !== valueToDelete)
        attributeName = "marca"
        break
      case "motivoRetiro":
        updatedList = retirementReasons.filter((reason) => reason !== valueToDelete)
        attributeName = "motivo de retiro"
        break
      default:
        return
    }

    // Simulate update
    toast({
      title: "Atributo Eliminado",
      description: `La ${attributeName} "${valueToDelete}" ha sido eliminada.`,
    })
    addRecentActivity({
      type: `Eliminación de ${attributeName}`,
      description: `La ${attributeName} "${valueToDelete}" fue eliminada.`,
      date: new Date().toLocaleString(),
      details: { type: attributeName, deletedValue: valueToDelete, deletedBy: user?.nombre },
    })
  }

  const handleOpenColumnCustomization = (page: string) => {
    setSelectedPageForColumns(page)
    // Initialize column preferences based on current user's settings or defaults
    const userPrefs = state.userColumnPreferences.find((pref) => pref.page === page)?.preferences || []
    // This is a placeholder. In a real app, you'd have a definitive list of all possible columns for each page.
    // For now, we'll just use some dummy data or infer from existing data.
    const defaultColumns = [
      { id: "nombre", label: "Nombre", visible: true },
      { id: "estado", label: "Estado", visible: true },
      { id: "cantidad", label: "Cantidad", visible: true },
      { id: "marca", label: "Marca", visible: true },
      { id: "modelo", label: "Modelo", visible: true },
      { id: "categoria", label: "Categoría", visible: true },
      { id: "numeroSerie", label: "Número de Serie", visible: true },
      { id: "fechaIngreso", label: "Fecha de Ingreso", visible: true },
    ]
    // Merge default columns with user preferences, prioritizing user preferences
    const mergedColumns = defaultColumns.map((col) => {
      const userPref = userPrefs.find((up) => up.id === col.id)
      return userPref ? { ...col, visible: userPref.visible } : col
    })
    setColumnPreferences(mergedColumns)
    setIsColumnCustomizationModalOpen(true)
  }

  const handleColumnVisibilityChange = (id: string, checked: boolean) => {
    setColumnPreferences((prev) => prev.map((col) => (col.id === id ? { ...col, visible: checked } : col)))
  }

  const saveColumnPreferences = () => {
    if (user) {
      updateUserColumnPreferences(selectedPageForColumns, columnPreferences)
      addRecentActivity({
        type: "Personalización de Columnas",
        description: `Preferencias de columnas actualizadas para la página "${selectedPageForColumns}".`,
        date: new Date().toLocaleString(),
        details: { page: selectedPageForColumns, userId: user.id, updatedBy: user.nombre },
      })
      toast({
        title: "Preferencias Guardadas",
        description: `Las preferencias de columnas para ${selectedPageForColumns} han sido guardadas.`,
      })
    } else {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar tus preferencias.",
        variant: "destructive",
      })
    }
    setIsColumnCustomizationModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Configuración del Sistema</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="access-requests">Solicitudes de Acceso</TabsTrigger>
          <TabsTrigger value="pending-actions">Acciones Pendientes</TabsTrigger>
          {/* <TabsTrigger value="attributes">Atributos</TabsTrigger> */}
          {/* <TabsTrigger value="columns">Columnas</TabsTrigger> */}
        </TabsList>

        {/* Gestión de Usuarios */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Gestión de Usuarios</CardTitle>
              {canManageUsers && (
                <Button size="sm" onClick={() => handleAddOrEditUser()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Añadir Usuario
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.rol}</TableCell>
                      <TableCell>
                        {canManageUsers && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAddOrEditUser(u)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solicitudes de Acceso */}
        <TabsContent value="access-requests">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Solicitudes de Acceso</CardTitle>
              <CardDescription>Gestiona las solicitudes de nuevos usuarios al sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Justificación</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudesAcceso.length > 0 ? (
                    solicitudesAcceso.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.nombre}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.justificacion}</TableCell>
                        <TableCell>{new Date(request.fecha).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.estado} />
                        </TableCell>
                        <TableCell>
                          {canManageUsers && request.estado === "Pendiente" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAccessRequestAction(request, "approve")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAccessRequestAction(request, "reject")}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rechazar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay solicitudes de acceso pendientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Acciones Pendientes de Aprobación */}
        <TabsContent value="pending-actions">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Acciones Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y aprueba o rechaza acciones que requieren supervisión.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead>Solicitado Por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingActionRequests.length > 0 ? (
                    pendingActionRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.type}</TableCell>
                        <TableCell>
                          {request.type === "Asignación" &&
                            `Asignación de ${request.details?.productName || ""} a ${request.details?.assignedTo || ""}`}
                          {request.type === "Préstamo" &&
                            `Préstamo de ${request.details?.productName || ""} a ${request.details?.lentToName || ""}`}
                          {request.type === "Retiro de Producto" &&
                            `Retiro de ${request.details?.productName || ""} por ${request.details?.reason || ""}`}
                          {request.type === "Creación de Producto" && `Creación de ${request.details?.nombre || ""}`}
                          {request.type === "Edición de Producto" &&
                            `Edición de ${request.details?.updates?.nombre || request.details?.id || ""}`}
                          {request.type === "Duplicación de Producto" &&
                            `Duplicación de ${request.details?.originalProduct?.nombre || ""}`}
                          {request.type === "Reactivación" && `Reactivación de ${request.details?.productName || ""}`}
                          {request.type === "Edición Masiva" &&
                            `Edición masiva de ${request.details?.count || 0} artículos`}
                          {request.type === "Asignación Masiva" &&
                            `Asignación masiva de ${request.details?.count || 0} artículos`}
                          {request.type === "Préstamo Masivo" &&
                            `Préstamo masivo de ${request.details?.count || 0} artículos`}
                          {request.type === "Retiro Masivo" &&
                            `Retiro masivo de ${request.details?.count || 0} artículos`}
                        </TableCell>
                        <TableCell>{request.requestedBy}</TableCell>
                        <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          {canManageUsers && request.status === "Pendiente" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePendingActionRequestAction(request, "approve")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePendingActionRequestAction(request, "reject")}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Rechazar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePendingActionRequestAction(request, "delete")}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setIsAuditLogSheetOpen(true)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Auditoría
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay acciones pendientes de aprobación.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Atributos (Categorías, Marcas, Motivos de Retiro) */}
        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Gestión de Atributos</CardTitle>
              <CardDescription>Administra categorías, marcas y motivos de retiro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {/* Categorías */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Categorías</h3>
                <ul className="space-y-2">
                  {categorias.map((cat, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md bg-muted p-2">
                      <span>{cat}</span>
                      {canManageAttributes && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddOrEditAttribute("categoria", cat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteAttribute("categoria", cat)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {canManageAttributes && (
                  <Button size="sm" className="w-full" onClick={() => handleAddOrEditAttribute("categoria")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Categoría
                  </Button>
                )}
              </div>

              {/* Marcas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Marcas</h3>
                <ul className="space-y-2">
                  {marcas.map((brand, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md bg-muted p-2">
                      <span>{brand}</span>
                      {canManageAttributes && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleAddOrEditAttribute("marca", brand)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteAttribute("marca", brand)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {canManageAttributes && (
                  <Button size="sm" className="w-full" onClick={() => handleAddOrEditAttribute("marca")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Marca
                  </Button>
                )}
              </div>

              {/* Motivos de Retiro */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Motivos de Retiro</h3>
                <ul className="space-y-2">
                  {retirementReasons.map((reason, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md bg-muted p-2">
                      <span>{reason}</span>
                      {canManageAttributes && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddOrEditAttribute("motivoRetiro", reason)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteAttribute("motivoRetiro", reason)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {canManageAttributes && (
                  <Button size="sm" className="w-full" onClick={() => handleAddOrEditAttribute("motivoRetiro")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Motivo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalización de Columnas */}
        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Personalización de Columnas</CardTitle>
              <CardDescription>Selecciona qué columnas deseas ver en cada tabla.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button onClick={() => handleOpenColumnCustomization("inventario")}>
                Personalizar Columnas de Inventario
              </Button>
              <Button onClick={() => handleOpenColumnCustomization("asignados")}>
                Personalizar Columnas de Asignados
              </Button>
              <Button onClick={() => handleOpenColumnCustomization("prestamos")}>
                Personalizar Columnas de Préstamos
              </Button>
              <Button onClick={() => handleOpenColumnCustomization("historial")}>
                Personalizar Columnas de Historial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialogForEditor
        isOpen={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        onConfirm={confirmAction}
        title={
          actionType === "approve"
            ? "¿Confirmar Aprobación?"
            : actionType === "reject"
              ? "¿Confirmar Rechazo?"
              : "¿Confirmar Eliminación?"
        }
        description={
          requestType === "access"
            ? `¿Estás seguro de que deseas ${actionType === "approve" ? "aprobar" : "rechazar"} la solicitud de acceso de "${(selectedRequest as AccessRequest)?.nombre || ""}"?`
            : `¿Estás seguro de que deseas ${actionType === "approve" ? "aprobar" : actionType === "reject" ? "rechazar" : "eliminar"} la solicitud de acción de tipo "${(selectedRequest as PendingActionRequest)?.type || ""}"?`
        }
        confirmButtonText={
          actionType === "approve" ? "Sí, Aprobar" : actionType === "reject" ? "Sí, Rechazar" : "Sí, Eliminar"
        }
        cancelButtonText="No, Cancelar"
      />

      {selectedRequest && requestType === "action" && (selectedRequest as PendingActionRequest).auditLog && (
        <TaskAuditLogSheet
          open={isAuditLogSheetOpen}
          onOpenChange={setIsAuditLogSheetOpen}
          auditLog={(selectedRequest as PendingActionRequest).auditLog || []}
          taskType={(selectedRequest as PendingActionRequest).type || "Desconocido"}
        />
      )}

      {/* User Add/Edit Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Realiza cambios en la cuenta de usuario." : "Crea una nueva cuenta de usuario."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select value={newUserRole} onValueChange={(value: User["rol"]) => setNewUserRole(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Visualizador">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveUser}>
              <Save className="mr-2 h-4 w-4" />
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attribute Add/Edit Modal */}
      <Dialog open={isAttributeModalOpen} onOpenChange={setIsAttributeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAttribute ? `Editar ${attributeType}` : `Añadir Nueva ${attributeType}`}</DialogTitle>
            <DialogDescription>
              {editingAttribute
                ? `Realiza cambios en la ${attributeType} existente.`
                : `Añade una nueva ${attributeType} al sistema.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attribute-value" className="text-right">
                Valor
              </Label>
              <Input
                id="attribute-value"
                value={newAttributeValue}
                onChange={(e) => setNewAttributeValue(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttributeModalOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveAttribute}>
              <Save className="mr-2 h-4 w-4" />
              {editingAttribute ? "Guardar Cambios" : "Añadir Atributo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Customization Modal */}
      <Dialog open={isColumnCustomizationModalOpen} onOpenChange={setIsColumnCustomizationModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Personalizar Columnas para {selectedPageForColumns}</DialogTitle>
            <DialogDescription>
              Selecciona las columnas que deseas mostrar en la tabla de {selectedPageForColumns}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columnPreferences.map((col) => (
              <div key={col.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${col.id}`}
                  checked={col.visible}
                  onCheckedChange={(checked: boolean) => handleColumnVisibilityChange(col.id, checked)}
                />
                <label
                  htmlFor={`col-${col.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {col.label}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsColumnCustomizationModalOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveColumnPreferences}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Preferencias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
