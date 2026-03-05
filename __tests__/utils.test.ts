import { describe, it, expect } from 'vitest';
import { isSameNeighborhood, buildWazeUrl } from '../lib/utils';

describe('isSameNeighborhood', () => {
    it('returns true for exact matches', () => {
        expect(isSameNeighborhood('Rehavia', 'Rehavia')).toBe(true);
    });

    it('handles Hebrew with diacritics', () => {
        expect(isSameNeighborhood('רחביה', 'רחביה')).toBe(true);
    });

    it('handles case insensitivity and whitespace', () => {
        expect(isSameNeighborhood('  Rehavia  ', 'rehavia')).toBe(true);
    });

    it('handles small typos (levenshtein)', () => {
        expect(isSameNeighborhood('Rehavia', 'Rehavya')).toBe(true);
        expect(isSameNeighborhood('Talpiot', 'Talpiyot')).toBe(true);
    });

    it('returns false for different neighborhoods', () => {
        expect(isSameNeighborhood('Rehavia', 'Arnona')).toBe(false);
    });

    it('returns false for null/undefined/empty', () => {
        expect(isSameNeighborhood(null, 'Arnona')).toBe(false);
        expect(isSameNeighborhood('', 'Arnona')).toBe(false);
    });
});

describe('buildWazeUrl', () => {
    it('encodes address correctly', () => {
        const url = buildWazeUrl('Jaffa 1, Jerusalem');
        expect(url).toContain('q=Jaffa%201%2C%20Jerusalem%2C%20%D7%99%D7%A9%D7%A8%D7%90%D7%9C');
    });

    it('adds country if missing', () => {
        const url = buildWazeUrl('Jaffa 1');
        expect(url).toContain('%D7%99%D7%A9%D7%A8%D7%90%D7%9C'); // "ישראל"
    });

    it('does not add country if already present', () => {
        const url = buildWazeUrl('Jaffa 1, Israel');
        expect(url).toContain('Israel');
    });

    it('returns null for too short addresses', () => {
        expect(buildWazeUrl('123')).toBe(null);
    });
});
