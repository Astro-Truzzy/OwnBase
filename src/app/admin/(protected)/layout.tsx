import { requireAdminUser } from "@/lib/admin/auth";
import { AdminSideNav } from "../_components/admin-side-nav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /admin/login if cookie is missing or invalid.
  const { email } = await requireAdminUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex">
        <AdminSideNav email={email} />
      </div>
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
