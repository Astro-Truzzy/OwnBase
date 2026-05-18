import dynamic from "next/dynamic";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const UploadForm = dynamic(
  () => import("./upload-form").then((m) => m.UploadForm),
  { ssr: true },
);

const UploadedProjectsList = dynamic(
  () => import("./uploaded-projects-list").then((m) => m.UploadedProjectsList),
  { ssr: true },
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
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          Upload project
        </h1>
        <p className="mt-2 text-sm text-cyan-100/65">
          Upload a zip of your project. It will be stored in your
          environment—your code, your business.
        </p>
      </div>

      <UploadForm />

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-medium text-cyan-50">
          Your uploaded projects
        </h2>
        <p className="mt-1 text-sm text-cyan-100/65">
          Projects you’ve uploaded are stored securely in your own storage.
        </p>
        <UploadedProjectsList projects={projects ?? []} />
      </section>
    </div>
  );
}
