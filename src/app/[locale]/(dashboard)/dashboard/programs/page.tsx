import { ProgramsContent } from "@/components/dashboard/ProgramsContent";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { canDownloadPrograms } from "@/lib/programs/config";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getEffectiveCreditInfo(user.id);

  return <ProgramsContent canDownload={canDownloadPrograms(plan?.plan_type, plan?.expires_at)} />;
}
