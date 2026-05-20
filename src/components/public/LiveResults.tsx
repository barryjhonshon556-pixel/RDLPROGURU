'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useTodayResults } from '@/hooks/useResults'
import { TIME_SLOTS } from '@/lib/constants'
import { RefreshCw, Clock, CheckCircle2, HourglassIcon } from 'lucide-react'
import { format } from 'date-fns'
import { getClientISTDate } from '@/lib/ist-date'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, nextSlot: '' })

  useEffect(() => {
    function calculateNextSlot() {
      const ist = getClientISTDate()
      const currentHour = ist.hour
      const currentMinute = ist.minute
      const currentTotalMinutes = currentHour * 60 + currentMinute

      let nextSlotHour: number | null = null
      let nextSlotLabel = ''

      for (const slot of TIME_SLOTS) {
        const slotTotalMinutes = slot.hour * 60
        if (slotTotalMinutes > currentTotalMinutes) {
          nextSlotHour = slot.hour
          nextSlotLabel = slot.label
          break
        }
      }

      if (nextSlotHour === null) {
        nextSlotHour = TIME_SLOTS[0].hour
        nextSlotLabel = TIME_SLOTS[0].label
        const minutesUntilMidnight = 24 * 60 - currentTotalMinutes
        const minutesUntilSlot = minutesUntilMidnight + nextSlotHour * 60
        const hours = Math.floor(minutesUntilSlot / 60)
        const minutes = minutesUntilSlot % 60
        setTimeLeft({ hours, minutes, seconds: 59 - ist.second, nextSlot: nextSlotLabel })
        return
      }

      const diffMinutes = nextSlotHour * 60 - currentTotalMinutes
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60

      setTimeLeft({ hours, minutes, seconds: 59 - ist.second, nextSlot: nextSlotLabel })
    }

    calculateNextSlot()
    const interval = setInterval(calculateNextSlot, 1000)
    return () => clearInterval(interval)
  }, [])

  return timeLeft
}

