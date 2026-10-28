import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { getInternalAdminEmails } from "@/lib/admin/internal-users";
import { hasLectureOnlyAccess } from "@/lib/lectures/access";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { paymentNet, paymentSchema, paymentTime } from "./attribution-model";
import type { AttributionInput, AttributionPayload } from "./attribution-model";

export async function recordAttribution(input: AttributionInput, purpose: AttributionPayload["purpose"]) {
  const auth = await createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  const admin = createAdminClient();
  let audience: AttributionPayload["audience"] = user ? "prospect" : "unknown";
  if (user && getInternalAdminEmails().includes(user.email?.toLowerCase() ?? "")) audience = "internal";
  else if (user) {
    const [payments, plan] = await Promise.all([
      admin.from("toss_payments").select("id,user_id,order_id,session_key,amount,status,created_at,metadata")
        .eq("user_id", user.id).eq("metadata->>planType", "allinone"),
      admin.from("user_plans").select("plan_type,expires_at").eq("user_id", user.id).maybeSingle(),
    ]);
    if (payments.error) throw payments.error;
    if (plan.error) throw plan.error;
    const paid = z.array(paymentSchema).parse(payments.data).some((payment) =>
      paymentNet(payment) > 0 && Date.parse(paymentTime(payment)) <= Date.now());
    const access = z.object({ plan_type: z.string(), expires_at: z.string().nullable() }).nullable().parse(plan.data);
    if (paid) audience = "customer";
    else if (hasLectureOnlyAccess(user.app_metadata) || isActiveAccessPlan(access?.plan_type, access?.expires_at)) audience = "access_only";
  }
  const { token, id, ...event } = input;
  const payload: AttributionPayload = { ...event, test: event.test || process.env.VERCEL_ENV !== "production",
    version: 2, userId: user?.id ?? null, audience, purpose };
  const { error } = await admin.from("marketing_session_events").upsert({
    id, session_key: input.visitorId, marketing_token: token, event_type: "attribution_v2",
    page_path: input.path, payload,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}
