import { createAdminClient } from "@/utils/supabase/admin";

export const CREDIT_COSTS = {
    generate_full: 10,
    generate_batch: 10,
    generate_skip: 7,
    research: 3,
    rewrite: 2,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

type CreditResult =
    | { success: true; status: number; credits: number; deducted: number; message: string }
    | { success: false; status: number; credits?: number; deducted?: number; error: string };

export async function deductUserCredits(
    userId: string,
    action: CreditAction,
): Promise<CreditResult> {
    const cost = CREDIT_COSTS[action];

    if (!cost) {
        return {
            success: false,
            status: 400,
            error: `알 수 없는 액션: ${action}`,
        };
    }

    const adminClient = createAdminClient();

    const { data: plan, error: planError } = await adminClient
        .from("user_plans")
        .select("credits, plan_type, expires_at")
        .eq("user_id", userId)
        .single();

    if (planError || !plan) {
        return {
            success: false,
            status: 403,
            error: "플랜 정보가 없습니다. 페이지를 새로고침 해주세요.",
        };
    }

    if (plan.expires_at && ["pro", "allinone"].includes(plan.plan_type)) {
        const now = new Date();
        const expiresAt = new Date(plan.expires_at);

        if (now > expiresAt) {
            return {
                success: false,
                status: 403,
                error: "이용권이 만료되었습니다. 갱신해주세요.",
            };
        }
    }

    if (plan.credits < cost) {
        return {
            success: false,
            status: 403,
            credits: plan.credits,
            error: `크레딧이 부족합니다. (필요: ${cost}cr, 보유: ${plan.credits}cr)`,
        };
    }

    const { data: updated, error: updateError } = await adminClient
        .from("user_plans")
        .update({ credits: plan.credits - cost })
        .eq("user_id", userId)
        .eq("credits", plan.credits)
        .select("credits")
        .single();

    if (updateError || !updated) {
        return {
            success: false,
            status: 409,
            error: "동시 요청과 충돌했습니다. 다시 시도해주세요.",
        };
    }

    return {
        success: true,
        status: 200,
        credits: updated.credits,
        deducted: cost,
        message: `${cost}cr 사용 (보유: ${updated.credits}cr)`,
    };
}
