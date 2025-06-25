/**
 * Demostración del Sistema de Documentos Adjuntos - GATI-C
 * 
 * Página completa para mostrar todas las funcionalidades del sistema
 * con datos de ejemplo y diferentes roles de usuario
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    User,
    Shield,
    Edit,
    Eye,
    FileText,
    Database,
    Settings
} from 'lucide-react'
import DocumentManager from './document-manager'
import { type DocumentMetadata } from '@/lib/document-storage'

// Datos de ejemplo
const sampleDocuments: DocumentMetadata[] = [
    {
        id: 'doc-1',
        originalFilename: 'Contrato_Compra_Laptops_2024.pdf',
        storedFilename: 'uuid-1.pdf',
        fileType: 'application/pdf',
        fileSize: 2500000, // 2.5MB
        productId: 1,
        uploadedBy: 'admin@cfe.gob.mx',
        uploadedAt: new Date('2024-01-15T10:30:00'),
        isDeleted: false,
        version: 1
    },
    {
        id: 'doc-2',
        originalFilename: 'SISE_Especificaciones_Tecnicas.docx',
        storedFilename: 'uuid-2.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 1800000, // 1.8MB
        productId: 1,
        uploadedBy: 'editor@cfe.gob.mx',
        uploadedAt: new Date('2024-01-20T14:15:00'),
        isDeleted: false,
        version: 2,
        previousVersionId: 'doc-2-v1'
    },
    {
        id: 'doc-3',
        originalFilename: 'Factura_Original_Eliminada.pdf',
        storedFilename: 'uuid-3.pdf',
        fileType: 'application/pdf',
        fileSize: 950000, // 950KB
        productId: 1,
        uploadedBy: 'editor@cfe.gob.mx',
        uploadedAt: new Date('2024-01-10T09:00:00'),
        isDeleted: true,
        deletedAt: new Date('2024-01-25T16:30:00'),
        deletedBy: 'admin@cfe.gob.mx',
        version: 1
    }
]

type UserRole = 'admin' | 'editor' | 'lector'

interface UserProfile {
    id: string
    name: string
    email: string
    role: UserRole
    roleLabel: string
    icon: React.ReactNode
    permissions: string[]
}

const userProfiles: Record<UserRole, UserProfile> = {
    admin: {
        id: 'admin-1',
        name: 'Carlos Administrador',
        email: 'admin@cfe.gob.mx',
        role: 'admin',
        roleLabel: 'Administrador',
        icon: <Shield className="h-4 w-4" />,
        permissions: [
            'Subir documentos',
            'Eliminar documentos',
            'Ver papelera',
            'Restaurar documentos',
            'Gestión completa'
        ]
    },
    editor: {
        id: 'editor-1',
        name: 'María Editora',
        email: 'editor@cfe.gob.mx',
        role: 'editor',
        roleLabel: 'Editor',
        icon: <Edit className="h-4 w-4" />,
        permissions: [
            'Subir documentos',
            'Eliminar documentos',
            'Ver documentos activos',
            'No acceso a papelera'
        ]
    },
    lector: {
        id: 'lector-1',
        name: 'Juan Lector',
        email: 'lector@cfe.gob.mx',
        role: 'lector',
        roleLabel: 'Lector',
        icon: <Eye className="h-4 w-4" />,
        permissions: [
            'Solo lectura de documentos',
            'Sin permisos de upload',
            'Sin permisos de eliminación'
        ]
    }
}

export default function DocumentDemo() {
    const [currentRole, setCurrentRole] = useState<UserRole>('admin')
    const [documents, setDocuments] = useState<DocumentMetadata[]>(sampleDocuments)

    const currentUser = userProfiles[currentRole]

    const handleDocumentChange = (newDocuments: DocumentMetadata[]) => {
        setDocuments(newDocuments)
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-6xl">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    Sistema de Documentos Adjuntos GATI-C
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Demostración completa del sistema de gestión de documentos adjuntos
                    implementado según las especificaciones del PRD de CFE
                </p>
            </div>

            {/* Selector de Rol */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Simulador de Roles de Usuario
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Cambiar rol de usuario para probar permisos:
                            </label>
                            <Select value={currentRole} onValueChange={(value: UserRole) => setCurrentRole(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(userProfiles).map(([role, profile]) => (
                                        <SelectItem key={role} value={role}>
                                            <div className="flex items-center gap-2">
                                                {profile.icon}
                                                <span>{profile.roleLabel}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{currentUser.name}</span>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {currentUser.icon}
                                    {currentUser.roleLabel}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{currentUser.email}</p>

                            <div className="pt-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">Permisos activos:</p>
                                <div className="flex flex-wrap gap-1">
                                    {currentUser.permissions.map((permission, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {permission}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sistema de Documentos */}
            <DocumentManager
                productId={1}
                productName="Laptop Dell Latitude 7420 - Serie: DL7420CFE001"
                userRole={currentRole}
                currentUserId={currentUser.id}
                initialDocuments={documents}
                maxFiles={10}
                onDocumentChange={handleDocumentChange}
            />

            {/* Estado del Sistema */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Estado Actual del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center space-y-2">
                            <div className="text-2xl font-bold text-green-600">
                                {documents.filter(d => !d.isDeleted).length}
                            </div>
                            <p className="text-sm text-muted-foreground">Documentos Activos</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-2xl font-bold text-red-600">
                                {documents.filter(d => d.isDeleted).length}
                            </div>
                            <p className="text-sm text-muted-foreground">En Papelera</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.round(documents.reduce((sum, d) => sum + d.fileSize, 0) / (1024 * 1024) * 100) / 100}MB
                            </div>
                            <p className="text-sm text-muted-foreground">Almacenamiento Total</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Lista completa de documentos:</h4>
                        <div className="space-y-1 text-xs">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <span className={doc.isDeleted ? 'line-through text-gray-500' : ''}>
                                        {doc.originalFilename}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={doc.isDeleted ? 'destructive' : 'default'} className="text-xs">
                                            {doc.isDeleted ? 'Papelera' : 'Activo'}
                                        </Badge>
                                        {doc.version > 1 && (
                                            <Badge variant="secondary" className="text-xs">v{doc.version}</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Especificaciones Técnicas */}
            <Card>
                <CardHeader>
                    <CardTitle>Especificaciones Técnicas del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Funcionalidades Implementadas:</h4>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>✅ Upload drag & drop con validación</li>
                                <li>✅ Tipos de archivo: PDF y DOCX únicamente</li>
                                <li>✅ Límite de 100MB por archivo</li>
                                <li>✅ Sistema de papelera con retención 30 días</li>
                                <li>✅ Versioning automático de documentos</li>
                                <li>✅ Control RBAC por roles (Admin/Editor/Lector)</li>
                                <li>✅ Visualización en nueva pestaña</li>
                                <li>✅ Mensajes de error según PRD</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Cumplimiento PRD:</h4>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>✅ Gestión SISE / Contrato de Compra</li>
                                <li>✅ Múltiples documentos por producto</li>
                                <li>✅ Eliminación a papelera con registro</li>
                                <li>✅ Restauración solo para Administradores</li>
                                <li>✅ Flujo de procesamiento en formulario completo</li>
                                <li>✅ Sobrescritura con backup automático</li>
                                <li>✅ Límites y validaciones específicas</li>
                                <li>✅ Interfaz moderna y fluida</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 