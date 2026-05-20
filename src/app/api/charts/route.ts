import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // If showing all (including hidden), require admin
    if (showAll) {
      const admin = await getCurrentAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const charts = await db.monthlyChart.findMany({
      where: showAll ? {} : { visible: true },
      include: {
        days: {
          orderBy: { day: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const result = charts.map((chart) => ({
      id: chart.id,
      month: chart.month,
      year: chart.year,
      visible: chart.visible,
      days: chart.days.map((d) => ({
        day: d.day,
        slot1: d.slot1,
        slot2: d.slot2,
        slot3: d.slot3,
        slot4: d.slot4,
        slot5: d.slot5,
        slot6: d.slot6,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Charts list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
