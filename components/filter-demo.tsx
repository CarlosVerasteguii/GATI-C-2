"use client"

import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFilterStore, useFilterUrlSync } from "@/lib/stores/filter-store"
import { useDebouncedSelector } from "@/hooks/use-debounced-store"

/**
 * Componente de demostración que muestra cómo usar la tienda Zustand para filtros
 */
export function FilterDemo() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Obtener estados y acciones de la tienda Zustand
    const {
        searchTerm,
        filterCategoria,
        advancedFilters,
        setSearchTerm: setStoreSearchTerm,
        setFilterCategoria: setStoreFilterCategoria,
        updateAdvancedFilters,
        resetAllFilters,
        syncWithUrl
    } = useFilterStore()

    // Sincronización con URL
    const { updateUrl } = useFilterUrlSync(router, pathname)

    // Usar debounce para el término de búsqueda
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebouncedSelector(
        () => useFilterStore.getState().searchTerm,
        setStoreSearchTerm,
        300
    )

    // Sincronizar con URL al montar el componente
    useEffect(() => {
        syncWithUrl(searchParams)
    }, [searchParams, syncWithUrl])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Demostración de Filtros con Zustand</CardTitle>
                <CardDescription>
                    Este componente muestra cómo usar la tienda Zustand para gestionar filtros
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Filtros básicos */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Término de búsqueda (con debounce)</Label>
                        <Input
                            type="search"
                            placeholder="Buscar productos..."
                            value={debouncedSearchTerm}
                            onChange={(e) => setDebouncedSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Categoría (sin debounce)</Label>
                        <Input
                            type="text"
                            placeholder="Categoría"
                            value={filterCategoria}
                            onChange={(e) => setStoreFilterCategoria(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fecha mínima</Label>
                        <Input
                            type="date"
                            value={advancedFilters.fechaDesde ? advancedFilters.fechaDesde.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : null
                                updateAdvancedFilters({ fechaDesde: date })
                            }}
                        />
                    </div>
                </div>

                {/* Estado actual de la tienda */}
                <div className="border rounded-md p-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">Estado actual de la tienda Zustand</h3>
                    <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                        {JSON.stringify({
                            searchTerm,
                            filterCategoria,
                            advancedFilters
                        }, null, 2)}
                    </pre>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetAllFilters}>
                    Reiniciar filtros
                </Button>
                <Button onClick={() => updateUrl()}>
                    Actualizar URL
                </Button>
            </CardFooter>
        </Card>
    )
} 