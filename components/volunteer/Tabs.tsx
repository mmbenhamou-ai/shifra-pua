'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  canCook: boolean;
  canDeliver: boolean;
  children: ReactNode[];
};

export default function Tabs({ canCook, canDeliver, children }: Props) {
  const [active, setActive] = useState<'cook' | 'deliver'>(
    canCook ? 'cook' : 'deliver',
  );

  const cookContent = canCook ? children[0] : null;
  const deliverContent = canDeliver ? children[canCook ? 1 : 0] : null;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex gap-2">
        {canCook && (
          <button
            type="button"
            onClick={() => setActive('cook')}
            className={`flex-1 min-h-[48px] rounded-full text-sm font-semibold ${
              active === 'cook'
                ? 'bg-[#91006A] text-white'
                : 'bg-white text-[#91006A] border border-[#E4C1D6]'
            }`}
          >
            בישול
          </button>
        )}
        {canDeliver && (
          <button
            type="button"
            onClick={() => setActive('deliver')}
            className={`flex-1 min-h-[48px] rounded-full text-sm font-semibold ${
              active === 'deliver'
                ? 'bg-[#91006A] text-white'
                : 'bg-white text-[#91006A] border border-[#E4C1D6]'
            }`}
          >
            חלוקה
          </button>
        )}
      </div>

      {active === 'cook' ? cookContent : deliverContent}
    </div>
  );
}