// Number reveal animation component
function AnimatedNumber({ value, hasValue }: { value: string; hasValue: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {hasValue ? (
        <motion.span
          key={value}
          initial={{ scale: 0.3, opacity: 0, rotateY: 90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      ) : (
        <span>{value}</span>
      )}
    </AnimatePresence>
  )
}

export function LiveResults() {
  const { data, isLoading, isError, dataUpdatedAt } = useTodayResults()
  const countdown = useCountdown()

  const ist = getClientISTDate()
  const dateStr = `${String(ist.day).padStart(2, '0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][ist.month - 1]} ${ist.year}`
  const timeStr = `${String(ist.hour % 12 || 12).padStart(2, '0')}:${String(ist.minute).padStart(2, '0')}:${String(ist.second).padStart(2, '0')} ${ist.hour >= 12 ? 'PM' : 'AM'}`
  const lastUpdated = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'hh:mm:ss a') : '--'

  // Determine current active slot index and label
  const currentHour = ist.hour
  let activeSlotIndex = -1
  let currentSlotLabel = ''
  for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
    if (currentHour >= TIME_SLOTS[i].hour) {
      activeSlotIndex = i
      const rawLabel = TIME_SLOTS[i].label
      currentSlotLabel = rawLabel.replace(':00', '').replace(' ', '')
      break
    }
  }
  if (activeSlotIndex === -1) {
    activeSlotIndex = 0
    const rawLabel = TIME_SLOTS[0].label
    currentSlotLabel = rawLabel.replace(':00', '').replace(' ', '')
  }

  // Progress bar calculation
  const filledCount = useMemo(() => {
    if (!data?.slots) return 0
    return data.slots.filter(
      (s) => s.result !== null && s.result !== undefined
    ).length
  }, [data])

  return (
    <section className="w-full bg-[var(--bg-primary)] py-6 sm:py-8 relative overflow-hidden">
      {/* Subtle grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--accent-blue-border) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue-border) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            RDL Pro Matka Results
          </h2>
          <p className="text-sm text-[var(--text-accent)] mt-1">
            {dateStr} | {timeStr}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-[var(--text-secondary)]">
            <RefreshCw className="size-3" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </motion.div>

        {/* Current Time Slot Indicator Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-5"
        >
          <div className="bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-blue-hover)] to-[var(--accent-blue)] rounded-xl px-4 py-3 text-center shadow-lg shadow-[var(--accent-blue)]/20 border border-white/10 relative overflow-hidden">
            {/* Animated pulse background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-current" />
            <div className="flex items-center justify-center gap-2 relative z-10">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-white" />
              </span>
              <span className="text-white font-extrabold text-sm sm:text-base tracking-wide">
                Current RDL PRO {currentSlotLabel}
              </span>
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-white" />
              </span>
            </div>
            <p className="text-blue-100/70 text-[10px] sm:text-xs mt-0.5 relative z-10">
              According to current time slot
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-4"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
            <span>Today&apos;s Progress</span>
            <span className="text-[var(--accent-blue)] font-bold">{filledCount}/6 results posted</span>
          </div>
          <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${(filledCount / 6) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {/* Slot progress dots */}
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            {TIME_SLOTS.map((slot, i) => {
              const slotData = data?.slots?.[i]
              const filled = slotData && slotData.result !== null && slotData.result !== undefined
              return (
                <div key={slot.index} className="flex flex-col items-center gap-0.5">
                  <div className={`w-2 h-2 rounded-full ${filled ? 'bg-green-400' : 'bg-[var(--text-muted)]'}`} />
                  <span className="text-[8px] text-[var(--text-muted)]">{slot.label.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="bg-[var(--bg-card)]/80 backdrop-blur-sm border border-[var(--border-color)] rounded-lg px-4 py-2.5 flex items-center gap-2 sm:gap-3">
            <Clock className="size-4 text-[var(--accent-blue)]" />
            <span className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">Next Draw:</span>
            <span className="text-[var(--accent-blue)] font-bold text-xs sm:text-sm">{countdown.nextSlot}</span>
            <span className="text-[var(--text-primary)] font-mono font-bold text-sm sm:text-base">
              {String(countdown.hours).padStart(2, '0')}:
              {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')}
            </span>
          </div>
        </motion.div>

        {/* Loading State - Shimmer Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="shimmer h-5 w-20 rounded-full" />
                    <div className="shimmer h-4 w-14 rounded" />
                  </div>
                  <div className="flex items-center justify-center my-4">
                    <div className="text-center">
                      <div className="shimmer h-10 w-16 rounded mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            <p>Failed to load results. Retrying...</p>
          </div>
        )}

        {/* Results Grid */}
        {data && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {data.slots.map((slot, index) => {
              const hasResult = slot.result !== null && slot.result !== undefined
              const isWaiting = !hasResult
              const isActive = index === activeSlotIndex
              const resultStr = hasResult ? String(slot.result).padStart(2, '0') : '--'

              return (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card
                    className={`relative rounded-lg overflow-hidden transition-all duration-300 backdrop-blur-md bg-[var(--bg-card)]/70 border ${
                      isActive && isWaiting
                        ? 'border-2 border-[var(--accent-blue)] shadow-[0_0_20px_var(--accent-blue-border)]'
                        : hasResult
                        ? 'border border-green-600/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                        : 'border border-[var(--border-color)]'
                    } ${isActive && isWaiting ? 'animate-pulse-subtle' : ''}`}
                    style={{
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Glassmorphism inner glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue-subtle)] via-transparent to-transparent pointer-events-none" />

                    {/* Active slot pulsing overlay */}
                    {isActive && isWaiting && (
                      <div className="absolute inset-0 rounded-lg pointer-events-none">
                        <div className="absolute inset-0 rounded-lg border-2 border-[var(--accent-blue)] animate-ping-slow opacity-30" />
                      </div>
                    )}

                    <CardContent className="p-4 sm:p-5">
                      {/* CURRENT badge for active slot */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, x: 10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[var(--accent-blue)] text-white text-[8px] sm:text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-lg shadow-[var(--accent-blue)]/30"
                        >
                          <span className="relative flex size-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full size-1.5 bg-white" />
                          </span>
                          CURRENT
                        </motion.div>
                      )}

                      {/* Time slot badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-[var(--slot-badge-bg)] text-[var(--slot-badge-text)] text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full">
                          {slot.label || TIME_SLOTS[index]?.label || `Slot ${index + 1}`}
                        </span>
                        {hasResult ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="size-3.5 text-green-500" />
                            <span className="text-green-500 text-[10px] sm:text-xs font-bold">RESULT</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <HourglassIcon className="size-3.5 text-yellow-500 animate-pulse" />
                            <span className="text-yellow-500 text-[10px] sm:text-xs font-bold animate-pulse">WAITING</span>
                          </div>
                        )}
                      </div>

                      {/* Single Number Display */}
                      <div className="flex items-center justify-center my-4">
                        <div className="text-center">
                          <p className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                            <AnimatedNumber value={resultStr} hasValue={hasResult} />
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes ping-slow {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.02); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 15px var(--accent-blue-border); }
          50% { box-shadow: 0 0 25px var(--accent-blue-border); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        @keyframes shimmer-current {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-current {
          animation: shimmer-current 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
