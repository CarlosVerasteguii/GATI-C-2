# Implementación del Estado de Filtros en GATI-C

## Resumen

Este documento describe la implementación del sistema de filtros avanzados en el módulo de inventario de GATI-C, incluyendo su migración completa a Zustand según lo especificado en el SRS.

## Arquitectura

La implementación sigue una arquitectura basada en Zustand, con múltiples stores especializados que manejan diferentes aspectos del estado de la aplicación:

### Stores Principales

1. **`filter-store.ts`**: Gestiona todo el estado relacionado con filtros:
   - Filtros básicos (búsqueda, categoría, marca, estado)
   - Filtros avanzados (fechas, documentos, estados especiales)
   - Sincronización con URL
   - Persistencia de preferencias

2. **`inventory-table-store.ts`**: Maneja el estado de la tabla de inventario:
   - Ordenamiento (columna y dirección)
   - Selección de filas
   - Estado de formularios específicos

3. **`modals-store.ts`**: Centraliza la gestión de modales y diálogos:
   - Estado de apertura/cierre
   - Modos de modales
   - Datos temporales para modales

4. **`product-selection-store.ts`**: Controla la selección de productos y paginación:
   - Producto seleccionado actualmente
   - Paginación
   - Estado de importación

## Filtros Implementados

### Filtros Básicos
- **Búsqueda de texto**: Busca en nombre, marca, modelo, número de serie, proveedor y ID de contrato
- **Filtro por categoría**: Filtra por categoría de producto
- **Filtro por marca**: Filtra por marca de producto
- **Filtro por estado**: Filtra por estado actual del producto (Disponible, Asignado, etc.)
- **Filtro por número de serie**: Filtra productos con/sin número de serie

### Filtros Avanzados
- **Rango de fechas de adquisición**: Filtra por fecha de compra
- **Estado de documentación**: Filtra productos con/sin documentos adjuntos
- **Estados especiales**: Filtra por condiciones específicas:
  - Equipos críticos (costo > 5000)
  - Próximos a vencer garantía (< 30 días)
  - Sin documentos
  - Adquisición reciente (< 30 días)
- **Rango de valor/costo**: Filtra por rango de precio
- **Ubicación**: Filtra por ubicación física
- **Estado de mantenimiento**: Filtra por condición de mantenimiento

## Sincronización con URL

Para permitir compartir vistas filtradas, todos los filtros se sincronizan con los parámetros de URL:

1. **Serialización**: Los filtros se convierten a parámetros de URL mediante la función `serializeFilters`
2. **Deserialización**: Los parámetros de URL se convierten a estado mediante `deserializeFilters`
3. **Sincronización bidireccional**:
   - Al cambiar filtros, se actualiza la URL
   - Al cargar la página con parámetros, se aplican los filtros correspondientes

## Persistencia de Preferencias

Las preferencias de filtros se guardan para cada usuario:

1. **Almacenamiento**: Las preferencias se guardan en el estado global de la aplicación
2. **Carga automática**: Al iniciar, se cargan las preferencias guardadas
3. **Guardado explícito**: El usuario puede guardar explícitamente sus filtros actuales

## Optimización de Rendimiento

Para garantizar una experiencia fluida, se implementaron varias optimizaciones:

1. **Debounce**: Las entradas de texto y numéricas utilizan debounce para evitar actualizaciones excesivas
2. **Memoización**: Los resultados filtrados se memorizan con `useMemo` para evitar recálculos innecesarios
3. **Selectores**: Se utilizan selectores de Zustand para minimizar re-renderizados

## Migración a Zustand

La implementación original basada en Context API se migró completamente a Zustand siguiendo los requisitos del SRS:

1. **Motivación**:
   - Mejorar rendimiento evitando re-renderizados innecesarios
   - Simplificar el código con una API más limpia
   - Alinearse con los requisitos del SRS

2. **Proceso**:
   - Creación de stores especializados
   - Migración gradual de estados y lógica
   - Actualización de referencias en componentes
   - Pruebas y corrección de errores

3. **Beneficios obtenidos**:
   - Mejor rendimiento y experiencia de usuario
   - Código más mantenible y modular
   - Mejor depuración con Redux DevTools
   - Cumplimiento del SRS

## Uso en Componentes

### Ejemplo de uso básico:

```tsx
// Importar hooks de Zustand
import { useFilterStore } from "@/lib/stores/filter-store"
import { useInventoryTableStore } from "@/lib/stores/inventory-table-store"

function InventoryComponent() {
  // Obtener estado y acciones
  const { 
    searchTerm, 
    filterCategoria,
    setSearchTerm,
    updateAdvancedFilters
  } = useFilterStore()
  
  const {
    sortColumn,
    sortDirection,
    setSortColumn
  } = useInventoryTableStore()
  
  // Usar en componente
  return (
    <div>
      <input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      
      {/* Resto del componente */}
    </div>
  )
}
```

### Ejemplo de uso con selector debounced:

```tsx
import { useDebouncedSelector } from "@/hooks/use-debounced-store"
import { useFilterStore } from "@/lib/stores/filter-store"

function SearchComponent() {
  // Usar selector con debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebouncedSelector(
    () => useFilterStore.getState().searchTerm,
    useFilterStore.getState().setSearchTerm,
    300
  )
  
  return (
    <input 
      value={debouncedSearchTerm} 
      onChange={(e) => setDebouncedSearchTerm(e.target.value)} 
    />
  )
}
```

## Próximos Pasos

1. **Migración completa del AppContext**:
   - Mover gradualmente todo el estado global a stores de Zustand
   - Mantener compatibilidad durante la transición

2. **Implementación de middleware**:
   - Añadir persistencia en localStorage
   - Implementar logging para depuración

3. **Optimización adicional**:
   - Implementar virtualización para grandes conjuntos de datos
   - Refinar selectores para minimizar re-renderizados

4. **Pruebas**:
   - Añadir pruebas unitarias para los stores
   - Verificar el comportamiento correcto en diferentes escenarios

## Referencias

- [Documentación de Zustand](https://github.com/pmndrs/zustand)
- [SRS - GATI-C v2.0](../context-md/Software%20Requirements%20Specification%20(SRS)%20-%20GATI-C%20v2.0%20(Enterprise-Grade).md)
- [Migración a Zustand](./zustand_migration.md)
