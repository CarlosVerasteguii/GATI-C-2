import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { serializeFilters, deserializeFilters } from '@/lib/utils'

// Tipos para los filtros
export interface AdvancedFilters {
    fechaDesde: Date | null
    fechaHasta: Date | null
    diasEnOperacion: number | null
    documentos: boolean | null
    estadosEspeciales: string[]
    rangoValor: [number | null, number | null]  // [min, max] para filtrar por costo
    ubicaciones: string[]                      // Filtro por ubicación
    estadoMantenimiento: string | null         // Estado de mantenimiento
}

// Configuración para la deserialización de filtros desde URL
export const advancedFilterConfig = {
    fechaDesde: { type: 'date' as const },
    fechaHasta: { type: 'date' as const },
    diasEnOperacion: { type: 'number' as const },
    documentos: { type: 'boolean' as const },
    estadosEspeciales: { type: 'array' as const },
    rangoValor: { type: 'range' as const },
    ubicaciones: { type: 'array' as const },
    estadoMantenimiento: { type: 'string' as const },
};

// Filtros por defecto
export const defaultAdvancedFilters: AdvancedFilters = {
    fechaDesde: null,
    fechaHasta: null,
    diasEnOperacion: null,
    documentos: null,
    estadosEspeciales: [],
    rangoValor: [null, null],
    ubicaciones: [],
    estadoMantenimiento: null,
};

// Interfaz para la tienda de filtros
interface FilterState {
    // Filtros básicos
    searchTerm: string
    filterCategoria: string
    filterMarca: string
    filterEstado: string
    hasSerialNumber: boolean

    // Filtros avanzados
    advancedFilters: AdvancedFilters
    showAdvancedFilters: boolean

    // Acciones
    setSearchTerm: (term: string) => void
    setFilterCategoria: (categoria: string) => void
    setFilterMarca: (marca: string) => void
    setFilterEstado: (estado: string) => void
    setHasSerialNumber: (has: boolean) => void
    setShowAdvancedFilters: (show: boolean) => void
    updateAdvancedFilters: (updates: Partial<AdvancedFilters>) => void
    resetAdvancedFilters: () => void
    resetAllFilters: () => void

    // Sincronización con URL
    syncWithUrl: (searchParams: URLSearchParams) => void
    getUrlParams: () => Record<string, string>
}

// Crear la tienda Zustand con persistencia
export const useFilterStore = create<FilterState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            searchTerm: '',
            filterCategoria: '',
            filterMarca: '',
            filterEstado: '',
            hasSerialNumber: false,
            advancedFilters: { ...defaultAdvancedFilters },
            showAdvancedFilters: false,

            // Acciones para filtros básicos
            setSearchTerm: (term) => set({ searchTerm: term }),
            setFilterCategoria: (categoria) => set({ filterCategoria: categoria }),
            setFilterMarca: (marca) => set({ filterMarca: marca }),
            setFilterEstado: (estado) => set({ filterEstado: estado }),
            setHasSerialNumber: (has) => set({ hasSerialNumber: has }),
            setShowAdvancedFilters: (show) => set({ showAdvancedFilters: show }),

            // Acciones para filtros avanzados
            updateAdvancedFilters: (updates) => set((state) => ({
                advancedFilters: { ...state.advancedFilters, ...updates }
            })),

            resetAdvancedFilters: () => set({ advancedFilters: { ...defaultAdvancedFilters } }),

            resetAllFilters: () => set({
                searchTerm: '',
                filterCategoria: '',
                filterMarca: '',
                filterEstado: '',
                hasSerialNumber: false,
                advancedFilters: { ...defaultAdvancedFilters }
            }),

            // Sincronización con URL
            syncWithUrl: (searchParams) => {
                // Sincronizar filtros básicos
                const searchTerm = searchParams.get('q') || '';
                const filterCategoria = searchParams.get('categoria') || '';
                const filterMarca = searchParams.get('marca') || '';
                const filterEstado = searchParams.get('estado') || '';
                const hasSerialNumber = searchParams.get('hasSerialNumber') === 'true';

                // Sincronizar filtros avanzados
                const advancedFilters = deserializeFilters(searchParams, advancedFilterConfig);

                set({
                    searchTerm,
                    filterCategoria,
                    filterMarca,
                    filterEstado,
                    hasSerialNumber,
                    advancedFilters: {
                        ...defaultAdvancedFilters,
                        ...advancedFilters
                    }
                });
            },

            getUrlParams: () => {
                const state = get();
                const params: Record<string, string> = {};

                // Añadir filtros básicos
                if (state.searchTerm) params.q = state.searchTerm;
                if (state.filterCategoria) params.categoria = state.filterCategoria;
                if (state.filterMarca) params.marca = state.filterMarca;
                if (state.filterEstado) params.estado = state.filterEstado;
                if (state.hasSerialNumber) params.hasSerialNumber = 'true';

                // Añadir filtros avanzados
                const advancedParams = serializeFilters(state.advancedFilters);
                Object.assign(params, advancedParams);

                return params;
            }
        }),
        {
            name: 'gati-c-filters', // Nombre para localStorage
            partialize: (state) => ({
                // Solo persistir estos campos
                advancedFilters: state.advancedFilters,
                showAdvancedFilters: state.showAdvancedFilters
            })
        }
    )
);

// Hook para manejar la actualización de URL
export function useFilterUrlSync(router: any, pathname: string) {
    const getUrlParams = useFilterStore((state) => state.getUrlParams);
    const syncWithUrl = useFilterStore((state) => state.syncWithUrl);

    // Función para actualizar la URL con los filtros actuales
    const updateUrl = (debounced = false) => {
        const params = getUrlParams();
        const searchParams = new URLSearchParams();

        // Añadir todos los parámetros a la URL
        Object.entries(params).forEach(([key, value]) => {
            searchParams.set(key, value);
        });

        // Construir la URL
        const queryString = searchParams.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // Actualizar la URL sin recargar la página
        if (debounced) {
            // Usar replace para evitar múltiples entradas en el historial durante el debounce
            router.replace(url);
        } else {
            router.push(url);
        }
    };

    return {
        updateUrl,
        syncWithUrl
    };
} 