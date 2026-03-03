import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'cook' ou 'driver'

    if (!userId || !role || (role !== 'cook' && role !== 'driver')) {
        return new NextResponse('Missing or invalid parameters', { status: 400 });
    }

    const supabase = createAdminClient();

    // On récupère les informations de l'utilisateur pour le nom du calendrier
    const { data: userRaw } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

    if (!userRaw) {
        return new NextResponse('User not found', { status: 404 });
    }

    const userName = userRaw.name || 'מתנדבת';
    const roleLabel = role === 'cook' ? 'מבשלת' : 'מחלקת';

    // On récupère les repas futurs assignés à cet utilisateur
    const today = new Date().toISOString().split('T')[0];
    const { data: meals } = await supabase
        .from('meals')
        .select(
            'id, date, type, beneficiary:beneficiary_id(user:user_id(name, address, neighborhood, phone))'
        )
        .eq(`${role}_id`, userId)
        .gte('date', today)
        .order('date', { ascending: true });

    if (!meals) {
        return new NextResponse('No meals found', { status: 200 });
    }

    const escapeICS = (str: string) => str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//שפרה ופועה//${roleLabel} ${userName}//HE`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:שפרה ופועה - ${roleLabel}`,
        `X-WR-TIMEZONE:Asia/Jerusalem`,
    ].join('\n') + '\n';

    const typeLabels: Record<string, string> = {
        breakfast: 'ארוחת בוקר',
        shabbat_friday: 'שבת (ליל שבת)',
        shabbat_saturday: 'שבת (יום שבת)',
    };

    meals.forEach((meal) => {
        // Les dates en ICS Doivent être compactes au format YYYYMMDD
        const dateStr = (meal.date as string).replace(/-/g, '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bUser = (meal.beneficiary as any)?.user;
        const bName = bUser?.name || 'יולדת';
        const bAddress = bUser?.address ? `${bUser.address}, ${bUser.neighborhood || ''}` : '';
        const bPhone = bUser?.phone || '';

        const summary = escapeICS(`שפרה ופועה: ${role === 'cook' ? 'בישול' : 'משלוח'} ל${bName}`);
        let description = `סוג ארוחה: ${typeLabels[meal.type as string] || meal.type}\n`;
        description += `יולדת: ${bName}\n`;
        description += `כתובת: ${bAddress}\n`;
        if (bPhone) description += `טלפון: ${bPhone}\n`;
        // On peut aussi ajouter un lien pour rediriger vers l'app !

        // Le timestamp de création de l'event (obligatoire)
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icsContent += [
            'BEGIN:VEVENT',
            `UID:meal-${meal.id}-${role}@shifrapua.app`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART;VALUE=DATE:${dateStr}`, // All Day event
            // `DTEND;VALUE=DATE:${endDateStr}` could be added if it's more than 1 day
            `SUMMARY:${summary}`,
            `DESCRIPTION:${escapeICS(description)}`,
            bAddress ? `LOCATION:${escapeICS(bAddress)}` : '',
            'END:VEVENT',
        ].filter(Boolean).join('\n') + '\n';
    });

    icsContent += 'END:VCALENDAR';

    return new NextResponse(icsContent, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="shifra-pua-${role}.ics"`,
        },
    });
}
