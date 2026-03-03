import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    // Auth check: admin only
    const supabase = await createSupabaseServerClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const admin = createAdminClient();
    const { data: user } = await admin
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
    if (user?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

    const type = new URL(request.url).searchParams.get('type') ?? 'meals';
    const date = new Date().toISOString().split('T')[0];

    let csvContent = '';
    let filename = '';

    if (type === 'meals') {
        const { data } = await admin
            .from('meals')
            .select(
                'date, type, status, beneficiary:beneficiary_id(user:user_id(name, address)), cook:cook_id(name), driver:driver_id(name)',
            )
            .order('date', { ascending: false })
            .limit(1000);

        filename = `repas-${date}.csv`;
        csvContent = '\uFEFF'; // BOM for Excel UTF-8 compatibility
        csvContent += 'תאריך,סוג,סטטוס,יולדת,כתובת,מבשלת,מחלקת\n';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((m: any) => {
            const ben = m.beneficiary?.user;
            const cook = m.cook;
            const driver = m.driver;
            csvContent += [
                m.date ?? '',
                m.type ?? '',
                m.status ?? '',
                `"${(ben?.name ?? '').replace(/"/g, '""')}"`,
                `"${(ben?.address ?? '').replace(/"/g, '""')}"`,
                `"${(cook?.name ?? '').replace(/"/g, '""')}"`,
                `"${(driver?.name ?? '').replace(/"/g, '""')}"`,
            ].join(',') + '\n';
        });
    } else if (type === 'users') {
        const { data } = await admin
            .from('users')
            .select('name, phone, role, neighborhood, has_car, approved, created_at')
            .order('created_at', { ascending: false });

        filename = `משתמשות-${date}.csv`;
        csvContent = '\uFEFF'; // BOM for Excel UTF-8 compatibility
        csvContent += 'שם,טלפון,תפקיד,שכונה,רכב,מאושרת,תאריך הרשמה\n';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((u: any) => {
            csvContent += [
                `"${(u.name ?? '').replace(/"/g, '""')}"`,
                `"${(u.phone ?? '').replace(/"/g, '""')}"`,
                u.role ?? '',
                `"${(u.neighborhood ?? '').replace(/"/g, '""')}"`,
                u.has_car ? 'כן' : 'לא',
                u.approved ? 'כן' : 'לא',
                u.created_at ? new Date(u.created_at).toLocaleDateString('he-IL') : '',
            ].join(',') + '\n';
        });
    } else if (type === 'beneficiaries') {
        const { data } = await admin
            .from('beneficiaries')
            .select('user:user_id(name, phone, address, neighborhood), start_date, num_breakfast_days, num_shabbat_weeks, active')
            .order('start_date', { ascending: false });

        filename = `יולדות-${date}.csv`;
        csvContent = '\uFEFF';
        csvContent += 'שם,טלפון,כתובת,שכונה,תאריך התחלה,ימי ארוחת בוקר,שבתות,פעילה\n';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?.forEach((b: any) => {
            const u = b.user;
            csvContent += [
                `"${(u?.name ?? '').replace(/"/g, '""')}"`,
                `"${(u?.phone ?? '').replace(/"/g, '""')}"`,
                `"${(u?.address ?? '').replace(/"/g, '""')}"`,
                `"${(u?.neighborhood ?? '').replace(/"/g, '""')}"`,
                b.start_date ?? '',
                b.num_breakfast_days ?? '',
                b.num_shabbat_weeks ?? '',
                b.active ? 'כן' : 'לא',
            ].join(',') + '\n';
        });
    }

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
    });
}
