"use client";

type ImagePlaceholderProps = {
  label?: string;
  aspectRatio?: "16/10" | "4/3" | "1/1";
  className?: string;
};

export function ImagePlaceholder({
  label = "Image",
  aspectRatio = "16/10",
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-border bg-surface bg-linear-to-br from-surface to-surface-elevated ${className}`}
      style={{ aspectRatio }}
      aria-hidden
    >
      <span className="text-sm font-medium text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}
