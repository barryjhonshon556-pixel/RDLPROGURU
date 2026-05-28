import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TIME_SLOTS } from '@/lib/constants';
import { getISTDay, getISTMonth, getISTYear, getISTDateString } from '@/lib/ist-date';

export async function GET() {
  try {
    const today = getISTDay();
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const dateStr = getISTDateString();

    // Ensure current month's chart exists
    let chart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
    });

    if (!chart) {
      // Auto-create the chart with all days from 1 to today
      const dayDataArray = [];
      for (let d = 1; d <= today; d++) {
        dayDataArray.push({ day: d });
      }

      chart = await db.monthlyChart.create({
        data: {
          month: currentMonth,
          year: currentYear,
          visible: true,
          days: {
            create: dayDataArray,
          },
        },
      });
    } else {
      // Backfill any missing days between 1 and today
      const existingDays = await db.dayData.findMany({
        where: { chartId: chart.id },
        select: { day: true },
      });
      const existingDaySet = new Set(existingDays.map((d) => d.day));

      const missingDays: { day: number }[] = [];
      for (let d = 1; d <= today; d++) {
        if (!existingDaySet.has(d)) {
          missingDays.push({ day: d });
        }
      }

      if (missingDays.length > 0) {
        await db.dayData.createMany({
          data: missingDays.map((d) => ({ day: d.day, chartId: chart.id })),
        });
      }
    }

    // Ensure today's day data exists (guaranteed after backfill, but safe check)
    let dayData = await db.dayData.findUnique({
      where: { chartId_day: { chartId: chart.id, day: today } },
    });

    if (!dayData) {
      dayData = await db.dayData.create({
        data: {
          day: today,
          chartId: chart.id,
        },
      });
    }

    // Build the response - single result number per slot
    const slots = TIME_SLOTS.map((slot, index) => {
      const slotNum = index + 1;
      const key = `slot${slotNum}` as keyof typeof dayData;
      const resultVal = dayData ? (dayData[key] as number | null) : null;

      return {
        slotIndex: slotNum,
        time: slot.label,
        label: `RDL Pro ${slot.label.replace(':00 ', '').replace(' ', '')}`,
        result: resultVal,
        timeLabel: slot.label,
      };
    });

    return NextResponse.json({ date: dateStr, slots });
  } catch (error) {
    console.error('Today results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
