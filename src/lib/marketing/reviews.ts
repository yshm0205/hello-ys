import { createAdminClient } from "@/utils/supabase/admin";

export type PublicMarketingReview = {
  id: string;
  rating: number;
  headline: string | null;
  content: string;
  displayName: string;
  createdAt: string;
};

export type PublicMarketingReviewsSummary = {
  reviews: PublicMarketingReview[];
  totalCount: number;
  averageRating: number;
};

export const MARKETING_REVIEWS_FALLBACK: PublicMarketingReviewsSummary = {
  reviews: [],
  totalCount: 0,
  averageRating: 0,
};

type StudentReviewRow = {
  id: string;
  user_id: string;
  email: string | null;
  rating: number | string | null;
  headline: string | null;
  content: string;
  channel_name: string | null;
  created_at: string;
};

type UserNameRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function maskReviewerName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "수강생";

  const withoutSuffix = trimmed.endsWith("님") ? trimmed.slice(0, -1).trim() : trimmed;
  const chars = Array.from(withoutSuffix);
  if (chars.length === 0) return "수강생";
  if (chars.length === 1) return `${chars[0]}*`;

  const hiddenCount = Math.floor(chars.length / 2);
  const visibleCount = chars.length - hiddenCount;
  return `${chars.slice(0, visibleCount).join("")}${"*".repeat(hiddenCount)}`;
}

function getEmailHandle(email?: string | null) {
  const handle = email?.split("@")[0]?.trim();
  return handle || null;
}

export async function getMarketingReviews(limit = 20): Promise<PublicMarketingReviewsSummary> {
  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("student_reviews")
    .select("id, user_id, email, rating, headline, content, channel_name, created_at", { count: "exact" })
    .eq("marketing_consent", true)
    .in("status", ["submitted", "approved"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const reviewRows = (data || []) as StudentReviewRow[];
  const userIds = Array.from(
    new Set(
      reviewRows
        .filter((row) => !row.channel_name?.trim())
        .map((row) => row.user_id)
        .filter(Boolean),
    ),
  );

  const usersById = new Map<string, UserNameRow>();
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    if (usersError) {
      throw usersError;
    }

    for (const user of (users || []) as UserNameRow[]) {
      usersById.set(user.id, user);
    }
  }

  const reviews = reviewRows.map((row) => {
    const user = usersById.get(row.user_id);
    const displayNameSource =
      row.channel_name?.trim() ||
      user?.full_name?.trim() ||
      getEmailHandle(user?.email) ||
      getEmailHandle(row.email);

    return {
      id: row.id,
      rating: Number(row.rating) || 5,
      headline: row.headline,
      content: row.content,
      displayName: maskReviewerName(displayNameSource),
      createdAt: row.created_at,
    };
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return {
    reviews,
    totalCount: count ?? reviews.length,
    averageRating,
  };
}
