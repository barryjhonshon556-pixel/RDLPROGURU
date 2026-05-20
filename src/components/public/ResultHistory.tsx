'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, Clock, AlertCircle, CheckCircle2, History } from 'lucide-react'
import { TIME_SLOTS, SLOT_KEYS, MONTH_NAMES } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import type { ChartData, ChartDayData } from '@/hooks/useResults'

interface DayResult {
  slotLabel: string
  slotIndex: number
  result: number | null
  hasResult: boolean
}

export function ResultHistory() {
  const ist = getClientISTDate()
  const [selectedMonth, setSelectedMonth] = useState<string>(String(ist.month))
  const [selectedYear, setSelectedYear] = useState<string>(String(ist.year))
  const [selectedDay, setSelectedDay] = useState<string>(String(ist.day))
  const [results, setResults] = useState<DayResult[] | null>(null)
  const [searchedDate, setSearchedDate] = useState<string>('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noResult, setNoResult] = useState(false)

  const handleSearch = useCallback(async () => {
    const month = parseInt(selectedMonth as string, 10)
    const year = parseInt(selectedYear as string, 10)
    const day = parseInt(selectedDay as string, 10)

    if (isNaN(month) || isNaN(year) || isNaN(day)) {
      setError('Please select a valid date')
      return
    }

    setIsSearching(true)
    setError(null)
    setNoResult(false)
    setResults(null)

    try {
      const res = await fetch('/api/charts')
      if (!res.ok) throw new Error('Failed to fetch charts')
      const charts: ChartData[] = await res.json()

      // Find the matching month chart
      const matchingChart = charts.find(
        (c) => c.month === month && c.year === year
      )

      if (!matchingChart) {
        setNoResult(true)
        setSearchedDate(`${day} ${MONTH_NAMES[month]} ${year}`)
        return
      }

      // Find the matching day
      const matchingDay: ChartDayData | undefined = matchingChart.days.find(
        (d) => d.day === day
      )

      if (!matchingDay) {
        setNoResult(true)
        setSearchedDate(`${day} ${MONTH_NAMES[month]} ${year}`)
        return
      }

      // Build results for all 6 time slots using single number format
      const dayResults: DayResult[] = SLOT_KEYS.map((sk, i) => {
        const val = matchingDay[sk.key as keyof ChartDayData] as number | null
        const hasResult = val !== null && val !== undefined

        return {
          slotLabel: TIME_SLOTS[i].label,
          slotIndex: sk.index,
          result: val,
          hasResult,
        }
      })

      // Check if any slot has results
      const hasAnyResult = dayResults.some((r) => r.hasResult)

      if (!hasAnyResult) {
        setNoResult(true)
      } else {
        setResults(dayResults)
      }

      setSearchedDate(`${day} ${MONTH_NAMES[month]} ${year}`)
    } catch {
      setError('Failed to search results. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [selectedMonth, selectedYear, selectedDay])

  // Generate year options (current year and 2 years back)
  const currentYear = getClientISTDate().year
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

  // Generate day options based on month/year
  const daysInMonth = new Date(
    parseInt(selectedYear as string, 10) || currentYear,
    parseInt(selectedMonth as string, 10) || 1,
    0
  ).getDate()
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <section className="w-full bg-[var(--bg-primary)] py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Card with gradient border effect */}
          <div className="rounded-xl p-[2px] bg-gradient-to-br from-[var(--accent-blue)] via-[var(--accent-blue)]/30 to-[var(--accent-blue)]">
            <Card className="bg-[var(--bg-card)] border-0 shadow-[var(--card-shadow-lg)] overflow-hidden rounded-[10px]">
              {/* Header */}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[var(--text-primary)] text-lg sm:text-xl">
                  <div className="p-1.5 rounded-lg bg-[var(--accent-blue-subtle)]">
                    <History className="size-5 text-[var(--accent-blue)]" />
                  </div>
                  Result History
                </CardTitle>
                <p className="text-[var(--text-accent)]/70 text-xs sm:text-sm mt-1">
                  Search past results by date
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Search Controls */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Day */}
                    <div className="space-y-1.5">
                      <Label className="text-[var(--text-secondary)] text-xs">Day</Label>
                      <Select
                        value={selectedDay as string}
                        onValueChange={setSelectedDay}
                      >
                        <SelectTrigger className="w-full bg-[var(--bg-secondary)] border-[var(--border-accent)] text-[var(--text-primary)] text-sm h-9">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-card)] border-[var(--border-accent)] max-h-48">
                          {dayOptions.map((d) => (
                            <SelectItem
                              key={d}
                              value={String(d)}
                              className="text-[var(--text-primary)] focus:bg-[var(--accent-blue-subtle)] focus:text-[var(--text-primary)]"
                            >
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month */}
                    <div className="space-y-1.5">
                      <Label className="text-[var(--text-secondary)] text-xs">Month</Label>
                      <Select
                        value={selectedMonth as string}
                        onValueChange={(val) => {
                          setSelectedMonth(val)
                          const newDaysInMonth = new Date(
                            parseInt(selectedYear as string, 10) || currentYear,
                            parseInt(val, 10),
                            0
                          ).getDate()
                          if (parseInt(selectedDay as string, 10) > newDaysInMonth) {
                            setSelectedDay(String(newDaysInMonth))
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-[var(--bg-secondary)] border-[var(--border-accent)] text-[var(--text-primary)] text-sm h-9">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-card)] border-[var(--border-accent)] max-h-48">
                          {Object.entries(MONTH_NAMES).map(([num, name]) => (
                            <SelectItem
                              key={num}
                              value={num}
                              className="text-[var(--text-primary)] focus:bg-[var(--accent-blue-subtle)] focus:text-[var(--text-primary)]"
                            >
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year */}
                    <div className="space-y-1.5">
                      <Label className="text-[var(--text-secondary)] text-xs">Year</Label>
                      <Select
                        value={selectedYear as string}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-full bg-[var(--bg-secondary)] border-[var(--border-accent)] text-[var(--text-primary)] text-sm h-9">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-card)] border-[var(--border-accent)]">
                          {yearOptions.map((y) => (
                            <SelectItem
                              key={y}
                              value={String(y)}
                              className="text-[var(--text-primary)] focus:bg-[var(--accent-blue-subtle)] focus:text-[var(--text-primary)]"
                            >
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Search Button with animated icon */}
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-bold py-2.5 text-sm sm:text-base rounded-lg shadow-md shadow-[var(--accent-blue)]/20 transition-all hover:shadow-lg hover:shadow-[var(--accent-blue)]/30"
                  >
                    {isSearching ? (
                      <>
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                          className="mr-2"
                        >
                          <Search className="size-4" />
                        </motion.div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="size-4 mr-2" />
                        Search Results
                      </>
                    )}
                  </Button>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                      >
                        <AlertCircle className="size-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* No Results */}
                  <AnimatePresence>
                    {noResult && !results && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center py-6"
                      >
                        <Calendar className="size-10 text-[var(--text-muted)] mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)] text-sm font-medium">
                          No results found
                        </p>
                        <p className="text-[var(--text-muted)] text-xs mt-1">
                          No data available for {searchedDate}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Results Grid */}
                  <AnimatePresence>
                    {results && results.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        {/* Searched Date Header with calendar icon */}
                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                          <div className="flex items-center justify-center size-7 rounded-lg bg-[var(--accent-blue-subtle)]">
                            <Calendar className="size-4 text-[var(--accent-blue)]" />
                          </div>
                          <span className="text-[var(--accent-blue)] text-sm font-semibold">
                            Results for {searchedDate}
                          </span>
                        </div>

                        {/* Results List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {results.map((result, index) => (
                            <motion.div
                              key={result.slotIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`rounded-lg border p-3 transition-all ${
                                result.hasResult
                                  ? 'bg-[var(--bg-secondary)] border-green-500/30 hover:border-green-500/50'
                                  : 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                {/* Time Slot Label */}
                                <div className="flex items-center gap-2">
                                  <Clock className="size-3.5 text-[var(--accent-blue)]/70" />
                                  <span className="text-[var(--accent-blue)] text-xs sm:text-sm font-semibold">
                                    {result.slotLabel}
                                  </span>
                                </div>

                                {/* Status */}
                                {result.hasResult ? (
                                  <CheckCircle2 className="size-3.5 text-green-500" />
                                ) : (
                                  <AlertCircle className="size-3.5 text-[var(--text-muted)]" />
                                )}
                              </div>

                              {/* Single Number */}
                              <div className="mt-2">
                                {result.hasResult ? (
                                  <span className="text-[var(--text-primary)] font-extrabold text-lg sm:text-xl">
                                    {String(result.result).padStart(2, '0')}
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-muted)] text-sm italic">
                                    Not Posted
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
