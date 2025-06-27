import { useState, useEffect, useRef } from 'react'

/**
 * Hook personalizado para aplicar debounce a actualizaciones de estado en Zustand
 * 
 * @param value Valor inicial
 * @param delay Tiempo de espera en milisegundos
 * @param onChange Función a llamar cuando el valor cambia después del debounce
 * @returns [valor actual (inmediato), función para actualizar el valor]
 */
export function useDebouncedStore<T>(
    value: T,
    delay: number,
    onChange: (value: T) => void
): [T, (newValue: T) => void] {
    // Estado local para actualización inmediata de la UI
    const [localValue, setLocalValue] = useState<T>(value)

    // Referencia para el timeout de debounce
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Actualizar el valor local cuando cambia el valor externo
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Función para actualizar el valor con debounce
    const setValue = (newValue: T) => {
        // Actualizar inmediatamente el valor local para la UI
        setLocalValue(newValue)

        // Limpiar el timeout anterior si existe
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Configurar un nuevo timeout para la actualización real
        timeoutRef.current = setTimeout(() => {
            onChange(newValue)
            timeoutRef.current = null
        }, delay)
    }

    // Limpiar el timeout al desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return [localValue, setValue]
}

/**
 * Hook personalizado para aplicar debounce a un selector de Zustand
 * 
 * @param selector Función selectora de Zustand
 * @param setter Función para actualizar el estado en Zustand
 * @param delay Tiempo de espera en milisegundos
 * @returns [valor actual (inmediato), función para actualizar el valor]
 */
export function useDebouncedSelector<T>(
    selector: () => T,
    setter: (value: T) => void,
    delay: number = 300
): [T, (newValue: T) => void] {
    // Obtener el valor actual del store
    const value = selector()

    // Usar el hook de debounce
    return useDebouncedStore(value, delay, setter)
} 