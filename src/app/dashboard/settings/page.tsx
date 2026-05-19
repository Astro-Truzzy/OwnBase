import { IconSettings } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountSection } from "./delete-account-section";
import { UserSettingsForm } from "./user-settings-form";

export const metadata = {
  title: "User settings",
  description: "Update your profile and preferences.",
};

export default async function UserSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, business_name, business_sector, avatar_storage_path",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  let avatarPreviewUrl: string | null = null;
  const path = profile?.avatar_storage_path as string | null | undefined;
  if (path) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600);
    avatarPreviewUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-8">
      <div className="dash-panel dash-panel--lg p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
            <IconSettings className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              User settings
            </h1>
            <p className="mt-1 text-sm text-cyan-100/70 sm:text-base">
              Manage your name, company, sector, and profile photo.
            </p>
          </div>
        </div>
      </div>

      <UserSettingsForm
        initialFirstName={profile?.first_name ?? ""}
        initialLastName={profile?.last_name ?? ""}
        initialBusinessName={profile?.business_name ?? ""}
        initialBusinessSector={profile?.business_sector ?? ""}
        avatarPreviewUrl={avatarPreviewUrl}
      />

      <DeleteAccountSection
        confirmPhrase={user.email ?? user.id}
      />
    </div>
  );
}
