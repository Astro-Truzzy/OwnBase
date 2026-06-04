import Link from "next/link";
import {
  IconAlertTriangle,
  IconClockHour4,
  IconPlayerStop,
  IconZoomQuestion,
} from "@tabler/icons-react";
import type { OverviewMetrics } from "@/lib/admin/metrics";

interface Alert {
  id: string;
  icon: React.ReactNode;
  message: string;
  href: string;
  tone: "amber" | "red" | "blue";
}

function buildAlerts(metrics: OverviewMetrics): Alert[] {
  const alerts: Alert[] = [];

  if (metrics.trials_expiring_7d > 0) {
    alerts.push({
      id: "trials-expiring",
      icon: <IconClockHour4 className="h-4 w-4 shrink-0" />,
      message: `${metrics.trials_expiring_7d} trial${metrics.trials_expiring_7d === 1 ? "" : "s"} expiring in the next 7 days — consider outreach to convert.`,
      href: "/admin/users?filter=expiring",
      tone: "amber",
    });
  }

  if (metrics.webhook_pending_7d > 0) {
    alerts.push({
      id: "webhook-failures",
      icon: <IconAlertTriangle className="h-4 w-4 shrink-0" />,
      message: `${metrics.webhook_pending_7d} Paystack webhook event${metrics.webhook_pending_7d === 1 ? "" : "s"} received in the last 7 days without processing confirmation.`,
      href: "/admin/system",
      tone: "red",
    });
  }

  if (metrics.inactive_with_repos > 0) {
    alerts.push({
      id: "inactive-users",
      icon: <IconPlayerStop className="h-4 w-4 shrink-0" />,
      message: `${metrics.inactive_with_repos} user${metrics.inactive_with_repos === 1 ? "" : "s"} ha${metrics.inactive_with_repos === 1 ? "s" : "ve"} tracked repos but zero activity in the last 30 days — activation gap.`,
      href: "/admin/users?filter=inactive",
      tone: "amber",
    });
  }

  if (metrics.plan_trial === 0 && metrics.paying_users === 0 && metrics.total_users === 0) {
    alerts.push({
      id: "no-data",
      icon: <IconZoomQuestion className="h-4 w-4 shrink-0" />,
      message: "No users found. Apply the admin metrics migration and check ADMIN_ALLOWED_EMAILS.",
      href: "/admin/system",
      tone: "blue",
    });
  }

  return alerts;
}

const toneStyles = {
  amber:
    "border-amber-400/30 bg-amber-500/8 text-amber-800 dark:text-amber-300 [&_svg]:text-amber-500",
  red: "border-red-400/30 bg-red-500/8 text-red-800 dark:text-red-300 [&_svg]:text-red-500",
  blue: "border-blue-400/30 bg-blue-500/8 text-blue-800 dark:text-blue-300 [&_svg]:text-blue-500",
};

export function AlertStrip({ metrics }: { metrics: OverviewMetrics }) {
  const alerts = buildAlerts(metrics);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={alert.href}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-opacity hover:opacity-80 ${toneStyles[alert.tone]}`}
        >
          {alert.icon}
          <span>{alert.message}</span>
        </Link>
      ))}
    </div>
  );
}
