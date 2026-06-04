import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "./session";

/**
 * Returns the list of allowed admin emails from env.
 * Normalized to lowercase, trimmed, empty strings filtered.
 */
export function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if the given email is in the ADMIN_ALLOWED_EMAILS list.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = parseAdminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Server-only guard for admin layouts and pages.
 * Reads the admin_token httpOnly cookie, verifies the HMAC signature,
 * and checks the email against ADMIN_ALLOWED_EMAILS.
 * Redirects to /admin/login if the session is missing or invalid.
 */
export async function requireAdminUser(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);

  if (!session) {
    redirect("/admin/login");
  }

  // Double-check in case env changed after the token was issued
  if (!isAdminEmail(session.email)) {
    redirect("/admin/unauthorized");
  }

  return { email: session.email };
}

/**
 * API route guard — returns a 401 NextResponse instead of redirecting.
 * Use in /api/admin/* route handlers.
 */
export async function requireAdminUserAPI(): Promise<
  { email: string } | { error: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);

  if (!session || !isAdminEmail(session.email)) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { email: session.email };
}
