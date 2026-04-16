import { NextResponse } from "next/server";

import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { sendPaymentCompleteEmail } from "@/services/email/actions";
import { createClient } from "@/utils/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = TOSSPAY_PLAN_CONFIG.allinone;
  const result = await sendPaymentCompleteEmail({
    email: user.email,
    userName: user.email.split("@")[0] || "수강생",
    amount: plan.amount,
    grantedCredits: plan.initialCredits,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email: user.email,
  });
}
