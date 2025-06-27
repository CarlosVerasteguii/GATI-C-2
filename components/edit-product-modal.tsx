"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { showError, showSuccess, showWarning } from "@/hooks/use-toast"
import { Loader2, Edit, HelpCircle, ExternalLink, Trash2 } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BrandCombobox } from "./brand-combobox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface EditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any // The product object to edit
  onSuccess: () => void
}

export function EditProductModal({ open, onOpenChange, product, onSuccess }: EditProductModalProps) {
  const { state, addPendingTask, addRecentActivity, addPendingRequest } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [hasSerialNumber, setHasSerialNumber] = useState(product?.numeroSerie !== null)
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "documents">("basic")
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [formData, setFormData] = useState({
    productName: product?.nombre || "",
    brand: product?.marca || "",
    model: product?.modelo || "",
    category: product?.categoria || "",
    description: product?.descripcion || "",
    proveedor: product?.proveedor || "",
    fechaAdquisicion: product?.fechaAdquisicion || "",
    contratoId: product?.contratoId || "",
    // For serialized items, quantity is always 1, serial number is direct
    // For non-serialized, quantity is editable, serial number is null
    quantity: product?.cantidad?.toString() || "1",
    serialNumber: product?.numeroSerie || "",
    costo: product?.costo?.toString() || "",
    
    // Campos nuevos para garantía
    garantia: product?.garantia || "",
    garantiaFechaInicio: product?.garantiaInfo?.fechaInicio || "",
    garantiaFechaVencimiento: product?.garantiaInfo?.fechaVencimiento || product?.garantia || "",
    garantiaProveedor: product?.garantiaInfo?.proveedor || product?.proveedor || "",
    garantiaNumeroPoliza: product?.garantiaInfo?.numeroPoliza || "",
    
    vidaUtil: product?.vidaUtil || "",
    
    // Campos para criticidad
    esCritico: product?.esCritico || false,
    nivelCriticidad: product?.nivelCriticidad || "Bajo",
    
    // Campos para mantenimiento
    mantenimiento: product?.mantenimiento || "No Aplica",
    ubicacion: product?.ubicacion || "",
    ubicacionId: product?.ubicacionId?.toString() || "",
  })

  // Documentos adjuntos (simulados)
  const [attachedDocuments, setAttachedDocuments] = useState<{ id: string, name: string, url: string, uploadDate: string }[]>(
    product?.documentosAdjuntos?.map((doc: any, index: number) => ({
      id: `doc-${index}`,
      name: doc.name,
      url: doc.url,
      uploadDate: new Date().toISOString().split('T')[0]
    })) || []
  )

  // Update form data when product prop changes (e.g., when a different product is selected for editing)
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.nombre || "",
        brand: product.marca || "",
        model: product.modelo || "",
        category: product.categoria || "",
        description: product.descripcion || "",
        proveedor: product.proveedor || "",
        fechaAdquisicion: product.fechaAdquisicion || "",
        contratoId: product.contratoId || "",
        quantity: product.cantidad?.toString() || "1",
        serialNumber: product.numeroSerie || "",
        costo: product.costo?.toString() || "",
        
        // Campos nuevos para garantía
        garantia: product.garantia || "",
        garantiaFechaInicio: product.garantiaInfo?.fechaInicio || "",
        garantiaFechaVencimiento: product.garantiaInfo?.fechaVencimiento || product.garantia || "",
        garantiaProveedor: product.garantiaInfo?.proveedor || product.proveedor || "",
        garantiaNumeroPoliza: product.garantiaInfo?.numeroPoliza || "",
        
        vidaUtil: product.vidaUtil || "",
        
        // Campos para criticidad
        esCritico: product.esCritico || false,
        nivelCriticidad: product.nivelCriticidad || "Bajo",
        
        // Campos para mantenimiento
        mantenimiento: product.mantenimiento || "No Aplica",
        ubicacion: product.ubicacion || "",
        ubicacionId: product.ubicacionId?.toString() || "",
      })
      setHasSerialNumber(product.numeroSerie !== null)

      // Actualizar documentos adjuntos
      setAttachedDocuments(
        product?.documentosAdjuntos?.map((doc: any, index: number) => ({
          id: doc.id || `doc-${index}`,
          name: doc.name,
          url: doc.url,
          uploadDate: doc.uploadDate || new Date().toISOString().split('T')[0]
        })) || []
      )
    }
  }, [product])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Validación inteligente en tiempo real
    if (field === "serialNumber" && value.trim() && hasSerialNumber) {
      // Verificar si el número de serie ya existe (excluyendo el producto actual)
      const existingProduct = state.inventoryData.find(
        (item) => item.numeroSerie === value.trim() && item.id !== product.id
      )

      if (existingProduct) {
        showWarning({
          title: "Número de serie duplicado",
          description: `Este número ya pertenece a "${existingProduct.nombre}"`
        })
      }
    }

    if (field === "costo" && value) {
      const cost = parseFloat(value)
      if (isNaN(cost) || cost < 0) {
        showWarning({
          title: "Costo inválido",
          description: "El costo debe ser un número positivo"
        })
      }
    }
  }

  const handleFileUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showError({
        title: "Error",
        description: "Seleccione al menos un archivo para subir."
      });
      return;
    }

    // Simulación de subida
    setUploadingFiles(true);

    setTimeout(() => {
      const newDocs = Array.from(selectedFiles).map(file => ({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString().split('T')[0]
      }));

      setAttachedDocuments(prev => [...prev, ...newDocs]);
      setSelectedFiles(null);
      setUploadingFiles(false);

      showSuccess({
        title: "Documentos subidos",
        description: `Se han subido ${newDocs.length} documento(s) correctamente.`
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    // Verificar campos obligatorios independientemente de la pestaña activa
    if (!formData.productName || !formData.brand || !formData.model || !formData.category) {
      // Determinar qué campos están faltando para mostrar un mensaje más específico
      const missingFields = [];
      if (!formData.productName) missingFields.push("Nombre del Producto");
      if (!formData.brand) missingFields.push("Marca");
      if (!formData.model) missingFields.push("Modelo");
      if (!formData.category) missingFields.push("Categoría");

      showError({
        title: "Campos requeridos",
        description: `Por favor, completa los siguientes campos obligatorios: ${missingFields.join(", ")}.`
      });

      // Cambiar a la pestaña básica si hay campos faltantes
      setActiveTab("basic");
      return;
    }

    setIsLoading(true)

    // Validar los formatos de fecha
    const fechasAValidar = [
      { campo: "fechaAdquisicion", valor: formData.fechaAdquisicion, nombre: "Fecha de Adquisición" },
      { campo: "garantiaFechaInicio", valor: formData.garantiaFechaInicio, nombre: "Fecha Inicio Garantía" },
      { campo: "garantiaFechaVencimiento", valor: formData.garantiaFechaVencimiento, nombre: "Fecha Vencimiento Garantía" }
    ];
    
    for (const { campo, valor, nombre } of fechasAValidar) {
      if (valor && !isValidDate(valor)) {
        showError({
          title: "Formato de fecha inválido",
          description: `El campo "${nombre}" debe tener un formato de fecha válido (YYYY-MM-DD).`
        });
        setIsLoading(false);
        return;
      }
    }
    
    // Verificar que la fecha de vencimiento de garantía sea posterior a la fecha de inicio
    if (formData.garantiaFechaInicio && formData.garantiaFechaVencimiento) {
      const inicioDate = new Date(formData.garantiaFechaInicio);
      const vencimientoDate = new Date(formData.garantiaFechaVencimiento);
      
      if (vencimientoDate <= inicioDate) {
        showError({
          title: "Error en fechas de garantía",
          description: "La fecha de vencimiento de garantía debe ser posterior a la fecha de inicio."
        });
        setIsLoading(false);
        return;
      }
    }

    // Prepare updates based on whether it's serialized or not
    const updates = {
      nombre: formData.productName,
      marca: formData.brand,
      modelo: formData.model,
      categoria: formData.category,
      descripcion: formData.description,
      proveedor: formData.proveedor,
      fechaAdquisicion: formData.fechaAdquisicion || undefined,
      contratoId: formData.contratoId || undefined,
      // Only update quantity/serial if the type (serialized/non-serialized) matches the original
      // Or if the user explicitly changes the serial number toggle and provides valid input
      cantidad: hasSerialNumber ? 1 : Number.parseInt(formData.quantity) || 0,
      numeroSerie: hasSerialNumber ? formData.serialNumber : null,
      costo: formData.costo ? parseFloat(formData.costo) : undefined,
      
      // Información de garantía
      garantia: formData.garantiaFechaVencimiento || formData.garantia || undefined, // Para retrocompatibilidad
      garantiaInfo: {
        fechaInicio: formData.garantiaFechaInicio || undefined,
        fechaVencimiento: formData.garantiaFechaVencimiento || formData.garantia || undefined,
        proveedor: formData.garantiaProveedor || undefined,
        numeroPoliza: formData.garantiaNumeroPoliza || undefined,
      },
      
      vidaUtil: formData.vidaUtil || undefined,
      
      // Información de criticidad
      esCritico: formData.esCritico === "true" || formData.esCritico === true || false,
      nivelCriticidad: formData.nivelCriticidad || "Bajo",
      
      // Información de mantenimiento
      mantenimiento: formData.mantenimiento || "No Aplica",
      ubicacion: formData.ubicacion || undefined,
      ubicacionId: formData.ubicacionId ? Number(formData.ubicacionId) : undefined,
      
      documentosAdjuntos: attachedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        uploadDate: doc.uploadDate,
        type: doc.name.split('.').pop() || '',
        size: 0, // No tenemos esta información en la simulación
      })),
    }

    try {
      // Si es un Lector, crear una solicitud de cambio
      if (state.user?.rol === "Lector") {
        // Crear una solicitud pendiente de aprobación
        const request = {
          id: Date.now(),
          type: "Edición de Producto",
          requestedBy: state.user.nombre,
          date: new Date().toISOString().split('T')[0],
          status: "Pendiente",
          details: {
            productId: product.id,
            productName: product.nombre,
            originalData: { ...product },
            updatedData: updates
          }
        }

        addPendingRequest(request)

        showSuccess({
          title: "Solicitud enviada",
          description: "Tu solicitud de edición ha sido enviada para aprobación."
        })

        onOpenChange(false)
        onSuccess()
      } else {
        // Si es Admin o Editor, aplicar cambios directamente
        // Simulate API call / processing
        setTimeout(() => {
          // Add activity record
          addRecentActivity({
            type: "Edición de Producto",
            description: `${state.user?.nombre || "Usuario"} editó el producto "${updates.nombre}"`,
            date: new Date().toISOString()
          })

          showSuccess({
            title: "Producto actualizado",
            description: "Los cambios han sido guardados exitosamente."
          })

          onOpenChange(false)
          onSuccess()
        }, 1000)
      }
    } catch (error) {
      showError({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios."
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Función auxiliar para validar formato de fecha ISO 8601 (YYYY-MM-DD)
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return true; // Campo vacío es válido
    
    // Verificar formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Verificar que sea una fecha válida
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  if (!product) return null

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Producto
            </DialogTitle>
            <DialogDescription>Modifica la información del producto "{product.nombre}".</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "basic" | "details" | "documents")}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="details">Detalles Técnicos</TabsTrigger>
              <TabsTrigger value="documents">Documentación</TabsTrigger>
            </TabsList>

            {/* Pestaña: Información Básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nombre del Producto <span className="text-red-500">*</span></Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange("productName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca <span className="text-red-500">*</span></Label>
                  <BrandCombobox
                    value={formData.brand}
                    onValueChange={(val) => handleInputChange("brand", val)}
                    placeholder="Selecciona o escribe una marca"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo <span className="text-red-500">*</span></Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.categorias.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasSerial"
                      checked={hasSerialNumber}
                      onCheckedChange={setHasSerialNumber}
                      disabled={product.numeroSerie !== null && product.cantidad === 1} // Disable if it's a serialized item that cannot be changed to non-serialized
                    />
                    <Label htmlFor="hasSerial" className="flex items-center gap-1">
                      Este artículo tiene número de serie
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Activa esta opción si cada unidad del producto tiene un número de serie único que debe ser
                            rastreado individualmente.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>

                  {hasSerialNumber ? (
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Número de Serie</Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber}
                        onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                        disabled={product.numeroSerie !== null} // Disable if it's an existing serialized item
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: Detalles Técnicos */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    placeholder="Nombre del proveedor"
                    value={formData.proveedor}
                    onChange={(e) => handleInputChange("proveedor", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaAdquisicion">Fecha de Adquisición</Label>
                  <Input
                    id="fechaAdquisicion"
                    type="date"
                    placeholder="YYYY-MM-DD"
                    value={formData.fechaAdquisicion}
                    onChange={(e) => handleInputChange("fechaAdquisicion", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contratoId">Número de Contrato</Label>
                  <Input
                    id="contratoId"
                    placeholder="Identificador del contrato"
                    value={formData.contratoId}
                    onChange={(e) => handleInputChange("contratoId", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo">Costo de Adquisición</Label>
                  <Input
                    id="costo"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor en pesos"
                    value={formData.costo}
                    onChange={(e) => handleInputChange("costo", e.target.value)}
                  />
                </div>
                
                {/* Información de Garantía */}
                <div className="col-span-2">
                  <div className="mb-2 border-t pt-4">
                    <h3 className="font-medium">Información de Garantía</h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="garantiaFechaInicio">Fecha Inicio Garantía</Label>
                  <Input
                    id="garantiaFechaInicio"
                    type="date"
                    placeholder="YYYY-MM-DD"
                    value={formData.garantiaFechaInicio}
                    onChange={(e) => handleInputChange("garantiaFechaInicio", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="garantiaFechaVencimiento">Fecha Vencimiento Garantía</Label>
                  <Input
                    id="garantiaFechaVencimiento"
                    type="date"
                    placeholder="YYYY-MM-DD"
                    value={formData.garantiaFechaVencimiento}
                    onChange={(e) => handleInputChange("garantiaFechaVencimiento", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="garantiaProveedor">Proveedor de Garantía</Label>
                  <Input
                    id="garantiaProveedor"
                    placeholder="Proveedor que otorga la garantía"
                    value={formData.garantiaProveedor}
                    onChange={(e) => handleInputChange("garantiaProveedor", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="garantiaNumeroPoliza">Número de Póliza</Label>
                  <Input
                    id="garantiaNumeroPoliza"
                    placeholder="Número de póliza o identificador"
                    value={formData.garantiaNumeroPoliza}
                    onChange={(e) => handleInputChange("garantiaNumeroPoliza", e.target.value)}
                  />
                </div>
                
                {/* Información de Criticidad */}
                <div className="col-span-2">
                  <div className="mb-2 border-t pt-4">
                    <h3 className="font-medium">Criticidad del Equipo</h3>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="esCritico"
                    checked={formData.esCritico}
                    onCheckedChange={(checked) => handleInputChange("esCritico", checked.toString())}
                  />
                  <Label htmlFor="esCritico">Equipo Crítico</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Marque esta opción si el equipo es considerado crítico para la operación.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nivelCriticidad">Nivel de Criticidad</Label>
                  <Select 
                    value={formData.nivelCriticidad} 
                    onValueChange={(value) => handleInputChange("nivelCriticidad", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bajo">Bajo</SelectItem>
                      <SelectItem value="Medio">Medio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Crítico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Información de Mantenimiento */}
                <div className="col-span-2">
                  <div className="mb-2 border-t pt-4">
                    <h3 className="font-medium">Estado de Mantenimiento</h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mantenimiento">Estado de Mantenimiento</Label>
                  <Select 
                    value={formData.mantenimiento} 
                    onValueChange={(value) => handleInputChange("mantenimiento", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Requerido">Requiere Mantenimiento</SelectItem>
                      <SelectItem value="Programado">Mantenimiento Programado</SelectItem>
                      <SelectItem value="Al Día">Al Día</SelectItem>
                      <SelectItem value="No Aplica">No Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    placeholder="Ubicación física del equipo"
                    value={formData.ubicacion}
                    onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vidaUtil">Vida Útil Estimada</Label>
                  <Input
                    id="vidaUtil"
                    placeholder="Vida útil estimada (ej. 5 años)"
                    value={formData.vidaUtil}
                    onChange={(e) => handleInputChange("vidaUtil", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña: Documentación */}
            <TabsContent value="documents" className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Documentos Adjuntos</h3>

                {attachedDocuments.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {attachedDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">Ver</a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => setAttachedDocuments(prev => prev.filter(d => d.id !== doc.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">No hay documentos adjuntos para este producto.</p>
                )}

                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      disabled={uploadingFiles}
                    />
                    <Button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!selectedFiles || uploadingFiles}
                      className="whitespace-nowrap"
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Subir"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos permitidos: PDF, DOCX. Tamaño máximo: 100MB.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary hover:bg-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
