"use client";

import {
  IconBrandGithub,
  IconBrandGitlab,
  IconChevronDown,
  IconDots,
  IconFilter,
  IconInbox,
  IconLayoutKanban,
  IconLink,
  IconPlus,
  IconSettings,
  IconShieldCheck,
  IconUpload,
} from "@tabler/icons-react";

/* ─── Data ─── */

type Label = { text: string; color: string };
type Card = {
  id: string;
  title: string;
  labels: Label[];
  platform?: "github" | "gitlab" | "upload";
  avatar?: string;
  avatarColor?: string;
};
type Column = {
  name: string;
  count: number;
  dotColor: string;
  cards: Card[];
};

const COLUMNS: Column[] = [
  {
    name: "Backlog",
    count: 7,
    dotColor: "bg-slate-400",
    cards: [
      {
        id: "OWN-019",
        title: "mobile-app-ios",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
        ],
        platform: "github",
        avatar: "ML",
        avatarColor: "bg-violet-500",
      },
      {
        id: "OWN-031",
        title: "admin-dashboard",
        labels: [
          {
            text: "GitLab",
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/25",
          },
          {
            text: "High",
            color: "text-amber-600 bg-amber-50 dark:bg-amber-900/25",
          },
        ],
        platform: "gitlab",
        avatar: "RK",
        avatarColor: "bg-orange-500",
      },
      {
        id: "OWN-008",
        title: "email-service",
        labels: [
          {
            text: "Medium",
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/25",
          },
        ],
        platform: "github",
      },
      {
        id: "OWN-047",
        title: "analytics-module",
        labels: [
          {
            text: "Upload",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
        ],
        platform: "upload",
        avatar: "TA",
        avatarColor: "bg-blue-500",
      },
      {
        id: "OWN-063",
        title: "data-export-service",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
          {
            text: "Medium",
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/25",
          },
        ],
        platform: "github",
        avatar: "JD",
        avatarColor: "bg-cyan-500",
      },
    ],
  },
  {
    name: "Connecting",
    count: 3,
    dotColor: "bg-amber-400",
    cards: [
      {
        id: "OWN-052",
        title: "storefront-redesign",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
          {
            text: "Improvement",
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/25",
          },
        ],
        platform: "github",
        avatar: "JD",
        avatarColor: "bg-cyan-500",
      },
      {
        id: "OWN-055",
        title: "crm-integration",
        labels: [
          {
            text: "GitLab",
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/25",
          },
        ],
        platform: "gitlab",
      },
      {
        id: "OWN-060",
        title: "legacy-api-migration",
        labels: [
          {
            text: "Critical",
            color: "text-red-600 bg-red-50 dark:bg-red-900/25",
          },
        ],
        platform: "upload",
        avatar: "SA",
        avatarColor: "bg-rose-500",
      },
    ],
  },
  {
    name: "Protected",
    count: 11,
    dotColor: "bg-emerald-500",
    cards: [
      {
        id: "OWN-001",
        title: "main-website",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
          {
            text: "Secured",
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25",
          },
        ],
        platform: "github",
        avatar: "YO",
        avatarColor: "bg-emerald-500",
      },
      {
        id: "OWN-003",
        title: "auth-service",
        labels: [
          {
            text: "Critical",
            color: "text-red-600 bg-red-50 dark:bg-red-900/25",
          },
        ],
        platform: "gitlab",
        avatar: "JD",
        avatarColor: "bg-cyan-500",
      },
      {
        id: "OWN-007",
        title: "billing-api",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
          {
            text: "Long term",
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25",
          },
        ],
        platform: "github",
        avatar: "ML",
        avatarColor: "bg-violet-500",
      },
      {
        id: "OWN-011",
        title: "payment-gateway-v2",
        labels: [
          {
            text: "Upload",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
        ],
        platform: "upload",
        avatar: "TA",
        avatarColor: "bg-blue-500",
      },
      {
        id: "OWN-014",
        title: "docs-platform",
        labels: [
          {
            text: "GitHub",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
        ],
        platform: "github",
      },
      {
        id: "OWN-017",
        title: "user-portal-v3",
        labels: [
          {
            text: "GitLab",
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/25",
          },
          {
            text: "Secured",
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25",
          },
        ],
        platform: "gitlab",
        avatar: "SA",
        avatarColor: "bg-rose-500",
      },
    ],
  },
  {
    name: "At Risk",
    count: 4,
    dotColor: "bg-red-500",
    cards: [
      {
        id: "OWN-022",
        title: "legacy-backend",
        labels: [
          {
            text: "Upload",
            color: "text-slate-500 bg-slate-100 dark:bg-slate-800/60",
          },
          {
            text: "Single contributor",
            color: "text-red-600 bg-red-50 dark:bg-red-900/25",
          },
        ],
        platform: "upload",
        avatar: "RK",
        avatarColor: "bg-orange-500",
      },
      {
        id: "OWN-038",
        title: "search-api",
        labels: [
          {
            text: "High",
            color: "text-amber-600 bg-amber-50 dark:bg-amber-900/25",
          },
        ],
        platform: "github",
      },
      {
        id: "OWN-044",
        title: "notification-service",
        labels: [
          {
            text: "GitLab",
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/25",
          },
        ],
        platform: "gitlab",
        avatar: "SA",
        avatarColor: "bg-rose-500",
      },
    ],
  },
];

