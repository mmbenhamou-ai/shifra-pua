'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Clock, LogOut } from 'lucide-react';

export default function PendingPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f5f8]" dir="rtl">
            <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col p-8 items-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-amber-500" />
                </div>

                <h1 className="text-slate-900 text-2xl font-bold text-center">החשבון ממתין לאישור</h1>
                <p className="text-slate-600 text-base mt-4 text-center leading-relaxed">
                    החשבון שלך נשלח לאישור מנהלת המערכת.
                    <br />
                    נודיע לך ברגע שתאושר.
                </p>

                <button
                    onClick={handleLogout}
                    className="mt-12 flex items-center gap-2 text-slate-500 hover:text-[#91006A] font-medium p-4 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>התנתקות</span>
                </button>
            </div>
        </div>
    );
}
