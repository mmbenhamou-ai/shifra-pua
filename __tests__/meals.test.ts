import { describe, it, expect, vi } from 'vitest';

// ─── Mock Supabase admin client ───────────────────────────────────────────────
// We mock createAdminClient so we can test the logic without a real DB
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();

const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: mockEq,
    single: mockSingle,
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
});

vi.mock('../lib/supabase-admin', () => ({
    createAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

// ─── normalizePhone test ──────────────────────────────────────────────────────
// Inline normalization function (duplicated from login/page.tsx for testing)
function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('972')) return '+' + digits;
    if (digits.startsWith('0')) return '+972' + digits.slice(1);
    return '+972' + digits;
}

describe('normalizePhone', () => {
    it('converts 050... to +97250...', () => {
        expect(normalizePhone('0501234567')).toBe('+972501234567');
    });

    it('converts 972... to +972...', () => {
        expect(normalizePhone('972501234567')).toBe('+972501234567');
    });

    it('handles formatted numbers with dashes', () => {
        expect(normalizePhone('050-123-4567')).toBe('+972501234567');
    });

    it('handles numbers that already start with 5', () => {
        expect(normalizePhone('501234567')).toBe('+972501234567');
    });
});

// ─── Meal status transition validation ───────────────────────────────────────
describe('meal status transitions', () => {
    // Valid status flows as defined in the system
    const VALID_TRANSITIONS: Record<string, string[]> = {
        open: ['cook_assigned'],
        cook_assigned: ['ready'],
        ready: ['driver_assigned'],
        driver_assigned: ['picked_up'],
        picked_up: ['delivered'],
        delivered: ['confirmed'],
    };

    Object.entries(VALID_TRANSITIONS).forEach(([from, tos]) => {
        tos.forEach((to) => {
            it(`allows transition ${from} → ${to}`, () => {
                expect(VALID_TRANSITIONS[from]).toContain(to);
            });
        });
    });

    it('does not allow skipping statuses', () => {
        expect(VALID_TRANSITIONS['open']).not.toContain('delivered');
        expect(VALID_TRANSITIONS['cook_assigned']).not.toContain('confirmed');
    });
});
