import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear } from '@/lib/ist-date';

const SLOT_FIELDS: Record<number, string> = {
  1: 'slot1',
  2: 'slot2',
  3: 'slot3',
  4: 'slot4',
  5: 'slot5',
  6: 'slot6',
};

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timeSlot, result } = body;

    if (timeSlot === undefined || timeSlot < 1 || timeSlot > 6) {
      return NextResponse.json(
        { error: 'timeSlot must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Validate number: must be 0-99
    if (result !== null && (result < 0 || result > 99)) {
      return NextResponse.json(
        { error: 'result must be between 0 and 99 or null' },
        { status: 400 }
      );
    }

    const today = getISTDay();
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();

    // Get or create current month's chart
    let chart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
    });

    if (!chart) {
      chart = await db.monthlyChart.create({
        data: { month: currentMonth, year: currentYear, visible: true },
      });
    }

    // Get or create today's DayData
    const slotField = SLOT_FIELDS[timeSlot];
    let dayData = await db.dayData.findUnique({
      where: { chartId_day: { chartId: chart.id, day: today } },
    });

    if (!dayData) {
      dayData = await db.dayData.create({
        data: {
          day: today,
          chartId: chart.id,
          [slotField]: result,
        },
      });
    } else {
      dayData = await db.dayData.update({
        where: { id: dayData.id },
        data: {
          [slotField]: result,
        },
      });
    }

    return NextResponse.json({ success: true, dayData });
  } catch (error) {
    console.error('Post result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

