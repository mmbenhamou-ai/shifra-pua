import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET() {
  const admin = adminClient();

  const [
    { count: totalMeals },
    { count: deliveredMeals },
    { count: totalVolunteers },
    { count: activeBeneficiaries },
  ] = await Promise.all([
    admin.from('meals').select('*', { count: 'exact', head: true }),
    admin.from('meals').select('*', { count: 'exact', head: true }).in('status', ['delivered', 'confirmed']),
    admin.from('users').select('*', { count: 'exact', head: true }).in('role', ['cook', 'driver']).eq('approved', true),
    admin.from('beneficiaries').select('*', { count: 'exact', head: true }).not('end_date', 'lt', new Date().toISOString().split('T')[0]),
  ]);

  return NextResponse.json({
    total_meals:          totalMeals ?? 0,
    delivered_meals:      deliveredMeals ?? 0,
    total_volunteers:     totalVolunteers ?? 0,
    active_beneficiaries: activeBeneficiaries ?? 0,
    updated_at:           new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
