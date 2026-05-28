import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear, getDaysInMonth } from '@/lib/ist-date';

const SLOT_FIELDS = [
  'slot1',
  'slot2',
  'slot3',
  'slot4',
  'slot5',
  'slot6',
];

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, slots } = body;

    // Determine target date
    let targetDay: number;
    let targetMonth: number;
    let targetYear: number;

    if (date) {
      const parsed = new Date(date);
      targetDay = parsed.getDate();
      targetMonth = parsed.getMonth() + 1;
      targetYear = parsed.getFullYear();
    } else {
      const today = getISTDay();
      const currentMonth = getISTMonth();
      const currentYear = getISTYear();
      targetDay = today;
      targetMonth = currentMonth;
      targetYear = currentYear;
    }

    // Validate day is within month
    const daysInMonth = getDaysInMonth(targetMonth, targetYear);
    if (targetDay < 1 || targetDay > daysInMonth) {
      return NextResponse.json(
        { error: `Day must be between 1 and ${daysInMonth} for month ${targetMonth}` },
        { status: 400 }
      );
    }

    // Get or create chart for that month
    let chart = await db.monthlyChart.findUnique({
      where: { month_year: { month: targetMonth, year: targetYear } },
    });

    if (!chart) {
      chart = await db.monthlyChart.create({
        data: { month: targetMonth, year: targetYear, visible: true },
      });
    }

    // Build update data from slots - each slot has a single result number
    const updateData: Record<string, number | null> = {};
    for (const slotEntry of slots) {
      const slotIndex = slotEntry.slotIndex as number;
      if (slotIndex < 1 || slotIndex > 6) continue;

      const field = SLOT_FIELDS[slotIndex - 1];
      const val = slotEntry.result;

      if (val !== undefined) {
        if (val !== null && (val < 0 || val > 99)) {
          return NextResponse.json(
            { error: `Slot ${slotIndex} result must be 0-99 or null` },
            { status: 400 }
          );
        }
        updateData[field] = val;
      }
    }

    // Get or create day data
    let dayData = await db.dayData.findUnique({
      where: { chartId_day: { chartId: chart.id, day: targetDay } },
    });

    if (!dayData) {
      dayData = await db.dayData.create({
        data: {
          day: targetDay,
          chartId: chart.id,
          ...updateData,
        },
      });
    } else {
      dayData = await db.dayData.update({
        where: { id: dayData.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, dayData });
  } catch (error) {
    console.error('Bulk results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

