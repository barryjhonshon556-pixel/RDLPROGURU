import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

/** Initialize a blank day in a chart */
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chartId, day, slotData } = await request.json();

    if (!chartId) {
      return NextResponse.json({ error: 'Chart ID is required' }, { status: 400 });
    }

    if (!day || day < 1 || day > 31) {
      return NextResponse.json({ error: 'Invalid day (1-31)' }, { status: 400 });
    }

    // Verify chart exists
    const chart = await db.monthlyChart.findUnique({ where: { id: chartId } });
    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
    }

    const data: Record<string, number | null> = {};
    if (slotData) {
      // Save provided slot data with validation - single number per slot
      const VALID_SLOT_KEYS = new Set([
        'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6',
      ]);

      for (let i = 1; i <= 6; i++) {
        const key = `slot${i}`;
        const val = slotData[key];

        // Validate: must be null, undefined, or 0-99
        if (val !== null && val !== undefined) {
          if (typeof val !== 'number' || val < 0 || val > 99 || !Number.isInteger(val)) {
            return NextResponse.json(
              { error: `Invalid value for ${key}: must be integer 0-99 or null` },
              { status: 400 }
            );
          }
        }

        data[key] = val ?? null;
      }

      // SECURITY: Reject any keys that aren't valid slot fields
      for (const key of Object.keys(slotData)) {
        if (!VALID_SLOT_KEYS.has(key)) {
          return NextResponse.json(
            { error: `Invalid slot key: ${key}` },
            { status: 400 }
          );
        }
      }
    }

    await db.dayData.upsert({
      where: {
        chartId_day: { chartId, day },
      },
      update: data,
      create: {
        chartId,
        day,
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Day ${day} ${slotData ? 'saved' : 'initialized'} successfully`,
    });
  } catch (error) {
    console.error('Save day error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
