import { create } from 'zustand'

interface PendingActionDetails {
    type: string
    productData?: any
    originalProductId?: number
    productId?: number
    productName?: string
    productSerialNumber?: string | null
}

interface ModalsState {
    // Estado de modales
    isAddProductModalOpen: boolean
    isImportModalOpen: boolean
    isDetailSheetOpen: boolean
    isConfirmDialogOpen: boolean
    isConfirmEditorOpen: boolean
    isAssignModalOpen: boolean
    isLendModalOpen: boolean
    isQuickLoadModalOpen: boolean
    isQuickRetireModalOpen: boolean

    // Datos para modales
    modalMode: "add" | "edit" | "duplicate" | "process-carga"
    pendingActionDetails: PendingActionDetails | null

    // Acciones para modales
    setIsAddProductModalOpen: (isOpen: boolean) => void
    setIsImportModalOpen: (isOpen: boolean) => void
    setIsDetailSheetOpen: (isOpen: boolean) => void
    setIsConfirmDialogOpen: (isOpen: boolean) => void
    setIsConfirmEditorOpen: (isOpen: boolean) => void
    setIsAssignModalOpen: (isOpen: boolean) => void
    setIsLendModalOpen: (isOpen: boolean) => void
    setIsQuickLoadModalOpen: (isOpen: boolean) => void
    setIsQuickRetireModalOpen: (isOpen: boolean) => void
    setModalMode: (mode: "add" | "edit" | "duplicate" | "process-carga") => void
    setPendingActionDetails: (details: PendingActionDetails | null) => void
    resetModals: () => void
}

export const useModalsStore = create<ModalsState>((set) => ({
    // Estado inicial
    isAddProductModalOpen: false,
    isImportModalOpen: false,
    isDetailSheetOpen: false,
    isConfirmDialogOpen: false,
    isConfirmEditorOpen: false,
    isAssignModalOpen: false,
    isLendModalOpen: false,
    isQuickLoadModalOpen: false,
    isQuickRetireModalOpen: false,
    modalMode: "add",
    pendingActionDetails: null,

    // Acciones
    setIsAddProductModalOpen: (isOpen) => set({ isAddProductModalOpen: isOpen }),
    setIsImportModalOpen: (isOpen) => set({ isImportModalOpen: isOpen }),
    setIsDetailSheetOpen: (isOpen) => set({ isDetailSheetOpen: isOpen }),
    setIsConfirmDialogOpen: (isOpen) => set({ isConfirmDialogOpen: isOpen }),
    setIsConfirmEditorOpen: (isOpen) => set({ isConfirmEditorOpen: isOpen }),
    setIsAssignModalOpen: (isOpen) => set({ isAssignModalOpen: isOpen }),
    setIsLendModalOpen: (isOpen) => set({ isLendModalOpen: isOpen }),
    setIsQuickLoadModalOpen: (isOpen) => set({ isQuickLoadModalOpen: isOpen }),
    setIsQuickRetireModalOpen: (isOpen) => set({ isQuickRetireModalOpen: isOpen }),
    setModalMode: (mode) => set({ modalMode: mode }),
    setPendingActionDetails: (details) => set({ pendingActionDetails: details }),

    resetModals: () => set({
        isAddProductModalOpen: false,
        isImportModalOpen: false,
        isDetailSheetOpen: false,
        isConfirmDialogOpen: false,
        isConfirmEditorOpen: false,
        isAssignModalOpen: false,
        isLendModalOpen: false,
        isQuickLoadModalOpen: false,
        isQuickRetireModalOpen: false,
        pendingActionDetails: null
    })
})) 