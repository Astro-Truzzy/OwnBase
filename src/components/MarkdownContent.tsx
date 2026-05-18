import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

/**
 * Renders assistant markdown (headings, bold, lists, code) as formatted HTML.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "markdown-body text-sm leading-relaxed text-cyan-100/90",
        "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-cyan-50",
        "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-cyan-50",
        "[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-cyan-100",
        "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold [&_strong]:text-cyan-50",
        "[&_em]:text-cyan-100/80",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_li]:text-cyan-100/85",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:text-primary/90",
        "[&_code]:rounded [&_code]:bg-[#010409] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-primary/90",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-cyan-200/10 [&_pre]:bg-[#010409] [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-cyan-100/85",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-300/30 [&_blockquote]:pl-3 [&_blockquote]:text-cyan-100/70",
        "[&_hr]:my-3 [&_hr]:border-cyan-200/15",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
