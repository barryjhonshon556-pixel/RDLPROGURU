'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Flame, Snowflake, Hash } from 'lucide-react'
import type { ChartData, ChartDayData } from '@/hooks/useResults'
import { SLOT_KEYS } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NumberStat {
  number: string
  count: number
}

interface TrendItem {
  number: string
  count: number
  recentCount: number
  earlierCount: number
  trend: 'up' | 'down' | 'stable'
}

interface StatisticsData {
  frequency: Record<string, number>
  hotNumbers: NumberStat[]
  coldNumbers: NumberStat[]
  trends: TrendItem[]
  maxFrequency: number
  totalDraws: number
  currentMonthLabel: string
}

// ─── Analysis Logic ──────────────────────────────────────────────────────────

function extractAllNumbers(charts: ChartData[]): string[] {
  const numbers: string[] = []
  for (const chart of charts) {
    for (const day of chart.days) {
      for (const sk of SLOT_KEYS) {
        const val = day[sk.key as keyof ChartDayData] as number | null
        if (val !== null && val !== undefined) {
          numbers.push(String(val).padStart(2, '0'))
        }
      }
    }
  }
  return numbers
}

function computeFrequency(numbers: string[]): Record<string, number> {
  const freq: Record<string, number> = {}
  for (let i = 0; i <= 99; i++) {
    freq[String(i).padStart(2, '0')] = 0
  }
  for (const num of numbers) {
    if (num in freq) {
      freq[num]++
    }
  }
  return freq
}

function computeTrends(charts: ChartData[]): {
  trends: TrendItem[]
  currentMonthLabel: string
} {
  const ist = getClientISTDate()
  const currentMonth = ist.month
  const currentYear = ist.year

  const monthNames: Record<number, string> = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April',
    5: 'May', 6: 'June', 7: 'July', 8: 'August',
    9: 'September', 10: 'October', 11: 'November', 12: 'December',
  }

  const currentMonthLabel = `${monthNames[currentMonth]} ${currentYear}`

  // Find the current month's chart
  const currentChart = charts.find(
    (c) => c.month === currentMonth && c.year === currentYear
  )

  if (!currentChart || currentChart.days.length === 0) {
    return { trends: [], currentMonthLabel }
  }

  const today = ist.day
  const midpoint = Math.floor(today / 2) || 1

  // Count numbers in recent days vs earlier days of current month
  const recentCounts: Record<string, number> = {}
  const earlierCounts: Record<string, number> = {}

  for (let i = 0; i <= 99; i++) {
    const key = String(i).padStart(2, '0')
    recentCounts[key] = 0
    earlierCounts[key] = 0
  }

  for (const day of currentChart.days) {
    if (day.day > today) continue
    const isRecent = day.day > midpoint
    const target = isRecent ? recentCounts : earlierCounts

    for (const sk of SLOT_KEYS) {
      const val = day[sk.key as keyof ChartDayData] as number | null
      if (val !== null && val !== undefined) {
        const key = String(val).padStart(2, '0')
        if (key in target) target[key]++
      }
    }
  }

  // Build trends
  const trendItems: TrendItem[] = []
  for (let i = 0; i <= 99; i++) {
    const key = String(i).padStart(2, '0')
    const total = recentCounts[key] + earlierCounts[key]
    const diff = recentCounts[key] - earlierCounts[key]
    const trend: 'up' | 'down' | 'stable' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
    trendItems.push({
      number: key,
      count: total,
      recentCount: recentCounts[key],
      earlierCount: earlierCounts[key],
      trend,
    })
  }

  // Sort by count descending, take top 10
  trendItems.sort((a, b) => b.count - a.count)

  return {
    trends: trendItems.slice(0, 10),
    currentMonthLabel,
  }
}

function analyzeStatistics(charts: ChartData[]): StatisticsData {
  const allNumbers = extractAllNumbers(charts)
  const frequency = computeFrequency(allNumbers)
  const totalDraws = allNumbers.length

  // Sort by frequency to find hot and cold
  const sorted = Object.entries(frequency)
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)

  const hotNumbers = sorted.slice(0, 10)
  const coldNumbers = sorted.slice(-10).reverse() // least frequent, still show in order

  const maxFrequency = sorted[0]?.count || 1

  const { trends, currentMonthLabel } = computeTrends(charts)

  return {
    frequency,
    hotNumbers,
    coldNumbers,
    trends,
    maxFrequency,
    totalDraws,
    currentMonthLabel,
  }
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function getHeatColor(count: number, max: number): string {
  if (max === 0) return 'bg-[var(--accent-blue-subtle)]'
  const ratio = count / max
  if (ratio === 0) return 'bg-[var(--accent-blue-subtle)]'
  if (ratio < 0.15) return 'bg-blue-500/20'
  if (ratio < 0.3) return 'bg-blue-500/30'
  if (ratio < 0.45) return 'bg-blue-500/40'
  if (ratio < 0.6) return 'bg-blue-500/50'
  if (ratio < 0.75) return 'bg-cyan-500/50'
  if (ratio < 0.9) return 'bg-green-500/50'
  return 'bg-green-500/60'
}

