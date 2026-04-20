import Link from "next/link";
import { Logo } from "@/components/Logo";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sign in", href: "/login" },
] as const;

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  // { label: "Blog", href: "#" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <ul className="mt-4 space-y-3" role="list">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1 -ml-1"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-20 border-t border-border bg-surface/30"
      role="contentinfo"
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand column */}
          <div
            className="sm:col-span-2 lg:col-span-2"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Logo className="h-5 w-5" />
              </span>
              Ownbase
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted leading-relaxed">
              Your software. Your base. Own and control your code, access, and
              activity in one place.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                Get started
              </Link>
            </div>
          </div>

          {/* Product */}
          <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="50">
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
          </div>

          {/* Company */}
          <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="100">
            <FooterColumn title="Company" links={COMPANY_LINKS} />
          </div>

          {/* Legal */}
          <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="150">
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4"
          data-aos="fade-up"
          data-aos-duration="550"
          data-aos-delay="100"
        >
          <p className="text-sm text-muted">
            © {year} Ownbase. Your Software. Your Base.
          </p>
          <div className="flex items-center gap-6 text-sm">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
