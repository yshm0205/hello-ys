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
      <style>{`
        .admin-light,
        .admin-light * {
          --tw-bg-opacity: 1;
          color-scheme: light;
        }
        .admin-light .dark\\:bg-zinc-950 { background-color: rgb(250 250 249) !important; }
        .admin-light .dark\\:bg-zinc-900 { background-color: white !important; }
        .admin-light .dark\\:bg-zinc-800 { background-color: rgb(244 244 245) !important; }
        .admin-light .dark\\:text-zinc-100,
        .admin-light .dark\\:text-zinc-200,
        .admin-light .dark\\:text-zinc-300 { color: rgb(24 24 27) !important; }
        .admin-light .dark\\:text-zinc-400 { color: rgb(113 113 122) !important; }
        .admin-light .dark\\:border-zinc-800 { border-color: rgb(228 228 231) !important; }
        .admin-light [data-slot="card"] { background-color: white !important; border-color: rgb(228 228 231) !important; }
      `}</style>
    </div>
  );
}
