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
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          ← Back to uploads
        </Link>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
              <IconFolder className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {project.name}
              </h1>
              <p className="mt-1.5 text-sm text-cyan-100/65">
                Uploaded {formatDate(project.created_at)} ·{" "}
                {formatSize(project.file_size)}
              </p>
            </div>
          </div>
          <UploadedProjectActions
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-medium text-cyan-50">
          <IconShield className="h-5 w-5 text-cyan-300/90" aria-hidden />
          Stored in your environment
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-cyan-100/65">
          This project is stored in your business’s storage. Your code stays
          under your control. Use <strong>Download zip</strong> above to get the
          file and open it on your computer to view or extract the contents.
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="shrink-0 text-cyan-100/55">Name:</dt>
            <dd className="font-medium text-cyan-50">{project.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-cyan-100/55">Size:</dt>
            <dd className="text-cyan-100">{formatSize(project.file_size)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-cyan-100/55">Uploaded:</dt>
            <dd className="text-cyan-100">{formatDate(project.created_at)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
