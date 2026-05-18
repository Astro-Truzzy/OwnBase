import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthSplitLayout title="Reset password">
      <p className="mb-8 text-sm text-muted-foreground">
        Enter the email for your account and we&apos;ll send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
