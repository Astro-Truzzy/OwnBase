"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import {
  formatLimit,
  getLimitsForPlan,
  getUserPlanTier,
} from "../../../lib/plan-limits";
import { verifyFeatureAccess } from "../../../lib/subscription-access";

const BUCKET = "project-uploads";
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadProjectAction(
  name: string,
  file: File
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "You must be signed in." };
  if (file.size > MAX_SIZE) return { success: false, error: "File must be under 50 MB." };

  const access = await verifyFeatureAccess(supabase, user.id, "project uploads");
  if (!access.allowed) {
    return { success: false, error: access.error };
  }

  const plan = await getUserPlanTier(supabase, user.id);
  const limits = getLimitsForPlan(plan);
  if (limits.maxUploads != null) {
    const { count: uploadCount, error: uploadCountError } = await supabase
      .from("uploaded_projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (uploadCountError) {
      return {
        success: false,
        error: "Could not verify upload limits. Please try again.",
      };
    }

    if ((uploadCount ?? 0) >= limits.maxUploads) {
      return {
        success: false,
        error: `You have reached your upload limit (${formatLimit(
          limits.maxUploads
        )}) for the ${plan} plan. Upgrade to upload more projects.`,
      };
    }
  }

  const ext = file.name.toLowerCase().endsWith(".zip") ? "" : ".zip";
  const path = `${user.id}/${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/zip",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("uploaded_projects").insert({
    user_id: user.id,
    name: name.trim(),
    storage_path: path,
    file_size: file.size,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/upload");
  return { success: true };
}

export async function deleteUploadedProjectAction(
  id: string
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: row, error: fetchError } = await supabase
    .from("uploaded_projects")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) return false;

  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  const { error: deleteError } = await supabase
    .from("uploaded_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) return false;
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/upload");
  return true;
}

/** Get a temporary download URL for an uploaded project (zip). Expires in 60 seconds. */
export async function getUploadedProjectDownloadUrl(
  id: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { data: row, error: fetchError } = await supabase
    .from("uploaded_projects")
    .select("storage_path, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) return { error: "Project not found." };

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, 60);

  if (signError || !signed?.signedUrl) return { error: "Could not create download link." };

  return { url: signed.signedUrl };
}
