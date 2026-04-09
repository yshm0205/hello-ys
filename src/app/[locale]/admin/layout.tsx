import { createClient } from "@/utils/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email === undefined || user.email === null) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    return null;
  }

  const userEmail: string = user.email;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

  if (!adminEmails.includes(userEmail)) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
    return null;
  }

  return (
    <div className="admin-light flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 md:p-8 max-w-7xl space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
