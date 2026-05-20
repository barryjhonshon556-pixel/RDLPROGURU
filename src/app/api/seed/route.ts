import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getCurrentAdmin } from '@/lib/auth';
import { getISTDate, getISTDay, getISTMonth, getISTYear, getDaysInMonth } from '@/lib/ist-date';

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 100); // 0-99
}

export async function GET() {
  try {
    // Allow seed if: (1) admin is authenticated, OR (2) no admin exists yet (initial setup)
    const admin = await getCurrentAdmin();
    const adminCount = await db.admin.count();

    if (!admin && adminCount > 0) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Seed default admin if not exists
    const existingAdmin = await db.admin.findUnique({
      where: { username: 'admin' },
    });

    let adminCreated = false;
    if (!existingAdmin) {
      const hashed = await hashPassword('admin123');
      await db.admin.create({
        data: { username: 'admin', password: hashed },
      });
      adminCreated = true;
    }

    // Initialize current month's chart if not exists
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const today = getISTDay();

    const existingChart = await db.monthlyChart.findUnique({
      where: { month_year: { month: currentMonth, year: currentYear } },
    });

    let chartCreated = false;
    if (!existingChart) {
      // For current month: only create days up to today (future days added by cron)
      const dayDataArray = [];
      for (let d = 1; d <= today; d++) {
        dayDataArray.push({ day: d });
      }

      await db.monthlyChart.create({
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
    }

    // Also seed previous 5 months if they don't exist (with sample data)
    let pastChartsCreated = 0;
    for (let offset = 1; offset <= 5; offset++) {
      // Calculate past month in IST: subtract offset months from current IST date
      const istDate = getISTDate();
      istDate.setMonth(istDate.getMonth() - offset);
      const pastMonth = istDate.getMonth() + 1;
      const pastYear = istDate.getFullYear();

      const existingPastChart = await db.monthlyChart.findUnique({
        where: { month_year: { month: pastMonth, year: pastYear } },
      });

      if (!existingPastChart) {
        const pastDaysInMonth = getDaysInMonth(pastMonth, pastYear);
        const pastDayDataArray = [];
        for (let d = 1; d <= pastDaysInMonth; d++) {
          // Past months: fill all days with random 2-digit data
          pastDayDataArray.push({
            day: d,
            slot1: randomTwoDigit(),
            slot2: randomTwoDigit(),
            slot3: randomTwoDigit(),
            slot4: randomTwoDigit(),
            slot5: randomTwoDigit(),
            slot6: randomTwoDigit(),
          });
        }

        await db.monthlyChart.create({
          data: {
            month: pastMonth,
            year: pastYear,
            visible: true,
            days: {
              create: pastDayDataArray,
            },
          },
        });
        pastChartsCreated++;
      }
    }

    // Seed default site settings if not exists
    const defaultSettings = [
      { key: 'site_name', value: 'RDL Pro Matka' },
      { key: 'contact_number', value: '+91 98765 43210' },
      { key: 'notice_text', value: '' },
      { key: 'whatsapp_link', value: 'https://wa.me/919876543210' },
      { key: 'telegram_link', value: 'https://t.me/rdlpro' },
      { key: 'contact_name', value: 'RDL Pro' },
      { key: 'marquee_text', value: 'Welcome to RDL Pro Matka - Fastest Results Here!' },
      { key: 'banner_text', value: 'RDL PRO LIVE RESULT TODAY' },
    ];

    let settingsCreated = 0;
    for (const setting of defaultSettings) {
      const exists = await db.siteSettings.findUnique({
        where: { key: setting.key },
      });
      if (!exists) {
        await db.siteSettings.create({
          data: { key: setting.key, value: setting.value },
        });
        settingsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      adminCreated,
      chartCreated,
      pastChartsCreated,
      settingsCreated,
      message: `Seed complete. Admin ${adminCreated ? 'created (admin/admin123)' : 'already exists'}. Chart ${chartCreated ? 'created' : 'already exists'}. ${pastChartsCreated} past month charts created with sample data. ${settingsCreated} settings seeded.`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
