import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chartId, visible } = body;

    if (!chartId || visible === undefined) {
      return NextResponse.json(
        { error: 'chartId and visible are required' },
        { status: 400 }
      );
    }

    const chart = await db.monthlyChart.findUnique({ where: { id: chartId } });
    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    const updated = await db.monthlyChart.update({
      where: { id: chartId },
      data: { visible: Boolean(visible) },
    });

    return NextResponse.json({ success: true, chart: updated });
  } catch (error) {
    console.error('Visibility toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
