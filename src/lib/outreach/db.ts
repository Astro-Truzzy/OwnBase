import { createAdminClient } from "@/lib/supabase/admin";
import type { OutreachLead, OutreachMessage } from "./types";
import { isOutreachTableMissing } from "./types";

export function getOutreachAdmin() {
  return createAdminClient();
}

export async function listLeads(opts?: {
  status?: string;
  track?: string;
  search?: string;
  limit?: number;
}): Promise<{ leads: OutreachLead[]; error?: string; missingTable?: boolean }> {
  const admin = getOutreachAdmin();
  let q = admin
    .from("outreach_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.track) q = q.eq("track", opts.track);

  const { data, error } = await q;
  if (error) {
    if (isOutreachTableMissing(error)) {
      return { leads: [], missingTable: true, error: error.message };
    }
    return { leads: [], error: error.message };
  }

  let leads = (data ?? []) as OutreachLead[];
  const search = opts?.search?.trim().toLowerCase();
  if (search) {
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(search) ||
        (l.email?.toLowerCase().includes(search) ?? false) ||
        (l.address?.toLowerCase().includes(search) ?? false),
    );
  }
  return { leads };
}

export async function listEscalations(limit = 50): Promise<{
  messages: Array<OutreachMessage & { lead?: Pick<OutreachLead, "id" | "name" | "email" | "track"> }>;
  error?: string;
  missingTable?: boolean;
}> {
  const admin = getOutreachAdmin();
  const { data, error } = await admin
    .from("outreach_messages")
    .select("*, lead:outreach_leads(id, name, email, track)")
    .eq("needs_human", true)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isOutreachTableMissing(error)) {
      return { messages: [], missingTable: true, error: error.message };
    }
    return { messages: [], error: error.message };
  }

  return {
    messages: (data ?? []) as Array<
      OutreachMessage & { lead?: Pick<OutreachLead, "id" | "name" | "email" | "track"> }
    >,
  };
}

export async function getOutreachStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byTrack: Record<string, number>;
  escalated: number;
  drafts: number;
  missingTable?: boolean;
}> {
  const admin = getOutreachAdmin();
  const { data, error } = await admin.from("outreach_leads").select("status, track");
  if (error) {
    if (isOutreachTableMissing(error)) {
      return { total: 0, byStatus: {}, byTrack: {}, escalated: 0, drafts: 0, missingTable: true };
    }
    throw new Error(error.message);
  }

  const byStatus: Record<string, number> = {};
  const byTrack: Record<string, number> = {};
  for (const row of data ?? []) {
    byStatus[row.status as string] = (byStatus[row.status as string] ?? 0) + 1;
    byTrack[row.track as string] = (byTrack[row.track as string] ?? 0) + 1;
  }

  const [{ count: escalated }, { count: drafts }] = await Promise.all([
    admin
      .from("outreach_messages")
      .select("*", { count: "exact", head: true })
      .eq("needs_human", true)
      .eq("direction", "inbound"),
    admin
      .from("outreach_messages")
      .select("*", { count: "exact", head: true })
      .eq("direction", "outbound")
      .eq("status", "draft"),
  ]);

  return {
    total: data?.length ?? 0,
    byStatus,
    byTrack,
    escalated: escalated ?? 0,
    drafts: drafts ?? 0,
  };
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const admin = getOutreachAdmin();
  const { data } = await admin
    .from("outreach_suppressions")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

export async function suppressEmail(email: string, reason: string) {
  const admin = getOutreachAdmin();
  await admin.from("outreach_suppressions").upsert(
    { email: email.trim().toLowerCase(), reason },
    { onConflict: "email" },
  );
}
