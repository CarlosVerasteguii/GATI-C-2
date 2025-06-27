import { create } from 'zustand'
import { type InventoryItem } from '@/contexts/app-context'

interface ProductSelectionState {
    // Paginación
    currentPage: number
    itemsPerPage: number

    // Producto seleccionado
    selectedProduct: InventoryItem | null

    // Estado de importación
    isLoading: boolean
    importProgress: number
    showImportProgress: boolean

    // Acciones
    setCurrentPage: (page: number) => void
    setItemsPerPage: (count: number) => void
    setSelectedProduct: (product: InventoryItem | null) => void
    setIsLoading: (isLoading: boolean) => void
    setImportProgress: (progress: number) => void
    setShowImportProgress: (show: boolean) => void
    resetImportProgress: () => void
}

export const useProductSelectionStore = create<ProductSelectionState>((set) => ({
    // Estado inicial
    currentPage: 1,
    itemsPerPage: 10,
    selectedProduct: null,
    isLoading: false,
    importProgress: 0,
    showImportProgress: false,

    // Acciones
    setCurrentPage: (page) => set({ currentPage: page }),
    setItemsPerPage: (count) => set({ itemsPerPage: count }),
    setSelectedProduct: (product) => set({ selectedProduct: product }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setImportProgress: (progress) => set({ importProgress: progress }),
    setShowImportProgress: (show) => set({ showImportProgress: show }),
    resetImportProgress: () => set({ importProgress: 0, showImportProgress: false })
})) 