import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { endpoint, keys } = body.subscription;

        if (!endpoint || !keys?.auth || !keys?.p256dh) {
            return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
        }

        const { error } = await supabase
            .from('user_push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('Supabase UPSERT Error:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscription Endpoint Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
