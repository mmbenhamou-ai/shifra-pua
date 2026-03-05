'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type DebugState = {
  session: { hasSession: boolean; userId?: string; email?: string } | null;
  user: { hasUser: boolean; userId?: string; email?: string } | null;
  profile: { hasProfile: boolean; role?: string; approved?: boolean } | null;
  loading: boolean;
};

export default function DebugAuthPage() {
  const [state, setState] = useState<DebugState>({ session: null, user: null, profile: null, loading: true });
  const [whoami, setWhoami] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();

      let profile: { hasProfile: boolean; role?: string; approved?: boolean } = { hasProfile: false };
      if (user) {
        const { data: row } = await supabase
          .from('users')
          .select('id, role, approved')
          .eq('id', user.id)
          .maybeSingle();
        profile = row
          ? { hasProfile: true, role: row.role ?? undefined, approved: row.approved ?? undefined }
          : { hasProfile: false };
      }

      setState({
        session: session
          ? { hasSession: true, userId: session.user?.id, email: session.user?.email ?? undefined }
          : { hasSession: false },
        user: user
          ? { hasUser: true, userId: user.id, email: user.email ?? undefined }
          : { hasUser: false },
        profile,
        loading: false,
      });
    };
    run();
  }, []);

  useEffect(() => {
    fetch('/api/debug/whoami')
      .then((r) => r.json())
      .then(setWhoami)
      .catch(() => setWhoami({ error: 'fetch failed' }));
  }, []);

  return (
    <div className="min-h-screen p-6 bg-slate-100 font-mono text-sm" dir="ltr">
      <h1 className="text-xl font-bold mb-4">Debug Auth</h1>
      <p className="text-slate-600 mb-6">Client-side + server-side auth diagnostic. No tokens or secrets displayed.</p>

      {state.loading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-6">
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Client: getSession()</h2>
            <pre className="bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(state.session, null, 2)}
            </pre>
          </section>
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Client: getUser()</h2>
            <pre className="bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(state.user, null, 2)}
            </pre>
          </section>
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Client: public.users (current user row)</h2>
            <pre className="bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(state.profile, null, 2)}
            </pre>
          </section>
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">Server: GET /api/debug/whoami</h2>
            <pre className="bg-slate-50 p-2 rounded overflow-auto">
              {whoami == null ? '…' : JSON.stringify(whoami, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
