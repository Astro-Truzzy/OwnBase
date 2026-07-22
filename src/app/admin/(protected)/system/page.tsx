import type { Metadata } from "next";
import { getAdminOverview, getWebhookEvents } from "@/lib/admin/metrics";

export const metadata: Metadata = { title: "System" };

function EnvCheck({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
      <span className="font-mono text-xs text-foreground">{label}</span>
      <span
        className={
          set
            ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
            : "text-xs font-medium text-red-600 dark:text-red-400"
        }
      >
        {set ? "Set" : "Missing"}
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminSystemPage() {
  const [metrics, webhookEvents] = await Promise.all([
    getAdminOverview(),
    getWebhookEvents(30),
  ]);

  const envChecks = [
    { label: "NEXT_PUBLIC_SUPABASE_URL", set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY", set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { label: "SUPABASE_SERVICE_ROLE_KEY", set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { label: "PAYSTACK_SECRET_KEY", set: !!process.env.PAYSTACK_SECRET_KEY },
    { label: "PAYSTACK_PLAN_STARTER", set: !!process.env.PAYSTACK_PLAN_STARTER },
    { label: "PAYSTACK_PLAN_PRO", set: !!process.env.PAYSTACK_PLAN_PRO },
    { label: "OPENAI_API_KEY", set: !!process.env.OPENAI_API_KEY },
    { label: "GITHUB_TOKEN_ENCRYPTION_KEY", set: !!process.env.GITHUB_TOKEN_ENCRYPTION_KEY },
    { label: "UPSTASH_REDIS_REST_URL", set: !!process.env.UPSTASH_REDIS_REST_URL },
    { label: "UPSTASH_REDIS_REST_TOKEN", set: !!process.env.UPSTASH_REDIS_REST_TOKEN },
    { label: "CRON_SECRET", set: !!process.env.CRON_SECRET },
    { label: "ADMIN_ALLOWED_EMAILS", set: !!process.env.ADMIN_ALLOWED_EMAILS },
    { label: "RESEND_API_KEY", set: !!process.env.RESEND_API_KEY },
    { label: "RESEND_FROM_EMAIL", set: !!process.env.RESEND_FROM_EMAIL },
    { label: "GOOGLE_PLACES_API_KEY", set: !!process.env.GOOGLE_PLACES_API_KEY },
    { label: "HUNTER_API_KEY", set: !!process.env.HUNTER_API_KEY },
    { label: "RESEND_WEBHOOK_SECRET", set: !!process.env.RESEND_WEBHOOK_SECRET },
  ];

  const criticalMissing = envChecks.filter(
    (e) =>
      !e.set &&
      ["SUPABASE_SERVICE_ROLE_KEY", "PAYSTACK_SECRET_KEY", "OPENAI_API_KEY"].includes(e.label),
  );

  const processedWebhooks = webhookEvents.filter((e) => e.processed);

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">System Health</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Environment checks, webhook ledger, and operational status
        </p>
      </div>

      {/* Critical alerts */}
      {criticalMissing.length > 0 && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/8 px-5 py-4 space-y-1">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Critical env vars missing
          </p>
          {criticalMissing.map((e) => (
            <p key={e.label} className="font-mono text-xs text-red-600 dark:text-red-400">
              {e.label}
            </p>
          ))}
        </div>
      )}

      {/* Webhook health summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total (last 30)
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-foreground">
            {webhookEvents.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Paystack webhook events</p>
        </div>
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Processed
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {processedWebhooks.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">events with processed_at</p>
        </div>
        <div
          className={`rounded-xl border p-5 ${
            metrics.webhook_pending_7d > 0
              ? "border-amber-400/25 bg-amber-500/5"
              : "border-border bg-card"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending (7d)
          </p>
          <p
            className={`mt-1.5 text-2xl font-semibold ${
              metrics.webhook_pending_7d > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
            }`}
          >
            {metrics.webhook_pending_7d}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">received but not processed</p>
        </div>
      </div>

      {/* Webhook event log */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Webhook Events</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 30 received</p>
        </div>
        {webhookEvents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No webhook events found. Verify Paystack is configured.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Received</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Processed</th>
                </tr>
              </thead>
              <tbody>
                {webhookEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{ev.event_type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          ev.processed
                            ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                            : "text-xs font-medium text-amber-600 dark:text-amber-400"
                        }
                      >
                        {ev.processed ? "Processed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(ev.received_at)}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {ev.processed_at ? formatDate(ev.processed_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Environment checklist */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Environment Variables</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shows set/missing only — no secret values are displayed
          </p>
        </div>
        <div className="p-5 grid gap-2 sm:grid-cols-2">
          {envChecks.map((e) => (
            <EnvCheck key={e.label} label={e.label} set={e.set} />
          ))}
        </div>
      </div>
    </div>
  );
}
