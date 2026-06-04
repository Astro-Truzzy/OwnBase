import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/session";

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  const response = NextResponse.redirect(`${base}/admin/login`, 303);
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
