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

/** Per-extension tint — darker in light mode, brighter on dark panels */
const EXT_COLOR: Record<string, string> = {
  jsx: "text-sky-600 dark:text-sky-400",
  tsx: "text-sky-600 dark:text-sky-400",
  js: "text-amber-700 dark:text-amber-300",
  mjs: "text-amber-700 dark:text-amber-300",
  cjs: "text-amber-700 dark:text-amber-300",
  vue: "text-emerald-700 dark:text-emerald-400",
  ts: "text-blue-700 dark:text-blue-400",
  json: "text-amber-800 dark:text-amber-200",
  css: "text-violet-700 dark:text-violet-400",
  scss: "text-violet-700 dark:text-violet-400",
  sass: "text-violet-700 dark:text-violet-400",
  html: "text-orange-700 dark:text-orange-400",
  htm: "text-orange-700 dark:text-orange-400",
  py: "text-emerald-700 dark:text-emerald-400",
  md: "text-muted-foreground",
  mdx: "text-muted-foreground",
  yml: "text-slate-600 dark:text-slate-400",
  yaml: "text-slate-600 dark:text-slate-400",
  gitignore: "text-rose-700 dark:text-rose-400",
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
    EXT_COLOR[ext] ?? "text-muted-foreground";

  return <Icon className={`${className} ${colorClass}`} aria-hidden />;
}
