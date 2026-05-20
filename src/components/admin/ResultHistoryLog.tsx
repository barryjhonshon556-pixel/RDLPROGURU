'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Eye, EyeOff, Loader2, Calendar, Clock } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import { TIME_SLOTS, SLOT_KEYS, MONTH_NAMES } from '@/lib/constants';
import { getClientISTDate } from '@/lib/ist-date';
import type { ChartData, ChartDayData } from '@/hooks/useResults';

interface LogEntry {
  dateKey: string; // e.g., "16 May 2026"
  dateLabel: string; // formatted date for display
  day: number;
  month: number;
  year: number;
  slotIndex: number;
  slotLabel: string;
  result: number | null;
  status: 'full' | 'empty';
}

function StatusDot({ status }: { status: 'full' | 'empty' }) {
  const colorMap = {
    full: 'bg-green-500',
    empty: 'bg-red-500',
  };
  const ringMap = {
    full: 'ring-green-500/30',
    empty: 'ring-red-500/30',
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[status]} ring-2 ${ringMap[status]}`}
      title={status === 'full' ? 'Result posted' : 'Empty'}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 shimmer rounded" />
        <div className="h-8 w-24 shimmer rounded" />
      </div>
      {/* Date group skeletons */}
      {[1, 2, 3].map((group) => (
        <Card key={group} className="border-gray-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="h-4 w-32 shimmer rounded" />
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-2.5 w-2.5 shimmer rounded-full" />
                <div className="h-4 w-20 shimmer rounded" />
                <div className="h-4 w-16 shimmer rounded ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ResultHistoryLog() {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/charts?all=true');
      if (!res.ok) throw new Error('Failed to fetch charts');
      const json = await res.json();
      const chartData = Array.isArray(json) ? json : json.charts || [];
      setCharts(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result history');
    } finally {
      setLoading(false);
    }
  };

  // Build log entries from all chart data
  const allEntries = useMemo<LogEntry[]>(() => {
    const entries: LogEntry[] = [];

    for (const chart of charts) {
      const monthName = MONTH_NAMES[chart.month] || String(chart.month);

      for (const day of chart.days) {
        const dateKey = `${day.day} ${monthName} ${chart.year}`;
        const dateLabel = `${day.day} ${monthName} ${chart.year}`;

        for (let i = 0; i < SLOT_KEYS.length; i++) {
          const slotKey = SLOT_KEYS[i];
          const val = day[slotKey.key as keyof ChartDayData] as number | null;
          const timeSlot = TIME_SLOTS[i];

          const hasResult = val !== null && val !== undefined;

          const status: 'full' | 'empty' = hasResult ? 'full' : 'empty';

          entries.push({
            dateKey,
            dateLabel,
            day: day.day,
            month: chart.month,
            year: chart.year,
            slotIndex: timeSlot.index,
            slotLabel: timeSlot.label,
            result: val,
            status,
          });
        }
      }
    }

    // Sort by date descending, then by slot ascending
    entries.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.month !== b.month) return b.month - a.month;
      if (a.day !== b.day) return b.day - a.day;
      return a.slotIndex - b.slotIndex;
    });

    return entries;
  }, [charts]);

  // Filter to last 7 days unless showAll
  const filteredEntries = useMemo(() => {
    if (showAll) return allEntries;

    const ist = getClientISTDate();
    const now = new Date(ist.year, ist.month - 1, ist.day);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return allEntries.filter((entry) => {
      const entryDate = new Date(entry.year, entry.month - 1, entry.day);
      return entryDate >= sevenDaysAgo;
    });
  }, [allEntries, showAll]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.dateKey]) {
        groups[entry.dateKey] = [];
      }
      groups[entry.dateKey].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  // Count total results
  const totalResults = useMemo(() => {
    return filteredEntries.filter((e) => e.status === 'full').length;
  }, [filteredEntries]);

  const totalSlots = filteredEntries.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Result History Log</h2>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Result History Log</h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              onClick={fetchCharts}
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-600 hover:bg-red-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Result History Log</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {totalResults}/{totalSlots} results
          </span>
        </div>
        <Button
          onClick={() => setShowAll((prev) => !prev)}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {showAll ? (
            <>
              <EyeOff className="size-3.5 mr-1" />
              Last 7 Days
            </>
          ) : (
            <>
              <Eye className="size-3.5 mr-1" />
              View All
            </>
          )}
        </Button>
      </div>

      {/* Empty state */}
      {Object.keys(groupedEntries).length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <Calendar className="size-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No results found{!showAll ? ' in the last 7 days' : ''}.</p>
            {!showAll && (
              <Button
                onClick={() => setShowAll(true)}
                variant="link"
                size="sm"
                className="text-purple-600 mt-1"
              >
                View all history
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grouped entries by date */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {Object.entries(groupedEntries).map(([dateKey, entries]) => {
          const fullCount = entries.filter((e) => e.status === 'full').length;
          return (
            <Card key={dateKey} className="border-gray-200 shadow-sm overflow-hidden">
              {/* Date header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-700">{dateKey}</span>
                </div>
                <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {fullCount}/{entries.length} posted
                </span>
              </div>

              {/* Slot entries */}
              <div className="divide-y divide-gray-50">
                {entries.map((entry, idx) => (
                  <div
                    key={`${entry.slotIndex}-${entry.day}`}
                    className={`flex items-center gap-3 px-4 py-2 text-sm ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <StatusDot status={entry.status} />
                    <div className="flex items-center gap-1.5 min-w-[100px]">
                      <Clock className="size-3 text-gray-400" />
                      <span className="text-gray-600 text-xs">{entry.slotLabel}</span>
                    </div>
                    <span className={`font-mono font-semibold text-sm ml-auto ${
                      entry.status === 'full'
                        ? 'text-gray-800'
                        : 'text-gray-300'
                    }`}>
                      {entry.result !== null && entry.result !== undefined
                        ? String(entry.result).padStart(2, '0')
                        : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
