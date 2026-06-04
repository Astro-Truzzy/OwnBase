import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { ADMIN_COOKIE, SESSION_HOURS, createAdminToken } from "@/lib/admin/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  const base = new URL(request.url).origin;

  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) {
    return NextResponse.redirect(`${base}/admin/login?error=not_configured`, 303);
  }

  if (!isAdminEmail(email) || password !== adminPassword) {
    return NextResponse.redirect(`${base}/admin/login?error=invalid`, 303);
  }

  let token: string;
  try {
    token = await createAdminToken(email);
  } catch {
    return NextResponse.redirect(`${base}/admin/login?error=not_configured`, 303);
  }

  const response = NextResponse.redirect(`${base}/admin`, 303);
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 3600,
    path: "/",
  });
  return response;
}
