'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTodayResults } from '@/hooks/useResults'
import { TIME_SLOTS } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import { Clock, CheckCircle2, Zap, CalendarDays, Timer } from 'lucide-react'

type SlotStatus = 'completed' | 'active' | 'upcoming'

function getSlotStatus(slotHour: number, currentHour: number, hasResult: boolean): SlotStatus {
  // If result is posted, it's completed regardless of time
  if (hasResult) return 'completed'
  // If current hour >= slot hour but < next slot hour, this is active
  if (currentHour >= slotHour) {
    const nextSlot = TIME_SLOTS.find(s => s.hour > slotHour)
    if (!nextSlot || currentHour < nextSlot.hour) {
      return 'active'
    }
    return 'active'
  }
  return 'upcoming'
}

// Countdown hook for active slot
function useSlotCountdown() {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, activeSlotHour: -1 })

  useEffect(() => {
    function calculate() {
      const ist = getClientISTDate()
      const currentHour = ist.hour
      const currentMinute = ist.minute
      const currentSecond = ist.second
      const currentTotalMinutes = currentHour * 60 + currentMinute

      // Find the active slot (the current or most recent slot without result)
      let activeSlotHour = -1
      for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
        if (currentHour >= TIME_SLOTS[i].hour) {
          activeSlotHour = TIME_SLOTS[i].hour
          break
        }
      }
      if (activeSlotHour === -1) {
        activeSlotHour = TIME_SLOTS[0].hour
      }

      // Countdown to the next slot
      let nextSlotHour: number | null = null
      for (const slot of TIME_SLOTS) {
        if (slot.hour * 60 > currentTotalMinutes) {
          nextSlotHour = slot.hour
          break
        }
      }

      if (nextSlotHour !== null) {
        const diffSeconds = (nextSlotHour * 60 - currentTotalMinutes) * 60 - currentSecond
        const hours = Math.floor(diffSeconds / 3600)
        const minutes = Math.floor((diffSeconds % 3600) / 60)
        const seconds = diffSeconds % 60
        setCountdown({ hours, minutes, seconds, activeSlotHour })
      } else {
        // Next slot is tomorrow
        const diffSeconds = ((24 * 60 - currentTotalMinutes + TIME_SLOTS[0].hour * 60) * 60) - currentSecond
        const hours = Math.floor(diffSeconds / 3600)
        const minutes = Math.floor((diffSeconds % 3600) / 60)
        const seconds = diffSeconds % 60
        setCountdown({ hours, minutes, seconds, activeSlotHour: TIME_SLOTS[0].hour })
      }
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [])

  return countdown
}

