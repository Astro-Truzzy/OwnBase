import { createClient } from "../../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconFolder, IconShield } from "@tabler/icons-react";
import { UploadedProjectActions } from "./uploaded-project-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function UploadedProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: project, error } = await supabase
    .from("uploaded_projects")
    .select("id, name, storage_path, file_size, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !project) notFound();

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1 -ml-2"
        >
          ← Back to uploads
        </Link>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <IconFolder className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {project.name}
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Uploaded {formatDate(project.created_at)} · {formatSize(project.file_size)}
              </p>
            </div>
          </div>
          <UploadedProjectActions projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          <IconShield className="h-5 w-5 text-accent/80" aria-hidden />
          Stored in your environment
        </h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          This project is stored in your business’s storage. Your code stays under your control.
          Use <strong>Download zip</strong> above to get the file and open it on your computer to view or extract the contents.
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Name:</dt>
            <dd className="text-foreground font-medium">{project.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Size:</dt>
            <dd className="text-foreground">{formatSize(project.file_size)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted shrink-0">Uploaded:</dt>
            <dd className="text-foreground">{formatDate(project.created_at)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
