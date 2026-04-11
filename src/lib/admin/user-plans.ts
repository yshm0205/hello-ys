import { createAdminClient } from "@/utils/supabase/admin";

export type AdminUserPlanUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
};

export type AdminUserPlanItem = {
  user_id: string;
  credits: number;
  plan_type: string;
  expires_at: string | null;
  user: AdminUserPlanUser | null;
};

type UserPlanFilters = {
  q?: string;
  planType?: string;
  page?: number;
  pageSize?: number;
};

export async function getPaginatedUserPlans(
  filters?: UserPlanFilters,
): Promise<{ data: AdminUserPlanItem[]; totalItems: number; totalPages: number }> {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters?.q?.trim();

  let matchedUserIds: string[] | null = null;

  if (search) {
    const { data: matchedUsers } = await supabase
      .from("users")
      .select("id")
      .ilike("email", `%${search}%`)
      .limit(500);

    matchedUserIds = (matchedUsers || []).map((user) => user.id);

    if (!matchedUserIds.length) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 1,
      };
    }
  }

  let countQuery = supabase
    .from("user_plans")
    .select("user_id", { count: "exact", head: true });

  if (filters?.planType && filters.planType !== "all") {
    countQuery = countQuery.eq("plan_type", filters.planType);
  }

  if (matchedUserIds) {
    countQuery = countQuery.in("user_id", matchedUserIds);
  }

  const { count } = await countQuery;

  let dataQuery = supabase
    .from("user_plans")
    .select("user_id, credits, plan_type, expires_at")
    .order("credits", { ascending: false });

  if (filters?.planType && filters.planType !== "all") {
    dataQuery = dataQuery.eq("plan_type", filters.planType);
  }

  if (matchedUserIds) {
    dataQuery = dataQuery.in("user_id", matchedUserIds);
  }

  const { data: plans } = await dataQuery.range(from, to);
  const items = (plans || []) as Array<{
    user_id: string;
    credits: number;
    plan_type: string;
    expires_at: string | null;
  }>;

  const userIds = items.map((item) => item.user_id);
  const { data: users } = userIds.length
    ? await supabase
        .from("users")
        .select("id, email, full_name, created_at")
        .in("id", userIds)
    : { data: [] };

  const userMap = new Map(
    ((users || []) as AdminUserPlanUser[]).map((user) => [user.id, user]),
  );

  return {
    data: items.map((item) => ({
      ...item,
      user: userMap.get(item.user_id) || null,
    })),
    totalItems: count || 0,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  };
}
