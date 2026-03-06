import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * GET /api/auth/google — redirection vers Google OAuth (fallback sans JS).
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectTo = "" + origin + "/auth/callback";

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      return NextResponse.redirect(origin + "/login?error=" + encodeURIComponent(error.message));
    }
    if (data?.url) {
      return NextResponse.redirect(data.url);
    }
  } catch (e) {
    console.error("[api/auth/google]", e);
  }
  return NextResponse.redirect(origin + "/login?error=oauth");
}
