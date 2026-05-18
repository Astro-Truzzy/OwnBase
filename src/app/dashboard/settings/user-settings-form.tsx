"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { IconPhoto, IconTrash } from "@tabler/icons-react";
import {
  removeProfileAvatarAction,
  updateUserProfileAction,
  uploadProfileAvatarAction,
} from "./actions";

export type UserSettingsFormProps = {
  initialFirstName: string;
  initialLastName: string;
  initialBusinessName: string;
  initialBusinessSector: string;
  avatarPreviewUrl: string | null;
};

export function UserSettingsForm({
  initialFirstName,
  initialLastName,
  initialBusinessName,
  initialBusinessSector,
  avatarPreviewUrl,
}: UserSettingsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSavingProfile, startSaveProfile] = useTransition();
  const [isUploadingAvatar, startUploadAvatar] = useTransition();
  const [isRemovingAvatar, startRemoveAvatar] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startSaveProfile(async () => {
      const result = await updateUserProfileAction({
        firstName: String(fd.get("firstName") ?? ""),
        lastName: String(fd.get("lastName") ?? ""),
        businessName: String(fd.get("businessName") ?? ""),
        businessSector: String(fd.get("businessSector") ?? ""),
      });
      if (result.ok) {
        setMessage({ type: "success", text: "Profile saved." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function onAvatarFileChange() {
    const input = fileRef.current;
    const file = input?.files?.[0];
    if (!file) return;
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    startUploadAvatar(async () => {
      const result = await uploadProfileAvatarAction(fd);
      if (result.ok) {
        setMessage({ type: "success", text: "Profile photo updated." });
        if (input) input.value = "";
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
        if (input) input.value = "";
      }
    });
  }

  function removeAvatar() {
    setMessage(null);
    startRemoveAvatar(async () => {
      const result = await removeProfileAvatarAction();
      if (result.ok) {
        setMessage({ type: "success", text: "Profile photo removed." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              : "rounded-lg border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          }
        >
          {message.text}
        </div>
      )}

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-cyan-50">Profile photo</h2>
        <p className="mt-1 text-sm text-cyan-100/65">
          JPEG, PNG, WebP, or GIF. Maximum size 5 MB.
        </p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-200/20 bg-[#050b16]/80">
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <IconPhoto
                className="h-10 w-10 text-cyan-200/35"
                aria-hidden
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onAvatarFileChange}
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              {isUploadingAvatar ? "Uploading…" : "Upload from device"}
            </button>
            {avatarPreviewUrl && (
              <button
                type="button"
                disabled={isRemovingAvatar}
                onClick={() => void removeAvatar()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-cyan-100/80 transition hover:bg-muted/40 disabled:opacity-50"
              >
                <IconTrash className="h-4 w-4" aria-hidden />
                {isRemovingAvatar ? "Removing…" : "Remove photo"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-cyan-50">Your details</h2>
        <p className="mt-1 text-sm text-cyan-100/65">
          Name and organization information used across your workspace.
        </p>
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="settings-first-name"
                className="mb-1 block text-sm font-medium text-cyan-100"
              >
                First name
              </label>
              <input
                id="settings-first-name"
                name="firstName"
                type="text"
                defaultValue={initialFirstName}
                autoComplete="given-name"
                className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
              />
            </div>
            <div>
              <label
                htmlFor="settings-last-name"
                className="mb-1 block text-sm font-medium text-cyan-100"
              >
                Last name
              </label>
              <input
                id="settings-last-name"
                name="lastName"
                type="text"
                defaultValue={initialLastName}
                autoComplete="family-name"
                className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="settings-company"
              className="mb-1 block text-sm font-medium text-cyan-100"
            >
              Company
            </label>
            <input
              id="settings-company"
              name="businessName"
              type="text"
              defaultValue={initialBusinessName}
              autoComplete="organization"
              placeholder="e.g. Acme Ltd"
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
            />
          </div>
          <div>
            <label
              htmlFor="settings-sector"
              className="mb-1 block text-sm font-medium text-cyan-100"
            >
              Sector
            </label>
            <input
              id="settings-sector"
              name="businessSector"
              type="text"
              defaultValue={initialBusinessSector}
              placeholder="e.g. Fintech, Healthcare, SaaS"
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-5 py-2.5 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/25 disabled:opacity-50"
            >
              {isSavingProfile ? "Saving…" : "Save details"}
            </button>
          </div>
        </form>
      </section>

      <section className="dash-panel border-dashed border-cyan-200/20 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-cyan-50/90">
          Additional settings
        </h2>
        <p className="mt-2 text-sm text-cyan-100/55">
          Preferences such as notifications, security, and integrations will
          appear here in a future update.
        </p>
      </section>
    </div>
  );
}
