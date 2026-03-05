import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type AppRole = 'admin' | 'beneficiary' | 'cook' | 'driver' | 'both';

export async function getSessionOrRedirect() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { supabase, user };
}

type ProfileOptions = {
  allowedRoles?: AppRole[];
};

export async function getProfileOrRedirect(options: ProfileOptions = {}) {
  const { supabase, user } = await getSessionOrRedirect();

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/login');
  }

  if (!profile.approved) {
    redirect('/pending');
  }

  if (options.allowedRoles && !options.allowedRoles.includes(profile.role as AppRole)) {
    redirect('/login');
  }

  return {
    supabase,
    user,
    profile: {
      id: profile.id as string,
      role: profile.role as AppRole,
      is_approved: !!profile.approved,
      shabbat_enabled: null,
    },
  };
}

