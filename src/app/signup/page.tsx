import {
  DEFAULT_POST_AUTH_PATH,
  sanitizeAuthRedirect,
} from "@/lib/auth/redirects";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { redirectTo, error } = await searchParams;

  if (user) {
    redirect(sanitizeAuthRedirect(redirectTo));
  }

  return (
    <AuthSplitLayout title="Create account">
      <p className="mb-8 text-sm text-muted-foreground">
        Your code, your business — get started in a minute.
      </p>

      <SignupForm redirectTo={redirectTo} error={error} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={
            !redirectTo || sanitizeAuthRedirect(redirectTo) === DEFAULT_POST_AUTH_PATH
              ? "/login"
              : `/login?redirectTo=${encodeURIComponent(sanitizeAuthRedirect(redirectTo))}`
          }
          className="font-medium text-foreground underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
