import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the provided function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Creates a throttled function that limits how often a function can be called
 * 
 * @param func The function to throttle
 * @param limit The time limit in milliseconds
 * @returns A throttled version of the provided function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      lastRan = Date.now()
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

/**
 * Serializes filter parameters into URL-friendly format
 * 
 * @param filters Object containing filter values
 * @returns Object with URL-friendly string values
 */
export function serializeFilters(filters: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return // Skip null/undefined/empty values
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return // Skip empty arrays

      if (value.every(v => v === null || v === undefined)) return // Skip arrays of null/undefined

      // Handle arrays of primitive values
      if (value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
        result[key] = value.filter(v => v !== null && v !== undefined).join(',')
      }
      // Handle range arrays (e.g. [min, max])
      else if (value.length === 2) {
        const [min, max] = value
        if (min !== null && min !== undefined) result[`${key}Min`] = String(min)
        if (max !== null && max !== undefined) result[`${key}Max`] = String(max)
      }
    }
    // Handle Date objects
    else if (value instanceof Date) {
      result[key] = value.toISOString().split('T')[0] // YYYY-MM-DD format
    }
    // Handle boolean values
    else if (typeof value === 'boolean') {
      result[key] = value ? 'true' : 'false'
    }
    // Handle primitive values
    else if (typeof value === 'string' || typeof value === 'number') {
      result[key] = String(value)
    }
  })

  return result
}

/**
 * Deserializes URL parameters into filter object
 * 
 * @param params URL search params
 * @param filterConfig Configuration describing how to parse each filter
 * @returns Object with parsed filter values
 */
export function deserializeFilters(
  params: URLSearchParams,
  filterConfig: Record<string, { type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'range' }>
): Record<string, any> {
  const result: Record<string, any> = {}

  Object.entries(filterConfig).forEach(([key, config]) => {
    if (config.type === 'range') {
      // Handle range values (e.g. price range [min, max])
      const min = params.get(`${key}Min`)
      const max = params.get(`${key}Max`)

      result[key] = [
        min ? Number(min) : null,
        max ? Number(max) : null
      ]
    }
    else if (config.type === 'array') {
      // Handle array values
      const value = params.get(key)
      result[key] = value ? value.split(',') : []
    }
    else if (config.type === 'date') {
      // Handle date values
      const value = params.get(key)
      result[key] = value ? new Date(value) : null
    }
    else if (config.type === 'boolean') {
      // Handle boolean values
      const value = params.get(key)
      if (value === null) {
        result[key] = null
      } else {
        result[key] = value === 'true'
      }
    }
    else if (config.type === 'number') {
      // Handle number values
      const value = params.get(key)
      result[key] = value !== null ? Number(value) : null
    }
    else {
      // Handle string values
      result[key] = params.get(key) || null
    }
  })

  return result
}

/**
 * Extrae la información de asignación de un elemento de inventario
 * 
 * @param item Elemento de inventario
 * @returns Detalles de asignación (asignadoA y fechaAsignacion)
 */
export function getAssignmentDetails(item: any): { asignadoA: string | null; fechaAsignacion: string | null } {
  // Si el estado no es "Asignado", no hay detalles de asignación
  if (item.estado !== "Asignado") {
    return { asignadoA: null, fechaAsignacion: null }
  }

  // Si hay historial de asignación, obtener la última asignación
  if (item.historialAsignaciones && Array.isArray(item.historialAsignaciones) && item.historialAsignaciones.length > 0) {
    // Ordenar por fecha más reciente
    const sortedHistory = [...item.historialAsignaciones].sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )

    return {
      asignadoA: sortedHistory[0].asignadoA || null,
      fechaAsignacion: sortedHistory[0].fecha || null
    }
  }

  // Si hay información de asignación directa en el objeto
  if (item.asignadoA || item.fechaAsignacion) {
    return {
      asignadoA: item.asignadoA || null,
      fechaAsignacion: item.fechaAsignacion || null
    }
  }

  // Si no hay información de asignación
  return { asignadoA: null, fechaAsignacion: null }
}

/**
 * Obtiene el valor de una columna específica de un elemento de inventario
 * 
 * @param item Elemento de inventario
 * @param columnId Identificador de la columna
 * @returns Valor de la columna para el elemento dado
 */
export function getColumnValue(item: any, columnId: string): any {
  // Columnas especiales que requieren procesamiento adicional
  if (columnId === "asignadoA" || columnId === "fechaAsignacion") {
    const details = getAssignmentDetails(item)
    return details[columnId as keyof typeof details] || ""
  }

  // Columnas con formato de fecha
  if (columnId === "fechaAdquisicion" || columnId === "fechaIngreso") {
    return item[columnId] || ""
  }

  // Columnas numéricas
  if (columnId === "costo" || columnId === "cantidad") {
    return item[columnId] !== undefined ? Number(item[columnId]) : 0
  }

  // Columnas de texto y otras columnas directas
  return item[columnId] !== undefined ? item[columnId] : ""
}
