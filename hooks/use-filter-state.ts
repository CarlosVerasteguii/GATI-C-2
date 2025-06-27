import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/app-context'
import { serializeFilters, deserializeFilters, debounce } from '@/lib/utils'

/**
 * Custom hook for managing filter state with URL synchronization and user preferences
 * 
 * @param pageId Identifier for the page (used for storing user preferences)
 * @param defaultFilters Default filter values
 * @param filterConfig Configuration for deserializing URL parameters
 * @param debounceMs Debounce time in milliseconds for URL updates (default: 500ms)
 * @returns Object containing filter state and utility functions
 */
export function useFilterState<T extends Record<string, any>>(
    pageId: string,
    defaultFilters: T,
    filterConfig: Record<string, { type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'range' }>,
    debounceMs: number = 500
) {
    const { state, updateUserFilterPreferences } = useApp()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize filters from URL parameters or user preferences or defaults
    const [filters, setFilters] = useState<T>(() => {
        // First try to get filters from URL parameters
        if (searchParams.size > 0) {
            return {
                ...defaultFilters,
                ...deserializeFilters(searchParams, filterConfig)
            } as T
        }

        // Then try to get filters from user preferences
        const userId = state.user?.id
        if (userId && state.userFilterPreferences) {
            const userPrefs = state.userFilterPreferences.find(pref =>
                pref.userId === userId && pref.pageId === pageId
            )

            if (userPrefs?.filters) {
                return {
                    ...defaultFilters,
                    ...userPrefs.filters
                } as T
            }
        }

        // Fall back to default filters
        return defaultFilters
    })

    // Update URL when filters change
    const updateUrl = useCallback(
        debounce((newFilters: T) => {
            const serialized = serializeFilters(newFilters)

            // Create new URLSearchParams object
            const params = new URLSearchParams()

            // Add all serialized filter parameters
            Object.entries(serialized).forEach(([key, value]) => {
                params.set(key, value)
            })

            // Update URL without refreshing the page
            const queryString = params.toString()
            const url = queryString ? `/${pageId}?${queryString}` : `/${pageId}`
            router.push(url)
        }, debounceMs),
        [router, pageId, debounceMs]
    )

    // Update user preferences when filters change
    const saveUserPreferences = useCallback(
        debounce((newFilters: T) => {
            const userId = state.user?.id
            if (!userId) return

            updateUserFilterPreferences(userId, pageId, newFilters)
        }, 1000), // Save preferences with a longer debounce
        [state.user?.id, pageId, updateUserFilterPreferences]
    )

    // Update filters with automatic URL and preference synchronization
    const updateFilters = useCallback((newFilters: Partial<T> | ((prev: T) => T)) => {
        setFilters(prev => {
            const updated = typeof newFilters === 'function'
                ? newFilters(prev)
                : { ...prev, ...newFilters }

            // Update URL and save user preferences
            updateUrl(updated)
            saveUserPreferences(updated)

            return updated
        })
    }, [updateUrl, saveUserPreferences])

    // Reset filters to defaults
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters)

        // Clear URL parameters and user preferences
        router.push(`/${pageId}`)

        const userId = state.user?.id
        if (userId) {
            updateUserFilterPreferences(userId, pageId, defaultFilters)
        }
    }, [defaultFilters, pageId, router, state.user?.id, updateUserFilterPreferences])

    return {
        filters,
        updateFilters,
        resetFilters
    }
} 