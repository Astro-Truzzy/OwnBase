import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route-handler sign-out: must attach cookie updates to the redirect Response.
 * POST only — GET is rejected to prevent third-party sites from logging users out.
 */
async function performSignOut(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.delete("redirectTo");
  url.searchParams.set("signedOut", "1");

  const response = NextResponse.redirect(url);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.signOut({ scope: "global" });

  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return performSignOut(request);
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed. Sign out using POST from the app.",
    },
    {
      status: 405,
      headers: { Allow: "POST" },
    },
  );
}
