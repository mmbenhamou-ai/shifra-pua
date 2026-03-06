/**
 * Normalise les options cookies Supabase SSR pour NextResponse.cookies.set().
 * Next.js attend path, maxAge (secondes), sameSite, secure, httpOnly.
 */
export function toNextCookieOptions(options?: Record<string, unknown>): {
  path?: string;
  maxAge?: number;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
} {
  if (!options || typeof options !== "object") return {};
  const o = options as Record<string, unknown>;
  const maxAgeRaw = o.maxAge ?? o.max_age;
  let maxAge: number | undefined;
  if (typeof maxAgeRaw === "number") {
    maxAge = maxAgeRaw > 10000000000 ? Math.floor(maxAgeRaw / 1000) : maxAgeRaw;
  }
  const sameSite = (o.sameSite ?? o.same_site) as "lax" | "strict" | "none" | undefined;
  return {
    path: (o.path as string) ?? "/",
    ...(maxAge !== undefined && { maxAge }),
    ...(sameSite && { sameSite }),
    ...(typeof o.secure === "boolean" && { secure: o.secure }),
    ...(typeof o.httpOnly === "boolean" && { httpOnly: o.httpOnly }),
    ...(typeof (o as { http_only?: boolean }).http_only === "boolean" && {
      httpOnly: (o as { http_only: boolean }).http_only,
    }),
  };
}
