import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear, getDaysInMonth } from '@/lib/ist-date';

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chartId } = body;

    if (!chartId) {
      return NextResponse.json({ error: 'chartId is required' }, { status: 400 });
    }

    const chart = await db.monthlyChart.findUnique({
      where: { id: chartId },
    });

    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Determine max day to create
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();

    let maxDay: number;
    if (chart.year < currentYear || (chart.year === currentYear && chart.month < currentMonth)) {
      // Past month - fill all days
      maxDay = getDaysInMonth(chart.month, chart.year);
    } else if (chart.year === currentYear && chart.month === currentMonth) {
      // Current month - up to today
      maxDay = getISTDay();
    } else {
      // Future month - no days to create
      maxDay = 0;
    }

    if (maxDay === 0) {
      return NextResponse.json({
        success: true,
        daysCreated: 0,
        message: 'Future month - no days to create',
      });
    }

    // Find existing days
    const existingDays = await db.dayData.findMany({
      where: { chartId: chart.id },
      select: { day: true },
    });
    const existingDaySet = new Set(existingDays.map((d) => d.day));

    // Create missing days
    const missingDays: { day: number; chartId: string }[] = [];
    for (let d = 1; d <= maxDay; d++) {
      if (!existingDaySet.has(d)) {
        missingDays.push({ day: d, chartId: chart.id });
      }
    }

    if (missingDays.length > 0) {
      await db.dayData.createMany({
        data: missingDays,
      });
    }

    return NextResponse.json({
      success: true,
      daysCreated: missingDays.length,
      maxDay,
      message: missingDays.length > 0
        ? `Created ${missingDays.length} missing day(s)`
        : 'All days already exist',
    });
  } catch (error) {
    console.error('Chart sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
