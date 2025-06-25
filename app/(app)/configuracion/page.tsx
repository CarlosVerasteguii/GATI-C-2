"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, PlusCircle } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { showError, showSuccess, showInfo } from "@/hooks/use-toast"
import { StatusBadge } from "@/components/status-badge"

export default function ConfiguracionPage() {
  const { state, addRecentActivity, updateSolicitudStatus, addUserToUsersData } = useApp()
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [accessRequestSearchTerm, setAccessRequestSearchTerm] = useState("")

  const handleApproveRequest = (request: any) => {
    // ✅ CORREGIDO: Actualizar estado de la solicitud a "Aprobada"
    updateSolicitudStatus(request.id, "Aprobada")

    // ✅ Crear nuevo usuario basado en la solicitud aprobada
    const newUser = {
      id: Math.floor(Math.random() * 100000),
      nombre: request.nombre,
      email: request.email,
      password: request.password, // Usar la contraseña que definió el usuario
      rol: "Lector" as const, // Rol por defecto para nuevos usuarios
    }

    // ✅ Agregar el usuario a la lista de usuarios
    addUserToUsersData(newUser)

    showSuccess({
      title: "✅ Solicitud Aprobada",
      description: `${request.nombre} ha sido agregado como usuario con rol Lector. Ya puede iniciar sesión.`,
    })

    addRecentActivity({
      type: "Aprobación de Solicitud",
      description: `Solicitud de acceso de ${request.nombre} aprobada y usuario creado`,
      date: new Date().toLocaleString(),
      details: {
        requestId: request.id,
        requestName: request.nombre,
        newUserId: newUser.id,
        userRole: newUser.rol,
        email: request.email
      },
    })
  }

  const handleRejectRequest = (request: any) => {
    // ✅ CORREGIDO: Actualizar estado de la solicitud a "Rechazada"
    updateSolicitudStatus(request.id, "Rechazada")

    showError({
      title: "❌ Solicitud Rechazada",
      description: `La solicitud de acceso de ${request.nombre} ha sido rechazada definitivamente.`,
    })

    addRecentActivity({
      type: "Rechazo de Solicitud",
      description: `Solicitud de acceso de ${request.nombre} rechazada`,
      date: new Date().toLocaleString(),
      details: {
        requestId: request.id,
        requestName: request.nombre,
        email: request.email,
        justification: request.justificacion
      },
    })
  }

  // Filter users safely
  const filteredUsers = (state.usersData || []).filter((user) => {
    return (
      user.nombre?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.rol?.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
  })

  // Filter access requests safely
  const filteredAccessRequests = (state.solicitudesAcceso || []).filter((request) => {
    return (
      request.nombre?.toLowerCase().includes(accessRequestSearchTerm.toLowerCase()) ||
      request.email?.toLowerCase().includes(accessRequestSearchTerm.toLowerCase()) ||
      request.justificacion?.toLowerCase().includes(accessRequestSearchTerm.toLowerCase())
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuarios ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="access-requests">
            Solicitudes de Acceso ({state.solicitudesAcceso?.filter(r => r.estado === "Pendiente")?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            <Button onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}>
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
                className="pl-8"
              />
            </div>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.rol} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Access Requests Tab */}
        <TabsContent value="access-requests" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Solicitudes de Acceso</h2>
            <div className="text-sm text-muted-foreground">
              Total: {state.solicitudesAcceso?.length || 0} |
              Pendientes: {state.solicitudesAcceso?.filter(r => r.estado === "Pendiente")?.length || 0}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar solicitud..."
                value={accessRequestSearchTerm}
                onChange={(e) => setAccessRequestSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Justificación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccessRequests.length > 0 ? (
                  filteredAccessRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.nombre}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell className="max-w-xs truncate" title={request.justificacion}>
                        {request.justificacion}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.estado} />
                      </TableCell>
                      <TableCell>{request.fecha}</TableCell>
                      <TableCell>
                        {request.estado === "Pendiente" ? (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              onClick={() => handleApproveRequest(request)}
                            >
                              ✅ Aprobar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                              onClick={() => handleRejectRequest(request)}
                            >
                              ❌ Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-sm font-medium ${request.estado === "Aprobada" ? "text-green-600" : "text-red-600"
                            }`}>
                            {request.estado === "Aprobada" ? "✅ Aprobada" : "❌ Rechazada"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {state.solicitudesAcceso?.length === 0
                        ? "📭 No hay solicitudes de acceso aún"
                        : "🔍 No se encontraron solicitudes que coincidan con la búsqueda"
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Configuración del Sistema</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-md p-6">
              <h3 className="font-semibold mb-4">Categorías ({state.categorias?.length || 0})</h3>
              <div className="space-y-2">
                {(state.categorias || []).map((categoria, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{categoria}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}
                    >
                      Editar
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Categoría
                </Button>
              </div>
            </div>

            <div className="border rounded-md p-6">
              <h3 className="font-semibold mb-4">Marcas ({state.marcas?.length || 0})</h3>
              <div className="space-y-2">
                {(state.marcas || []).map((marca, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{marca}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}
                    >
                      Editar
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => showInfo({ title: "Próximamente", description: "Funcionalidad en desarrollo" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Marca
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
