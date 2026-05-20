'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MONTH_NAMES } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import { ChevronRight, Star } from 'lucide-react'
import type { ChartData } from '@/hooks/useResults'
import { MobileChartCards } from './MobileChartCards'

const SLOT_COLUMNS = [
  { key: '1', label: '12PM' },
  { key: '2', label: '2PM' },
  { key: '3', label: '4PM' },
  { key: '4', label: '6PM' },
  { key: '5', label: '8PM' },
  { key: '6', label: '10PM' },
] as const

interface MonthlyChartTableProps {
  chart: ChartData
}

function formatCellValue(val: number | null | undefined): string {
  if (val === null || val === undefined) return '--'
  return String(val).padStart(2, '0')
}

function hasValue(val: number | null | undefined): boolean {
  return val !== null && val !== undefined
}

export function MonthlyChartTable({ chart }: MonthlyChartTableProps) {
  const monthName = MONTH_NAMES[chart.month] || `Month ${chart.month}`
  const title = `${monthName} MONTH CHART`

  // Determine today's day for highlighting
  const ist = getClientISTDate()
  const isCurrentMonth = chart.month === ist.month && chart.year === ist.year
  const todayDay = ist.day

  // Scroll state for indicator
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollArrow, setShowScrollArrow] = useState(false)
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function checkScroll() {
      if (!el) return
      // Show arrow if content is wider than container
      setShowScrollArrow(el.scrollWidth > el.clientWidth + 10)
      // Hide arrow when scrolled to end
      setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10)
    }

    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  return (
    <>
      {/* Mobile: Card-based layout */}
      <div className="md:hidden">
        <MobileChartCards chart={chart} />
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Card className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            {/* Blue header bar with month name */}
            <div className="bg-gradient-to-r from-[#0055dd] via-[#0066ff] to-[#0055dd] px-4 py-2.5 sm:py-3">
              <h3 className="text-white font-bold text-center text-sm sm:text-base tracking-wide">
                {title}
              </h3>
            </div>

            {/* Table with horizontal scroll */}
            <div className="relative">
              <div ref={scrollRef} className="overflow-x-auto">
                <Table className="w-full min-w-[560px]">
                  <TableHeader>
                    {/* Main header row - Yellow */}
                    <TableRow className="bg-yellow-500/90 hover:bg-yellow-500/90 border-none">
                      <TableHead className="text-black font-bold text-center text-xs sm:text-sm w-12 sm:w-16 sticky left-0 bg-yellow-500/90 z-10">
                        Date
                      </TableHead>
                      {SLOT_COLUMNS.map((col) => (
                        <TableHead
                          key={col.key}
                          className="text-black font-bold text-center text-xs sm:text-sm"
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chart.days
                      .filter((day) => !isCurrentMonth || day.day <= todayDay)
                      .map((day, idx) => {
                      const isToday = isCurrentMonth && day.day === todayDay

                      return (
                        <TableRow
                          key={day.day}
                          className={`border-[var(--border-color)] transition-colors duration-150 ${
                            isToday
                              ? 'bg-[var(--bg-card-alt)] hover:bg-[var(--bg-card-alt)] border-l-2 border-l-[var(--accent-blue)]'
                              : idx % 2 === 0
                              ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)]'
                              : 'bg-[var(--bg-card-alt)] hover:bg-[var(--bg-card)]'
                          }`}
                        >
                          <TableCell
                            className={`text-center font-medium text-xs sm:text-sm sticky left-0 z-10 ${
                              isToday
                                ? 'bg-[var(--bg-card-alt)] text-[var(--accent-blue)] font-bold'
                                : idx % 2 === 0
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                                : 'bg-[var(--bg-card-alt)] text-[var(--text-primary)]'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>{day.day}</span>
                              {isToday && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full bg-[var(--accent-blue)] text-white text-[7px] sm:text-[8px] font-bold"
                                >
                                  <Star className="size-2 fill-white" />
                                  TODAY
                                </motion.span>
                              )}
                            </div>
                          </TableCell>
                          {SLOT_COLUMNS.map((col) => {
                            const slotKey = `slot${col.key}` as keyof typeof day
                            const val = day[slotKey] as number | null | undefined
                            const filled = hasValue(val)

                            return (
                              <TableCell
                                key={col.key}
                                className={`text-center text-xs sm:text-sm cursor-default transition-colors ${
                                  filled
                                    ? 'hover:bg-green-500/[0.08]'
                                    : ''
                                }`}
                                title={`Day ${day.day} | ${col.label} | ${filled ? formatCellValue(val) : 'No result'}`}
                              >
                                <span className={`font-mono ${
                                  filled
                                    ? 'text-[var(--text-primary)] font-bold'
                                    : 'text-[var(--text-muted)]'
                                }`}>
                                  {formatCellValue(val)}
                                </span>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                    {chart.days.filter((d) => !isCurrentMonth || d.day <= todayDay).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-[var(--text-secondary)] py-8"
                        >
                          No data available for this month
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Scroll indicator arrow on mobile */}
              {showScrollArrow && !isScrolledToEnd && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  <div className="bg-[var(--accent-blue)]/80 backdrop-blur-sm p-1.5 rounded-l-lg shadow-lg">
                    <ChevronRight className="size-4 text-white animate-bounce-right" />
                  </div>
                </motion.div>
              )}
            </div>
          </Card>

          <style jsx>{`
            @keyframes bounce-right {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(3px); }
            }
            .animate-bounce-right {
              animation: bounce-right 1.5s ease-in-out infinite;
            }
          `}</style>
        </motion.div>
      </div>
    </>
  )
}
