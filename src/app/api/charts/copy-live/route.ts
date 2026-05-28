import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear } from '@/lib/ist-date';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chartId, day } = body;

    if (!chartId || day === undefined) {
      return NextResponse.json(
        { error: 'chartId and day are required' },
        { status: 400 }
      );
    }

    // Verify target chart exists
    const targetChart = await db.monthlyChart.findUnique({
      where: { id: chartId },
    });
    if (!targetChart) {
      return NextResponse.json(
        { error: 'Target chart not found' },
        { status: 404 }
      );
    }

    // Get today's live results from the current month's chart
    const today = getISTDay();
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();

    const currentChart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
      include: {
        days: { where: { day: today } },
      },
    });

    if (!currentChart || currentChart.days.length === 0) {
      return NextResponse.json(
        { error: 'No live results found for today' },
        { status: 404 }
      );
    }

    const todayData = currentChart.days[0];

    // Get or create the day data in the target chart
    let targetDayData = await db.dayData.findUnique({
      where: { chartId_day: { chartId, day } },
    });

    const copyData = {
      slot1: todayData.slot1,
      slot2: todayData.slot2,
      slot3: todayData.slot3,
      slot4: todayData.slot4,
      slot5: todayData.slot5,
      slot6: todayData.slot6,
    };

    if (!targetDayData) {
      targetDayData = await db.dayData.create({
        data: {
          day,
          chartId,
          ...copyData,
        },
      });
    } else {
      targetDayData = await db.dayData.update({
        where: { id: targetDayData.id },
        data: copyData,
      });
    }

    return NextResponse.json({ success: true, dayData: targetDayData });
  } catch (error) {
    console.error('Copy live error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

