'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Hook qui écoute les mises à jour Realtime sur la table meals
 * et retire automatiquement les repas pris de la liste locale.
 *
 * Usage :
 *   const { visibleIds, conflictId, clearConflict } = useMealRealtime(initialIds, role)
 */
export function useMealRealtime(
  initialIds: string[],
  role: 'cook' | 'driver',
) {
  const [visibleIds,  setVisibleIds]  = useState<Set<string>>(new Set(initialIds));
  const [conflictId,  setConflictId]  = useState<string | null>(null);

  const clearConflict = useCallback(() => setConflictId(null), []);

  // Resync le Set si les IDs SSR changent (navigation, revalidation)
  useEffect(() => {
    setVisibleIds(new Set(initialIds));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIds.join(',')]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const channel = supabase
      .channel(`meal-realtime-${role}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meals' },
        (payload) => {
          const updated = payload.new as { id: string; status: string; cook_id: string | null; driver_id: string | null };

          // Retire de la liste si le repas n'est plus disponible
          const isNoLongerOpen = role === 'cook'
            ? updated.status !== 'open' || updated.cook_id !== null
            : !['cook_assigned', 'ready'].includes(updated.status) || updated.driver_id !== null;

          if (isNoLongerOpen) {
            setVisibleIds((prev) => {
              if (!prev.has(updated.id)) return prev;
              // Signale un conflit si le repas était visible
              setConflictId(updated.id);
              const next = new Set(prev);
              next.delete(updated.id);
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role]);

  return { visibleIds, conflictId, clearConflict };
}

/**
 * Bannière de conflit affichée quand un repas disparaît en temps réel
 */
export function ConflictBanner({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 inset-x-4 z-50 mx-auto max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg"
           dir="rtl">
        <span className="text-xl">⚠️</span>
        <p className="flex-1 text-sm font-medium text-amber-800">
          מישהי לקחה ארוחה עכשיו — הרשימה עודכנה
        </p>
        <button onClick={onClose} className="text-amber-500 text-lg leading-none">✕</button>
      </div>
    </div>
  );
}
