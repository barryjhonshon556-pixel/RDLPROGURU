import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

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
    const { chartId, day, timeSlot, result } = body;

    if (!chartId || day === undefined || !timeSlot) {
      return NextResponse.json(
        { error: 'chartId, day, and timeSlot are required' },
        { status: 400 }
      );
    }

    if (timeSlot < 1 || timeSlot > 6) {
      return NextResponse.json(
        { error: 'timeSlot must be between 1 and 6' },
        { status: 400 }
      );
    }

    if (result !== null && (result < 0 || result > 99)) {
      return NextResponse.json(
        { error: 'result must be between 0 and 99 or null' },
        { status: 400 }
      );
    }

    // Verify chart exists
    const chart = await db.monthlyChart.findUnique({ where: { id: chartId } });
    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    const slotField = SLOT_FIELDS[timeSlot];

    // Get or create day data for this chart/day
    let dayData = await db.dayData.findUnique({
      where: { chartId_day: { chartId, day } },
    });

    if (!dayData) {
      dayData = await db.dayData.create({
        data: {
          day,
          chartId,
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
    console.error('Edit result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

