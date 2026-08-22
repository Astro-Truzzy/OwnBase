"use client";

import {
  IconAlertCircle,
  IconBrandGithub,
  IconChevronRight,
  IconDownload,
  IconFolder,
  IconRocket,
  IconShield,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { DashboardTodoItem } from "@/lib/dashboard/overview-metrics";
import { applyDashboardTodoNavigation } from "./dashboard-todo-navigation";

export type { DashboardTodoItem };

function todoIconForId(id: string) {
  const className = "h-4 w-4";
  switch (id) {
    case "connect":
      return <IconBrandGithub className={className} />;
    case "track-repo":
      return <IconFolder className={className} />;
    case "upload":
      return <IconDownload className={className} />;
    case "summary":
      return <IconSparkles className={className} />;
    case "bus-factor":
    case "low-health":
      return <IconAlertCircle className={className} />;
    case "security":
    case "access":
      return <IconShield className={className} />;
    default:
      return <IconRocket className={className} />;
  }
}

function TodoRow({ todo }: { todo: DashboardTodoItem }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <li className="min-w-0 list-none">
      <Link
        href={todo.href}
        onClick={(event) => {
          const handled = applyDashboardTodoNavigation({
            dashboardTab: todo.dashboardTab,
            portfolioFilter: todo.portfolioFilter,
            pathname,
            push: router.push,
          });
          if (handled) event.preventDefault();
        }}
        className="group flex w-full min-w-0 items-start gap-3 rounded-lg py-2.5 transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
      >
        <span className="mt-0.5 text-muted-foreground group-hover:text-foreground">
          {todoIconForId(todo.id)}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-medium text-foreground">
            {todo.title}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {todo.desc}
          </span>
        </span>
        <IconChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-foreground"
          aria-hidden
        />
      </Link>
    </li>
  );
}

export function DashboardTodoPanel({
  todos,
  isNewWorkspace,
  hasPortfolioData,
}: {
  todos: DashboardTodoItem[];
  isNewWorkspace: boolean;
  hasPortfolioData: boolean;
}) {
  const heading =
    isNewWorkspace || !hasPortfolioData ? "Get started" : "Next steps";

  return (
    <section data-tour="dashboard-todos" aria-labelledby="dashboard-todo-heading">
      <h2
        id="dashboard-todo-heading"
        className="text-sm font-medium text-muted-foreground"
      >
        {heading}
      </h2>

      {todos.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </section>
  );
}
