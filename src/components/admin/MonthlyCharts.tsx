'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  Copy,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Trash2,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-fetch';
import {
  TIME_SLOTS,
  type ChartDayData,
} from '@/hooks/useResults';
import { MONTH_NAMES } from '@/lib/constants';
import { getClientISTDate, getDaysInMonth } from '@/lib/ist-date';

interface ChartInfo {
  id: string;
  month: number;
  year: number;
  visible: boolean;
  days: ChartDayData[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Format a full date string like "21 May 2025, Wednesday" */
function formatFullDate(day: number, month: number, year: number): string {
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[month] || 'Unknown';
  return `${day} ${monthName} ${year}, ${dayName}`;
}

/** Format a short date string like "21 May 2025, Wed" */
function formatShortDate(day: number, month: number, year: number): string {
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES_SHORT[date.getDay()];
  const monthName = MONTH_NAMES[month] || 'Unknown';
  return `${day} ${monthName} ${year}, ${dayName}`;
}

export default function MonthlyCharts() {
  // Month Setup
  const istNow = getClientISTDate();
  const [month, setMonth] = useState(String(istNow.month));
  const [year, setYear] = useState(String(istNow.year));
  const [initLoading, setInitLoading] = useState(false);
  const [quickSetupLoading, setQuickSetupLoading] = useState(false);

  // Daily Entry
  const [selectedChartId, setSelectedChartId] = useState('');
  const [day, setDay] = useState(String(istNow.day));
  const [daySlots, setDaySlots] = useState<Record<string, string>>({});
  const [dayLoading, setDayLoading] = useState(false);
  const [initDayLoading, setInitDayLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Saved Charts - always show all charts in admin panel
  const [showHidden, setShowHidden] = useState(true);
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch charts - admin panel always fetches all charts
  const fetchCharts = useCallback(async (autoSelect = false) => {
    try {
      setChartsLoading(true);
      const res = await adminFetch('/api/charts?all=true');
      if (!res.ok) throw new Error('Failed to fetch charts');
      const data = await res.json();
      // API returns an array directly
      const chartsList = Array.isArray(data) ? data : data.charts || [];
      setCharts(chartsList);
      // Auto-select current month's chart if none selected
      if (autoSelect) {
        setSelectedChartId((prev) => {
          if (!prev && chartsList.length > 0) {
            // Try to find current month's chart first (IST timezone)
            const { month: currentMonth, year: currentYear } = getClientISTDate();
            const currentChart = chartsList.find(
              (c: ChartInfo) => c.month === currentMonth && c.year === currentYear
            );
            return currentChart?.id || chartsList[0].id;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Fetch charts error:', err);
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharts(true);
  }, [fetchCharts]);

  // Auto-select today's day when chart is selected
  useEffect(() => {
    if (selectedChartId) {
      const chart = charts.find((c) => c.id === selectedChartId);
      if (chart) {
        const { day: istDay, month: currentMonth, year: currentYear } = getClientISTDate();
        // If it's the current month, set day to today
        if (chart.month === currentMonth && chart.year === currentYear) {
          setDay(String(istDay));
        }
      }
    }
  }, [selectedChartId, charts]);

  // Check if day is initialized in selected chart
  const selectedChart = charts.find((c) => c.id === selectedChartId);
  const dayNum = parseInt(day, 10);
  const dayData = selectedChart?.days.find((d) => d.day === dayNum);
  const dayNotInitialized = selectedChart && !dayData;

  // Compute full date display for selected day
  const selectedDateDisplay = selectedChart
    ? formatFullDate(dayNum, selectedChart.month, selectedChart.year)
    : '';

  // Populate day slots when chart/day changes
  useEffect(() => {
    if (dayData) {
      const slots: Record<string, string> = {};
      for (let i = 1; i <= 6; i++) {
        const key = `slot${i}`;
        const val = dayData[key as keyof ChartDayData] as number | null;
        slots[key] = val !== null ? String(val) : '';
      }
      setDaySlots(slots);
    } else {
      const slots: Record<string, string> = {};
      for (let i = 1; i <= 6; i++) {
        slots[`slot${i}`] = '';
      }
      setDaySlots(slots);
    }
  }, [dayData, selectedChartId, day]);

  const handleQuickSetup = async () => {
    setQuickSetupLoading(true);
    const { month: istMonth, year: istYear } = getClientISTDate();
    let created = 0;
    let skipped = 0;

    // Initialize past 6 months + current month + next month (8 total)
    for (let offset = -6; offset <= 1; offset++) {
      const targetDate = new Date(istYear, istMonth - 1 - offset, 1);
      const m = targetDate.getMonth() + 1;
      const y = targetDate.getFullYear();

      try {
        const res = await adminFetch('/api/charts/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: m, year: y }),
        });
        const data = await res.json();
        if (res.ok && data.chart) {
          created++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    toast.success(`Quick setup complete: ${created} created, ${skipped} already existed`);
    fetchCharts();
    setQuickSetupLoading(false);
  };

  const handleInitializeMonth = async () => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(m) || m < 1 || m > 12) {
      toast.error('Please select a valid month');
      return;
    }
    if (isNaN(y) || y < 2020 || y > 2099) {
      toast.error('Please enter a valid year');
      return;
    }

    setInitLoading(true);
    try {
      const res = await adminFetch('/api/charts/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: m, year: y }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize chart');

      // API returns { success, chart } or { success, message, chart }
      const chartId = data.chart?.id;
      toast.success(data.message || `Chart initialized for ${MONTHS[m - 1]} ${y}`);
      if (chartId) setSelectedChartId(chartId);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initialize chart');
    } finally {
      setInitLoading(false);
    }
  };

  const handleInitializeDay = async () => {
    if (!selectedChartId) {
      toast.error('Please select a chart first');
      return;
    }

    setInitDayLoading(true);
    try {
      const res = await adminFetch('/api/charts/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: selectedChartId, day: dayNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize day');
      toast.success(data.message);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initialize day');
    } finally {
      setInitDayLoading(false);
    }
  };

  const handleCopyLive = async () => {
    if (!selectedChartId) {
      toast.error('Please select a chart first');
      return;
    }

    setCopyLoading(true);
    try {
      const res = await adminFetch('/api/charts/copy-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: selectedChartId, day: dayNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to copy results');
      toast.success('Live results copied successfully');
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to copy results');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleSaveDay = async () => {
    if (!selectedChartId) {
      toast.error('Please select a chart first');
      return;
    }

    setDayLoading(true);
    try {
      const slotData: Record<string, number | null> = {};
      for (let i = 1; i <= 6; i++) {
        const key = `slot${i}`;
        const val = daySlots[key];
        slotData[key] = val !== '' ? parseInt(val, 10) : null;
      }

      const res = await adminFetch('/api/charts/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: selectedChartId, day: dayNum, slotData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save day');

      toast.success(data.message);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save day');
    } finally {
      setDayLoading(false);
    }
  };

  const handleSyncChart = async () => {
    if (!selectedChartId) {
      toast.error('Please select a chart first');
      return;
    }

    setSyncLoading(true);
    try {
      const res = await adminFetch('/api/charts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: selectedChartId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync chart');

      toast.success(data.message || `Synced: ${data.daysCreated} day(s) created`);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync chart');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleToggleVisibility = async (chartId: string, visible: boolean) => {
    try {
      const res = await adminFetch('/api/charts/visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, visible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle visibility');
      toast.success(`Chart ${visible ? 'shown' : 'hidden'}`);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  const updateDaySlot = useCallback((field: string, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const clamped = sanitized === '' ? '' : String(Math.min(99, parseInt(sanitized, 10)));
    setDaySlots((prev) => ({ ...prev, [field]: clamped }));
  }, []);

  const startEditDay = useCallback((chartId: string, dayInfo: ChartDayData) => {
    const key = `${chartId}-${dayInfo.day}`;
    setEditingDay(key);
    const slots: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      const val = dayInfo[`slot${i}` as keyof ChartDayData] as number | null;
      slots[`slot${i}`] = val !== null ? String(val) : '';
    }
    setEditSlots(slots);
  }, []);

  const handleSaveEditDay = async (chartId: string, editDayNum: number) => {
    const slotData: Record<string, number | null> = {};
    for (let i = 1; i <= 6; i++) {
      const key = `slot${i}`;
      const val = editSlots[key];
      slotData[key] = val !== '' ? parseInt(val, 10) : null;
    }

    try {
      const res = await adminFetch('/api/charts/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId, day: editDayNum, slotData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(`Day ${editDayNum} updated`);
      setEditingDay(null);
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const updateEditSlot = useCallback((field: string, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const clamped = sanitized === '' ? '' : String(Math.min(99, parseInt(sanitized, 10)));
    setEditSlots((prev) => ({ ...prev, [field]: clamped }));
  }, []);

  const handleDeleteChart = async (chartId: string) => {
    setDeleteLoading(true);
    try {
      const res = await adminFetch('/api/charts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete chart');
      toast.success(data.message || 'Chart deleted');
      setDeleteConfirmId(null);
      // Clear selected chart if it was deleted
      if (selectedChartId === chartId) setSelectedChartId('');
      fetchCharts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete chart');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getMonthName = (m: number) => MONTHS[m - 1] || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Month Setup */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Month Setup</h3>

          {/* Quick Setup */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Quick Setup</p>
                <p className="text-[11px] text-blue-600">Initializes charts for the past 6 months + current + next month</p>
              </div>
            </div>
            <Button
              onClick={handleQuickSetup}
              disabled={quickSetupLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              {quickSetupLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              Quick Setup
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Label className="text-gray-700">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-full sm:w-28">
              <Label className="text-gray-700">Year</Label>
              <Input
                type="number"
                min={2020}
                max={2099}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleInitializeMonth}
              disabled={initLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto"
            >
              {initLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckSquare className="size-4" />
              )}
              Initialize Month Chart
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Smart initialization: Past months get all days, current month gets days up to today, future months get empty shells. New months auto-create on first site visit.
          </p>
        </CardContent>
      </Card>

      {/* Daily Entry */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Daily Entry</h3>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Label className="text-gray-700">Chart</Label>
              <Select value={selectedChartId} onValueChange={setSelectedChartId}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select a chart" />
                </SelectTrigger>
                <SelectContent>
                  {charts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getMonthName(c.month)} {c.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-full sm:w-24">
              <Label className="text-gray-700">Day</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Full date display */}
          {selectedChartId && selectedChart && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <CalendarDays className="size-4 text-gray-500 shrink-0" />
              <span className="font-medium">{selectedDateDisplay}</span>
            </div>
          )}

          {dayNotInitialized && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <AlertTriangle className="size-4 shrink-0" />
              <span>This day is not initialized yet. Click &quot;Initialize Day&quot; or &quot;Sync to Today&quot; below.</span>
            </div>
          )}

          {/* 6 time slot cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TIME_SLOTS.map((slot) => {
              const slotKey = `slot${slot.index}`;
              const hasVal = dayData?.[`slot${slot.index}` as keyof ChartDayData] !== null;

              return (
                <Card key={slot.index} className="border border-gray-200">
                  <CardContent className="p-2.5 space-y-2">
                    <p className="text-xs font-semibold text-blue-600 text-center">
                      {slot.label}
                    </p>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">Result</Label>
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        placeholder={hasVal ? '' : '—'}
                        value={daySlots[slotKey] ?? ''}
                        onChange={(e) => updateDaySlot(slotKey, e.target.value)}
                        className="h-8 text-center text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleInitializeDay}
              disabled={initDayLoading || !selectedChartId}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {initDayLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckSquare className="size-3.5" />}
              Initialize Day
            </Button>
            <Button
              onClick={handleSyncChart}
              disabled={syncLoading || !selectedChartId}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {syncLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Sync to Today
            </Button>
            <Button
              onClick={handleCopyLive}
              disabled={copyLoading || !selectedChartId}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
              Copy Live Results
            </Button>
            <Button
              onClick={handleSaveDay}
              disabled={dayLoading || !selectedChartId}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {dayLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Day In Chart
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Workflow: Initialize the day first, then either copy live results or enter manually, then save. Use &quot;Sync to Today&quot; to backfill any missing days for the selected chart.
          </p>
        </CardContent>
      </Card>

      {/* Saved Month Charts */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Saved Month Charts</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={(checked) => setShowHidden(checked === true)}
              />
              <Label htmlFor="show-hidden" className="text-sm text-gray-600 cursor-pointer">
                Show hidden
              </Label>
            </div>
          </div>

          {chartsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : charts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No charts found. Initialize a month chart above to get started.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {charts.map((chart: ChartInfo) => (
                <div key={chart.id} className="border border-gray-200 rounded-lg">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedChart(expandedChart === chart.id ? null : chart.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      {expandedChart === chart.id ? (
                        <ChevronUp className="size-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="size-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {getMonthName(chart.month)} {chart.year}
                        </p>
                        <p className="text-xs text-gray-500">
                          {chart.days.length} day{chart.days.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge
                        variant={chart.visible ? 'default' : 'secondary'}
                        className={
                          chart.visible
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }
                      >
                        {chart.visible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(chart.id, !chart.visible);
                        }}
                        className="text-xs"
                      >
                        {chart.visible ? 'Hide' : 'Show'}
                      </Button>
                      {deleteConfirmId === chart.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChart(chart.id);
                            }}
                            disabled={deleteLoading}
                            className="text-xs h-7"
                          >
                            {deleteLoading ? <Loader2 className="size-3 animate-spin" /> : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="text-xs h-7"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(chart.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedChart === chart.id && (
                    <div className="border-t border-gray-100 p-3 space-y-2">
                      {chart.days.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-3">
                          No days initialized yet.
                        </p>
                      ) : (
                        chart.days.map((dayInfo: ChartDayData) => {
                          const editKey = `${chart.id}-${dayInfo.day}`;
                          const isEditing = editingDay === editKey;
                          const dayDateStr = formatShortDate(dayInfo.day, chart.month, chart.year);

                          return (
                            <div
                              key={dayInfo.day}
                              className="flex flex-col gap-2 p-2 bg-gray-50 rounded-md"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">
                                  Day {dayInfo.day} <span className="font-normal text-gray-500">— {dayDateStr}</span>
                                </span>
                                {!isEditing ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-6"
                                    onClick={() => startEditDay(chart.id, dayInfo)}
                                  >
                                    Edit
                                  </Button>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-6 text-blue-600"
                                      onClick={() => handleSaveEditDay(chart.id, dayInfo.day)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-6"
                                      onClick={() => setEditingDay(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {TIME_SLOTS.map((slot) => {
                                    const slotKey = `slot${slot.index}`;
                                    return (
                                      <div key={slot.index} className="text-center">
                                        <p className="text-[9px] text-blue-500 mb-0.5">
                                          {slot.label}
                                        </p>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={99}
                                          value={editSlots[slotKey] ?? ''}
                                          onChange={(e) => updateEditSlot(slotKey, e.target.value)}
                                          className="h-6 text-[10px] text-center p-0"
                                          placeholder="--"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {TIME_SLOTS.map((slot) => {
                                    const val = dayInfo[`slot${slot.index}` as keyof ChartDayData] as number | null;
                                    return (
                                      <div key={slot.index} className="text-center text-[10px]">
                                        <p className="text-blue-500">{slot.label}</p>
                                        <p className="text-gray-700">
                                          {val !== null ? String(val).padStart(2, '0') : '—'}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
