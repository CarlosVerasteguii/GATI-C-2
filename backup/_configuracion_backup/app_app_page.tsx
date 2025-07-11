"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, PlusCircle, MoreHorizontal, CheckCircle, XCircle, UserPlus, Edit, Trash2, Eye, Save, X } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import type { User, AccessRequest, PendingActionRequest } from "@/contexts/app-context"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { AccessRequestModal } from "@/components/access-request-modal"
import { StatusBadge } from "@/components/status-badge"
import { ActionMenu } from "@/components/action-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { TaskAuditLogSheet } from "@/components/task-audit-log-sheet"

export default function ConfiguracionPage() {
  const {
    state,
    dispatch,
    addRecentActivity,
    updateAccessRequestStatus,
    updatePendingActionRequests,
    updateUserInUsersData,
    updateUserColumnPreferences,
    updateSolicitudes,
  } = useApp()
  const { solicitudesAcceso, pendingActionRequests, usersData, user, categorias, marcas, retirementReasons } = state
  const { toast } = useToast()

  // User Management State
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userSortConfig, setUserSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isUserDeleteConfirmOpen, setIsUserDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)

  // Old user management states to reconcile
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<User["rol"]>("Visualizador")
  const [newUserPassword, setNewUserPassword] = useState("") // Important to keep

  // Access Request Management State (reconciled)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | PendingActionRequest | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete">("approve")
  const [requestType, setRequestType] = useState<"access" | "action">("access")
  const [isAccessRequestModalOpen, setIsAccessRequestModalOpen] = useState(false) // Keeping this as it's from the newer file for a specific modal
  const [isAccessRequestApproveConfirmOpen, setIsAccessRequestApproveConfirmOpen] = useState(false)
  const [requestToApprove, setRequestToApprove] = useState<AccessRequest | null>(null)
  const [isAccessRequestRejectConfirmOpen, setIsAccessRequestRejectConfirmOpen] = useState(false)
  const [requestToReject, setRequestToReject] = useState<AccessRequest | null>(null)
  const [isAuditLogSheetOpen, setIsAuditLogSheetOpen] = useState(false)

  const [accessRequestSearchTerm, setAccessRequestSearchTerm] = useState("")
  const [accessRequestSortConfig, setAccessRequestSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  // Attribute Management State (reconciled)
  const [attributeSearchTerm, setAttributeSearchTerm] = useState("")
  const [attributeSortConfig, setAttributeSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isAttributeDeleteConfirmOpen, setIsAttributeDeleteConfirmOpen] = useState(false)
  const [attributeToDelete, setAttributeToDelete] = useState<any>(null)
  const [newAttributeName, setNewAttributeName] = useState("")
  const [newAttributeType, setNewAttributeType] = useState("text") // Default type (from newer file)

  // Old attribute management states to reconcile
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false)
  const [newAttributeValue, setNewAttributeValue] = useState("")
  const [editingAttribute, setEditingAttribute] = useState<{ type: string; value: string } | null>(null)

  // Column Customization State (newly added from old file)
  const [isColumnCustomizationModalOpen, setIsColumnCustomizationModalOpen] = useState(false)
  const [selectedPageForColumns, setSelectedPageForColumns] = useState("inventario")
  const [columnPreferences, setColumnPreferences] = useState<{ id: string; label: string; visible: boolean }[]>([])

  const canManageUsers = user?.rol === "Administrador"
  const canManageAttributes = user?.rol === "Administrador"
  const canManageColumnPreferences = user?.rol === "Administrador" || user?.rol === "Editor"

  // Handlers for User Management
  const handleUserDelete = (user: any) => {
    setUserToDelete(user)
    setIsUserDeleteConfirmOpen(true)
  }

  const confirmUserDelete = () => {
    if (userToDelete) {
      dispatch({ type: "DELETE_USER", payload: userToDelete.id })
      addRecentActivity({
        type: "Eliminación de Usuario",
        description: `Usuario ${userToDelete.nombre} (${userToDelete.rol}) eliminado.`,
        date: new Date().toLocaleString(),
        details: { userId: userToDelete.id, userName: userToDelete.nombre, userRole: userToDelete.rol },
      })
      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${userToDelete.nombre} ha sido eliminado.`,
      })
      setIsUserDeleteConfirmOpen(false)
      setUserToDelete(null)
    }
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
      dispatch({
        type: "UPDATE_USER_IN_USERS_DATA",
        payload: {
          userId: editingUser.id,
          updates: {
            nombre: newUserName,
            email: newUserEmail,
            rol: newUserRole,
            password: newUserPassword,
          },
          newUser: { ...editingUser, nombre: newUserName, email: newUserEmail, rol: newUserRole, password: newUserPassword },
        },
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
      const newId = Math.max(...state.usersData.map((u) => u.id), 0) + 1
      const newUser: User = {
        id: newId,
        nombre: newUserName,
        email: newUserEmail,
        rol: newUserRole,
        password: newUserPassword,
      }
      dispatch({ type: "UPDATE_USER_IN_USERS_DATA", payload: { userId: 0, updates: {}, newUser } }) // Pass 0 or a placeholder, the reducer will add it
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

  const filteredUsers = useMemo(() => {
    const filtered = state.usersData.filter((user) => {
      const matchesSearch =
        (user.nombre || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.rol || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.trustedIp || "").toLowerCase().includes(userSearchTerm.toLowerCase())

      return matchesSearch
    })
    return filtered
  }, [state.usersData, userSearchTerm])

  const sortedUsers = useMemo(() => {
    if (!userSortConfig) {
      return filteredUsers
    }
    const sorted = [...filteredUsers].sort((a, b) => {
      const aValue = a[userSortConfig.key] || ""
      const bValue = b[userSortConfig.key] || ""
      if (aValue < bValue) {
        return userSortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return userSortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
    return sorted
  }, [filteredUsers, userSortConfig])

  const requestUserSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (userSortConfig && userSortConfig.key === key && userSortConfig.direction === "ascending") {
      direction = "descending"
    }
    setUserSortConfig({ key, direction })
  }

  const getUserSortIcon = (key: string) => {
    if (!userSortConfig || userSortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (userSortConfig.direction === "ascending") {
      return <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Handlers for Access Request Management
  const handleApproveAccessRequest = (request: any) => {
    setRequestToApprove(request)
    setIsAccessRequestApproveConfirmOpen(true)
  }

  const confirmApproveAccessRequest = () => {
    if (requestToApprove) {
      dispatch({ type: "APPROVE_ACCESS_REQUEST", payload: requestToApprove.id })
      addRecentActivity({
        type: "Aprobación de Solicitud de Acceso",
        description: `Solicitud de acceso de ${requestToApprove.name} (${requestToApprove.email}) aprobada.`,
        date: new Date().toLocaleString(),
        details: { requestId: requestToApprove.id, requestName: requestToApprove.name },
      })
      toast({
        title: "Solicitud Aprobada",
        description: `La solicitud de ${requestToApprove.name} ha sido aprobada.`,
      })
      setIsAccessRequestApproveConfirmOpen(false)
      setRequestToApprove(null)
    }
  }

  const handleRejectAccessRequest = (request: any) => {
    setRequestToReject(request)
    setIsAccessRequestRejectConfirmOpen(true)
  }

  const confirmRejectAccessRequest = () => {
    if (requestToReject) {
      dispatch({ type: "REJECT_ACCESS_REQUEST", payload: requestToReject.id })
      addRecentActivity({
        type: "Rechazo de Solicitud de Acceso",
        description: `Solicitud de acceso de ${requestToReject.name} (${requestToReject.email}) rechazada.`,
        date: new Date().toLocaleString(),
        details: { requestId: requestToReject.id, requestName: requestToReject.name },
      })
      toast({
        title: "Solicitud Rechazada",
        description: `La solicitud de ${requestToReject.name} ha sido rechazada.`,
      })
      setIsAccessRequestRejectConfirmOpen(false)
      setRequestToReject(null)
    }
  }

  const filteredAccessRequests = useMemo(() => {
    const filtered = state.accessRequests.filter((request) => {
      const matchesSearch =
        (request.name || "").toLowerCase().includes(accessRequestSearchTerm.toLowerCase()) ||
        (request.email || "").toLowerCase().includes(accessRequestSearchTerm.toLowerCase()) ||
        (request.role || "").toLowerCase().includes(accessRequestSearchTerm.toLowerCase()) ||
        (request.status || "").toLowerCase().includes(accessRequestSearchTerm.toLowerCase())

      return matchesSearch
    })
    return filtered
  }, [state.accessRequests, accessRequestSearchTerm])

  const sortedAccessRequests = useMemo(() => {
    if (!accessRequestSortConfig) {
      return filteredAccessRequests
    }
    const sorted = [...filteredAccessRequests].sort((a, b) => {
      const aValue = a[accessRequestSortConfig.key] || ""
      const bValue = b[accessRequestSortConfig.key] || ""
      if (aValue < bValue) {
        return accessRequestSortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return accessRequestSortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
    return sorted
  }, [filteredAccessRequests, accessRequestSortConfig])

  const requestAccessRequestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (
      accessRequestSortConfig &&
      accessRequestSortConfig.key === key &&
      accessRequestSortConfig.direction === "ascending"
    ) {
      direction = "descending"
    }
    setAccessRequestSortConfig({ key, direction })
  }

  const getAccessRequestSortIcon = (key: string) => {
    if (!accessRequestSortConfig || accessRequestSortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (accessRequestSortConfig.direction === "ascending") {
      return <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Handlers for Attribute Management
  const handleAddAttribute = () => {
    if (newAttributeName.trim()) {
      dispatch({
        type: "ADD_ATTRIBUTE",
        payload: { name: newAttributeName.trim(), type: newAttributeType },
      })
      addRecentActivity({
        type: "Adición de Atributo",
        description: `Nuevo atributo "${newAttributeName}" de tipo "${newAttributeType}" añadido.`,
        date: new Date().toLocaleString(),
        details: { attributeName: newAttributeName, attributeType: newAttributeType },
      })
      toast({
        title: "Atributo Añadido",
        description: `El atributo "${newAttributeName}" ha sido añadido.`,
      })
      setNewAttributeName("")
      setNewAttributeType("text")
    } else {
      toast({
        title: "Error",
        description: "El nombre del atributo no puede estar vacío.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAttribute = (attribute: any) => {
    setAttributeToDelete(attribute)
    setIsAttributeDeleteConfirmOpen(true)
  }

  const confirmAttributeDelete = () => {
    if (attributeToDelete) {
      dispatch({ type: "DELETE_ATTRIBUTE", payload: attributeToDelete.id })
      addRecentActivity({
        type: "Eliminación de Atributo",
        description: `Atributo "${attributeToDelete.name}" eliminado.`,
        date: new Date().toLocaleString(),
        details: { attributeId: attributeToDelete.id, attributeName: attributeToDelete.name },
      })
      toast({
        title: "Atributo Eliminado",
        description: `El atributo "${attributeToDelete.name}" ha sido eliminado.`,
      })
      setIsAttributeDeleteConfirmOpen(false)
      setAttributeToDelete(null)
    }
  }

  const filteredAttributes = useMemo(() => {
    const filtered = state.customAttributes.filter((attribute) => {
      const matchesSearch =
        (attribute.name || "").toLowerCase().includes(attributeSearchTerm.toLowerCase()) ||
        (attribute.type || "").toLowerCase().includes(attributeSearchTerm.toLowerCase())

      return matchesSearch
    })
    return filtered
  }, [state.customAttributes, attributeSearchTerm])

  const sortedAttributes = useMemo(() => {
    if (!attributeSortConfig) {
      return filteredAttributes
    }
    const sorted = [...filteredAttributes].sort((a, b) => {
      const aValue = a[attributeSortConfig.key] || ""
      const bValue = b[attributeSortConfig.key] || ""
      if (aValue < bValue) {
        return attributeSortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return attributeSortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
    return sorted
  }, [filteredAttributes, attributeSortConfig])

  const requestAttributeSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    if (attributeSortConfig && attributeSortConfig.key === key && attributeSortConfig.direction === "ascending") {
      direction = "descending"
    }
    setAttributeSortConfig({ key, direction })
  }

  const getAttributeSortIcon = (key: string) => {
    if (!attributeSortConfig || attributeSortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (attributeSortConfig.direction === "ascending") {
      return <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Column Customization Handlers (from old file)
  const handleOpenColumnCustomization = (page: string) => {
    setSelectedPageForColumns(page)
    const userPrefs = state.userColumnPreferences.find(pref => pref.page === page && pref.userId === state.user?.id)
    const initialColumns = userPrefs ? userPrefs.preferences : [] // Assuming preferences array is already structured { id, label, visible }
    setColumnPreferences(initialColumns)
    setIsColumnCustomizationModalOpen(true)
  }

  const handleColumnVisibilityChange = (id: string, checked: boolean) => {
    setColumnPreferences(prev => prev.map(col =>
      col.id === id ? { ...col, visible: checked } : col
    ))
  }

  const saveColumnPreferences = () => {
    if (state.user) {
      dispatch({
        type: "UPDATE_USER_COLUMN_PREFERENCES",
        payload: {
          userId: state.user.id,
          pageId: selectedPageForColumns,
          columns: columnPreferences.filter(col => col.visible).map(col => col.id)
        }
      })
      toast({
        title: "Preferencias Guardadas",
        description: "Tus preferencias de columnas han sido actualizadas.",
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias. Por favor, inicia sesión.",
        variant: "destructive",
      })
    }
    setIsColumnCustomizationModalOpen(false)
  }

  // Current Access Requests filtered for pending status
  const pendingAccessRequests = state.solicitudesAcceso.filter(
    (request) => request.estado === "Pendiente",
  )

  // Combined and filtered pending action requests
  const filteredPendingActionRequests = state.pendingActionRequests.filter(
    (request) => request.status === "Pendiente",
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="access-requests">Solicitudes de Acceso</TabsTrigger>
          <TabsTrigger value="attributes">Atributos Personalizados</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            <Button onClick={() => console.log("Add User clicked")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Usuario
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar usuario..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-background pl-8"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestUserSort("nombre")} className="cursor-pointer">
                    Nombre
                    {getUserSortIcon("nombre")}
                  </TableHead>
                  <TableHead onClick={() => requestUserSort("email")} className="cursor-pointer">
                    Email
                    {getUserSortIcon("email")}
                  </TableHead>
                  <TableHead onClick={() => requestUserSort("rol")} className="cursor-pointer">
                    Rol
                    {getUserSortIcon("rol")}
                  </TableHead>
                  <TableHead onClick={() => requestUserSort("trustedIp")} className="cursor-pointer">
                    IP Confiable
                    {getUserSortIcon("trustedIp")}
                  </TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.rol}</TableCell>
                      <TableCell>{user.trustedIp || "N/A"}</TableCell>
                      <TableCell>
                        <ActionMenu
                          onEdit={() => console.log("Edit User clicked", user)}
                          onDelete={() => handleUserDelete(user)}
                          user={user}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ConfirmationDialogForEditor
            open={isUserDeleteConfirmOpen}
            onOpenChange={setIsUserDeleteConfirmOpen}
            onConfirm={confirmUserDelete}
            title="Confirmar Eliminación de Usuario"
            description={`¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          />
        </TabsContent>

        {/* Access Request Management Tab */}
        <TabsContent value="access-requests" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Solicitudes de Acceso Pendientes</h2>
            <Button onClick={() => setIsAccessRequestModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Solicitar Acceso
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar solicitud..."
                value={accessRequestSearchTerm}
                onChange={(e) => setAccessRequestSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-background pl-8"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestAccessRequestSort("name")} className="cursor-pointer">
                    Nombre
                    {getAccessRequestSortIcon("name")}
                  </TableHead>
                  <TableHead onClick={() => requestAccessRequestSort("email")} className="cursor-pointer">
                    Email
                    {getAccessRequestSortIcon("email")}
                  </TableHead>
                  <TableHead onClick={() => requestAccessRequestSort("role")} className="cursor-pointer">
                    Rol Solicitado
                    {getAccessRequestSortIcon("role")}
                  </TableHead>
                  <TableHead onClick={() => requestAccessRequestSort("status")} className="cursor-pointer">
                    Estado
                    {getAccessRequestSortIcon("status")}
                  </TableHead>
                  <TableHead onClick={() => requestAccessRequestSort("date")} className="cursor-pointer">
                    Fecha Solicitud
                    {getAccessRequestSortIcon("date")}
                  </TableHead>
                  <TableHead className="w-[150px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAccessRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron solicitudes de acceso.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAccessRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <ActionMenu
                          onApprove={() => handleApproveAccessRequest(request)}
                          onReject={() => handleRejectAccessRequest(request)}
                          request={request}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <AccessRequestModal open={isAccessRequestModalOpen} onOpenChange={setIsAccessRequestModalOpen} />
          <ConfirmationDialogForEditor
            open={isAccessRequestApproveConfirmOpen}
            onOpenChange={setIsAccessRequestApproveConfirmOpen}
            onConfirm={confirmApproveAccessRequest}
            title="Confirmar Aprobación de Solicitud"
            description={`¿Estás seguro de que deseas aprobar la solicitud de acceso de "${requestToApprove?.name}"?`}
          />
          <ConfirmationDialogForEditor
            open={isAccessRequestRejectConfirmOpen}
            onOpenChange={setIsAccessRequestRejectConfirmOpen}
            onConfirm={confirmRejectAccessRequest}
            title="Confirmar Rechazo de Solicitud"
            description={`¿Estás seguro de que deseas rechazar la solicitud de acceso de "${requestToReject?.name}"?`}
          />
        </TabsContent>

        {/* Attribute Management Tab */}
        <TabsContent value="attributes" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Gestión de Atributos Personalizados</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nombre del nuevo atributo"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                className="w-64"
              />
              <select
                value={newAttributeType}
                onChange={(e) => setNewAttributeType(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
                <option value="boolean">Booleano</option>
              </select>
              <Button onClick={handleAddAttribute}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Atributo
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar atributo..."
                value={attributeSearchTerm}
                onChange={(e) => setAttributeSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-background pl-8"
              />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestAttributeSort("name")} className="cursor-pointer">
                    Nombre
                    {getAttributeSortIcon("name")}
                  </TableHead>
                  <TableHead onClick={() => requestAttributeSort("type")} className="cursor-pointer">
                    Tipo
                    {getAttributeSortIcon("type")}
                  </TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No se encontraron atributos personalizados.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAttributes.map((attribute) => (
                    <TableRow key={attribute.id}>
                      <TableCell className="font-medium">{attribute.name}</TableCell>
                      <TableCell>{attribute.type}</TableCell>
                      <TableCell>
                        <ActionMenu onDelete={() => handleDeleteAttribute(attribute)} attribute={attribute} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ConfirmationDialogForEditor
            open={isAttributeDeleteConfirmOpen}
            onOpenChange={setIsAttributeDeleteConfirmOpen}
            onConfirm={confirmAttributeDelete}
            title="Confirmar Eliminación de Atributo"
            description={`¿Estás seguro de que deseas eliminar el atributo "${attributeToDelete?.name}"? Esta acción no se puede deshacer.`}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
