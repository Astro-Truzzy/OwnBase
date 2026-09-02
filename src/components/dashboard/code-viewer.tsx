"use client";

import { useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useThemeIsDark } from "@/lib/theme";

type CodeViewerProps = {
  code: string;
  language?: string;
  path?: string;
  truncated?: boolean;
  /** Max height of the scrollable code area (CSS value). */
  maxHeight?: string;
  showFooter?: boolean;
};

const customStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  background: "transparent",
  fontSize: "12.5px",
  lineHeight: "1.55",
};

export function CodeViewer({
  code,
  language = "plaintext",
  path,
  truncated,
  maxHeight = "min(50vh, 480px)",
  showFooter = true,
}: CodeViewerProps) {
  const isDark = useThemeIsDark();
  const lines = useMemo(() => code.split("\n"), [code]);
  const lang =
    language === "jsx" ? "jsx" : language === "tsx" ? "tsx" : language;

  return (
    <div className="overflow-hidden rounded-b-xl bg-muted">
      <div className="flex overflow-auto" style={{ maxHeight }}>
        <div
          className="dash-surface-inset sticky left-0 shrink-0 select-none rounded-none border-y-0 border-l-0 py-3 pr-3 pl-2 text-right font-mono text-[11px] leading-[1.55] text-muted-foreground"
          aria-hidden
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto py-3 pr-4">
          <SyntaxHighlighter
            language={lang}
            style={isDark ? oneDark : oneLight}
            customStyle={customStyle}
            showLineNumbers={false}
            wrapLongLines={false}
            PreTag="div"
            CodeTag="code"
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
      {showFooter && (truncated || path) && (
        <div className="dash-surface-inset flex flex-wrap items-center justify-between gap-2 rounded-none border-x-0 border-b-0 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="truncate font-mono">{path}</span>
          {truncated && <span className="text-warning">Preview truncated</span>}
        </div>
      )}
    </div>
  );
}
