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
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  FileDown,
  PackageMinus,
  Edit,
  Handshake,
  UserCheck,
} from "lucide-react"
import { QuickLoadModal } from "@/components/quick-load-modal"
import { useApp } from "@/contexts/app-context"
import { StatusBadge } from "@/components/status-badge"
import { EditProductModal } from "@/components/edit-product-modal"
import { ConfirmationDialogForEditor } from "@/components/confirmation-dialog-for-editor"
import { useToast } from "@/hooks/use-toast"
import { BulkAssignModal } from "@/components/bulk-assign-modal"
import { BulkLendModal } from "@/components/bulk-lend-modal"
import { BulkRetireModal } from "@/components/bulk-retire-modal"
import { ActionMenu } from "@/components/action-menu"
import { BulkEditModal } from "@/components/bulk-edit-modal"

export default function InventoryPage() {
  const { state, dispatch, addRecentActivity } = useApp()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    estado: "Todos",
    categoria: "Todas",
    marca: "Todas",
  })
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [isQuickLoadModalOpen, setIsQuickLoadModalOpen] = useState(false)
  const [isQuickRetireModalOpen, setIsQuickRetireModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [isBulkLendModalOpen, setIsBulkLendModalOpen] = useState(false)
  const [isBulkRetireModalOpen, setIsBulkRetireModalOpen] = useState(false)
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const handleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]))
  }

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredAndSortedProducts.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(filteredAndSortedProducts.map((p) => p.id))
    }
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (productToDelete) {
      dispatch({ type: "DELETE_PRODUCT", payload: productToDelete.id })
      addRecentActivity({
        type: "Eliminación de Producto",
        description: `Producto ${productToDelete.nombre} (N/S: ${
          productToDelete.numeroSerie || "N/A"
        }) eliminado del inventario.`,
        date: new Date().toLocaleString(),
        details: { productId: productToDelete.id, productName: productToDelete.nombre },
      })
      toast({
        title: "Producto Eliminado",
        description: `El producto ${productToDelete.nombre} ha sido eliminado.`,
      })
      setIsDeleteConfirmOpen(false)
      setProductToDelete(null)
    }
  }

  const handleUpdateProduct = (updatedProduct: any) => {
    dispatch({ type: "UPDATE_PRODUCT", payload: updatedProduct })
    addRecentActivity({
      type: "Actualización de Producto",
      description: `Producto ${updatedProduct.nombre} (N/S: ${updatedProduct.numeroSerie || "N/A"}) actualizado.`,
      date: new Date().toLocaleString(),
      details: { productId: updatedProduct.id, productName: updatedProduct.nombre },
    })
    toast({
      title: "Producto Actualizado",
      description: `El producto ${updatedProduct.nombre} ha sido actualizado.`,
    })
    setIsEditModalOpen(false)
    setSelectedProduct(null)
  }

  const handleBulkAssign = (assignData: {
    productIds: string[]
    assignedTo: string
    assignmentDate: string
  }) => {
    dispatch({ type: "BULK_ASSIGN_PRODUCTS", payload: assignData })
    assignData.productIds.forEach((id) => {
      const product = state.inventoryData.find((p) => p.id === id)
      if (product) {
        addRecentActivity({
          type: "Asignación Masiva",
          description: `Producto ${product.nombre} (N/S: ${
            product.numeroSerie || "N/A"
          }) asignado a ${assignData.assignedTo}.`,
          date: new Date().toLocaleString(),
          details: {
            productId: product.id,
            productName: product.nombre,
            assignedTo: assignData.assignedTo,
          },
        })
      }
    })
    toast({
      title: "Asignación Masiva Exitosa",
      description: `${assignData.productIds.length} productos han sido asignados.`,
    })
    setSelectedProductIds([])
    setIsBulkAssignModalOpen(false)
  }

  const handleBulkLend = (lendData: {
    productIds: string[]
    lentTo: string
    loanDate: string
    returnDate: string
  }) => {
    dispatch({ type: "BULK_LEND_PRODUCTS", payload: lendData })
    lendData.productIds.forEach((id) => {
      const product = state.inventoryData.find((p) => p.id === id)
      if (product) {
        addRecentActivity({
          type: "Préstamo Masivo",
          description: `Producto ${product.nombre} (N/S: ${
            product.numeroSerie || "N/A"
          }) prestado a ${lendData.lentTo}.`,
          date: new Date().toLocaleString(),
          details: {
            productId: product.id,
            productName: product.nombre,
            lentTo: lendData.lentTo,
          },
        })
      }
    })
    toast({
      title: "Préstamo Masivo Exitoso",
      description: `${lendData.productIds.length} productos han sido prestados.`,
    })
    setSelectedProductIds([])
    setIsBulkLendModalOpen(false)
  }

  const handleBulkRetire = (retireData: { productIds: string[]; retirementReason: string }) => {
    dispatch({ type: "BULK_RETIRE_PRODUCTS", payload: retireData })
    retireData.productIds.forEach((id) => {
      const product = state.inventoryData.find((p) => p.id === id)
      if (product) {
        addRecentActivity({
          type: "Retiro Masivo",
          description: `Producto ${product.nombre} (N/S: ${
            product.numeroSerie || "N/A"
          }) retirado por: ${retireData.retirementReason}.`,
          date: new Date().toLocaleString(),
          details: {
            productId: product.id,
            productName: product.nombre,
            reason: retireData.retirementReason,
          },
        })
      }
    })
    toast({
      title: "Retiro Masivo Exitoso",
      description: `${retireData.productIds.length} productos han sido retirados.`,
    })
    setSelectedProductIds([])
    setIsBulkRetireModalOpen(false)
  }

  const handleBulkEdit = (editData: { productIds: string[]; updates: Partial<any> }) => {
    dispatch({ type: "BULK_EDIT_PRODUCTS", payload: editData })
    editData.productIds.forEach((id) => {
      const product = state.inventoryData.find((p) => p.id === id)
      if (product) {
        addRecentActivity({
          type: "Edición Masiva",
          description: `Producto ${product.nombre} (N/S: ${product.numeroSerie || "N/A"}) editado masivamente.`,
          date: new Date().toLocaleString(),
          details: {
            productId: product.id,
            productName: product.nombre,
            updates: editData.updates,
          },
        })
      }
    })
    toast({
      title: "Edición Masiva Exitosa",
      description: `${editData.productIds.length} productos han sido actualizados.`,
    })
    setSelectedProductIds([])
    setIsBulkEditModalOpen(false)
  }

  const filteredProducts = useMemo(() => {
    const filtered = state.inventoryData.filter((product) => {
      const matchesSearch =
        product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.estado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.idContrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesEstado = filters.estado === "Todos" || product.estado === filters.estado
      const matchesCategoria = filters.categoria === "Todas" || product.categoria === filters.categoria
      const matchesMarca = filters.marca === "Todas" || product.marca === filters.marca

      return matchesSearch && matchesEstado && matchesCategoria && matchesMarca
    })

    return filtered
  }, [state.inventoryData, searchTerm, filters])

  const sortedProducts = useMemo(() => {
    if (!sortConfig) {
      return filteredProducts
    }

    const sorted = [...filteredProducts].sort((a, b) => {
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
  }, [filteredProducts, sortConfig])

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

  const allCategories = useMemo(() => {
    const categories = new Set(state.inventoryData.map((p) => p.categoria).filter(Boolean))
    return ["Todas", ...Array.from(categories).sort()]
  }, [state.inventoryData])

  const allBrands = useMemo(() => {
    const brands = new Set(state.inventoryData.map((p) => p.marca).filter(Boolean))
    return ["Todas", ...Array.from(brands).sort()]
  }, [state.inventoryData])

  const allStatuses = useMemo(() => {
    const statuses = new Set(state.inventoryData.map((p) => p.estado).filter(Boolean))
    return ["Todos", ...Array.from(statuses).sort()]
  }, [state.inventoryData])

  const filteredAndSortedProducts = sortedProducts

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="ml-auto" onClick={() => console.log("Import CSV clicked")}>
            <FileDown className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={() => setIsQuickLoadModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Producto
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar productos..."
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
                  {allStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.estado === status}
                      onCheckedChange={() => setFilters({ ...filters, estado: status })}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Categoría</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={filters.categoria === category}
                      onCheckedChange={() => setFilters({ ...filters, categoria: category })}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Marca</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {allBrands.map((brand) => (
                    <DropdownMenuCheckboxItem
                      key={brand}
                      checked={filters.marca === brand}
                      onCheckedChange={() => setFilters({ ...filters, marca: brand })}
                    >
                      {brand}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">{selectedProductIds.length} productos seleccionados</span>
          <Button variant="outline" size="sm" onClick={() => setIsBulkAssignModalOpen(true)} className="ml-auto">
            <UserCheck className="mr-2 h-4 w-4" /> Asignar Masivo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBulkLendModalOpen(true)}>
            <Handshake className="mr-2 h-4 w-4" /> Prestar Masivo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBulkRetireModalOpen(true)}>
            <PackageMinus className="mr-2 h-4 w-4" /> Retirar Masivo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBulkEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar Masivo
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={
                    selectedProductIds.length === filteredAndSortedProducts.length &&
                    filteredAndSortedProducts.length > 0
                  }
                  onChange={handleSelectAllProducts}
                />
              </TableHead>
              <TableHead onClick={() => requestSort("nombre")} className="cursor-pointer">
                Nombre del Producto
                {getSortIcon("nombre")}
              </TableHead>
              <TableHead onClick={() => requestSort("marca")} className="cursor-pointer">
                Marca
                {getSortIcon("marca")}
              </TableHead>
              <TableHead onClick={() => requestSort("modelo")} className="cursor-pointer">
                Modelo
                {getSortIcon("modelo")}
              </TableHead>
              <TableHead onClick={() => requestSort("numeroSerie")} className="cursor-pointer">
                N/S
                {getSortIcon("numeroSerie")}
              </TableHead>
              <TableHead onClick={() => requestSort("categoria")} className="cursor-pointer">
                Categoría
                {getSortIcon("categoria")}
              </TableHead>
              <TableHead onClick={() => requestSort("estado")} className="cursor-pointer">
                Estado
                {getSortIcon("estado")}
              </TableHead>
              <TableHead onClick={() => requestSort("cantidad")} className="cursor-pointer">
                Cantidad
                {getSortIcon("cantidad")}
              </TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.nombre}</TableCell>
                  <TableCell>{product.marca}</TableCell>
                  <TableCell>{product.modelo}</TableCell>
                  <TableCell>{product.numeroSerie || "N/A"}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>
                    <StatusBadge status={product.estado} />
                  </TableCell>
                  <TableCell>{product.cantidad}</TableCell>
                  <TableCell>
                    <ActionMenu
                      onEdit={() => handleEditProduct(product)}
                      onDelete={() => handleDeleteProduct(product)}
                      onAssign={() => {
                        setSelectedProductIds([product.id])
                        setIsBulkAssignModalOpen(true)
                      }}
                      onLend={() => {
                        setSelectedProductIds([product.id])
                        setIsBulkLendModalOpen(true)
                      }}
                      onRetire={() => {
                        setSelectedProductIds([product.id])
                        setIsBulkRetireModalOpen(true)
                      }}
                      product={product}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuickLoadModal open={isQuickLoadModalOpen} onOpenChange={setIsQuickLoadModalOpen} />
      {selectedProduct && (
        <EditProductModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          product={selectedProduct}
          onUpdateProduct={handleUpdateProduct}
        />
      )}
      <ConfirmationDialogForEditor
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        description={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />
      <BulkAssignModal
        open={isBulkAssignModalOpen}
        onOpenChange={setIsBulkAssignModalOpen}
        selectedProducts={selectedProductIds}
        onAssign={handleBulkAssign}
      />
      <BulkLendModal
        open={isBulkLendModalOpen}
        onOpenChange={setIsBulkLendModalOpen}
        selectedProducts={selectedProductIds}
        onLend={handleBulkLend}
      />
      <BulkRetireModal
        open={isBulkRetireModalOpen}
        onOpenChange={setIsBulkRetireModalOpen}
        selectedProducts={selectedProductIds}
        onRetire={handleBulkRetire}
      />
      <BulkEditModal
        open={isBulkEditModalOpen}
        onOpenChange={setIsBulkEditModalOpen}
        selectedProducts={selectedProductIds}
        onBulkEdit={handleBulkEdit}
      />
    </div>
  )
}
