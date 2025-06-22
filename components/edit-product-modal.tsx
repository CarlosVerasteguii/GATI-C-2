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
import { useToast } from "@/hooks/use-toast"
import { Loader2, Edit, HelpCircle } from "lucide-react"
import { useApp } from "@/contexts/app-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BrandCombobox } from "./brand-combobox"

interface EditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any // The product object to edit
  onSuccess: () => void
}

export function EditProductModal({ open, onOpenChange, product, onSuccess }: EditProductModalProps) {
  const { state, addPendingTask, addRecentActivity } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [hasSerialNumber, setHasSerialNumber] = useState(product?.numeroSerie !== null)
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
  })
  const { toast } = useToast()

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
      })
      setHasSerialNumber(product.numeroSerie !== null)
    }
  }, [product])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.productName) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa el nombre del producto.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Prepare updates based on whether it's serialized or not
    const updates = {
      nombre: formData.productName,
      marca: formData.brand,
      modelo: formData.model,
      categoria: formData.category,
      descripcion: formData.description,
      proveedor: formData.proveedor,
      fechaAdquisicion: formData.fechaAdquisicion,
      contratoId: formData.contratoId,
      // Only update quantity/serial if the type (serialized/non-serialized) matches the original
      // Or if the user explicitly changes the serial number toggle and provides valid input
      cantidad: hasSerialNumber ? 1 : Number.parseInt(formData.quantity),
      numeroSerie: hasSerialNumber ? formData.serialNumber : null,
    }

    // Simulate task creation for editing
    setTimeout(() => {
      addPendingTask({
        type: "Edición de Producto",
        creationDate: new Date().toISOString(),
        createdBy: state.user?.nombre || "Usuario Rápido",
        status: "Pendiente",
        details: {
          originalProductId: product.id, // Keep track of the original product ID
          updates: updates,
        },
        auditLog: [
          {
            event: "CREACIÓN",
            user: state.user?.nombre || "Usuario Rápido",
            dateTime: new Date().toISOString(),
            description: `Solicitud de edición para el producto ${product.nombre} (ID: ${product.id}) creada.`,
          },
        ],
      })
      toast({
        title: "Solicitud de Edición Enviada",
        description: "Tu solicitud de edición ha sido enviada para aprobación y procesamiento.",
      })
      addRecentActivity({
        type: "Creación de Tarea",
        description: `Tarea de edición para ${product.nombre} creada por ${state.user?.nombre || "Usuario Rápido"}`,
        date: new Date().toLocaleString(),
        details: {
          productId: product.id,
          productName: product.nombre,
          updates: updates,
          createdBy: state.user?.nombre || "Usuario Rápido",
        },
      })
      setIsLoading(false)
      onOpenChange(false)
      onSuccess() // Notify parent component of success
    }, 1000)
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
          <div className="grid gap-6 py-4">
            {/* Sección: Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2">Información General</h3>
              <div className="space-y-2">
                <Label htmlFor="productName">Nombre del Producto *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => handleInputChange("productName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <BrandCombobox
                  value={formData.brand}
                  onValueChange={(val) => handleInputChange("brand", val)}
                  placeholder="Selecciona o escribe una marca"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" value={formData.model} onChange={(e) => handleInputChange("model", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
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
            </div>

            {/* Sección: Detalles de Adquisición */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2">Detalles de Adquisición</h3>
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  onChange={(e) => handleInputChange("proveedor", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaAdquisicion">Fecha de Adquisición</Label>
                <Input
                  id="fechaAdquisicion"
                  type="date"
                  value={formData.fechaAdquisicion}
                  onChange={(e) => handleInputChange("fechaAdquisicion", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contratoId">SICE / Contrato ID</Label>
                <Input
                  id="contratoId"
                  value={formData.contratoId}
                  onChange={(e) => handleInputChange("contratoId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Sección: Gestión de Cantidad y Número de Serie */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="col-span-full text-lg font-semibold border-b pb-2 mb-2">Cantidad y Número de Serie</h3>
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
              {!hasSerialNumber ? (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    min="1"
                    required
                    disabled={product.numeroSerie !== null} // Disable if it was originally serialized
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="flex items-center gap-1">
                    Número de Serie *
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ingrese el número de serie único para esta unidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                    placeholder="Ingrese el número de serie"
                    required
                    disabled={product.numeroSerie === null && product.cantidad > 1} // Disable if it was originally non-serialized with quantity > 1
                  />
                  {product.numeroSerie === null && product.cantidad > 1 && (
                    <p className="text-sm text-red-500">
                      No se puede asignar un número de serie a un producto no serializado con cantidad mayor a 1.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
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