function getHeatTextColor(count: number, max: number): string {
  if (count === 0) return 'text-[var(--text-muted)]'
  const ratio = count / max
  if (ratio < 0.15) return 'text-[var(--accent-blue)]/60'
  if (ratio < 0.45) return 'text-[var(--accent-blue)]'
  return 'text-[var(--text-primary)]'
}

// ─── Animation variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
}

const barContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const barItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NumberStatistics() {
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

  const stats = useMemo(() => {
    if (!charts || charts.length === 0) return null
    return analyzeStatistics(charts)
  }, [charts])

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
                  <BarChart3 className="size-5 text-[var(--accent-blue)]" />
                </div>
                Number Statistics
              </CardTitle>
              <p className="text-[var(--text-accent)]/70 text-xs sm:text-sm mt-1">
                Frequency analysis across all monthly charts
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--accent-blue)] mr-2" />
                  <span className="text-[var(--text-secondary)] text-sm">Analyzing numbers...</span>
                </div>
              ) : !stats ? (
                <div className="text-center py-6">
                  <BarChart3 className="size-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-[var(--text-muted)] text-sm">No data available for analysis</p>
                </div>
              ) : (
                <Tabs defaultValue="heatmap" className="w-full">
                  <TabsList className="w-full bg-[var(--bg-secondary)] h-auto p-1 mb-4">
                    <TabsTrigger
                      value="heatmap"
                      className="flex-1 text-xs sm:text-sm data-[state=active]:bg-[var(--accent-blue-subtle)] data-[state=active]:text-[var(--accent-blue)]"
                    >
                      <Hash className="size-3.5" />
                      Heat Map
                    </TabsTrigger>
                    <TabsTrigger
                      value="hotcold"
                      className="flex-1 text-xs sm:text-sm data-[state=active]:bg-[var(--accent-blue-subtle)] data-[state=active]:text-[var(--accent-blue)]"
                    >
                      <Flame className="size-3.5" />
                      Hot & Cold
                    </TabsTrigger>
                    <TabsTrigger
                      value="trends"
                      className="flex-1 text-xs sm:text-sm data-[state=active]:bg-[var(--accent-blue-subtle)] data-[state=active]:text-[var(--accent-blue)]"
                    >
                      <TrendingUp className="size-3.5" />
                      Trends
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Heat Map Tab ── */}
                  <TabsContent value="heatmap">
                    <div className="space-y-3">
                      {/* Legend */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">Less frequent</span>
                        <div className="flex gap-0.5">
                          <div className="w-4 h-3 rounded-sm bg-[var(--accent-blue-subtle)]" />
                          <div className="w-4 h-3 rounded-sm bg-blue-500/20" />
                          <div className="w-4 h-3 rounded-sm bg-blue-500/40" />
                          <div className="w-4 h-3 rounded-sm bg-cyan-500/50" />
                          <div className="w-4 h-3 rounded-sm bg-green-500/50" />
                          <div className="w-4 h-3 rounded-sm bg-green-500/60" />
                        </div>
                        <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">More frequent</span>
                      </div>

                      {/* 10x10 Grid */}
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-10 gap-1 sm:gap-1.5"
                      >
                        {Array.from({ length: 100 }, (_, i) => {
                          const num = String(i).padStart(2, '0')
                          const count = stats.frequency[num] || 0
                          return (
                            <motion.div
                              key={num}
                              variants={itemVariants}
                              className={`aspect-square rounded-md flex items-center justify-center cursor-default transition-colors ${getHeatColor(count, stats.maxFrequency)}`}
                              title={`${num}: appeared ${count} time${count !== 1 ? 's' : ''}`}
                            >
                              <span
                                className={`text-[9px] sm:text-xs font-bold ${getHeatTextColor(count, stats.maxFrequency)}`}
                              >
                                {num}
                              </span>
                            </motion.div>
                          )
                        })}
                      </motion.div>

                      {/* Stats summary */}
                      <div className="flex items-center justify-between px-1 pt-1">
                        <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">
                          Total draws analyzed: {stats.totalDraws}
                        </span>
                        <span className="text-[var(--text-muted)] text-[10px] sm:text-xs">
                          Hottest: <span className="text-green-500 font-semibold">{stats.hotNumbers[0]?.number}</span> ({stats.hotNumbers[0]?.count}x)
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Hot & Cold Tab ── */}
                  <TabsContent value="hotcold">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Hot Numbers */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-3">
                          <Flame className="size-4 text-orange-500 dark:text-orange-400" />
                          <span className="text-orange-500 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider">
                            Hot Numbers
                          </span>
                        </div>
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex flex-wrap gap-1.5 sm:gap-2"
                        >
                          {stats.hotNumbers.map((item) => {
                            const sizeScale = stats.maxFrequency > 0
                              ? 0.7 + (item.count / stats.maxFrequency) * 0.6
                              : 1
                            return (
                              <motion.div
                                key={item.number}
                                variants={itemVariants}
                                whileHover={{ scale: 1.1 }}
                                className="flex flex-col items-center"
                              >
                                <Badge
                                  className="bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30 transition-colors"
                                  style={{
                                    fontSize: `${sizeScale * 0.75}rem`,
                                    padding: `${sizeScale * 0.25}rem ${sizeScale * 0.5}rem`,
                                  }}
                                >
                                  <Flame className="size-3" />
                                  {item.number}
                                </Badge>
                                <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                  {item.count}x
                                </span>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      </div>

                      {/* Cold Numbers */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-3">
                          <Snowflake className="size-4 text-[var(--accent-blue)]" />
                          <span className="text-[var(--accent-blue)] text-xs font-semibold uppercase tracking-wider">
                            Cold Numbers
                          </span>
                        </div>
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex flex-wrap gap-1.5 sm:gap-2"
                        >
                          {stats.coldNumbers.map((item) => (
                            <motion.div
                              key={item.number}
                              variants={itemVariants}
                              whileHover={{ scale: 1.1 }}
                              className="flex flex-col items-center"
                            >
                              <Badge
                                className="bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]/70 border-[var(--accent-blue-border)] hover:bg-[var(--accent-blue-subtle)] transition-colors"
                              >
                                <Snowflake className="size-3" />
                                {item.number}
                              </Badge>
                              <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                {item.count}x
                              </span>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Trends Tab ── */}
                  <TabsContent value="trends">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="size-3.5 text-[var(--accent-blue)]" />
                        <span className="text-[var(--accent-blue)] text-xs font-semibold uppercase tracking-wider">
                          Current Month Trends
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[10px] sm:text-xs -mt-1">
                        {stats.currentMonthLabel} — Top 10 numbers by frequency (recent vs earlier half)
                      </p>

                      {stats.trends.length === 0 ? (
                        <div className="text-center py-4">
                          <TrendingUp className="size-6 text-[var(--text-muted)] mx-auto mb-1" />
                          <p className="text-[var(--text-muted)] text-xs">No data for current month yet</p>
                        </div>
                      ) : (
                        <motion.div
                          variants={barContainerVariants}
                          initial="hidden"
                          animate="visible"
                          className="space-y-2"
                        >
                          {stats.trends.map((item) => {
                            const maxCount = stats.trends[0]?.count || 1
                            const barPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                            const trendIcon = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'
                            const trendColor =
                              item.trend === 'up'
                                ? 'text-green-500'
                                : item.trend === 'down'
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-[var(--text-secondary)]'

                            return (
                              <motion.div
                                key={item.number}
                                variants={barItemVariants}
                                className="flex items-center gap-2 sm:gap-3"
                              >
                                {/* Number label */}
                                <span className="text-[var(--text-primary)] font-bold text-xs sm:text-sm w-6 text-right">
                                  {item.number}
                                </span>

                                {/* Bar */}
                                <div className="flex-1 h-5 sm:h-6 bg-[var(--bg-primary)] rounded-md overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barPct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                                    className={`h-full rounded-md ${
                                      item.trend === 'up'
                                        ? 'bg-gradient-to-r from-green-600/70 to-green-400/70'
                                        : item.trend === 'down'
                                        ? 'bg-gradient-to-r from-blue-600/60 to-blue-400/60'
                                        : 'bg-gradient-to-r from-gray-500/60 to-gray-400/60'
                                    }`}
                                  />
                                  {/* Count text inside bar */}
                                  <span className="absolute inset-0 flex items-center px-2 text-[10px] sm:text-xs text-[var(--text-primary)]/80 font-medium">
                                    {item.count}x
                                  </span>
                                </div>

                                {/* Trend indicator */}
                                <span className={`text-xs font-bold ${trendColor} w-5 text-center`}>
                                  {trendIcon}
                                </span>

                                {/* Recent vs Earlier */}
                                <span className="text-[var(--text-muted)] text-[9px] sm:text-[10px] w-16 sm:w-20 text-right hidden sm:inline">
                                  <span className="text-green-500/70">{item.recentCount}</span>
                                  <span className="text-[var(--text-muted)]"> vs </span>
                                  <span className="text-[var(--accent-blue)]/70">{item.earlierCount}</span>
                                </span>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )}

                      {/* Trend legend */}
                      <div className="flex items-center justify-center gap-4 pt-2 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-1">
                          <span className="text-green-500 text-xs">↑</span>
                          <span className="text-[var(--text-muted)] text-[10px]">Trending Up</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-red-500 dark:text-red-400 text-xs">↓</span>
                          <span className="text-[var(--text-muted)] text-[10px]">Trending Down</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[var(--text-secondary)] text-xs">→</span>
                          <span className="text-[var(--text-muted)] text-[10px]">Stable</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