const HIDDEN_COLS = [
  { name: "Revoked", count: 6, color: "bg-slate-400" },
  { name: "Archived", count: 14, color: "bg-slate-300" },
];

/* ─── Sub-components ─── */

function PlatformIcon({
  platform,
}: {
  platform?: "github" | "gitlab" | "upload";
}) {
  if (platform === "github")
    return <IconBrandGithub className="h-3 w-3 shrink-0 text-slate-400" />;
  if (platform === "gitlab")
    return <IconBrandGitlab className="h-3 w-3 shrink-0 text-orange-400" />;
  if (platform === "upload")
    return <IconUpload className="h-3 w-3 shrink-0 text-slate-400" />;
  return null;
}

function KanbanCard({ card }: { card: Card }) {
  return (
    <div className="group cursor-pointer rounded-md border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f1623] px-3 py-2.5 hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-mono text-[#94a3b8] dark:text-[#475569] leading-none mt-0.5">
          {card.id}
        </span>
        {card.avatar && (
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white leading-none ${card.avatarColor}`}
          >
            {card.avatar}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] font-medium text-[#1e293b] dark:text-[#e2e8f0] leading-snug">
        {card.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <PlatformIcon platform={card.platform} />
        {card.labels.map((l) => (
          <span
            key={l.text}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium leading-none ${l.color}`}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ col }: { col: Column }) {
  return (
    <div className="flex w-[220px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center gap-1.5 px-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${col.dotColor}`} />
        <span className="text-[12px] font-medium text-[#334155] dark:text-[#94a3b8]">
          {col.name}
        </span>
        <span className="ml-0.5 text-[11px] text-[#94a3b8] dark:text-[#475569]">
          {col.count}
        </span>
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="rounded p-0.5 hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]">
            <IconDots className="h-3 w-3 text-[#94a3b8]" />
          </button>
          <button className="rounded p-0.5 hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b]">
            <IconPlus className="h-3 w-3 text-[#94a3b8]" />
          </button>
        </div>
      </div>
      {/* Cards */}
      <div className="flex flex-col gap-1.5">
        {col.cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Mockup ─── */

function KanbanMockup() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] bg-slate-100 dark:bg-[#050914] shadow-2xl shadow-black/10 dark:shadow-black/40">
      {/* Window chrome */}
      <div className="flex h-9 items-center gap-1.5 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0c111d] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-4 flex h-5 items-center rounded border border-[#e2e8f0] dark:border-[#1e293b] bg-[#f1f5f9] dark:bg-[#0f172a] px-2.5 text-[10px] text-[#94a3b8] dark:text-[#475569]">
          app.ownbase.io/dashboard
        </div>
      </div>

      {/* App shell — avoid inline fills so dark mode matches the real dashboard */}
      <div className="flex h-[560px] bg-slate-100 dark:bg-[#050914]">
        {/* Sidebar */}
        <aside className="flex w-[180px] shrink-0 flex-col border-r border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0c111d] px-2 py-3 text-[11px]">
          {/* Workspace selector */}
          <div className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] cursor-pointer">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0891b2] text-[9px] font-bold text-white shrink-0">
              OB
            </span>
            <span className="font-semibold text-[#0f172a] dark:text-[#e2e8f0] truncate">
              Ownbase
            </span>
            <IconChevronDown className="ml-auto h-3 w-3 text-[#94a3b8] shrink-0" />
          </div>

          {/* Nav items */}
          <nav className="space-y-0.5">
            <SidebarItem
              icon={<IconInbox className="h-3.5 w-3.5" />}
              label="Inbox"
              badge="4"
            />
            <SidebarItem
              icon={<IconLayoutKanban className="h-3.5 w-3.5" />}
              label="My Repos"
            />
          </nav>

          <div className="my-2 border-t border-[#e2e8f0] dark:border-[#1e293b]" />

          {/* Team section */}
          <p className="mb-1 px-2 text-[9px] font-semibold tracking-widest uppercase text-[#94a3b8] dark:text-[#475569]">
            Workspace
          </p>
          <nav className="space-y-0.5">
            <SidebarItem
              icon={<IconShieldCheck className="h-3.5 w-3.5" />}
              label="Repositories"
              active
            />
            <SidebarItem
              icon={<IconLink className="h-3.5 w-3.5" />}
              label="Integrations"
            />
            <SidebarItem
              icon={<IconSettings className="h-3.5 w-3.5" />}
              label="Settings"
            />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0c111d] px-4">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-[#0f172a] dark:text-[#e2e8f0]">
                Ownbase Core
              </span>
              <span className="text-[#94a3b8]">&rsaquo;</span>
              <span className="text-[#64748b] dark:text-[#94a3b8]">
                All repositories
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center gap-1 rounded border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a] px-2.5 py-1 text-[10px] text-[#64748b] hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-colors">
                <IconFilter className="h-3 w-3" />
                Filter
              </button>
              <button className="flex items-center gap-1 rounded border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a] px-2.5 py-1 text-[10px] text-[#64748b] hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-colors">
                Display
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-[#f8fafc] dark:bg-[#0c111d] px-4">
            {["All repos", "Active", "Unprotected", "Archived"].map(
              (tab, i) => (
                <button
                  key={tab}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    i === 0
                      ? "bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] text-[#0f172a] dark:text-[#e2e8f0] shadow-sm"
                      : "text-[#64748b] hover:text-[#334155] dark:hover:text-[#94a3b8]"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          {/* Kanban board */}
          <div className="group flex flex-1 gap-3 overflow-x-auto overflow-y-auto p-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.name} col={col} />
            ))}

            {/* Hidden columns panel */}
            <div className="ml-2 flex shrink-0 flex-col gap-2 min-w-[160px]">
              <p className="px-1 text-[10px] font-semibold tracking-wider uppercase text-[#94a3b8] dark:text-[#475569]">
                Hidden columns
              </p>
              {HIDDEN_COLS.map((hc) => (
                <div
                  key={hc.name}
                  className="flex items-center justify-between rounded-md border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0c111d] px-3 py-2 cursor-pointer hover:border-[#cbd5e1] dark:hover:border-[#334155] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${hc.color}`} />
                    <span className="text-[11px] font-medium text-[#334155] dark:text-[#94a3b8]">
                      {hc.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] dark:text-[#475569]">
                    {hc.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
        active
          ? "bg-[#f1f5f9] dark:bg-[#1e293b] text-[#0891b2]"
          : "text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] hover:text-[#334155] dark:hover:text-[#94a3b8]"
      }`}
    >
      <span className={`shrink-0 ${active ? "text-[#0891b2]" : ""}`}>
        {icon}
      </span>
      <span
        className={`flex-1 font-medium ${active ? "text-[#0f172a] dark:text-[#e2e8f0]" : ""}`}
      >
        {label}
      </span>
      {badge && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e2e8f0] dark:bg-[#1e293b] px-1 text-[9px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Section ─── */

export function ProductShowcase() {
  return (
    <section className="border-b border-border bg-surface/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
        {/* Heading */}
        <div
          className="text-center mb-12"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent mb-3">
            Your Dashboard
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl max-w-2xl mx-auto">
            Every Repository. One Secure Place.
          </h2>
          <p className="mt-4 text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Track the status of all your connected projects — what&apos;s
            protected, what&apos;s at risk, and where access needs review — at a
            glance.
          </p>
        </div>

        {/* Mockup */}
        <div
          data-aos="fade-up"
          data-aos-duration="600"
          data-aos-delay="80"
          className="relative"
        >
          {/* Subtle glow behind the mockup */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-8 h-1/2 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(8,145,178,0.18) 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <KanbanMockup />
        </div>
      </div>
    </section>
  );
}
