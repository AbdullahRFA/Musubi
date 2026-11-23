import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectBase = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin;

  if (error || errorDescription) {
    console.error("Auth callback error:", error, errorDescription);
    const msg = errorDescription || error || "OAuth error";
    return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(msg)}`);
  }

  if (code) {
    const response = NextResponse.redirect(`${redirectBase}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return response;
    }

    console.error("Exchange code error:", exchangeError);
    return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(exchangeError.message)}`);
  }

  return NextResponse.redirect(`${redirectBase}/login?error=no_code`);
}

