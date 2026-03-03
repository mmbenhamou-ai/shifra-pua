import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    // Vérifier l'authentification Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const admin = createAdminClient();
    const now = new Date();
    // Trouver le vendredi prochain
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    const nextSaturday = new Date(nextFriday);
    nextSaturday.setDate(nextFriday.getDate() + 1);

    const fridayStr = nextFriday.toISOString().split('T')[0];
    const saturdayStr = nextSaturday.toISOString().split('T')[0];

    // Récap des repas de Shabbat
    const { data: shabbatMeals } = await admin
        .from('meals')
        .select(`
      id, date, type, status,
      cook:cook_id(name, phone),
      driver:driver_id(name, phone),
      beneficiary:beneficiary_id(user:user_id(name, phone, address))
    `)
        .in('date', [fridayStr, saturdayStr])
        .in('type', ['shabbat_friday', 'shabbat_saturday'])
        .order('date', { ascending: true });

    const uncovered = (shabbatMeals ?? []).filter(
        (m) => m.status === 'open' || m.status === 'cook_assigned',
    );

    // Appeler le webhook n8n pour le récap
    const webhookUrl = process.env.N8N_SHABBAT_RECAP_WEBHOOK;
    if (webhookUrl) {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '',
            },
            body: JSON.stringify({
                friday: fridayStr,
                saturday: saturdayStr,
                meals: shabbatMeals ?? [],
                uncovered,
                timestamp: now.toISOString(),
            }),
        }).catch((err) => console.error('[cron/shabbat-recap] webhook error:', err));
    }

    console.log(`[cron/shabbat-recap] Shabbat ${fridayStr}: ${shabbatMeals?.length ?? 0} repas, ${uncovered.length} non couverts`);

    return NextResponse.json({
        ok: true,
        friday: fridayStr,
        total: shabbatMeals?.length ?? 0,
        uncovered: uncovered.length,
    });
}
