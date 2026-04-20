import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ownbase collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  const effectiveDate = "April 17, 2026";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">
          Effective date: {effectiveDate}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              1. What we collect
            </h2>
            <p>
              We collect account information (such as your email and profile
              details), repository metadata you choose to connect, uploaded
              project files, and billing-related status needed to provide the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              2. How we use data
            </h2>
            <p>
              We use data to authenticate users, render repository and activity
              views, generate AI summaries on demand, store uploaded files in
              your workspace, and manage subscription access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              3. Third-party services
            </h2>
            <p>
              Ownbase integrates with providers such as Supabase, GitHub,
              GitLab, OpenAI, and Paystack to deliver core functionality. Their
              terms and privacy policies also apply to their parts of the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              4. Data retention and deletion
            </h2>
            <p>
              You can remove uploaded projects and disconnect repositories at
              any time. Account deletion requests can be sent to support, and we
              will process deletion in accordance with applicable obligations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              5. Contact
            </h2>
            <p>
              For privacy requests or questions, contact{" "}
              <a
                href="mailto:support@ownbase.com"
                className="text-accent hover:underline"
              >
                support@ownbase.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
