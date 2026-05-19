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

export interface DashboardTodoItem {
  id: string;
  title: string;
  desc: string;
  href: string;
}

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
  return (
    <li className="dashboard-todo-row min-w-0 list-none">
      <Link
        href={todo.href}
        className="dashboard-todo-link flex w-full min-w-0 items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-3 backdrop-blur-sm transition hover:border-primary/35 hover:bg-muted/55 sm:px-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-300">
          {todoIconForId(todo.id)}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-medium leading-snug text-foreground">
            {todo.title}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {todo.desc}
          </span>
        </span>
        <IconChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground/80"
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
  const heading = isNewWorkspace || !hasPortfolioData ? "Get started" : "Next steps";

  return (
    <section
      data-tour="dashboard-todos"
      className="dashboard-todo-panel rounded-xl border border-amber-400/20 bg-[#0e1728]/95 p-5 sm:p-6"
      aria-labelledby="dashboard-todo-heading"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3
          id="dashboard-todo-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {heading}
        </h3>
        {todos.length > 0 && (
          <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200">
            {todos.length}
          </span>
        )}
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re all caught up. Open Organization to track a repository.
        </p>
      ) : (
        <ul className="dashboard-todo-list m-0 flex list-none flex-col gap-2.5 p-0">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </section>
  );
}
