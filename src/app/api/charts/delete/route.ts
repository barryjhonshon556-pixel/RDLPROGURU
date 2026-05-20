import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chartId } = body;

    if (!chartId || typeof chartId !== 'string') {
      return NextResponse.json(
        { error: 'chartId is required' },
        { status: 400 }
      );
    }

    // Verify the chart exists before deleting
    const chart = await db.monthlyChart.findUnique({
      where: { id: chartId },
    });

    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Delete the chart (cascade delete will remove all DayData rows)
    await db.monthlyChart.delete({
      where: { id: chartId },
    });

    return NextResponse.json({
      success: true,
      message: `Chart for month ${chart.month}/${chart.year} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete chart error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
