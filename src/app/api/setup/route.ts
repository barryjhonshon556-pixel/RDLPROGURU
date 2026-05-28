import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getISTDay, getISTMonth, getISTYear, getDaysInMonth } from '@/lib/ist-date';

function randomTwoDigit(): number {
  return Math.floor(Math.random() * 100); // 0-99
}

/**
 * Initial Setup Endpoint - PUBLIC (no auth required)
 * 
 * This endpoint ONLY works when no admin exists in the database.
 * It creates the default admin account, current month chart, 
 * past 5 months charts with sample data, and default site settings.
 * 
 * After the first admin is created, this endpoint returns 403.
 * Use /api/seed (requires auth) for re-seeding after initial setup.
 */
export async function POST() {
  try {
    // SECURITY: Only allow setup if no admin exists yet
    const existingAdmin = await db.admin.findFirst();
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup already completed. Admin account exists. Use /api/seed instead.', setupAvailable: false },
        { status: 403 }
      );
    }

    // 1. Create default admin account
    const hashedPassword = await hashPassword('admin123');
    await db.admin.create({
      data: { username: 'admin', password: hashedPassword },
    });

    // 2. Initialize current month's chart with days up to today
    const currentMonth = getISTMonth();
    const currentYear = getISTYear();
    const today = getISTDay();

    const dayDataArray = [];
    for (let d = 1; d <= today; d++) {
      dayDataArray.push({ day: d });
    }

    await db.monthlyChart.create({
      data: {
        month: currentMonth,
        year: currentYear,
        visible: true,
        days: { create: dayDataArray },
      },
    });

    // 3. Create past 5 months charts with SAMPLE DATA so site looks populated
    const istDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Calcutta' }));
    for (let offset = 1; offset <= 5; offset++) {
      const pastDate = new Date(istDate);
      pastDate.setMonth(pastDate.getMonth() - offset);
      const pastMonth = pastDate.getMonth() + 1;
      const pastYear = pastDate.getFullYear();

      const existingPastChart = await db.monthlyChart.findUnique({
        where: { month_year: { month: pastMonth, year: pastYear } },
      });

      if (!existingPastChart) {
        const pastDaysInMonth = getDaysInMonth(pastMonth, pastYear);
        const pastDayDataArray = [];
        for (let d = 1; d <= pastDaysInMonth; d++) {
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
            days: { create: pastDayDataArray },
          },
        });
      }
    }

    // 4. Seed default site settings
    const defaultSettings = [
      { key: 'site_name', value: 'RDL Pro Matka' },
      { key: 'contact_number', value: '+91 98765 43210' },
      { key: 'notice_text', value: '⚠️ This is a gambling results site. Play responsibly. We are not responsible for any financial losses.' },
      { key: 'whatsapp_link', value: 'https://wa.me/919876543210' },
      { key: 'telegram_link', value: 'https://t.me/rdlpro' },
      { key: 'contact_name', value: 'RDL Pro' },
      { key: 'marquee_text', value: 'Welcome to RDL Pro Matka - Fastest Results Here!' },
      { key: 'banner_text', value: 'RDL PRO LIVE RESULT TODAY' },
    ];

    for (const setting of defaultSettings) {
      await db.siteSettings.upsert({
        where: { key: setting.key },
        update: {},
        create: { key: setting.key, value: setting.value },
      });
    }

    return NextResponse.json({
      success: true,
      setupAvailable: false,
      adminCreated: true,
      chartsCreated: true,
      message: 'Setup complete! Admin account created with username "admin" and password "admin123". IMPORTANT: Change the password immediately after first login. Store these credentials securely.',
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed. Please check your DATABASE_URL in .env and try again.' },
      { status: 500 }
    );
  }
}

/** GET: Check if initial setup is needed */
export async function GET() {
  try {
    const adminCount = await db.admin.count();
    const needsSetup = adminCount === 0;

    return NextResponse.json({
      needsSetup,
      message: needsSetup
        ? 'No admin account found. POST to /api/setup to create initial admin.'
        : 'Setup already completed.',
    });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Database not configured. Check DATABASE_URL in .env' },
      { status: 500 }
    );
  }
}
