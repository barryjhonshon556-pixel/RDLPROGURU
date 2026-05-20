'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TIME_SLOTS, SLOT_KEYS, type TimeSlotIndex } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'

// Re-export for convenience
export { TIME_SLOTS, SLOT_KEYS }
export type { TimeSlotIndex }

// Types matching actual API responses - SINGLE NUMBER FORMAT

export interface TodaySlotData {
  time: string
  label: string
  result: number | null
}

export interface TodayResultsResponse {
  date: string
  slots: TodaySlotData[]
}

export interface ChartDayData {
  day: number
  slot1: number | null
  slot2: number | null
  slot3: number | null
  slot4: number | null
  slot5: number | null
  slot6: number | null
}

export interface ChartData {
  id: string
  month: number
  year: number
  visible: boolean
  dayCount: number
  days: ChartDayData[]
}

export interface ChartsResponse {
  charts: ChartData[]
}

export interface SiteSettings {
  site_name: string
  contact_number: string
  notice_text: string
  whatsapp_link: string
  telegram_link: string
  contact_name: string
  marquee_text: string
  banner_text: string
}

export interface AdminSession {
  authenticated: boolean
  admin?: { id: string; username: string }
}

// Admin-specific types
export interface SlotResult {
  slotIndex: TimeSlotIndex
  timeLabel: string
  result: number | null
}

export interface TodayResults {
  date: string
  slots: SlotResult[]
}

// Fetch today's results (react-query version for public components)
export function useTodayResults() {
  return useQuery<TodayResultsResponse>({
    queryKey: ['results', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/results/today')
      if (!res.ok) throw new Error('Failed to fetch today results')
      return res.json()
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

// Fetch charts (react-query version for public components)
export function useCharts(showAll = false) {
  return useQuery<ChartsResponse>({
    queryKey: ['charts', { showAll }],
    queryFn: async () => {
      const url = showAll ? '/api/charts?all=true' : '/api/charts'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch charts')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Fetch site settings
export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })
}

// Fetch admin session status
export function useAdminSession() {
  return useQuery<AdminSession>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return { authenticated: false }
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}

// ===== Admin-specific hooks (useState-based for admin components) =====

/** Get the current time slot based on current hour */
export function getCurrentTimeSlot(): { index: TimeSlotIndex; label: string } {
  const ist = getClientISTDate()
  const hour = ist.hour

  for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
    if (hour >= TIME_SLOTS[i].hour) {
      return { index: (i + 1) as TimeSlotIndex, label: TIME_SLOTS[i].label }
    }
  }

  return { index: 1, label: TIME_SLOTS[0].label }
}

/** Fetch today's results (admin version with slotIndex/timeLabel) */
export function useAdminTodayResults() {
  const [data, setData] = useState<TodayResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/results/today')
      if (!res.ok) throw new Error('Failed to fetch results')
      const json = await res.json()
      // Map API response to admin format
      const mapped: TodayResults = {
        date: json.date,
        slots: TIME_SLOTS.map((slot) => {
          const found = json.slots?.find(
            (s: { slotIndex?: number; time?: string }) =>
              s.slotIndex === slot.index
          )
          return {
            slotIndex: slot.index,
            timeLabel: slot.label,
            result: found?.result ?? null,
          }
        }),
      }
      setData(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return { data, loading, error, refetch: fetchResults }
}

/** Fetch all charts (admin version) */
export function useAdminCharts(showHidden = false) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCharts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/charts?all=${showHidden}`)
      if (!res.ok) throw new Error('Failed to fetch charts')
      const json = await res.json()
      setData(json.charts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [showHidden])

  useEffect(() => {
    fetchCharts()
  }, [fetchCharts])

  return { data, loading, error, refetch: fetchCharts }
}

// ===== Admin API functions =====

/** Post a single result */
export async function postResult(
  timeSlot: TimeSlotIndex,
  result: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/results/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeSlot, result }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to post result')
  return json
}

/** Bulk save results */
export async function bulkSaveResults(
  slots: { slotIndex: TimeSlotIndex; result: number | null }[],
  date?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/results/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots, date }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to save results')
  return json
}

/** Initialize a monthly chart */
export async function initializeChart(
  month: number,
  year: number
): Promise<{ success: boolean; message: string; chartId: string }> {
  const res = await fetch('/api/charts/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to initialize chart')
  return json
}

/** Copy live results to chart day */
export async function copyLiveResults(
  chartId: string,
  day: number
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/charts/copy-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chartId, day }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to copy results')
  return json
}

/** Toggle chart visibility */
export async function toggleChartVisibility(
  chartId: string,
  visible: boolean
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/charts/visibility', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chartId, visible }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to toggle visibility')
  return json
}
