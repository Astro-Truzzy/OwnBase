import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildDashboardNotifications,
  countUnread,
} from "@/lib/dashboard-notifications";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await buildDashboardNotifications(supabase, user.id);
  return NextResponse.json({
    notifications,
    unreadCount: countUnread(notifications),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notificationId?: string; markAll?: boolean };
  try {
    body = (await request.json()) as {
      notificationId?: string;
      markAll?: boolean;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (body.markAll) {
    const notifications = await buildDashboardNotifications(
      supabase,
      user.id,
    );
    const rows = notifications.map((n) => ({
      user_id: user.id,
      notification_id: n.id,
      read_at: now,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("notification_reads").upsert(rows, {
        onConflict: "user_id,notification_id",
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (
    typeof body.notificationId === "string" &&
    body.notificationId.length > 0 &&
    body.notificationId.length < 500
  ) {
    const { error } = await supabase.from("notification_reads").upsert(
      {
        user_id: user.id,
        notification_id: body.notificationId,
        read_at: now,
      },
      { onConflict: "user_id,notification_id" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Expected notificationId or markAll" },
    { status: 400 },
  );
}
