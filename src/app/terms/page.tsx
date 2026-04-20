import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms that govern use of the Ownbase platform.",
};

export default function TermsPage() {
  const effectiveDate = "April 17, 2026";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted">
          Effective date: {effectiveDate}
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              1. Use of service
            </h2>
            <p>
              Ownbase provides tools for software ownership visibility,
              repository governance, and handoff support. You agree to use the
              service lawfully and only for projects you have rights to access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              2. Account responsibility
            </h2>
            <p>
              You are responsible for account credentials, connected provider
              permissions, and activity performed through your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              3. Billing and plans
            </h2>
            <p>
              Paid plans renew according to your selected billing cycle.
              Subscription processing is handled by Paystack. Plan limits and
              feature availability depend on your active subscription status.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              4. Availability and changes
            </h2>
            <p>
              We may improve, modify, or discontinue features over time. We aim
              to communicate material changes to core functionality when
              practical.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              5. Contact
            </h2>
            <p>
              For legal questions, contact{" "}
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