export function GameSchedule() {
  const { data, isLoading } = useTodayResults()
  const slots = data?.slots ?? []
  const ist = getClientISTDate()
  const currentHour = ist.hour
  const slotCountdown = useSlotCountdown()

  // Determine status for each slot
  const slotStatuses = TIME_SLOTS.map((slotDef, index) => {
    const slotData = slots[index]
    const hasResult =
      slotData &&
      slotData.result !== null &&
      slotData.result !== undefined

    const status = getSlotStatus(slotDef.hour, currentHour, hasResult)
    return { ...slotDef, status, hasResult }
  })

  // Count completed draws
  const completedCount = slotStatuses.filter(s => s.status === 'completed').length
  const totalSlots = TIME_SLOTS.length
  const progressPercent = Math.round((completedCount / totalSlots) * 100)

  // Find active slot for countdown display
  const activeSlot = slotStatuses.find(s => s.status === 'active')

  return (
    <section className="w-full bg-[var(--bg-primary)] py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[var(--card-shadow-lg)] overflow-hidden">
            {/* Header */}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[var(--text-primary)] text-lg sm:text-xl">
                <div className="p-1.5 rounded-lg bg-[var(--accent-blue-subtle)]">
                  <CalendarDays className="size-5 text-[var(--accent-blue)]" />
                </div>
                Game Schedule
              </CardTitle>
              <p className="text-[var(--text-accent)]/70 text-xs sm:text-sm mt-1">
                Daily draw schedule & status
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">
                    Today&apos;s Progress
                  </span>
                  <span className="text-[var(--accent-blue)] text-xs sm:text-sm font-bold">
                    {completedCount} of {totalSlots} draws completed
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[var(--accent-blue)] to-green-500 rounded-full"
                  />
                </div>
                <p className="text-[var(--text-muted)] text-[10px] sm:text-xs mt-1 text-right">
                  {progressPercent}% complete
                </p>
              </div>

              {/* Active slot countdown */}
              {activeSlot && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 bg-[var(--status-active-bg)] border border-[var(--status-active-border)] rounded-lg px-4 py-2.5 flex items-center justify-center gap-2"
                >
                  <Timer className="size-4 text-[var(--status-active-text)]" />
                  <span className="text-[var(--status-active-text)] text-xs sm:text-sm font-medium">
                    Next draw in
                  </span>
                  <span className="text-[var(--text-primary)] font-mono font-bold text-sm sm:text-base">
                    {String(slotCountdown.hours).padStart(2, '0')}:
                    {String(slotCountdown.minutes).padStart(2, '0')}:
                    {String(slotCountdown.seconds).padStart(2, '0')}
                  </span>
                </motion.div>
              )}

              {/* Time Slots Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--accent-blue)] mr-2" />
                  <span className="text-[var(--text-secondary)] text-sm">Loading schedule...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {slotStatuses.map((slot, index) => {
                    const isActive = slot.status === 'active'
                    const isCompleted = slot.status === 'completed'
                    const isUpcoming = slot.status === 'upcoming'

                    return (
                      <motion.div
                        key={slot.index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.06 }}
                        whileHover={{
                          scale: 1.04,
                          boxShadow: isActive
                            ? '0 0 25px var(--accent-blue-border)'
                            : isCompleted
                            ? '0 0 20px rgba(34,197,94,0.2)'
                            : '0 0 15px rgba(100,116,139,0.15)',
                          y: -2,
                        }}
                        className={`relative rounded-lg p-3 sm:p-4 text-center border transition-all cursor-default ${
                          isActive
                            ? 'bg-[var(--status-active-bg)] border-[var(--status-active-border)] shadow-[0_0_20px_var(--accent-blue-border)]'
                            : isCompleted
                            ? 'bg-green-600/10 border-green-500/30'
                            : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)]'
                        }`}
                      >
                        {/* Active pulsing glow */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-lg border-2 border-[var(--status-active-text)]/40 animate-pulse pointer-events-none" />
                        )}

                        {/* Status Dot Indicator */}
                        <div className="mb-2 flex items-center justify-center">
                          {isCompleted ? (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex size-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400" />
                              </span>
                              <div className="p-0.5 rounded-full bg-green-500/20">
                                <CheckCircle2 className="size-4 text-green-500" />
                              </div>
                            </div>
                          ) : isActive ? (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex size-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-active-text)] opacity-75" />
                                <span className="relative inline-flex rounded-full size-2.5 bg-[var(--status-active-text)]" />
                              </span>
                              <div className="p-0.5 rounded-full bg-[var(--status-active-bg)]">
                                <Zap className="size-4 text-[var(--status-active-text)]" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="size-2.5 rounded-full bg-[var(--text-muted)]" />
                              <div className="p-0.5 rounded-full bg-[var(--bg-secondary)]">
                                <Clock className="size-4 text-[var(--text-muted)]" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Time Label */}
                        <p className={`font-bold text-sm sm:text-base ${
                          isActive ? 'text-[var(--status-active-text)]' : isCompleted ? 'text-green-500' : 'text-[var(--text-muted)]'
                        }`}>
                          {slot.label}
                        </p>

                        {/* Status Label */}
                        <p className={`text-[10px] sm:text-xs font-semibold mt-1 uppercase tracking-wider ${
                          isActive ? 'text-[var(--status-active-text)]' : isCompleted ? 'text-green-500' : 'text-[var(--text-muted)]'
                        }`}>
                          {isCompleted ? 'Completed' : isActive ? 'Live Now' : 'Upcoming'}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
