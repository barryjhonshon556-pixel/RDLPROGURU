'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { MONTH_NAMES, TIME_SLOTS, SLOT_KEYS } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import { Calendar, Star, Clock } from 'lucide-react'
import type { ChartData, ChartDayData } from '@/hooks/useResults'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface MobileChartCardsProps {
  chart: ChartData
}

function formatNumber(val: number | null): string {
  if (val === null || val === undefined) return '--'
  return String(val).padStart(2, '0')
}

function hasAnyResult(day: ChartDayData): boolean {
  return SLOT_KEYS.some(
    (sk) => (day[sk.key as keyof ChartDayData] as number | null) !== null
  )
}

function getDayOfWeek(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  return DAY_NAMES[date.getDay()]
}

// Virtualized list component for performance with many days
function VirtualizedDayList({
  days,
  year,
  month,
  isCurrentMonth,
  todayDay,
}: {
  days: ChartDayData[]
  year: number
  month: number
  isCurrentMonth: boolean
  todayDay: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 })
  const ITEM_HEIGHT = 180 // approximate height of each card
  const BUFFER = 3

  const calculateVisibleRange = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
    const end = Math.min(
      days.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER
    )
    setVisibleRange({ start, end })
  }, [days.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    calculateVisibleRange()
    container.addEventListener('scroll', calculateVisibleRange, { passive: true })
    window.addEventListener('resize', calculateVisibleRange)
    return () => {
      container.removeEventListener('scroll', calculateVisibleRange)
      window.removeEventListener('resize', calculateVisibleRange)
    }
  }, [calculateVisibleRange])

  return (
    <div
      ref={containerRef}
      className="max-h-[70vh] overflow-y-auto"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--scrollbar-thumb) var(--scrollbar-track)' }}
    >
      <div style={{ height: days.length * ITEM_HEIGHT, position: 'relative' }}>
        {days.slice(visibleRange.start, visibleRange.end).map((day, i) => {
          const actualIndex = visibleRange.start + i
          const isToday = isCurrentMonth && day.day === todayDay
          const dayOfWeek = getDayOfWeek(year, month, day.day)
          const hasResults = hasAnyResult(day)

          return (
            <div
              key={day.day}
              style={{
                position: 'absolute',
                top: actualIndex * ITEM_HEIGHT,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
              }}
              className="px-3 py-1.5"
            >
              <DayCard
                day={day}
                year={year}
                month={month}
                isToday={isToday}
                dayOfWeek={dayOfWeek}
                hasResults={hasResults}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayCard({
  day,
  year,
  month,
  isToday,
  dayOfWeek,
  hasResults,
}: {
  day: ChartDayData
  year: number
  month: number
  isToday: boolean
  dayOfWeek: string
  hasResults: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg border overflow-hidden ${
        isToday
          ? 'bg-[var(--bg-card-alt)] border-l-4 border-l-[var(--accent-blue)] border-r border-t border-b border-r-[var(--border-color)] border-t-[var(--border-color)] border-b-[var(--border-color)]'
          : 'bg-[var(--bg-card)] border-[var(--border-accent)]'
      }`}
    >
      {/* Day header */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          isToday ? 'bg-[var(--accent-blue-subtle)]' : 'bg-[var(--bg-secondary)]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-[var(--accent-blue)]" />
          <span className="text-[var(--text-primary)] font-bold text-sm">
            {day.day} {dayOfWeek}
          </span>
          {isToday && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-[var(--accent-blue)] text-white text-[9px] font-bold"
            >
              <Star className="size-2 fill-white" />
              TODAY
            </motion.span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          {day.day} {MONTH_NAMES[month]?.slice(0, 3)} {year}
        </span>
      </div>

      {/* Slot rows */}
      {hasResults ? (
        <div className="px-2 py-1 space-y-0.5">
          {SLOT_KEYS.map((sk, idx) => {
            const val = day[sk.key as keyof ChartDayData] as number | null
            const hasVal = val !== null && val !== undefined

            return (
              <div
                key={sk.index}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                  hasVal
                    ? 'bg-green-500/[0.06]'
                    : ''
                }`}
              >
                {/* Slot label */}
                <div className="flex items-center gap-1.5 min-w-[70px]">
                  <Clock className="size-3 text-[var(--accent-blue)]/60" />
                  <span className="text-[var(--accent-blue)] font-medium">
                    {TIME_SLOTS[idx]?.label.replace(':00 ', '') || `${sk.index * 2 + 10}PM`}
                  </span>
                </div>

                {/* Single result number */}
                <span
                  className={`font-mono font-bold text-sm ${
                    hasVal ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {formatNumber(val)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="px-3 py-4 text-center">
          <span className="text-[var(--text-muted)] text-xs">No results</span>
        </div>
      )}
    </motion.div>
  )
}

export function MobileChartCards({ chart }: MobileChartCardsProps) {
  const monthName = MONTH_NAMES[chart.month] || `Month ${chart.month}`
  const title = `${monthName} MONTH CHART`

  // Determine today's day for highlighting
  const ist = getClientISTDate()
  const isCurrentMonth =
    chart.month === ist.month && chart.year === ist.year
  const todayDay = ist.day

  // Filter days for current month: only show up to today
  const filteredDays = chart.days.filter(
    (d) => !isCurrentMonth || d.day <= todayDay
  )

  // A month has at most 31 rows, so a normal list is fast enough on mobile.
  // This avoids fixed-height virtualization clipping slot5/slot6 on some devices.
  const useVirtualization = false

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg overflow-hidden">
        {/* Blue header bar with month name */}
        <div className="bg-gradient-to-r from-[#0055dd] via-[#0066ff] to-[#0055dd] px-4 py-2.5">
          <h3 className="text-white font-bold text-center text-sm tracking-wide">
            {title}
          </h3>
        </div>

        {/* Card list */}
        <div className="py-2">
          {useVirtualization ? (
            <VirtualizedDayList
              days={filteredDays}
              year={chart.year}
              month={chart.month}
              isCurrentMonth={isCurrentMonth}
              todayDay={todayDay}
            />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto space-y-0">
              {filteredDays.map((day) => {
                const isToday = isCurrentMonth && day.day === todayDay
                const dayOfWeek = getDayOfWeek(chart.year, chart.month, day.day)
                const hasResults = hasAnyResult(day)

                return (
                  <div key={day.day} className="px-3 py-1.5">
                    <DayCard
                      day={day}
                      year={chart.year}
                      month={chart.month}
                      isToday={isToday}
                      dayOfWeek={dayOfWeek}
                      hasResults={hasResults}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {filteredDays.length === 0 && (
            <div className="text-center text-[var(--text-muted)] py-8 text-sm">
              No data available for this month
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
