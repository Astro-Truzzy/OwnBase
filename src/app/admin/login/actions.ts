"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin/auth";
import { ADMIN_COOKIE, SESSION_HOURS, createAdminToken } from "@/lib/admin/session";

export async function adminLoginAction(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    redirect("/admin/login?error=not_configured");
  }

  // Both checks must pass — wrong email or wrong password returns the same error
  // to avoid leaking which part failed.
  if (!isAdminEmail(email) || password !== adminPassword) {
    redirect("/admin/login?error=invalid");
  }

  const token = await createAdminToken(email);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 3600,
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
