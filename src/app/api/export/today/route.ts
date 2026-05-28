import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { TIME_SLOTS } from '@/lib/constants';
import { getISTDay, getISTMonth, getISTYear, getISTDateString } from '@/lib/ist-date';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getISTDay();
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const dateStr = getISTDateString();

    const chart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
      include: {
        days: {
          where: { day: today },
        },
      },
    });

    const dayData = chart?.days[0] ?? null;

    const slots = TIME_SLOTS.map((slot, index) => {
      const slotNum = index + 1;
      const key = `slot${slotNum}` as keyof typeof dayData;
      const resultVal = dayData ? (dayData[key] as number | null) : null;

      return {
        slotIndex: slotNum,
        time: slot.label,
        result: resultVal,
      };
    });

    const result = {
      exportDate: dateStr,
      exportedAt: new Date().toISOString(),
      results: { date: dateStr, slots },
    };

    const filename = `rdl-today-results-${dateStr}.json`;

    return new NextResponse(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export today error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

