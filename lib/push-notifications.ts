import webpush from 'web-push';
import { createAdminClient } from './supabase-admin';

// Initialize web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@shifrapua.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
    const admin = createAdminClient();

    // Get all subscriptions for this user
    const { data: subs, error } = await admin
        .from('user_push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (error || !subs || subs.length === 0) {
        return;
    }

    const payload = JSON.stringify({
        title,
        body,
        url: url || '/profile',
        icon: '/icon-192x192.png', // Ensure this exists in public/
    });

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.auth,
                        p256dh: sub.p256dh,
                    }
                },
                payload
            );
        } catch (err: unknown) {
            const error = err as { statusCode?: number };
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription expired or gone, delete it
                await admin
                    .from('user_push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint);
            } else {
                console.error('Push error:', err);
            }
        }
    });

    await Promise.all(promises);
}

export async function sendGlobalPushNotification(audience: string, title: string, body: string, url?: string) {
    const admin = createAdminClient();

    let userQuery = admin.from('users').select('id').eq('approved', true);
    if (audience !== 'all') {
        userQuery = userQuery.eq('role', audience);
    }

    const { data: users } = await userQuery;
    if (!users || users.length === 0) return;

    const userIds = users.map(u => u.id);

    // Get all subscriptions for these users
    const { data: subs } = await admin
        .from('user_push_subscriptions')
        .select('*')
        .in('user_id', userIds);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
        title,
        body,
        url: url || '/profile',
        icon: '/icon-192x192.png',
    });

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.auth,
                        p256dh: sub.p256dh,
                    }
                },
                payload
            );
        } catch (err: unknown) {
            const error = err as { statusCode?: number };
            if (error.statusCode === 410 || error.statusCode === 404) {
                await admin
                    .from('user_push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint);
            }
        }
    });

    await Promise.all(promises);
}

export async function sendPushToAdmins(title: string, body: string, url?: string) {
    const admin = createAdminClient();

    // Get all admin users
    const { data: admins } = await admin
        .from('users')
        .select('id')
        .eq('role', 'admin');

    if (!admins || admins.length === 0) return;

    const adminIds = admins.map(a => a.id);

    // Get all subscriptions for these admins
    const { data: subs } = await admin
        .from('user_push_subscriptions')
        .select('*')
        .in('user_id', adminIds);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
        title,
        body,
        url: url || '/admin',
        icon: '/icon-192x192.png',
    });

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.auth,
                        p256dh: sub.p256dh,
                    }
                },
                payload
            );
        } catch (err: unknown) {
            const error = err as { statusCode?: number };
            if (error.statusCode === 410 || error.statusCode === 404) {
                await admin
                    .from('user_push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint);
            }
        }
    });

    await Promise.all(promises);
}
