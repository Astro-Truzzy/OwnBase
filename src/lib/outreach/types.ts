export type OutreachTrack = "website_build" | "ownbase";

export type OutreachLeadStatus =
  | "new"
  | "enriched"
  | "drafted"
  | "queued"
  | "sent"
  | "replied"
  | "escalated"
  | "closed"
  | "unsubscribed"
  | "bounced"
  | "skipped";

export type OutreachMessageStatus =
  | "draft"
  | "approved"
  | "sent"
  | "failed"
  | "received"
  | "triaged"
  | "auto_replied";

export type OutreachIntent =
  | "interested"
  | "not_interested"
  | "question"
  | "pricing"
  | "negotiate"
  | "unsubscribe"
  | "out_of_office"
  | "other";

export interface OutreachLead {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_place_id: string | null;
  google_maps_uri: string | null;
  lat: number | null;
  lng: number | null;
  track: OutreachTrack;
  status: OutreachLeadStatus;
  business_summary: string | null;
  source: "manual" | "google_places" | "import";
  raw: Record<string, unknown>;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachMessage {
  id: string;
  lead_id: string;
  direction: "outbound" | "inbound";
  channel: "email";
  subject: string | null;
  body_text: string;
  body_html: string | null;
  status: OutreachMessageStatus;
  resend_email_id: string | null;
  provider_message_id: string | null;
  intent: OutreachIntent | null;
  needs_human: boolean;
  triage_notes: string | null;
  auto_reply_text: string | null;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredPlace {
  google_place_id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  google_maps_uri: string | null;
  lat: number | null;
  lng: number | null;
  raw: Record<string, unknown>;
}

export function isOutreachTableMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    msg.includes("outreach_leads") ||
    msg.includes("outreach_messages") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}
