'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const ROLE_REDIRECTS: Record<string, string> = {
  admin:       '/admin',
  cook:        '/cook',
  driver:      '/driver',
  beneficiary: '/beneficiary',
};

function SessionHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const role         = searchParams.get('role') ?? 'cook';

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest = ROLE_REDIRECTS[role] ?? '/';
        router.replace(dest);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (newSession) {
            subscription.unsubscribe();
            const dest = ROLE_REDIRECTS[role] ?? '/';
            router.replace(dest);
          }
        }
      );

      setTimeout(() => {
        subscription.unsubscribe();
        router.replace('/login');
      }, 5000);
    });
  }, [role, router]);

  return null;
}

export default function DemoSessionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl"
         style={{ background: 'linear-gradient(to bottom, #FFF7FB, #FBE4F0)' }}>
      <div className="text-center space-y-3">
        <div className="text-4xl animate-bounce">💛</div>
        <p className="text-sm font-medium" style={{ color: '#811453' }}>מתחברת...</p>
        <Suspense>
          <SessionHandler />
        </Suspense>
      </div>
    </div>
  );
}
