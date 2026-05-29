"use client";

import { useState, useTransition } from "react";
import { IconUpload } from "@tabler/icons-react";
import { uploadProjectAction } from "./actions";

export function UploadForm() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fileInput =
      form.querySelector<HTMLInputElement>('input[type="file"]');
    const nameInput =
      form.querySelector<HTMLInputElement>('input[name="name"]');
    const file = fileInput?.files?.[0];
    const name = nameInput?.value?.trim();

    if (!file) {
      setMessage({ type: "error", text: "Please select a zip file." });
      return;
    }
    if (!name) {
      setMessage({ type: "error", text: "Please enter a project name." });
      return;
    }
    if (
      !file.name.toLowerCase().endsWith(".zip") &&
      file.type !== "application/zip" &&
      file.type !== "application/x-zip-compressed"
    ) {
      setMessage({ type: "error", text: "Please upload a .zip file." });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: "error", text: "File must be under 50 MB." });
      return;
    }

    startTransition(async () => {
      const result = await uploadProjectAction(name, file);
      if (result.success) {
        setMessage({
          type: "success",
          text: "Project uploaded. It’s now stored in your environment.",
        });
        form.reset();
      } else {
        setMessage({ type: "error", text: result.error ?? "Upload failed." });
      }
    });
  };

  return (
    <section className="dash-panel p-6 sm:p-8">
      <h2 className="text-lg font-medium text-foreground">Upload a zip file</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Max 50 MB. Your code is stored in an environment owned by your business.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="upload-name"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Project name
          </label>
          <input
            id="upload-name"
            name="name"
            type="text"
            placeholder="e.g. my-app"
            required
            className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            disabled={isPending}
          />
        </div>
        <div>
          <label
            htmlFor="upload-file"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Zip file
          </label>
          <input
            id="upload-file"
            name="file"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="dash-input w-full rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/12 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            disabled={isPending}
          />
        </div>
        {message && (
          <p
            role="alert"
            className={`text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-105 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <IconUpload className="h-4 w-4" aria-hidden />
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </form>
    </section>
  );
}
