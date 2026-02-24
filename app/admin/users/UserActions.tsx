'use client';

import { useTransition } from 'react';
import { changeUserRole, toggleUserActive } from '../actions/users';

const ROLES = [
  { value: 'beneficiary', label: 'יולדת' },
  { value: 'cook',        label: 'מבשלת' },
  { value: 'driver',      label: 'מחלקת' },
  { value: 'admin',       label: 'אדמין' },
];

export function RoleSelect({ userId, current }: { userId: string; current: string }) {
  const [isPending, start] = useTransition();
  return (
    <select
      disabled={isPending}
      value={current}
      onChange={(e) => {
        if (!window.confirm(`לשנות תפקיד ל-${e.target.options[e.target.selectedIndex].text}?`)) return;
        start(async () => { await changeUserRole(userId, e.target.value); });
      }}
      className="rounded-xl border border-[#F7D4E2] bg-white px-2 py-1.5 text-xs text-zinc-800 focus:outline-none disabled:opacity-50"
    >
      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  );
}

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [isPending, start] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(isActive ? 'להשבית חשבון זה?' : 'להפעיל חשבון זה?')) return;
        start(async () => { await toggleUserActive(userId, isActive); });
      }}
      className="rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40"
      style={{
        borderColor:     isActive ? '#FCA5A5' : '#BBF7D0',
        color:           isActive ? '#DC2626'  : '#065F46',
        backgroundColor: isActive ? '#FFF5F5'  : '#F0FFF4',
      }}
    >
      {isPending ? '...' : isActive ? 'השבת' : 'הפעל'}
    </button>
  );
}
