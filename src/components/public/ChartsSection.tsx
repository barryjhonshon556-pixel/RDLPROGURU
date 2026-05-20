'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MonthlyChartTable } from './MonthlyChartTable'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react'
import { MONTH_NAMES } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import type { ChartData } from '@/hooks/useResults'

function ChartSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]">
      {/* Blue header bar */}
      <div className="shimmer h-10 w-full" />
      {/* Yellow sub-header row */}
      <div className="shimmer h-8 w-full opacity-50" />
      {/* Data rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border-color)]"
        >
          {/* Date column */}
          <div className="shimmer h-4 w-10 rounded flex-shrink-0" />
          {/* Slot columns */}
          <div className="flex gap-2 flex-1">
            {Array.from({ length: 6 }).map((_, j) => (
              <div
                key={j}
                className="shimmer h-4 rounded flex-1"
                style={{ width: `${50 + ((i * 6 + j) % 3) * 15}%`, maxWidth: '80px' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatMonthLabel(month: number, year: number): string {
  const name = MONTH_NAMES[month] || `Month ${month}`
  return `${name} ${year}`
}

function formatShortMonthLabel(month: number, year: number): string {
  const name = MONTH_NAMES[month] || `M${month}`
  return `${name.slice(0, 3)} ${year}`
}

export function ChartsSection() {
  const { data, isLoading, isError } = useQuery<ChartData[]>({
    queryKey: ['charts'],
    queryFn: async () => {
      const res = await fetch('/api/charts')
      if (!res.ok) throw new Error('Failed to fetch charts')
      const json = await res.json()
      // API returns array directly
      return Array.isArray(json) ? json : json.charts || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Sort charts in chronological order (oldest first) for navigation
  const sortedCharts = useMemo(
    () =>
      data
        ? [...data].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.month - b.month
          })
        : [],
    [data]
  )

  // Determine default selected index (current month or most recent)
  const defaultIndex = useMemo(() => {
    if (sortedCharts.length === 0) return 0
    const ist = getClientISTDate()
    const currentMonth = ist.month
    const currentYear = ist.year
    const currentIdx = sortedCharts.findIndex(
      (c) => c.month === currentMonth && c.year === currentYear
    )
    if (currentIdx !== -1) return currentIdx
    // Default to most recent (last in sorted array)
    return sortedCharts.length - 1
  }, [sortedCharts])

  // Track user's explicit selection; null means "use default"
  const [userSelectedIndex, setUserSelectedIndex] = useState<number | null>(null)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)

  // Compute effective selected index: user choice > default
  const selectedIndex = userSelectedIndex !== null
    ? Math.min(userSelectedIndex, Math.max(sortedCharts.length - 1, 0))
    : defaultIndex

  const selectedChart = sortedCharts[selectedIndex] || null

  const goToPrev = () => {
    setUserSelectedIndex((prev) => {
      const current = prev ?? selectedIndex
      return Math.max(0, current - 1)
    })
  }

  const goToNext = () => {
    setUserSelectedIndex((prev) => {
      const current = prev ?? selectedIndex
      return Math.min(sortedCharts.length - 1, current + 1)
    })
  }

  const goToIndex = (idx: number) => {
    setUserSelectedIndex(idx)
    setShowMonthDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showMonthDropdown) return
    const handleClick = () => setShowMonthDropdown(false)
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick, { once: true })
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [showMonthDropdown])

  // Check if a chart is the current month
  const isCurrentMonth = (chart: ChartData) => {
    const ist = getClientISTDate()
    return chart.month === ist.month && chart.year === ist.year
  }

  return (
    <section className="w-full bg-[var(--bg-primary)] py-6 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Monthly Charts
          </h2>
          <p className="text-sm text-[var(--accent-blue)] mt-1">
            View past results organized by month
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            <p>Failed to load charts. Please try again later.</p>
          </div>
        )}

        {/* Charts Navigation + Display */}
        {sortedCharts.length > 0 && selectedChart && (
          <div className="space-y-4">
            {/* Month Selector Navigation Bar */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 sm:px-4 py-3 shadow-[var(--card-shadow)]">
                {/* Left Arrow */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPrev}
                  disabled={selectedIndex === 0}
                  className={`flex items-center justify-center size-9 sm:size-10 rounded-lg transition-colors ${
                    selectedIndex === 0
                      ? 'text-[var(--text-muted)] cursor-not-allowed bg-[var(--toggle-bg)]'
                      : 'text-[var(--accent-blue)] bg-[var(--accent-blue-subtle)] hover:bg-[var(--accent-blue-border)] border border-[var(--accent-blue-border)]'
                  }`}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-5" />
                </motion.button>

                {/* Center: Month/Year + Counter */}
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0 px-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[var(--accent-blue)] flex-shrink-0" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMonthDropdown((prev) => !prev)
                      }}
                      className="flex items-center gap-1 text-[var(--text-primary)] font-bold text-base sm:text-lg hover:text-[var(--accent-blue)] transition-colors truncate"
                      aria-label="Select month"
                    >
                      <span>{formatMonthLabel(selectedChart.month, selectedChart.year)}</span>
                      <ChevronDown
                        className={`size-4 text-[var(--text-muted)] transition-transform duration-200 ${
                          showMonthDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isCurrentMonth(selectedChart) && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-bold tracking-wide flex-shrink-0"
                      >
                        CURRENT
                      </motion.span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Month {selectedIndex + 1} of {sortedCharts.length}
                  </span>
                </div>

                {/* Right Arrow */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToNext}
                  disabled={selectedIndex === sortedCharts.length - 1}
                  className={`flex items-center justify-center size-9 sm:size-10 rounded-lg transition-colors ${
                    selectedIndex === sortedCharts.length - 1
                      ? 'text-[var(--text-muted)] cursor-not-allowed bg-[var(--toggle-bg)]'
                      : 'text-[var(--accent-blue)] bg-[var(--accent-blue-subtle)] hover:bg-[var(--accent-blue-border)] border border-[var(--accent-blue-border)]'
                  }`}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-5" />
                </motion.button>
              </div>

              {/* Dropdown Month List */}
              <AnimatePresence>
                {showMonthDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 top-full mt-2 z-30 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[var(--card-shadow-lg)] overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto p-2">
                      {sortedCharts.map((chart, idx) => (
                        <motion.button
                          key={`${chart.year}-${chart.month}`}
                          whileHover={{ x: 4 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            goToIndex(idx)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            idx === selectedIndex
                              ? 'bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)] font-semibold'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-alt)]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-[var(--text-muted)]" />
                            {formatMonthLabel(chart.month, chart.year)}
                          </span>
                          <div className="flex items-center gap-2">
                            {isCurrentMonth(chart) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)] text-white">
                                NOW
                              </span>
                            )}
                            {idx === selectedIndex && (
                              <span className="size-2 rounded-full bg-[var(--accent-blue)]" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick Month Jump Chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
            >
              {sortedCharts.map((chart, idx) => {
                const isSelected = idx === selectedIndex
                const isCurrent = isCurrentMonth(chart)
                return (
                  <motion.button
                    key={`${chart.year}-${chart.month}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToIndex(idx)}
                    className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-md'
                        : isCurrent
                        ? 'bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)] border-[var(--accent-blue-border)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-blue-border)] hover:text-[var(--accent-blue)]'
                    }`}
                    aria-label={`Go to ${formatMonthLabel(chart.month, chart.year)}`}
                  >
                    <span>{formatShortMonthLabel(chart.month, chart.year)}</span>
                    {isCurrent && !isSelected && (
                      <span className="size-1.5 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                    )}
                  </motion.button>
                )
              })}
            </motion.div>

            {/* Selected Chart Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedChart.year}-${selectedChart.month}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MonthlyChartTable chart={selectedChart} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {data && sortedCharts.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] py-8">
            <p>No charts available yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
