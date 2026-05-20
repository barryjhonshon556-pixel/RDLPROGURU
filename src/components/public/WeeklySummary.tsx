'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, BarChart3, Hash, Trophy } from 'lucide-react'
import type { ChartData, ChartDayData } from '@/hooks/useResults'
import { SLOT_KEYS } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'

interface WeeklyDayStats {
  day: number
  dayName: string
  completedSlots: number
  totalSlots: number
}

interface WeeklySummaryData {
  totalDrawsCompleted: number
  totalDrawsPossible: number
  mostCommonNumber: { number: string; count: number } | null
  daysActive: number
  completionRate: number
  dayStats: WeeklyDayStats[]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekRange(): { start: Date; end: Date } {
  const ist = getClientISTDate()
  // Construct a local Date representing IST date at midnight
  const now = new Date(ist.year, ist.month - 1, ist.day)
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ...
  // Week starts on Monday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const start = new Date(now)
  start.setDate(now.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function analyzeWeekData(charts: ChartData[]): WeeklySummaryData {
  const { start, end } = getWeekRange()
  const startDay = start.getDate()
  const startMonth = start.getMonth() + 1
  const startYear = start.getFullYear()
  const endDay = end.getDate()
  const endMonth = end.getMonth() + 1
  const endYear = end.getFullYear()

  // Collect all day data for the week
  const weekDays: { day: number; data: ChartDayData }[] = []

  for (const chart of charts) {
    if (chart.year === startYear && chart.month === startMonth) {
      for (const day of chart.days) {
        if (day.day >= startDay && day.day <= (startMonth === endMonth ? endDay : 31)) {
          weekDays.push({ day: day.day, data: day })
        }
      }
    }
    // Handle week spanning two months
    if (startMonth !== endMonth) {
      if (chart.year === endYear && chart.month === endMonth) {
        for (const day of chart.days) {
          if (day.day <= endDay) {
            weekDays.push({ day: day.day, data: day })
          }
        }
      }
    }
  }

  let totalDrawsCompleted = 0
  const totalDrawsPossible = weekDays.length * 6
  const numberCounts: Record<string, number> = {}
  const dayStats: WeeklyDayStats[] = []

  for (const { day, data } of weekDays) {
    let completedSlots = 0
    for (const sk of SLOT_KEYS) {
      const val = data[sk.key as keyof ChartDayData] as number | null
      if (val !== null && val !== undefined) {
        completedSlots++
        totalDrawsCompleted++
        const numStr = String(val).padStart(2, '0')
        numberCounts[numStr] = (numberCounts[numStr] || 0) + 1
      }
    }

    // Determine day name
    const dateObj = new Date(
      weekDays.length > 0 ? (startMonth === endMonth ? startYear : (data.day >= startDay ? startYear : endYear)) : startYear,
      (data.day >= startDay && startMonth === endMonth) ? startMonth - 1 : endMonth - 1,
      data.day
    )
    const dayName = DAY_NAMES[dateObj.getDay()] || `Day ${day}`

    dayStats.push({
      day,
      dayName,
      completedSlots,
      totalSlots: 6,
    })
  }

  // Find most common number
  let mostCommonNumber: { number: string; count: number } | null = null

  for (const [num, count] of Object.entries(numberCounts)) {
    if (!mostCommonNumber || count > mostCommonNumber.count) {
      mostCommonNumber = { number: num, count }
    }
  }

  const completionRate = totalDrawsPossible > 0
    ? Math.round((totalDrawsCompleted / totalDrawsPossible) * 100)
    : 0

  return {
    totalDrawsCompleted,
    totalDrawsPossible,
    mostCommonNumber,
    daysActive: weekDays.length,
    completionRate,
    dayStats,
  }
}

export function WeeklySummary() {
  const { data: charts, isLoading } = useQuery<ChartData[]>({
    queryKey: ['charts'],
    queryFn: async () => {
      const res = await fetch('/api/charts')
      if (!res.ok) throw new Error('Failed to fetch charts')
      const json = await res.json()
      return Array.isArray(json) ? json : json.charts || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const summary = useMemo(() => {
    if (!charts || charts.length === 0) return null
    return analyzeWeekData(charts)
  }, [charts])

  const { start } = getWeekRange()

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
                <div className="p-1.5 rounded-lg bg-green-600/20">
                  <TrendingUp className="size-5 text-green-500 dark:text-green-400" />
                </div>
                Weekly Summary
              </CardTitle>
              <p className="text-[var(--text-accent)]/70 text-xs sm:text-sm mt-1">
                Week of {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mr-2" />
                  <span className="text-[var(--text-secondary)] text-sm">Loading weekly data...</span>
                </div>
              ) : !summary ? (
                <div className="text-center py-6">
                  <BarChart3 className="size-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-[var(--text-muted)] text-sm">No data available for this week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Total Draws */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center border border-[var(--border-color)]"
                    >
                      <BarChart3 className="size-4 text-[var(--accent-blue)] mx-auto mb-1" />
                      <p className="text-[var(--text-primary)] font-extrabold text-lg sm:text-xl">
                        {summary.totalDrawsCompleted}<span className="text-[var(--text-muted)] text-xs font-normal">/{summary.totalDrawsPossible}</span>
                      </p>
                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs">Draws Done</p>
                    </motion.div>

                    {/* Completion Rate */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center border border-[var(--border-color)]"
                    >
                      <TrendingUp className="size-4 text-green-500 dark:text-green-400 mx-auto mb-1" />
                      <p className="text-[var(--text-primary)] font-extrabold text-lg sm:text-xl">
                        {summary.completionRate}%
                      </p>
                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs">Completion</p>
                    </motion.div>

                    {/* Days Active */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-[var(--bg-secondary)] rounded-lg p-3 text-center border border-[var(--border-color)]"
                    >
                      <Trophy className="size-4 text-yellow-500 dark:text-yellow-400 mx-auto mb-1" />
                      <p className="text-[var(--text-primary)] font-extrabold text-lg sm:text-xl">
                        {summary.daysActive}<span className="text-[var(--text-muted)] text-xs font-normal">/7</span>
                      </p>
                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs">Days Active</p>
                    </motion.div>
                  </div>

                  {/* Most Common Number */}
                  {summary.mostCommonNumber && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Hash className="size-3.5 text-[var(--accent-blue)]" />
                        <span className="text-[var(--accent-blue)] text-xs font-semibold uppercase tracking-wider">
                          Most Common Number
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-[var(--bg-card)] rounded-md px-3 py-2">
                        <span className="text-[var(--text-secondary)] text-xs">Result</span>
                        <span className="text-green-500 font-bold text-sm">
                          {summary.mostCommonNumber.number}
                          <span className="text-[var(--text-muted)] text-[10px] ml-1">
                            (x{summary.mostCommonNumber.count})
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Daily Breakdown Mini bars */}
                  {summary.dayStats.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 className="size-3.5 text-[var(--accent-blue)]" />
                        <span className="text-[var(--accent-blue)] text-xs font-semibold uppercase tracking-wider">
                          Daily Breakdown
                        </span>
                      </div>
                      {summary.dayStats.map((dayStat) => {
                        const pct = Math.round((dayStat.completedSlots / dayStat.totalSlots) * 100)
                        return (
                          <div key={dayStat.day} className="flex items-center gap-2">
                            <span className="text-[var(--text-secondary)] text-[10px] sm:text-xs w-8 text-right font-medium">
                              {dayStat.dayName}
                            </span>
                            <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                className={`h-full rounded-full ${
                                  pct === 100
                                    ? 'bg-green-500'
                                    : pct > 50
                                    ? 'bg-[var(--accent-blue)]'
                                    : 'bg-[var(--text-muted)]'
                                }`}
                              />
                            </div>
                            <span className="text-[var(--text-muted)] text-[10px] w-6 text-right">
                              {dayStat.completedSlots}/{dayStat.totalSlots}
                            </span>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
