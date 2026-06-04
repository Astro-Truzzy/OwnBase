import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  description: "Internal business dashboard for OwnBase.",
  robots: { index: false, follow: false },
};

// Root admin layout — minimal wrapper so /admin/login is not inside the auth gate.
// Authentication lives in src/app/admin/(protected)/layout.tsx.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
