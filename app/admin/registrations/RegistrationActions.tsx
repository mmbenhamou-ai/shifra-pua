'use client';

import { useState, useTransition } from 'react';
import { approveUser, rejectUser } from '../actions/registrations';

export function ApproveUserButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="flex flex-col items-start gap-1">
            <button
                type="button"
                disabled={isPending}
                onClick={() => {
                    setError(null);
                    startTransition(async () => {
                        const result = await approveUser(userId);
                        if (result && 'error' in result) {
                            setError(result.error);
                        }
                    });
                }}
                className="min-h-[44px] min-w-[80px] rounded-full text-sm font-semibold text-white transition active:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand)' }}
            >
                {isPending ? '...' : 'אישור ✓'}
            </button>
            {error && (
                <p className="text-[10px] text-red-600 max-w-[200px] text-right leading-tight">{error}</p>
            )}
        </div>
    );
}

export function RejectUserButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    await rejectUser(userId);
                });
            }}
            className="min-h-[44px] min-w-[80px] rounded-full border text-sm font-semibold transition active:opacity-80 disabled:opacity-50"
            style={{ borderColor: '#F7D4E2', color: 'var(--brand)' }}
        >
            {isPending ? '...' : 'דחייה ✗'}
        </button>
    );
}
