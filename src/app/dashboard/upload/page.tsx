import dynamic from "next/dynamic";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const UploadForm = dynamic(
  () => import("./upload-form").then((m) => m.UploadForm),
  { ssr: true }
);

const UploadedProjectsList = dynamic(
  () => import("./uploaded-projects-list").then((m) => m.UploadedProjectsList),
  { ssr: true }
);

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("uploaded_projects")
    .select("id, name, storage_path, file_size, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1 -ml-2"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Upload project
        </h1>
        <p className="mt-2 text-sm text-muted">
          Upload a zip of your project. It will be stored in your environment—your code, your business.
        </p>
      </div>

      <UploadForm />

      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-medium text-foreground">Your uploaded projects</h2>
        <p className="mt-1 text-sm text-muted">
          Projects you’ve uploaded are stored securely in your own storage.
        </p>
        <UploadedProjectsList projects={projects ?? []} />
      </section>
    </div>
  );
}
