import { createAdminClient } from "@/lib/supabase/admin";

const AVATAR_BUCKET = "avatars";
const UPLOAD_BUCKET = "project-uploads";
const AVATAR_OBJECT_KEY = "avatar";

async function purgeUserStorage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<void> {
  const avatarPath = `${userId}/${AVATAR_OBJECT_KEY}`;
  await admin.storage.from(AVATAR_BUCKET).remove([avatarPath]);

  const { data: uploadRows } = await admin
    .from("uploaded_projects")
    .select("storage_path")
    .eq("user_id", userId);

  const uploadPaths = (uploadRows ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);

  if (uploadPaths.length > 0) {
    await admin.storage.from(UPLOAD_BUCKET).remove(uploadPaths);
  }

  const { data: listed } = await admin.storage.from(UPLOAD_BUCKET).list(userId);
  if (listed?.length) {
    const folderPaths = listed.map((file) => `${userId}/${file.name}`);
    await admin.storage.from(UPLOAD_BUCKET).remove(folderPaths);
  }
}

/**
 * Permanently deletes the auth user (DB rows cascade via FK) and removes storage objects.
 * Requires service role — call only from trusted server code after verifying the session.
 */
export async function deleteUserAccount(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Account deletion is unavailable right now. Please contact support if this continues.",
    };
  }

  try {
    await purgeUserStorage(admin, userId);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not delete your account.";
    return { ok: false, error: message };
  }
}
