import { NextResponse } from "next/server";

import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "크레딧을 조회하려면 로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const effectiveCreditInfo = await getEffectiveCreditInfo(user.id);

    if (!effectiveCreditInfo) {
      const adminClient = createAdminClient();
      const { data: created, error: createError } = await adminClient
        .from("user_plans")
        .insert({
          user_id: user.id,
          plan_type: "free",
          credits: 30,
        })
        .select("credits, plan_type, expires_at")
        .single();

      if (createError || !created) {
        const retry = await getEffectiveCreditInfo(user.id);

        if (retry) {
          return NextResponse.json(retry);
        }

        return NextResponse.json({
          credits: 30,
          plan_type: "free",
          expires_at: null,
          monthly_credit_amount: 0,
          monthly_credit_total_cycles: null,
          monthly_credit_granted_cycles: 0,
          next_credit_at: null,
        });
      }

      return NextResponse.json({
        credits: created.credits,
        plan_type: created.plan_type,
        expires_at: created.expires_at,
        monthly_credit_amount: 0,
        monthly_credit_total_cycles: null,
        monthly_credit_granted_cycles: 0,
        next_credit_at: null,
      });
    }

    return NextResponse.json(effectiveCreditInfo);
  } catch (error) {
    console.error("[Credits API] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
