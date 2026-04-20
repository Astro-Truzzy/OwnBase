import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { redirectTo, error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 py-12">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Logo className="h-5 w-5" />
            </span>
            Ownbase
          </Link>
          <p className="text-sm text-muted">
            Sign in to access your dashboard
          </p>
          <ul className="text-left text-xs text-muted space-y-1.5 mt-4 list-none">
            <li>• Connect your repository or upload your project — GitHub, GitLab, or direct upload.</li>
            <li>• Your code is stored in an environment owned by your business.</li>
          </ul>
        </div>

        <LoginForm redirectTo={redirectTo} error={error} />
      </div>
    </div>
  );
}
