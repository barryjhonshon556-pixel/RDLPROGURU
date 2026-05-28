import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear, getDaysInMonth } from '@/lib/ist-date';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body;

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid month (1-12) and year are required' },
        { status: 400 }
      );
    }

    // Check if chart already exists
    const existing = await db.monthlyChart.findUnique({
      where: { month_year: { month, year } },
      include: { days: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Chart already exists',
        chart: existing,
      });
    }

    // Determine how many days to create based on the month type
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const today = getISTDay();

    let daysToCreate: number;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      // PAST month: create ALL days (month is complete)
      daysToCreate = getDaysInMonth(month, year);
    } else if (year === currentYear && month === currentMonth) {
      // CURRENT month: only create days 1 through today
      daysToCreate = today;
    } else {
      // FUTURE month: create NO days (just empty chart shell)
      daysToCreate = 0;
    }

    const dayDataArray = [];
    for (let d = 1; d <= daysToCreate; d++) {
      dayDataArray.push({ day: d });
    }

    const chart = await db.monthlyChart.create({
      data: {
        month,
        year,
        visible: true,
        days: {
          create: dayDataArray,
        },
      },
      include: {
        days: { orderBy: { day: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, chart });
  } catch (error) {
    console.error('Initialize chart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

