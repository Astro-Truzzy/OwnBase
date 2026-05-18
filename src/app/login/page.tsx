import { sanitizeAuthRedirect } from "@/lib/auth/redirects";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
    signedOut?: string;
    passwordReset?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { redirectTo, error, signedOut, passwordReset } = await searchParams;

  if (user) {
    redirect(sanitizeAuthRedirect(redirectTo));
  }

  return (
    <AuthSplitLayout title="Sign in">
      <div className="mb-8 space-y-3">
        <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
        <ul className="list-none space-y-2 text-left text-xs leading-relaxed text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden>
              •
            </span>
            <span>
              Connect your repository or upload your project — GitHub, GitLab, or direct upload.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent" aria-hidden>
              •
            </span>
            <span>Your code is stored in an environment owned by your business.</span>
          </li>
        </ul>
      </div>

      <LoginForm
        redirectTo={redirectTo}
        error={error}
        signedOut={signedOut === "1"}
        passwordReset={passwordReset === "1"}
      />
    </AuthSplitLayout>
  );
}
