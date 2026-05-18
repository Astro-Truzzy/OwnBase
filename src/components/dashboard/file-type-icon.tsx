import {
  IconBrandCss3,
  IconBrandGit,
  IconBrandHtml5,
  IconBrandJavascript,
  IconBrandPython,
  IconBrandReact,
  IconBrandSass,
  IconBrandTypescript,
  IconFile,
  IconFileCode,
  IconMarkdown,
  IconSettings,
} from "@tabler/icons-react";

const EXT_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  js: IconBrandJavascript,
  mjs: IconBrandJavascript,
  cjs: IconBrandJavascript,
  jsx: IconBrandReact,
  ts: IconBrandTypescript,
  tsx: IconBrandReact,
  json: IconFileCode,
  css: IconBrandCss3,
  scss: IconBrandSass,
  sass: IconBrandSass,
  html: IconBrandHtml5,
  htm: IconBrandHtml5,
  md: IconMarkdown,
  mdx: IconMarkdown,
  py: IconBrandPython,
  yml: IconSettings,
  yaml: IconSettings,
  vue: IconBrandJavascript,
  gitignore: IconBrandGit,
  env: IconSettings,
};

export function fileExtension(name: string): string {
  const base = name.split("/").pop() ?? name;
  if (base.startsWith(".") && base.indexOf(".", 1) === -1) {
    return base.slice(1).toLowerCase() || "file";
  }
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

export function FileTypeIcon({
  name,
  className = "h-4 w-4 shrink-0",
}: {
  name: string;
  className?: string;
}) {
  const ext = fileExtension(name);
  const Icon = EXT_ICON[ext] ?? IconFile;

  const colorClass =
    ext === "jsx" || ext === "tsx"
      ? "text-sky-400"
      : ext === "js" || ext === "mjs"
        ? "text-amber-300"
        : ext === "ts"
          ? "text-blue-400"
          : ext === "json"
            ? "text-amber-200/90"
            : ext === "css" || ext === "scss"
              ? "text-violet-400"
              : ext === "html"
                ? "text-orange-400"
                : ext === "py"
                  ? "text-emerald-400"
                  : ext === "md"
                    ? "text-muted-foreground"
                    : "text-muted-foreground";

  return <Icon className={`${className} ${colorClass}`} aria-hidden />;
}
