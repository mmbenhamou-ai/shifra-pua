export function buildWazeUrl(address: string): string | null {
  const raw = (address ?? '').trim();
  if (!raw || raw.length < 5) return null;

  let enriched = raw;
  const lower = raw.toLowerCase();
  const hasCountry =
    lower.includes('israel') ||
    lower.includes('israël') ||
    lower.includes('il') ||
    lower.includes('ישראל');

  if (!hasCountry) {
    enriched = `${raw}, ישראל`;
  }

  const encoded = encodeURIComponent(enriched);
  return `https://waze.com/ul?q=${encoded}&navigate=yes`;
}

export function buildGoogleMapsUrl(address: string): string | null {
  const raw = (address ?? '').trim();
  if (!raw || raw.length < 5) return null;

  let enriched = raw;
  const lower = raw.toLowerCase();
  const hasCountry =
    lower.includes('israel') ||
    lower.includes('israël') ||
    lower.includes('il') ||
    lower.includes('ישראל');

  if (!hasCountry) {
    enriched = `${raw}, ישראל`;
  }

  const encoded = encodeURIComponent(enriched);
  return `https://maps.google.com/?q=${encoded}`;
}

function normalizeNeighborhood(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

export function isSameNeighborhood(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const na = normalizeNeighborhood(a);
  const nb = normalizeNeighborhood(b);
  if (!na || !nb) return false;

  if (na === nb) return true;
  if (na.replace(/\s+/g, '') === nb.replace(/\s+/g, '')) return true;

  const distance = levenshtein(na, nb);
  return distance <= 2;
}

export function getNowInTimezone(tz: string): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const isoLike = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`;
  return new Date(isoLike);
}

