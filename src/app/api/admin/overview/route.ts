import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { getDauSeries, getAdminOverview, getSignupSeries } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const [metrics, signups, dau] = await Promise.all([
      getAdminOverview(),
      getSignupSeries(30),
      getDauSeries(30),
    ]);
    return NextResponse.json({ metrics, signups, dau });
  } catch (err) {
    console.error("[admin/overview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
