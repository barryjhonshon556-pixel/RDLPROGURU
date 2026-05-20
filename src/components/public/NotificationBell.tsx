'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Clock } from 'lucide-react'
import { useTodayResults, TIME_SLOTS } from '@/hooks/useResults'
import { MONTH_NAMES } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'

interface NotificationItem {
  slotIndex: number
  timeLabel: string
  result: number | null
  timestamp: string
}

const STORAGE_KEY = 'rdl-last-seen-results'

function getLastSeenResults(): Record<string, number | null> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveLastSeenResults(results: Record<string, number | null>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch {
    // localStorage might be full or unavailable
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [markedRead, setMarkedRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: results } = useTodayResults()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Check for new results and compute notifications
  const checkForNewResults = useCallback(() => {
    if (!results?.slots) return

    const lastSeen = getLastSeenResults()
    const newNotifications: NotificationItem[] = []
    const currentResults: Record<string, number | null> = {}
    let newCount = 0

    results.slots.forEach((slot, index) => {
      const key = `slot-${index}`
      const hasResult = slot.result !== null && slot.result !== undefined
      const timeSlot = TIME_SLOTS[index]

      currentResults[key] = slot.result ?? null

      // Check if this is a new or updated result compared to last seen
      const prev = lastSeen[key]
      if (hasResult) {
        const isNew = prev === null || prev === undefined || prev !== slot.result

        if (isNew) {
          newCount++
          newNotifications.push({
            slotIndex: index,
            timeLabel: timeSlot?.label || slot.label || '',
            result: slot.result,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        }
      }
    })

    setNotifications(newNotifications)
    if (!markedRead) {
      setUnreadCount(newCount)
    }
  }, [results, markedRead])

  // Initial check + periodic refresh
  useEffect(() => {
    checkForNewResults()
  }, [checkForNewResults])

  // Auto-refresh every 30 seconds (aligned with useTodayResults refetch)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewResults()
    }, 30000)
    return () => clearInterval(interval)
  }, [checkForNewResults])

  // Save current results as "last seen" when marking as read
  const handleMarkAllRead = useCallback(() => {
    if (!results?.slots) return

    const currentResults: Record<string, number | null> = {}
    results.slots.forEach((slot, index) => {
      const key = `slot-${index}`
      currentResults[key] = slot.result ?? null
    })

    saveLastSeenResults(currentResults)
    setUnreadCount(0)
    setMarkedRead(true)
  }, [results])

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const ist = getClientISTDate()
  const dateStr = `${MONTH_NAMES[ist.month]} ${ist.day}, ${ist.year}`

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1, boxShadow: '0 0 15px var(--accent-blue-border)' }}
        whileTap={{ scale: 0.9 }}
        className="relative flex items-center justify-center size-8 rounded-full bg-[var(--toggle-bg)] backdrop-blur-sm border border-[var(--toggle-border)] hover:bg-[var(--toggle-hover)] transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title="Result notifications"
      >
        <Bell className="size-4 text-white/80" />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute -top-1 -right-1 size-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none px-0.5"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-10 z-50 w-72 sm:w-80 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card-alt)]">
              <div className="flex items-center gap-2">
                <Bell className="size-3.5 text-[var(--accent-blue)]" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Result Updates</h4>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] transition-colors cursor-pointer font-medium"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Date Label */}
            <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-input)]">
              <p className="text-xs text-[var(--text-muted)] font-medium">
                📅 {dateStr}
              </p>
            </div>

            {/* Notification List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="size-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[var(--text-muted)]">No new results yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 opacity-70">Notifications will appear when results are posted</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notif, index) => (
                    <motion.div
                      key={`notif-${notif.slotIndex}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-card-alt)] transition-colors"
                    >
                      {/* Status Icon */}
                      <div className="size-7 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3.5 text-green-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {notif.timeLabel}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {notif.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {notif.result !== null ? String(notif.result).padStart(2, '0') : '--'}
                          </span>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!markedRead && (
                        <div className="size-2 rounded-full bg-red-500 shrink-0 mt-2" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[var(--border-color)] bg-[var(--bg-card-alt)]">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <Clock className="size-3" />
                <span>Auto-refreshes every 30s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
