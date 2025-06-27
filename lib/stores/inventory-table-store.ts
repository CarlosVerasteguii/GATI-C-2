import { create } from 'zustand'

interface InventoryTableState {
    // Variables de formulario
    tempMarca: string
    activeFormTab: 'basic' | 'details' | 'documents'
    processingTaskId: number | null

    // Variables de ordenamiento
    sortColumn: string | null
    sortDirection: 'asc' | 'desc'

    // Variables de selección
    selectedRowIds: number[]

    // Variables de modales específicos
    isMaintenanceModalOpen: boolean
    maintenanceDetails: {
        productId: number | null
        provider: string
        notes: string
    }

    // Variables de documentos
    selectedFiles: FileList | null
    uploadingFiles: boolean
    attachedDocuments: Array<{
        id: string
        name: string
        url: string
    }>

    // Variables para retiro de productos
    retirementDetails: {
        reason: string
        method: string
        notes: string
        date: string
    }

    // Acciones
    setTempMarca: (marca: string) => void
    setActiveFormTab: (tab: 'basic' | 'details' | 'documents') => void
    setProcessingTaskId: (id: number | null) => void
    setSortColumn: (columnId: string | null) => void
    setSortDirection: (direction: 'asc' | 'desc') => void
    setSelectedRowIds: (ids: number[]) => void
    toggleRowSelection: (id: number, selected: boolean) => void
    selectAllRows: (ids: number[]) => void
    clearRowSelection: () => void
    setIsMaintenanceModalOpen: (isOpen: boolean) => void
    setMaintenanceDetails: (details: Partial<InventoryTableState['maintenanceDetails']>) => void
    setSelectedFiles: (files: FileList | null) => void
    setUploadingFiles: (uploading: boolean) => void
    setAttachedDocuments: (setter: (prev: InventoryTableState['attachedDocuments']) => InventoryTableState['attachedDocuments']) => void
    setRetirementDetails: (details: Partial<InventoryTableState['retirementDetails']>) => void
    resetRetirementDetails: () => void
}

export const useInventoryTableStore = create<InventoryTableState>((set) => ({
    // Estado inicial
    tempMarca: '',
    activeFormTab: 'basic',
    processingTaskId: null,
    sortColumn: null,
    sortDirection: 'asc',
    selectedRowIds: [],
    isMaintenanceModalOpen: false,
    maintenanceDetails: {
        productId: null,
        provider: '',
        notes: ''
    },
    selectedFiles: null,
    uploadingFiles: false,
    attachedDocuments: [],
    retirementDetails: {
        reason: '',
        method: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    },

    // Acciones
    setTempMarca: (marca) => set({ tempMarca: marca }),

    setActiveFormTab: (tab) => set({ activeFormTab: tab }),

    setProcessingTaskId: (id) => set({ processingTaskId: id }),

    setSortColumn: (columnId) => set((state) => ({
        sortColumn: columnId,
        // Si se cambia la columna, resetear la dirección a 'asc'
        sortDirection: state.sortColumn === columnId ? state.sortDirection : 'asc'
    })),

    setSortDirection: (direction) => set({ sortDirection: direction }),

    setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),

    toggleRowSelection: (id, selected) => set((state) => ({
        selectedRowIds: selected
            ? [...state.selectedRowIds, id]
            : state.selectedRowIds.filter((rowId) => rowId !== id)
    })),

    selectAllRows: (ids) => set({ selectedRowIds: ids }),

    clearRowSelection: () => set({ selectedRowIds: [] }),

    setIsMaintenanceModalOpen: (isOpen) => set({ isMaintenanceModalOpen: isOpen }),

    setMaintenanceDetails: (details) => set((state) => ({
        maintenanceDetails: { ...state.maintenanceDetails, ...details }
    })),

    setSelectedFiles: (files) => set({ selectedFiles: files }),

    setUploadingFiles: (uploading) => set({ uploadingFiles: uploading }),

    setAttachedDocuments: (setter) => set((state) => ({
        attachedDocuments: setter(state.attachedDocuments)
    })),

    setRetirementDetails: (details) => set((state) => ({
        retirementDetails: { ...state.retirementDetails, ...details }
    })),

    resetRetirementDetails: () => set({
        retirementDetails: {
            reason: '',
            method: '',
            notes: '',
            date: new Date().toISOString().split('T')[0]
        }
    })
})) 