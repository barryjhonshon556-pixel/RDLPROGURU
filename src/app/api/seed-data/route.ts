import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear } from '@/lib/ist-date';

const SLOT_FIELDS = [
  'slot1',
  'slot2',
  'slot3',
  'slot4',
  'slot5',
  'slot6',
] as const;

type SlotField = typeof SLOT_FIELDS[number];

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 100); // 0-99
}

export async function GET() {
  // SECURITY: Require admin auth to prevent unauthorized data manipulation
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  // SECURITY: Check if data has already been seeded (one-time only)
  const seedFlag = await db.siteSettings.findUnique({
    where: { key: 'is_data_seeded' },
  });
  if (seedFlag && seedFlag.value === 'true') {
    return NextResponse.json(
      { error: 'Data already seeded. This operation can only be run once. Contact support to reset.' },
      { status: 403 }
    );
  }

  try {
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const today = getISTDay();

    // Get all monthly charts with their days
    const charts = await db.monthlyChart.findMany({
      include: { days: true },
    });

    let totalDaysUpdated = 0;
    let totalFieldsUpdated = 0;
    const chartSummaries: Array<{
      month: number;
      year: number;
      daysUpdated: number;
      fieldsUpdated: number;
    }> = [];

    for (const chart of charts) {
      const isCurrentMonth = chart.month === currentMonth && chart.year === currentYear;
      let chartDaysUpdated = 0;
      let chartFieldsUpdated = 0;

      for (const day of chart.days) {
        // For current month: only fill days up to today
        // For past months: fill all days
        if (isCurrentMonth && day.day > today) {
          continue;
        }

        // Build update data only for null fields
        const updateData: Partial<Record<SlotField, number>> = {};
        let fieldsForThisDay = 0;

        for (const field of SLOT_FIELDS) {
          const currentValue = day[field as keyof typeof day];
          if (currentValue === null || currentValue === undefined) {
            updateData[field] = randomTwoDigit();
            fieldsForThisDay++;
          }
        }

        // Only update if there are null fields to fill
        if (fieldsForThisDay > 0) {
          await db.dayData.update({
            where: { id: day.id },
            data: updateData,
          });
          chartDaysUpdated++;
          chartFieldsUpdated += fieldsForThisDay;
        }
      }

      totalDaysUpdated += chartDaysUpdated;
      totalFieldsUpdated += chartFieldsUpdated;
      chartSummaries.push({
        month: chart.month,
        year: chart.year,
        daysUpdated: chartDaysUpdated,
        fieldsUpdated: chartFieldsUpdated,
      });
    }

    // Set the one-time seeded flag
    await db.siteSettings.upsert({
      where: { key: 'is_data_seeded' },
      update: { value: 'true' },
      create: { key: 'is_data_seeded', value: 'true' },
    });

    return NextResponse.json({
      success: true,
      chartsProcessed: charts.length,
      totalDaysUpdated,
      totalFieldsUpdated,
      currentMonth: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      todayDate: today,
      chartSummaries,
      message: `Seeded random data for ${totalDaysUpdated} days (${totalFieldsUpdated} fields) across ${charts.length} charts. Current month only filled up to day ${today}.`,
    });
  } catch (error) {
    console.error('Seed-data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
