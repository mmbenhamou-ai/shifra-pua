import { describe, it, expect } from 'vitest';
import { buildWazeUrl, buildGoogleMapsUrl, isSameNeighborhood } from '../lib/utils';

// ─── buildWazeUrl ─────────────────────────────────────────────────────────────

describe('buildWazeUrl', () => {
    it('returns null for empty address', () => {
        expect(buildWazeUrl('')).toBeNull();
        expect(buildWazeUrl(null as unknown as string)).toBeNull();
        expect(buildWazeUrl(undefined as unknown as string)).toBeNull();
    });

    it('returns null for very short address', () => {
        expect(buildWazeUrl('abc')).toBeNull();
    });

    it('appends ישראל when country not included', () => {
        const url = buildWazeUrl('רחוב הרצל 1 ירושלים');
        expect(url).not.toBeNull();
        expect(url).toContain('%D7%99%D7%A9%D7%A8%D7%90%D7%9C'); // encodes ישראל
        expect(url).toContain('navigate=yes');
    });

    it('does not duplicate ישראל when already present', () => {
        const url = buildWazeUrl('רחוב הרצל 1, ישראל');
        expect(url).not.toBeNull();
        // should not double-append ישראל
        const decoded = decodeURIComponent(url!);
        expect(decoded.split('ישראל').length).toBe(2); // exactly 1 occurrence
    });

    it('produces a valid Waze URL', () => {
        const url = buildWazeUrl('רחוב יפו 10, ירושלים');
        expect(url).toMatch(/^https:\/\/waze\.com\/ul\?q=/);
    });
});

// ─── buildGoogleMapsUrl ───────────────────────────────────────────────────────

describe('buildGoogleMapsUrl', () => {
    it('returns null for empty address', () => {
        expect(buildGoogleMapsUrl('')).toBeNull();
    });

    it('produces a valid Google Maps URL', () => {
        const url = buildGoogleMapsUrl('רחוב יפו 10, ירושלים');
        expect(url).toMatch(/^https:\/\/maps\.google\.com\/\?q=/);
    });
});

// ─── isSameNeighborhood ───────────────────────────────────────────────────────

describe('isSameNeighborhood', () => {
    it('returns false for null/undefined inputs', () => {
        expect(isSameNeighborhood(null, null)).toBe(false);
        expect(isSameNeighborhood('הר נוף', null)).toBe(false);
    });

    it('matches identical neighborhoods', () => {
        expect(isSameNeighborhood('גילה', 'גילה')).toBe(true);
    });

    it('matches with minor spacing variation', () => {
        expect(isSameNeighborhood('הר נוף', 'הרנוף')).toBe(true);
    });

    it('matches with small typos (Levenshtein ≤ 2)', () => {
        expect(isSameNeighborhood('גילה', 'גיל')).toBe(true);
    });

    it('does not match completely different neighborhoods', () => {
        expect(isSameNeighborhood('גילה', 'רמות')).toBe(false);
    });
});
