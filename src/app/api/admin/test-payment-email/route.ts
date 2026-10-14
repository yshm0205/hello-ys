import { NextResponse } from "next/server";

import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { sendPaymentCompleteEmail } from "@/services/email/server";
import {getEmailTestAdmin} from "@/services/email/test-admin";

export async function POST() {
  const user=await getEmailTestAdmin();
  if(!user?.email)return NextResponse.json({error:'Forbidden'},{status:403});

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
