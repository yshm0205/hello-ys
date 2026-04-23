import { redirect } from "next/navigation";

import { FeedbackRequestContent } from "@/components/dashboard/FeedbackRequestContent";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createClient } from "@/utils/supabase/server";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getEffectiveCreditInfo(user.id);
  if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
    redirect("/pricing");
  }

  return <FeedbackRequestContent />;
}
