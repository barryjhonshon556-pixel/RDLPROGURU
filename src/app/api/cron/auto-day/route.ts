import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear } from '@/lib/ist-date';

const CRON_SECRET = process.env.CRON_SECRET || 'rdl-cron-secret-2026';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Allow either admin auth or cron secret for automated triggers
    const admin = await getCurrentAdmin();
    if (!admin) {
      // Check for cron secret in header or query param
      const authHeader = request.headers.get('authorization');
      const cronKey = request.nextUrl.searchParams.get('key');
      const providedSecret = authHeader?.replace('Bearer ', '') || cronKey;

      if (providedSecret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = getISTDay();
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();

    // Find or create the current month's chart
    let chart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
    });

    let chartCreated = false;
    let daysCreated = 0;

    if (!chart) {
      // Create the chart with all days from 1 to today
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
      chartCreated = true;
      daysCreated = today;
    } else {
      // Backfill ALL missing days from 1 to today
      const existingDays = await db.dayData.findMany({
        where: { chartId: chart.id },
        select: { day: true },
      });
      const existingDaySet = new Set(existingDays.map((d) => d.day));

      const missingDays: { day: number; chartId: string }[] = [];
      for (let d = 1; d <= today; d++) {
        if (!existingDaySet.has(d)) {
          missingDays.push({ day: d, chartId: chart.id });
        }
      }

      if (missingDays.length > 0) {
        await db.dayData.createMany({
          data: missingDays,
          skipDuplicates: true,
        });
        daysCreated = missingDays.length;
      }
    }

    return NextResponse.json({
      success: true,
      chartCreated,
      daysCreated,
      month: currentMonth,
      year: currentYear,
      day: today,
    });
  } catch (error) {
    console.error('Auto-day error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
