"use server";

import { deleteUserAccount } from "@/lib/account/delete-user-account";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "avatars";
const AVATAR_OBJECT_KEY = "avatar";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type ProfileUpdateInput = {
  firstName: string;
  lastName: string;
  businessName: string;
  businessSector: string;
};

export async function updateUserProfileAction(
  input: ProfileUpdateInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (!first && !last) {
    return { ok: false, error: "Enter at least a first or last name." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: first || null,
      last_name: last || null,
      business_name: input.businessName.trim() || null,
      business_sector: input.businessSector.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function uploadProfileAvatarAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_AVATAR_TYPES.has(type)) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, WebP, or GIF image.",
    };
  }

  const path = `${user.id}/${AVATAR_OBJECT_KEY}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      contentType: type,
      upsert: true,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      avatar_storage_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (dbError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function removeProfileAvatarAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: row } = await supabase
    .from("profiles")
    .select("avatar_storage_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const path = row?.avatar_storage_path as string | null | undefined;
  if (path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_storage_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteAccountAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  return deleteUserAccount(user.id);
}
