import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

// SECURITY: Only allow these known setting keys to prevent arbitrary key injection
const ALLOWED_SETTING_KEYS = new Set([
  'site_name',
  'contact_number',
  'whatsapp_link',
  'telegram_link',
  'contact_name',
  'marquee_text',
  'banner_text',
  'notice_text',
]);

export async function GET() {
  try {
    const settings = await db.siteSettings.findMany({
      orderBy: { key: 'asc' },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      );
    }

    // SECURITY: Only allow known setting keys
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      return NextResponse.json(
        { error: `Unknown setting key: ${key}` },
        { status: 400 }
      );
    }

    // SECURITY: Limit value length
    if (typeof value === 'string' && value.length > 1000) {
      return NextResponse.json(
        { error: 'Setting value too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const setting = await db.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { error: 'settings array with { key, value } entries is required' },
        { status: 400 }
      );
    }

    for (const entry of settings) {
      if (!entry.key || entry.value === undefined) {
        return NextResponse.json(
          { error: 'Each setting must have key and value' },
          { status: 400 }
        );
      }
      // SECURITY: Only allow known setting keys
      if (!ALLOWED_SETTING_KEYS.has(entry.key)) {
        return NextResponse.json(
          { error: `Unknown setting key: ${entry.key}` },
          { status: 400 }
        );
      }
      // SECURITY: Limit value length
      if (typeof entry.value === 'string' && entry.value.length > 1000) {
        return NextResponse.json(
          { error: `Setting value too long for key: ${entry.key} (max 1000 characters)` },
          { status: 400 }
        );
      }
    }

    const results = [];
    for (const entry of settings) {
      const setting = await db.siteSettings.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
      results.push(setting);
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (error) {
    console.error('Batch update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
