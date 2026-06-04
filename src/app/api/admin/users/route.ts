import { type NextRequest, NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { getAdminUsers } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)));
  const search = searchParams.get("search")?.trim() || undefined;

  try {
    const { users, total } = await getAdminUsers(page, limit, search);
    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
