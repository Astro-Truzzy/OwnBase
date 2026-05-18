import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <AuthSplitLayout title="Choose a new password">
      <p className="mb-8 text-sm text-muted-foreground">
        Enter and confirm your new password below.
      </p>
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
