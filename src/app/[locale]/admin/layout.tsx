import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAdminAccessLevel } from "@/lib/admin/access";

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
  const accessLevel = getAdminAccessLevel(userEmail, user.user_metadata);

  if (accessLevel === "none") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
    return null;
  }

  return (
    <div className="admin-light flex min-h-screen bg-zinc-50">
      <AdminSidebar accessLevel={accessLevel} />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 pt-16 md:p-8 max-w-7xl space-y-6">
          {accessLevel === "full" && <Link href="/ko/admin/acquisition" className="inline-block rounded border bg-white px-3 py-2 text-sm font-semibold">키콘별 유입·구매 / 영상별 링크</Link>}
          {children}
        </div>
      </main>
    </div>
  );
}
