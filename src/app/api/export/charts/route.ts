import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const charts = await db.monthlyChart.findMany({
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

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `rdl-charts-export-${timestamp}.json`;

    return new NextResponse(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export charts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

