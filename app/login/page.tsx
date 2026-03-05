'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Heart } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות עם גוגל');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5f8]" dir="rtl">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#91006A]/10 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-[#91006A]" />
          </div>
          <h1 className="text-slate-900 text-3xl font-bold text-center">ברוכים הבאים</h1>
          <p className="text-slate-600 text-base mt-2 text-center">
            למערכת שפרה ופועה - ניהול ארוחות ליולדות
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 hover:border-[#91006A] text-slate-700 font-bold h-[56px] transition-all flex items-center justify-center gap-4 rounded-xl shadow-sm active:scale-95"
          >
            <Image src="/google-icon.svg" alt="Google" width={24} height={24} />
            <span>המשך עם Google</span>
          </button>

          {error && (
            <p className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-center">
              {error}
            </p>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            בהתחברות למערכת את מסכימה לתנאי השימוש
          </p>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#91006A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#91006A]/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
