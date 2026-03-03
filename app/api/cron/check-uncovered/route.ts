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
    const todayStr = now.toISOString().split('T')[0];
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48hStr = in48h.toISOString().split('T')[0];
    const in24hStr = in24h.toISOString().split('T')[0];

    // Repas non couverts dans les 48h
    const { data: uncovered48h } = await admin
        .from('meals')
        .select('id, date, type')
        .eq('status', 'open')
        .gte('date', todayStr)
        .lte('date', in48hStr);

    // Repas non couverts dans les 24h
    const { data: uncovered24h } = await admin
        .from('meals')
        .select('id, date, type')
        .eq('status', 'open')
        .gte('date', todayStr)
        .lte('date', in24hStr);

    // Appeler le webhook n8n pour ارسال alertes
    const webhookUrl = process.env.N8N_UNCOVERED_WEBHOOK;
    if (webhookUrl && ((uncovered48h?.length ?? 0) > 0 || (uncovered24h?.length ?? 0) > 0)) {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '',
            },
            body: JSON.stringify({
                uncovered48h: uncovered48h ?? [],
                uncovered24h: uncovered24h ?? [],
                timestamp: now.toISOString(),
            }),
        }).catch((err) => console.error('[cron/check-uncovered] webhook error:', err));
    }

    console.log(`[cron/check-uncovered] 48h: ${uncovered48h?.length ?? 0}, 24h: ${uncovered24h?.length ?? 0}`);

    return NextResponse.json({
        ok: true,
        uncovered48h: uncovered48h?.length ?? 0,
        uncovered24h: uncovered24h?.length ?? 0,
    });
}
